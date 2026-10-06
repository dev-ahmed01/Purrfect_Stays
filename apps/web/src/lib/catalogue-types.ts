export type Money = {
  currency: 'INR' | string;
  amountPaise: number;
};

export type PublicAmenity = {
  slug: string;
  name: string;
  category: string;
  icon: string | null;
  verified?: boolean;
  details?: string | null;
  verifiedAt?: string | null;
};

export type PublicPetPolicy = {
  maxPets: number;
  fee: Money & { mode: string };
  allowsDogs: boolean;
  allowsCats: boolean;
  allowsOther: boolean;
  allowedSizes: string[];
  allowedBreedKeys: string[];
  restrictedBreedKeys: string[];
  requiresVaccination: boolean;
  notes?: string | null;
};

export type PropertySummary = {
  id: string;
  slug: string;
  name: string;
  type: string;
  shortDescription: string;
  location: {
    locality: string | null;
    city: string;
    state: string;
  };
  rating: number;
  reviewCount: number;
  startingPrice: Money;
  featured: boolean;
  heroImage: {
    url: string;
    altText: string;
    sortOrder: number;
  } | null;
  amenities: PublicAmenity[];
  petPolicy: PublicPetPolicy | null;
};

export type PropertyDetail = PropertySummary & {
  description: string;
  address: {
    line1: string;
    line2: string | null;
    locality: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  images: Array<{
    url: string;
    altText: string;
    sortOrder: number;
  }>;
  amenities: PublicAmenity[];
  petPolicy: PublicPetPolicy | null;
  roomTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    totalUnits: number;
    nightlyRate: Money;
    serviceFee: Money;
  }>;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PropertySearchResponse = {
  items: PropertySummary[];
  meta: PaginationMeta;
  query: Record<string, unknown>;
};

export type FeaturedPropertiesResponse = {
  items: PropertySummary[];
};

export type DestinationsResponse = {
  items: Array<{
    city: string;
    state: string;
    stays: number;
  }>;
};

export type CatalogueFacets = {
  amenities: PublicAmenity[];
  propertyTypes: Array<{
    type: string;
    stays: number;
  }>;
  priceRange: {
    currency: string;
    minAmountPaise: number;
    maxAmountPaise: number;
  };
};

export type PublicReview = {
  id: string;
  bookingId: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  author?: {
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type PublicReviewsResponse = {
  summary: {
    averageRating: number;
    reviewCount: number;
  };
  items: PublicReview[];
  meta: PaginationMeta;
};

export type PetProfile = {
  id: string;
  name: string;
  species: string;
  breed: string;
  size: string;
  weightKg: number | null;
  birthDate: string | null;
  vaccinated: boolean;
  specialNeeds: string | null;
};

export type BookingQuote = {
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
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  petCount: number;
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string;
    size: string;
  }>;
  pricing: {
    currency: string;
    subtotalPaise: number;
    petFeePaise: number;
    serviceFeePaise: number;
    taxRateBps: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
  };
  availability: 'AVAILABLE';
  notice: string;
};

export type BookingCreateResult = {
  booking: {
    id: string;
    reference: string;
    status: string;
    checkIn: string;
    checkOut: string;
    totalPaise?: number;
    pricing?: {
      totalPaise: number;
      currency: string;
    };
  };
  idempotentReplay: boolean;
};
