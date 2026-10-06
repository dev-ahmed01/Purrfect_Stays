import argon2 from 'argon2';
import {
  BookingStatus,
  PetFeeMode,
  PetSize,
  PetSpecies,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  ReviewStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const DAY_MS = 86_400_000;

function utcDate(offsetDays: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
}

async function resetDemoData() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run destructive demo seed in production.');
  }

  await prisma.review.deleteMany();
  await prisma.bookingInventoryReservation.deleteMany();
  await prisma.bookingStatusEvent.deleteMany();
  await prisma.bookingPet.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.roomInventory.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.petPolicy.deleteMany();
  await prisma.propertyVerification.deleteMany();
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('Set SEED_DEMO_PASSWORD to a local demo password of at least 12 characters.');
  }

  await resetDemoData();

  const passwordHash = await argon2.hash(demoPassword, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const [admin, partner, petParent] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@purrfect.local',
        phone: '+919000000001',
        passwordHash,
        fullName: 'Purrfect Admin',
        city: 'Bengaluru',
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'partner@purrfect.local',
        phone: '+919000000002',
        passwordHash,
        fullName: 'Aarav Hospitality',
        city: 'Bengaluru',
        role: UserRole.PARTNER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ananya@purrfect.local',
        phone: '+919000000003',
        passwordHash,
        fullName: 'Ananya Pillai',
        city: 'Bengaluru',
        role: UserRole.USER,
      },
    }),
  ]);

  const bruno = await prisma.pet.create({
    data: {
      userId: petParent.id,
      name: 'Bruno',
      species: PetSpecies.DOG,
      breed: 'Golden Retriever',
      size: PetSize.LARGE,
      weightKg: 31.5,
      vaccinated: true,
      specialNeeds: 'Prefers open outdoor space and quiet rooms.',
    },
  });

  const amenities = [
    ['pet-playground', 'Pet playground', 'pet', '🛝'],
    ['garden', 'Garden / open lawn', 'outdoor', '🌿'],
    ['walking-trails', 'Walking trails', 'outdoor', '🥾'],
    ['grooming', 'Grooming', 'service', '✂️'],
    ['pool', 'Pool', 'property', '🏊'],
    ['vet-nearby', 'Vet nearby', 'safety', '🩺'],
    ['in-house-vet', 'In-house vet', 'safety', '🩺'],
    ['pet-food', 'Pet food menu', 'food', '🍖'],
    ['pet-beds', 'Pet beds & bowls', 'pet', '🛏️'],
    ['beach-access', 'Beach access', 'outdoor', '🏖️'],
    ['heated-pet-beds', 'Heated pet beds', 'pet', '🔥'],
    ['pet-attendant', 'Pet attendant', 'service', '🐾'],
  ] as const;

  const amenityMap = new Map<string, string>();
  for (const [slug, name, category, icon] of amenities) {
    const amenity = await prisma.amenity.create({
      data: { slug, name, category, icon },
    });
    amenityMap.set(slug, amenity.id);
  }

  const propertySeeds = [
    {
      slug: 'the-paw-villa',
      name: 'The Paw Villa',
      type: PropertyType.VILLA,
      locality: 'Anjuna',
      city: 'Goa',
      state: 'Goa',
      postalCode: '403509',
      shortDescription: 'Beachside villa with a pet play lawn, pool and grooming studio.',
      description:
        'A relaxed beachside villa in Anjuna with a dedicated pet play lawn, saltwater pool and in-house grooming space. Designed for pet parents who want room to slow down without compromising their pet routine.',
      rate: 580_000,
      featured: true,
      rating: 4.9,
      reviewCount: 126,
      policy: {
        maxPets: 2,
        petFeePaise: 50_000,
        petFeeMode: PetFeeMode.PER_NIGHT,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE, PetSize.EXTRA_LARGE],
        requiresVaccination: true,
        notes: 'All vaccinated dogs and cats welcome. Maximum two pets per booking.',
      },
      amenities: ['pet-playground', 'grooming', 'pool', 'vet-nearby', 'pet-food', 'pet-beds'],
      image:
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'forest-paws-homestay',
      name: 'Forest Paws Homestay',
      type: PropertyType.HOMESTAY,
      locality: 'Madikeri',
      city: 'Coorg',
      state: 'Karnataka',
      postalCode: '571201',
      shortDescription: 'Coffee-estate homestay with a large garden and forest walks.',
      description:
        'A cosy homestay surrounded by coffee plantations. The property is built around long garden time, quiet mornings and easy access to forested walking routes.',
      rate: 340_000,
      featured: true,
      rating: 4.8,
      reviewCount: 88,
      policy: {
        maxPets: 2,
        petFeePaise: 30_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.MEDIUM, PetSize.LARGE],
        requiresVaccination: true,
        notes: 'Dogs and cats welcome. Vaccination record required at check-in.',
      },
      amenities: ['garden', 'walking-trails', 'vet-nearby', 'pet-food', 'pet-beds'],
      image:
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'snow-peaks-pet-resort',
      name: 'Snow Peaks Pet Resort',
      type: PropertyType.RESORT,
      locality: 'Old Manali',
      city: 'Manali',
      state: 'Himachal Pradesh',
      postalCode: '175131',
      shortDescription: 'Mountain resort with indoor play, grooming and veterinary support.',
      description:
        'A high-altitude resort with a heated indoor pet area, grooming suite and veterinary support. A strong fit for active pets travelling into colder conditions.',
      rate: 720_000,
      featured: true,
      rating: 4.9,
      reviewCount: 104,
      policy: {
        maxPets: 3,
        petFeePaise: 45_000,
        petFeeMode: PetFeeMode.PER_NIGHT,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: true,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE, PetSize.EXTRA_LARGE],
        requiresVaccination: true,
        notes: 'All pets welcome subject to vaccination and a pet safety acknowledgement.',
      },
      amenities: ['pet-playground', 'grooming', 'in-house-vet', 'pet-food', 'heated-pet-beds', 'walking-trails'],
      image:
        'https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'nilgiri-nature-stay',
      name: 'Nilgiri Nature Stay',
      type: PropertyType.HOMESTAY,
      locality: 'Fern Hill',
      city: 'Ooty',
      state: 'Tamil Nadu',
      postalCode: '643004',
      shortDescription: 'Heritage bungalow with tea-estate views and quiet garden space.',
      description:
        'A small heritage stay overlooking the Nilgiris. Best suited to pet parents looking for a quieter base with garden access and cooler weather.',
      rate: 290_000,
      featured: false,
      rating: 4.7,
      reviewCount: 57,
      policy: {
        maxPets: 1,
        petFeePaise: 25_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM],
        requiresVaccination: true,
        notes: 'Small and medium dogs or cats only.',
      },
      amenities: ['garden', 'pet-food', 'vet-nearby', 'pet-beds'],
      image:
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'haveli-paws',
      name: 'Haveli Paws',
      type: PropertyType.HOTEL,
      locality: 'Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
      shortDescription: 'Heritage hotel with pet suites, grooming and a dedicated play yard.',
      description:
        'A boutique heritage property that pairs traditional Jaipur hospitality with dedicated pet services, including pet suites and an on-call support network.',
      rate: 650_000,
      featured: false,
      rating: 4.8,
      reviewCount: 73,
      policy: {
        maxPets: 2,
        petFeePaise: 60_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: true,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE, PetSize.EXTRA_LARGE],
        requiresVaccination: true,
        notes: 'All vaccinated pets welcome. Maximum two pets per room.',
      },
      amenities: ['pet-attendant', 'grooming', 'vet-nearby', 'pool', 'pet-food', 'pet-playground'],
      image:
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'seaside-whiskers-cottage',
      name: 'Seaside Whiskers Cottage',
      type: PropertyType.COTTAGE,
      locality: 'White Town',
      city: 'Pondicherry',
      state: 'Puducherry',
      postalCode: '605001',
      shortDescription: 'French-quarter cottage close to the promenade and pet-friendly cafés.',
      description:
        'A compact cottage in White Town for travellers who want to explore on foot. The beach promenade, pet-friendly cafés and a nearby veterinary clinic are all within easy reach.',
      rate: 380_000,
      featured: false,
      rating: 4.6,
      reviewCount: 42,
      policy: {
        maxPets: 2,
        petFeePaise: 25_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.SMALL],
        requiresVaccination: true,
        notes: 'Cats and small dogs welcome.',
      },
      amenities: ['beach-access', 'vet-nearby', 'garden'],
      image:
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'munnar-mist-retreat',
      name: 'Munnar Mist Retreat',
      type: PropertyType.RESORT,
      locality: 'Pallivasal',
      city: 'Munnar',
      state: 'Kerala',
      postalCode: '685612',
      shortDescription: 'Eco-retreat among tea estates with guided walks and organic pet meals.',
      description:
        'A misty hill retreat surrounded by tea estates. It combines open walking space, locally prepared pet meals and nearby veterinary support.',
      rate: 420_000,
      featured: false,
      rating: 4.7,
      reviewCount: 61,
      policy: {
        maxPets: 2,
        petFeePaise: 35_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE, PetSize.EXTRA_LARGE],
        requiresVaccination: true,
        notes: 'Vaccinated dogs and cats of all sizes welcome.',
      },
      amenities: ['walking-trails', 'grooming', 'vet-nearby', 'pet-beds', 'pet-food'],
      image:
        'https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1600&q=80',
    },
    {
      slug: 'pawsome-beach-shack',
      name: 'Pawsome Beach Shack',
      type: PropertyType.HOMESTAY,
      locality: 'North Cliff',
      city: 'Varkala',
      state: 'Kerala',
      postalCode: '695141',
      shortDescription: 'Simple beach stay near Varkala cliff with room for relaxed pet walks.',
      description:
        'A budget-friendly stay near Varkala cliff for uncomplicated beach trips with pets. Best for travellers who value location and outdoor time over resort-style facilities.',
      rate: 220_000,
      featured: false,
      rating: 4.5,
      reviewCount: 39,
      policy: {
        maxPets: 1,
        petFeePaise: 20_000,
        petFeeMode: PetFeeMode.PER_STAY,
        allowsDogs: true,
        allowsCats: true,
        allowsOther: false,
        allowedSizes: [PetSize.SMALL, PetSize.MEDIUM],
        requiresVaccination: false,
        notes: 'Dogs and cats welcome. One pet per booking.',
      },
      amenities: ['beach-access', 'vet-nearby'],
      image:
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  const createdProperties = new Map<string, { id: string; roomTypeId: string }>();

  for (const seed of propertySeeds) {
    const property = await prisma.property.create({
      data: {
        partnerId: partner.id,
        slug: seed.slug,
        name: seed.name,
        type: seed.type,
        status: PropertyStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VERIFIED,
        shortDescription: seed.shortDescription,
        description: seed.description,
        addressLine1: `${seed.name}, ${seed.locality}`,
        locality: seed.locality,
        city: seed.city,
        state: seed.state,
        country: 'India',
        postalCode: seed.postalCode,
        averageRating: seed.rating,
        reviewCount: seed.reviewCount,
        ratingBaselineCount: seed.reviewCount,
        ratingBaselineTotal: Math.round(seed.rating * seed.reviewCount * 100) / 100,
        startingPricePaise: seed.rate,
        featured: seed.featured,
        publishedAt: new Date(),
        petPolicy: { create: seed.policy },
        images: {
          create: [{ url: seed.image, altText: `${seed.name} property exterior`, sortOrder: 0 }],
        },
        amenities: {
          create: seed.amenities.map((slug) => ({
            amenityId: amenityMap.get(slug)!,
            verifiedAt: new Date(),
          })),
        },
        verifications: {
          create: {
            status: VerificationStatus.VERIFIED,
            notes: 'Verified demo listing created by seed data.',
            actorUserId: admin.id,
          },
        },
        statusEvents: {
          create: {
            fromStatus: null,
            toStatus: PropertyStatus.PUBLISHED,
            actorUserId: admin.id,
            reason: 'Published verified demo listing created by seed data.',
          },
        },
      },
    });

    const roomType = await prisma.roomType.create({
      data: {
        propertyId: property.id,
        name: seed.type === PropertyType.HOMESTAY ? 'Pet-friendly room' : 'Pet-friendly stay',
        description: 'Primary bookable inventory for the seeded demo property.',
        capacity: 3,
        totalUnits: seed.type === PropertyType.RESORT || seed.type === PropertyType.HOTEL ? 4 : 2,
        nightlyRatePaise: seed.rate,
        serviceFeePaise: 35_000,
      },
    });

    await prisma.roomInventory.createMany({
      data: Array.from({ length: 90 }, (_, index) => ({
        roomTypeId: roomType.id,
        date: utcDate(index),
        totalUnits: roomType.totalUnits,
        reservedUnits: index % 17 === 0 ? Math.min(1, roomType.totalUnits) : 0,
        nightlyRatePaise: index % 7 === 5 ? Math.round(seed.rate * 1.1) : null,
        closed: false,
      })),
    });

    createdProperties.set(seed.slug, { id: property.id, roomTypeId: roomType.id });
  }

  const pawVilla = createdProperties.get('the-paw-villa');
  if (!pawVilla) throw new Error('Seed invariant failed: The Paw Villa was not created.');

  const checkIn = utcDate(-10);
  const checkOut = utcDate(-8);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
  const subtotalPaise = 580_000 * nights;
  const petFeePaise = 50_000 * nights;
  const serviceFeePaise = 35_000;
  const taxable = subtotalPaise + petFeePaise + serviceFeePaise;
  const taxPaise = Math.round(taxable * 0.12);

  const completedBooking = await prisma.booking.create({
    data: {
      reference: 'PURR-GOA-28492',
      idempotencyKey: 'seed-completed-booking-0001',
      requestHash: 'seed-completed-booking-request-hash',
      userId: petParent.id,
      propertyId: pawVilla.id,
      roomTypeId: pawVilla.roomTypeId,
      checkIn,
      checkOut,
      nights,
      guests: 2,
      petCount: 1,
      subtotalPaise,
      petFeePaise,
      serviceFeePaise,
      taxPaise,
      taxRateBps: 1200,
      totalPaise: taxable + taxPaise,
      status: BookingStatus.COMPLETED,
      confirmedAt: checkIn,
      checkedInAt: checkIn,
      completedAt: checkOut,
      pets: {
        create: {
          petId: bruno.id,
          name: bruno.name,
          species: bruno.species,
          breed: bruno.breed,
          size: bruno.size,
        },
      },
      statusEvents: {
        create: [
          {
            fromStatus: null,
            toStatus: BookingStatus.CONFIRMED,
            actorUserId: petParent.id,
            reason: 'Seeded demo booking',
            createdAt: checkIn,
          },
          {
            fromStatus: BookingStatus.CONFIRMED,
            toStatus: BookingStatus.CHECKED_IN,
            actorUserId: partner.id,
            createdAt: checkIn,
          },
          {
            fromStatus: BookingStatus.CHECKED_IN,
            toStatus: BookingStatus.COMPLETED,
            actorUserId: partner.id,
            createdAt: checkOut,
          },
        ],
      },
    },
  });

  const forestPaws = createdProperties.get('forest-paws-homestay');
  if (!forestPaws) throw new Error('Seed invariant failed: Forest Paws was not created.');

  await Promise.all([
    prisma.review.create({
      data: {
        bookingId: completedBooking.id,
        userId: petParent.id,
        propertyId: pawVilla.id,
        rating: 5,
        title: 'Bruno had room to actually enjoy the trip',
        body:
          'The pet policy matched what we found at check-in, the lawn was genuinely spacious and having a vet option nearby made the stay much less stressful.',
        status: ReviewStatus.PUBLISHED,
        moderatedByUserId: admin.id,
        moderatedAt: new Date(),
        moderationNote: 'Approved seeded demo review.',
      },
    }),
    prisma.favourite.create({
      data: {
        userId: petParent.id,
        propertyId: forestPaws.id,
      },
    }),
  ]);

  const pawVillaSeed = propertySeeds.find((seed) => seed.slug === 'the-paw-villa');
  if (!pawVillaSeed) throw new Error('Seed invariant failed: The Paw Villa seed was not found.');

  const pawVillaReviewCount = pawVillaSeed.reviewCount + 1;
  const pawVillaRatingTotal = pawVillaSeed.rating * pawVillaSeed.reviewCount + 5;

  await prisma.property.update({
    where: { id: pawVilla.id },
    data: {
      reviewCount: pawVillaReviewCount,
      averageRating: pawVillaRatingTotal / pawVillaReviewCount,
    },
  });

  console.log('Purrfect Stays seed complete.');
  console.log('Demo accounts: admin@purrfect.local, partner@purrfect.local, ananya@purrfect.local');
  console.log(`Created ${propertySeeds.length} properties with 90 days of room inventory each.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
