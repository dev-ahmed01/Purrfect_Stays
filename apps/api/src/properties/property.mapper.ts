type PropertyImageShape = {
  url: string;
  altText: string;
  sortOrder: number;
};

type AmenityShape = {
  details: string | null;
  verifiedAt: Date | null;
  amenity: {
    slug: string;
    name: string;
    category: string;
    icon: string | null;
  };
};

type PetPolicyShape = {
  maxPets: number;
  petFeePaise: number;
  petFeeMode: string;
  allowsDogs: boolean;
  allowsCats: boolean;
  allowsOther: boolean;
  allowedSizes: string[];
  allowedBreedKeys: string[];
  restrictedBreedKeys: string[];
  requiresVaccination: boolean;
  notes: string | null;
} | null;

export function mapPropertySummary(property: {
  id: string;
  slug: string;
  name: string;
  type: string;
  shortDescription: string;
  locality: string | null;
  city: string;
  state: string;
  averageRating: { toString(): string } | number | string;
  reviewCount: number;
  startingPricePaise: number;
  featured: boolean;
  images: PropertyImageShape[];
  amenities: AmenityShape[];
  petPolicy: PetPolicyShape;
}) {
  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    type: property.type,
    shortDescription: property.shortDescription,
    location: {
      locality: property.locality,
      city: property.city,
      state: property.state,
    },
    rating: Number(property.averageRating),
    reviewCount: property.reviewCount,
    startingPrice: {
      currency: 'INR',
      amountPaise: property.startingPricePaise,
    },
    featured: property.featured,
    heroImage: property.images[0] ?? null,
    amenities: property.amenities.map((item) => ({
      slug: item.amenity.slug,
      name: item.amenity.name,
      category: item.amenity.category,
      icon: item.amenity.icon,
      verified: item.verifiedAt !== null,
    })),
    petPolicy: property.petPolicy
      ? {
          maxPets: property.petPolicy.maxPets,
          fee: {
            currency: 'INR',
            amountPaise: property.petPolicy.petFeePaise,
            mode: property.petPolicy.petFeeMode,
          },
          allowsDogs: property.petPolicy.allowsDogs,
          allowsCats: property.petPolicy.allowsCats,
          allowsOther: property.petPolicy.allowsOther,
          allowedSizes: property.petPolicy.allowedSizes,
          allowedBreedKeys: property.petPolicy.allowedBreedKeys,
          restrictedBreedKeys: property.petPolicy.restrictedBreedKeys,
          requiresVaccination: property.petPolicy.requiresVaccination,
        }
      : null,
  };
}

export function mapPropertyDetail(property: Parameters<typeof mapPropertySummary>[0] & {
  description: string;
  addressLine1: string;
  addressLine2: string | null;
  country: string;
  postalCode: string | null;
  latitude: { toString(): string } | number | string | null;
  longitude: { toString(): string } | number | string | null;
  images: PropertyImageShape[];
  roomTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    totalUnits: number;
    nightlyRatePaise: number;
    serviceFeePaise: number;
  }>;
}) {
  return {
    ...mapPropertySummary(property),
    description: property.description,
    address: {
      line1: property.addressLine1,
      line2: property.addressLine2,
      locality: property.locality,
      city: property.city,
      state: property.state,
      country: property.country,
      postalCode: property.postalCode,
      latitude: property.latitude === null ? null : Number(property.latitude),
      longitude: property.longitude === null ? null : Number(property.longitude),
    },
    images: property.images,
    amenities: property.amenities.map((item) => ({
      slug: item.amenity.slug,
      name: item.amenity.name,
      category: item.amenity.category,
      icon: item.amenity.icon,
      details: item.details,
      verifiedAt: item.verifiedAt,
    })),
    petPolicy: property.petPolicy
      ? {
          maxPets: property.petPolicy.maxPets,
          fee: {
            currency: 'INR',
            amountPaise: property.petPolicy.petFeePaise,
            mode: property.petPolicy.petFeeMode,
          },
          allowsDogs: property.petPolicy.allowsDogs,
          allowsCats: property.petPolicy.allowsCats,
          allowsOther: property.petPolicy.allowsOther,
          allowedSizes: property.petPolicy.allowedSizes,
          allowedBreedKeys: property.petPolicy.allowedBreedKeys,
          restrictedBreedKeys: property.petPolicy.restrictedBreedKeys,
          requiresVaccination: property.petPolicy.requiresVaccination,
          notes: property.petPolicy.notes,
        }
      : null,
    roomTypes: property.roomTypes.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      totalUnits: room.totalUnits,
      nightlyRate: {
        currency: 'INR',
        amountPaise: room.nightlyRatePaise,
      },
      serviceFee: {
        currency: 'INR',
        amountPaise: room.serviceFeePaise,
      },
    })),
  };
}
