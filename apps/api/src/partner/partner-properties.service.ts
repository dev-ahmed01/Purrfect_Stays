import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreatePartnerPropertyInput,
  CreateRoomTypeInput,
  InventoryCalendarQuery,
  PartnerPropertiesQuery,
  ReplacePropertyAmenitiesInput,
  ReplacePropertyImagesInput,
  UpdateInventoryCalendarInput,
  UpdatePartnerPropertyInput,
  UpdateRoomTypeInput,
  UpsertPetPolicyInput,
} from '@purrfect/contracts';
import {
  Prisma,
  PropertyStatus,
  VerificationStatus,
} from '@purrfect/database';
import { randomUUID } from 'node:crypto';
import { buildPaginationMeta, toPrismaPagination } from '../common/pagination/pagination.js';
import { PrismaService } from '../database/prisma.service.js';
import { todayInIndia } from '../bookings/business-date.js';
import {
  mapPartnerPropertyDetail,
  mapPartnerPropertySummary,
} from './partner-property.mapper.js';
import {
  partnerPropertyDetailSelect,
  partnerPropertySummarySelect,
} from './partner-property.select.js';
import { assertPropertyTransition } from './property-state-machine.js';

type ReadinessDb = Pick<
  Prisma.TransactionClient,
  'petPolicy' | 'propertyImage' | 'roomType' | 'roomInventory'
>;

@Injectable()
export class PartnerPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(partnerId: string, input: PartnerPropertiesQuery) {
    const where: Prisma.PropertyWhereInput = {
      partnerId,
      ...(input.status ? { status: input.status as PropertyStatus } : {}),
    };
    const pagination = toPrismaPagination(input);

    const [totalItems, properties] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        ...pagination,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: partnerPropertySummarySelect,
      }),
    ]);

    return {
      items: properties.map(mapPartnerPropertySummary),
      meta: buildPaginationMeta(input, totalItems),
    };
  }

  async findOne(partnerId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, partnerId },
      select: partnerPropertyDetailSelect,
    });

    if (!property) throw new NotFoundException('Property not found.');
    return mapPartnerPropertyDetail(property);
  }

  async create(partnerId: string, input: CreatePartnerPropertyInput) {
    const property = await this.prisma.serializable(async (tx) => {
      const created = await tx.property.create({
        data: {
          partnerId,
          slug: this.slugFromName(input.name),
          name: input.name,
          type: input.type,
          status: PropertyStatus.DRAFT,
          verificationStatus: VerificationStatus.UNVERIFIED,
          shortDescription: input.shortDescription,
          description: input.description,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          locality: input.locality,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          statusEvents: {
            create: {
              fromStatus: null,
              toStatus: PropertyStatus.DRAFT,
              actorUserId: partnerId,
              reason: 'Partner created listing draft',
            },
          },
        },
        select: partnerPropertyDetailSelect,
      });

      return created;
    });

    return mapPartnerPropertyDetail(property);
  }

  async update(
    partnerId: string,
    propertyId: string,
    input: UpdatePartnerPropertyInput,
  ) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(existing.status);

      return tx.property.update({
        where: { id: existing.id },
        data: {
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.type === undefined ? {} : { type: input.type }),
          ...(input.shortDescription === undefined
            ? {}
            : { shortDescription: input.shortDescription }),
          ...(input.description === undefined ? {} : { description: input.description }),
          ...(input.addressLine1 === undefined ? {} : { addressLine1: input.addressLine1 }),
          ...(input.addressLine2 === undefined ? {} : { addressLine2: input.addressLine2 }),
          ...(input.locality === undefined ? {} : { locality: input.locality }),
          ...(input.city === undefined ? {} : { city: input.city }),
          ...(input.state === undefined ? {} : { state: input.state }),
          ...(input.country === undefined ? {} : { country: input.country }),
          ...(input.postalCode === undefined ? {} : { postalCode: input.postalCode }),
          ...(input.latitude === undefined ? {} : { latitude: input.latitude }),
          ...(input.longitude === undefined ? {} : { longitude: input.longitude }),
        },
        select: partnerPropertyDetailSelect,
      });
    });

    return mapPartnerPropertyDetail(property);
  }

  async remove(partnerId: string, propertyId: string) {
    await this.prisma.serializable(async (tx) => {
      const existing = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(existing.status);

      const bookingCount = await tx.booking.count({
        where: { propertyId: existing.id },
      });

      if (bookingCount > 0) {
        throw new ConflictException(
          'A property with booking history cannot be deleted. Keep it as a draft instead.',
        );
      }

      await tx.property.delete({
        where: { id: existing.id },
      });
    });

    return { deleted: true };
  }

  async withdraw(partnerId: string, propertyId: string) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await this.requireOwnedProperty(tx, partnerId, propertyId);

      assertPropertyTransition(existing.status, PropertyStatus.DRAFT);

      await tx.propertyStatusEvent.create({
        data: {
          propertyId: existing.id,
          fromStatus: existing.status,
          toStatus: PropertyStatus.DRAFT,
          actorUserId: partnerId,
          reason: 'Partner withdrew listing for editing',
        },
      });

      await tx.propertyVerification.create({
        data: {
          propertyId: existing.id,
          status: VerificationStatus.UNVERIFIED,
          notes: 'Partner withdrew listing; a new review is required before publication.',
          actorUserId: partnerId,
        },
      });

      return tx.property.update({
        where: { id: existing.id },
        data: {
          status: PropertyStatus.DRAFT,
          verificationStatus: VerificationStatus.UNVERIFIED,
          publishedAt: null,
        },
        select: partnerPropertyDetailSelect,
      });
    });

    return mapPartnerPropertyDetail(property);
  }

  async upsertPetPolicy(
    partnerId: string,
    propertyId: string,
    input: UpsertPetPolicyInput,
  ) {
    return this.prisma.serializable(async (tx) => {
      const property = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(property.status);

      return tx.petPolicy.upsert({
        where: { propertyId: property.id },
        update: {
          maxPets: input.maxPets,
          petFeePaise: input.petFeePaise,
          petFeeMode: input.petFeeMode,
          allowsDogs: input.allowsDogs,
          allowsCats: input.allowsCats,
          allowsOther: input.allowsOther,
          allowedSizes: input.allowedSizes,
          allowedBreedKeys: input.allowedBreedKeys,
          restrictedBreedKeys: input.restrictedBreedKeys,
          requiresVaccination: input.requiresVaccination,
          notes: input.notes,
        },
        create: {
          propertyId: property.id,
          maxPets: input.maxPets,
          petFeePaise: input.petFeePaise,
          petFeeMode: input.petFeeMode,
          allowsDogs: input.allowsDogs,
          allowsCats: input.allowsCats,
          allowsOther: input.allowsOther,
          allowedSizes: input.allowedSizes,
          allowedBreedKeys: input.allowedBreedKeys,
          restrictedBreedKeys: input.restrictedBreedKeys,
          requiresVaccination: input.requiresVaccination,
          notes: input.notes,
        },
      });
    });
  }

  async replaceImages(
    partnerId: string,
    propertyId: string,
    input: ReplacePropertyImagesInput,
  ) {
    return this.prisma.serializable(async (tx) => {
      const property = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(property.status);

      await tx.propertyImage.deleteMany({
        where: { propertyId: property.id },
      });

      if (input.images.length > 0) {
        await tx.propertyImage.createMany({
          data: input.images.map((image, index) => ({
            propertyId: property.id,
            url: image.url,
            altText: image.altText,
            sortOrder: index,
          })),
        });
      }

      return {
        images: await tx.propertyImage.findMany({
          where: { propertyId: property.id },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        }),
      };
    });
  }

  async replaceAmenities(
    partnerId: string,
    propertyId: string,
    input: ReplacePropertyAmenitiesInput,
  ) {
    return this.prisma.serializable(async (tx) => {
      const property = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(property.status);

      const amenities =
        input.amenitySlugs.length === 0
          ? []
          : await tx.amenity.findMany({
              where: { slug: { in: input.amenitySlugs } },
              select: { id: true, slug: true, name: true, category: true, icon: true },
            });

      if (amenities.length !== input.amenitySlugs.length) {
        const found = new Set(amenities.map((amenity) => amenity.slug));
        const missing = input.amenitySlugs.filter((slug) => !found.has(slug));
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'One or more amenities do not exist.',
          details: { missingAmenitySlugs: missing },
        });
      }

      await tx.propertyAmenity.deleteMany({
        where: { propertyId: property.id },
      });

      if (amenities.length > 0) {
        await tx.propertyAmenity.createMany({
          data: amenities.map((amenity) => ({
            propertyId: property.id,
            amenityId: amenity.id,
            verifiedAt: null,
          })),
        });
      }

      return {
        items: amenities
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((amenity) => ({
            ...amenity,
            verifiedAt: null,
          })),
      };
    });
  }

  async availableAmenities() {
    const items = await this.prisma.amenity.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        icon: true,
      },
    });

    return { items };
  }

  async createRoomType(
    partnerId: string,
    propertyId: string,
    input: CreateRoomTypeInput,
  ) {
    return this.prisma.serializable(async (tx) => {
      const property = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertOperationalDefinitionEditable(property.status);

      const room = await tx.roomType.create({
        data: {
          propertyId: property.id,
          name: input.name,
          description: input.description,
          capacity: input.capacity,
          totalUnits: input.totalUnits,
          nightlyRatePaise: input.nightlyRatePaise,
          serviceFeePaise: input.serviceFeePaise,
          active: true,
        },
      });

      await this.recalculateStartingPrice(tx, property.id);
      return room;
    });
  }

  async updateRoomType(
    partnerId: string,
    roomTypeId: string,
    input: UpdateRoomTypeInput,
  ) {
    return this.prisma.serializable(async (tx) => {
      const room = await tx.roomType.findFirst({
        where: {
          id: roomTypeId,
          property: { partnerId },
        },
        include: {
          property: {
            select: { id: true, status: true },
          },
        },
      });

      if (!room) throw new NotFoundException('Room type not found.');
      this.assertOperationalDefinitionEditable(room.property.status);

      if (input.totalUnits !== undefined) {
        const maxReserved = await tx.roomInventory.aggregate({
          where: { roomTypeId: room.id },
          _max: { reservedUnits: true },
        });

        if ((maxReserved._max.reservedUnits ?? 0) > input.totalUnits) {
          throw new ConflictException(
            'Room total cannot be lower than inventory units already reserved.',
          );
        }
      }

      const updated = await tx.roomType.update({
        where: { id: room.id },
        data: {
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.description === undefined ? {} : { description: input.description }),
          ...(input.capacity === undefined ? {} : { capacity: input.capacity }),
          ...(input.totalUnits === undefined ? {} : { totalUnits: input.totalUnits }),
          ...(input.nightlyRatePaise === undefined
            ? {}
            : { nightlyRatePaise: input.nightlyRatePaise }),
          ...(input.serviceFeePaise === undefined
            ? {}
            : { serviceFeePaise: input.serviceFeePaise }),
          ...(input.active === undefined ? {} : { active: input.active }),
        },
      });

      await this.recalculateStartingPrice(tx, room.property.id);
      return updated;
    });
  }

  async inventory(
    partnerId: string,
    roomTypeId: string,
    input: InventoryCalendarQuery,
  ) {
    const room = await this.prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        property: { partnerId },
      },
      select: {
        id: true,
        name: true,
        totalUnits: true,
      },
    });

    if (!room) throw new NotFoundException('Room type not found.');

    const rows = await this.prisma.roomInventory.findMany({
      where: {
        roomTypeId: room.id,
        date: {
          gte: input.from,
          lte: input.to,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        totalUnits: true,
        reservedUnits: true,
        nightlyRatePaise: true,
        closed: true,
      },
    });

    return {
      roomType: room,
      from: input.from.toISOString().slice(0, 10),
      to: input.to.toISOString().slice(0, 10),
      items: rows.map((row) => ({
        ...row,
        date: row.date.toISOString().slice(0, 10),
        availableUnits: Math.max(0, row.totalUnits - row.reservedUnits),
      })),
    };
  }

  async updateInventory(
    partnerId: string,
    roomTypeId: string,
    input: UpdateInventoryCalendarInput,
  ) {
    const today = todayInIndia();

    const rows = await this.prisma.serializable(async (tx) => {
      const room = await tx.roomType.findFirst({
        where: {
          id: roomTypeId,
          property: { partnerId },
        },
        include: {
          property: { select: { status: true } },
        },
      });

      if (!room) throw new NotFoundException('Room type not found.');

      const output: Array<{
        id: string;
        date: Date;
        totalUnits: number;
        reservedUnits: number;
        nightlyRatePaise: number | null;
        closed: boolean;
      }> = [];

      for (const update of input.updates) {
        if (update.date < today) {
          throw new BadRequestException(
            'Past inventory dates cannot be modified.',
          );
        }

        const existing = await tx.roomInventory.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId: room.id,
              date: update.date,
            },
          },
        });

        if (existing) {
          const nextTotal = update.totalUnits ?? existing.totalUnits;

          if (nextTotal < existing.reservedUnits) {
            throw new ConflictException(
              `Inventory on ${update.date.toISOString().slice(0, 10)} cannot be reduced below ${existing.reservedUnits} reserved unit(s).`,
            );
          }

          output.push(
            await tx.roomInventory.update({
              where: { id: existing.id },
              data: {
                totalUnits: nextTotal,
                ...(update.nightlyRatePaise === undefined
                  ? {}
                  : { nightlyRatePaise: update.nightlyRatePaise }),
                ...(update.closed === undefined ? {} : { closed: update.closed }),
              },
              select: {
                id: true,
                date: true,
                totalUnits: true,
                reservedUnits: true,
                nightlyRatePaise: true,
                closed: true,
              },
            }),
          );
        } else {
          output.push(
            await tx.roomInventory.create({
              data: {
                roomTypeId: room.id,
                date: update.date,
                totalUnits: update.totalUnits ?? room.totalUnits,
                reservedUnits: 0,
                nightlyRatePaise: update.nightlyRatePaise ?? null,
                closed: update.closed ?? false,
              },
              select: {
                id: true,
                date: true,
                totalUnits: true,
                reservedUnits: true,
                nightlyRatePaise: true,
                closed: true,
              },
            }),
          );
        }
      }

      return output;
    });

    return {
      items: rows
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((row) => ({
          ...row,
          date: row.date.toISOString().slice(0, 10),
          availableUnits: Math.max(0, row.totalUnits - row.reservedUnits),
        })),
    };
  }

  async readiness(partnerId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, partnerId },
      select: { id: true },
    });

    if (!property) throw new NotFoundException('Property not found.');

    return this.listingReadiness(this.prisma, property.id);
  }

  async submit(partnerId: string, propertyId: string) {
    const property = await this.prisma.serializable(async (tx) => {
      const existing = await this.requireOwnedProperty(tx, partnerId, propertyId);
      this.assertDraftEditable(existing.status);

      assertPropertyTransition(existing.status, PropertyStatus.PENDING_REVIEW);

      const readiness = await this.listingReadiness(tx, existing.id);
      if (!readiness.ready) {
        throw new BadRequestException({
          code: 'LISTING_NOT_READY',
          message: 'The listing is not ready for review.',
          details: { missing: readiness.missing },
        });
      }

      const now = new Date();

      await tx.propertyStatusEvent.create({
        data: {
          propertyId: existing.id,
          fromStatus: existing.status,
          toStatus: PropertyStatus.PENDING_REVIEW,
          actorUserId: partnerId,
          reason: 'Partner submitted listing for verification',
        },
      });

      await tx.propertyVerification.create({
        data: {
          propertyId: existing.id,
          status: VerificationStatus.PENDING,
          notes: 'Partner submitted listing for platform review.',
          actorUserId: partnerId,
        },
      });

      return tx.property.update({
        where: { id: existing.id },
        data: {
          status: PropertyStatus.PENDING_REVIEW,
          verificationStatus: VerificationStatus.PENDING,
          publishedAt: null,
          updatedAt: now,
        },
        select: partnerPropertyDetailSelect,
      });
    });

    return mapPartnerPropertyDetail(property);
  }

  async assertListingReady(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ) {
    const readiness = await this.listingReadiness(tx, propertyId);

    if (!readiness.ready) {
      throw new BadRequestException({
        code: 'LISTING_NOT_READY',
        message: 'The listing does not satisfy publication requirements.',
        details: { missing: readiness.missing },
      });
    }

    return readiness;
  }

  private async listingReadiness(
    db: ReadinessDb,
    propertyId: string,
  ) {
    const today = todayInIndia();
    const [policy, imageCount, activeRooms, futureInventoryCount] = await Promise.all([
      db.petPolicy.findUnique({
        where: { propertyId },
        select: { id: true },
      }),
      db.propertyImage.count({
        where: { propertyId },
      }),
      db.roomType.findMany({
        where: { propertyId, active: true },
        select: { id: true },
      }),
      db.roomInventory.count({
        where: {
          roomType: {
            propertyId,
            active: true,
          },
          date: { gte: today },
          closed: false,
        },
      }),
    ]);

    const missing: string[] = [];
    if (!policy) missing.push('pet_policy');
    if (imageCount === 0) missing.push('property_image');
    if (activeRooms.length === 0) missing.push('active_room_type');
    if (futureInventoryCount === 0) missing.push('future_inventory');

    return {
      ready: missing.length === 0,
      missing,
      checks: {
        petPolicy: Boolean(policy),
        images: imageCount,
        activeRoomTypes: activeRooms.length,
        futureInventoryRows: futureInventoryCount,
      },
    };
  }

  private async requireOwnedProperty(
    tx: Prisma.TransactionClient,
    partnerId: string,
    propertyId: string,
  ) {
    const property = await tx.property.findFirst({
      where: { id: propertyId, partnerId },
      select: {
        id: true,
        status: true,
        verificationStatus: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found.');
    return property;
  }

  private assertDraftEditable(status: PropertyStatus) {
    if (status !== PropertyStatus.DRAFT) {
      throw new ConflictException(
        'Listing claims can only be edited while the property is in DRAFT status.',
      );
    }
  }

  private assertOperationalDefinitionEditable(status: PropertyStatus) {
    if (status === PropertyStatus.PENDING_REVIEW) {
      throw new ConflictException(
        'Room definitions are frozen while the listing is under review.',
      );
    }
  }

  private async recalculateStartingPrice(
    tx: Prisma.TransactionClient,
    propertyId: string,
  ) {
    const aggregate = await tx.roomType.aggregate({
      where: { propertyId, active: true },
      _min: { nightlyRatePaise: true },
    });

    await tx.property.update({
      where: { id: propertyId },
      data: {
        startingPricePaise: aggregate._min.nightlyRatePaise ?? 0,
      },
    });
  }

  private slugFromName(name: string) {
    const base = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
    return `${base || 'stay'}-${suffix}`;
  }
}
