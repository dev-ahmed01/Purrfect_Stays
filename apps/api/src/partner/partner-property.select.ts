import { Prisma } from '@purrfect/database';

export const partnerPropertySummarySelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  status: true,
  verificationStatus: true,
  shortDescription: true,
  city: true,
  state: true,
  startingPricePaise: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      roomTypes: true,
      images: true,
      amenities: true,
      bookings: true,
    },
  },
} satisfies Prisma.PropertySelect;

export const partnerPropertyDetailSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  status: true,
  verificationStatus: true,
  shortDescription: true,
  description: true,
  addressLine1: true,
  addressLine2: true,
  locality: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  averageRating: true,
  reviewCount: true,
  startingPricePaise: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
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
      updatedAt: true,
    },
  },
  images: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      url: true,
      altText: true,
      sortOrder: true,
      createdAt: true,
    },
  },
  amenities: {
    orderBy: {
      amenity: {
        name: 'asc',
      },
    },
    select: {
      details: true,
      verifiedAt: true,
      amenity: {
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          icon: true,
        },
      },
    },
  },
  roomTypes: {
    orderBy: [{ active: 'desc' }, { nightlyRatePaise: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      capacity: true,
      totalUnits: true,
      nightlyRatePaise: true,
      serviceFeePaise: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          bookings: true,
          inventory: true,
        },
      },
    },
  },
  statusEvents: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  },
  verifications: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      status: true,
      notes: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  },
  _count: {
    select: {
      bookings: true,
      favourites: true,
      reviews: true,
    },
  },
} satisfies Prisma.PropertySelect;
