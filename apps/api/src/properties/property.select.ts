import { Prisma } from '@purrfect/database';

export const propertySummarySelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  shortDescription: true,
  locality: true,
  city: true,
  state: true,
  averageRating: true,
  reviewCount: true,
  startingPricePaise: true,
  featured: true,
  images: {
    orderBy: { sortOrder: Prisma.SortOrder.asc },
    take: 1,
    select: {
      url: true,
      altText: true,
      sortOrder: true,
    },
  },
  amenities: {
    where: { verifiedAt: { not: null } },
    orderBy: {
      amenity: {
        name: Prisma.SortOrder.asc,
      },
    },
    take: 6,
    select: {
      details: true,
      verifiedAt: true,
      amenity: {
        select: {
          slug: true,
          name: true,
          category: true,
          icon: true,
        },
      },
    },
  },
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
      notes: true,
    },
  },
} satisfies Prisma.PropertySelect;

export const propertyDetailSelect = {
  ...propertySummarySelect,
  description: true,
  addressLine1: true,
  addressLine2: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  images: {
    orderBy: { sortOrder: Prisma.SortOrder.asc },
    select: {
      url: true,
      altText: true,
      sortOrder: true,
    },
  },
  amenities: {
    where: { verifiedAt: { not: null } },
    orderBy: {
      amenity: {
        name: Prisma.SortOrder.asc,
      },
    },
    select: {
      details: true,
      verifiedAt: true,
      amenity: {
        select: {
          slug: true,
          name: true,
          category: true,
          icon: true,
        },
      },
    },
  },
  roomTypes: {
    where: { active: true },
    orderBy: [{ nightlyRatePaise: Prisma.SortOrder.asc }, { name: Prisma.SortOrder.asc }],
    select: {
      id: true,
      name: true,
      description: true,
      capacity: true,
      totalUnits: true,
      nightlyRatePaise: true,
      serviceFeePaise: true,
    },
  },
} satisfies Prisma.PropertySelect;
