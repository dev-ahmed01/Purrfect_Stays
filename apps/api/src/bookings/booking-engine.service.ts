import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { QuoteRequest } from '@purrfect/contracts';
import {
  PetFeeMode,
  PetSpecies,
  Prisma,
  PropertyStatus,
  VerificationStatus,
} from '@purrfect/database';
import type { AppEnv } from '../config/env.js';
import { nightsBetween, todayInIndia } from './business-date.js';

export type BookingQuoteInternal = {
  roomTypeId: string;
  propertyId: string;
  property: {
    slug: string;
    name: string;
    city: string;
    state: string;
  };
  roomType: {
    name: string;
    capacity: number;
  };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  petCount: number;
  pets: Array<{
    id: string;
    name: string;
    species: PetSpecies;
    breed: string;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
  }>;
  inventoryRows: Array<{
    id: string;
    date: Date;
    nightlyRatePaise: number;
  }>;
  pricing: {
    currency: 'INR';
    subtotalPaise: number;
    petFeePaise: number;
    serviceFeePaise: number;
    taxRateBps: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
  };
};

@Injectable()
export class BookingEngineService {
  constructor(private readonly config: ConfigService<AppEnv>) {}

  async quote(
    tx: Prisma.TransactionClient,
    userId: string,
    input: QuoteRequest,
  ): Promise<BookingQuoteInternal> {
    if (input.checkIn < todayInIndia()) {
      throw new BadRequestException('Check-in cannot be in the past.');
    }

    const nights = nightsBetween(input.checkIn, input.checkOut);
    if (nights < 1 || nights > 60) {
      throw new BadRequestException('Booking length must be between 1 and 60 nights.');
    }

    const room = await tx.roomType.findFirst({
      where: {
        id: input.roomTypeId,
        active: true,
        property: {
          status: PropertyStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        nightlyRatePaise: true,
        serviceFeePaise: true,
        propertyId: true,
        property: {
          select: {
            slug: true,
            name: true,
            city: true,
            state: true,
            petPolicy: {
              select: {
                maxPets: true,
                petFeePaise: true,
                petFeeMode: true,
                allowsDogs: true,
                allowsCats: true,
                allowsOther: true,
                allowedSizes: true,
                allowedBreedKeys: true,
                restrictedBreedKeys: true,
                requiresVaccination: true,
              },
            },
          },
        },
      },
    });

    if (!room || !room.property.petPolicy) {
      throw new NotFoundException('Bookable room was not found.');
    }

    if (input.guests > room.capacity) {
      throw new BadRequestException('Guest count exceeds the room capacity.');
    }

    const pets = await tx.pet.findMany({
      where: {
        userId,
        id: { in: input.petIds },
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        size: true,
        vaccinated: true,
      },
    });

    if (pets.length !== input.petIds.length) {
      throw new BadRequestException('One or more selected pets do not belong to this account.');
    }

    this.assertPetCompatibility(room.property.petPolicy, pets);

    const inventory = await tx.roomInventory.findMany({
      where: {
        roomTypeId: room.id,
        date: {
          gte: input.checkIn,
          lt: input.checkOut,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        closed: true,
        totalUnits: true,
        reservedUnits: true,
        nightlyRatePaise: true,
      },
    });

    if (
      inventory.length !== nights ||
      inventory.some((row) => row.closed || row.reservedUnits >= row.totalUnits)
    ) {
      throw new ConflictException('This room is no longer available for the full stay.');
    }

    const inventoryRows = inventory.map((row) => ({
      id: row.id,
      date: row.date,
      nightlyRatePaise: row.nightlyRatePaise ?? room.nightlyRatePaise,
    }));

    const subtotalPaise = inventoryRows.reduce(
      (sum, row) => sum + row.nightlyRatePaise,
      0,
    );

    const policy = room.property.petPolicy;
    const petFeePaise =
      policy.petFeeMode === PetFeeMode.PER_NIGHT
        ? policy.petFeePaise * pets.length * nights
        : policy.petFeePaise * pets.length;

    const serviceFeePaise = room.serviceFeePaise;
    const taxRateBps =
      this.config.get('BOOKING_TAX_RATE_BPS', { infer: true }) ?? 1200;
    const taxablePaise = subtotalPaise + petFeePaise + serviceFeePaise;
    const taxPaise = Math.round((taxablePaise * taxRateBps) / 10_000);
    const discountPaise = 0;
    const totalPaise =
      taxablePaise + taxPaise - discountPaise;

    return {
      roomTypeId: room.id,
      propertyId: room.propertyId,
      property: {
        slug: room.property.slug,
        name: room.property.name,
        city: room.property.city,
        state: room.property.state,
      },
      roomType: {
        name: room.name,
        capacity: room.capacity,
      },
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      guests: input.guests,
      petCount: pets.length,
      pets: pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        size: pet.size,
      })),
      inventoryRows,
      pricing: {
        currency: 'INR',
        subtotalPaise,
        petFeePaise,
        serviceFeePaise,
        taxRateBps,
        taxPaise,
        discountPaise,
        totalPaise,
      },
    };
  }

  toPublicQuote(quote: BookingQuoteInternal) {
    return {
      roomTypeId: quote.roomTypeId,
      propertyId: quote.propertyId,
      property: quote.property,
      roomType: quote.roomType,
      checkIn: quote.checkIn.toISOString().slice(0, 10),
      checkOut: quote.checkOut.toISOString().slice(0, 10),
      nights: quote.nights,
      guests: quote.guests,
      petCount: quote.petCount,
      pets: quote.pets,
      pricing: quote.pricing,
      availability: 'AVAILABLE' as const,
      notice:
        'Price and availability are revalidated atomically when the booking is created.',
    };
  }

  private assertPetCompatibility(
    policy: {
      maxPets: number;
      allowsDogs: boolean;
      allowsCats: boolean;
      allowsOther: boolean;
      allowedSizes: Array<'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE'>;
      allowedBreedKeys: string[];
      restrictedBreedKeys: string[];
      requiresVaccination: boolean;
    },
    pets: Array<{
      name: string;
      species: PetSpecies;
      breed: string;
      size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
      vaccinated: boolean;
    }>,
  ) {
    if (pets.length > policy.maxPets) {
      throw new BadRequestException(
        `This property allows a maximum of ${policy.maxPets} pet(s) per booking.`,
      );
    }

    const allowedBreeds = new Set(policy.allowedBreedKeys.map(normalizeBreed));
    const restrictedBreeds = new Set(policy.restrictedBreedKeys.map(normalizeBreed));

    for (const pet of pets) {
      const speciesAllowed =
        (pet.species === PetSpecies.DOG && policy.allowsDogs) ||
        (pet.species === PetSpecies.CAT && policy.allowsCats) ||
        (pet.species === PetSpecies.OTHER && policy.allowsOther);

      if (!speciesAllowed) {
        throw new BadRequestException(
          `${pet.name}'s species is not allowed by this property's pet policy.`,
        );
      }

      if (!policy.allowedSizes.includes(pet.size)) {
        throw new BadRequestException(
          `${pet.name}'s size is not allowed by this property's pet policy.`,
        );
      }

      const breedKey = normalizeBreed(pet.breed);

      if (restrictedBreeds.has(breedKey)) {
        throw new BadRequestException(
          `${pet.name}'s breed is restricted by this property's pet policy.`,
        );
      }

      if (allowedBreeds.size > 0 && !allowedBreeds.has(breedKey)) {
        throw new BadRequestException(
          `${pet.name}'s breed is not on this property's allowed-breed list.`,
        );
      }

      if (policy.requiresVaccination && !pet.vaccinated) {
        throw new BadRequestException(
          `${pet.name} must have a current vaccination status for this stay.`,
        );
      }
    }
  }
}

function normalizeBreed(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
