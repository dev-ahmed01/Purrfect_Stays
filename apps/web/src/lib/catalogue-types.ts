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


export type BookingView = {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  petCount: number;
  property: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    heroImage: {
      url: string;
      altText: string;
    } | null;
  };
  roomType: {
    id: string;
    name: string;
  };
  pets: Array<{
    petId: string | null;
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
  lifecycle: {
    confirmedAt: string | null;
    checkedInAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
  };
  statusEvents: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type MyReview = {
  id: string;
  bookingId: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  property?: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
  };
  booking?: {
    reference: string;
  };
  moderation: {
    note: string | null;
    moderatedAt: string | null;
  };
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};


export type PartnerDashboard = {
  properties: {
    total: number;
    byStatus: Record<string, number>;
  };
  stays: {
    upcomingConfirmed: number;
    checkedIn: number;
    arrivalsToday: number;
    departuresToday: number;
  };
  reservationValue: {
    currency: string;
    amountPaise: number;
    note: string;
  };
  nextArrivals: PartnerBookingView[];
  businessDate: string;
};

export type PartnerBookingView = BookingView & {
  guest: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
};

export type PartnerPropertySummary = {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  verificationStatus: string;
  shortDescription: string;
  city: string;
  state: string;
  startingPricePaise: number;
  startingPrice: Money;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    roomTypes: number;
    images: number;
    amenities: number;
    bookings: number;
  };
};

export type PartnerPropertyDetail = {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  verificationStatus: string;
  shortDescription: string;
  description: string;
  addressLine1: string;
  addressLine2: string | null;
  locality: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  reviewCount: number;
  startingPricePaise: number;
  startingPrice: Money;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  petPolicy: null | {
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
    updatedAt: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText: string;
    sortOrder: number;
    createdAt: string;
  }>;
  amenities: Array<{
    details: string | null;
    verifiedAt: string | null;
    amenity: {
      id: string;
      slug: string;
      name: string;
      category: string;
      icon: string | null;
    };
  }>;
  roomTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    totalUnits: number;
    nightlyRatePaise: number;
    serviceFeePaise: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      bookings: number;
      inventory: number;
    };
  }>;
  statusEvents: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
    actor: null | {
      id: string;
      fullName: string;
      role: string;
    };
  }>;
  verifications: Array<{
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    actor: null | {
      id: string;
      fullName: string;
      role: string;
    };
  }>;
  _count: {
    bookings: number;
    favourites: number;
    reviews: number;
  };
};

export type PartnerAmenity = {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon: string | null;
};

export type InventoryRow = {
  id: string;
  date: string;
  totalUnits: number;
  reservedUnits: number;
  nightlyRatePaise: number | null;
  closed: boolean;
  availableUnits: number;
};

export type ListingReadiness = {
  ready: boolean;
  missing: string[];
  checks: {
    petPolicy: boolean;
    images: number;
    activeRoomTypes: number;
    futureInventoryRows: number;
  };
};

export type AdminListingSummary = PartnerPropertySummary & {
  partner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
};

export type AdminListingDetail = PartnerPropertyDetail & {
  partner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    city: string | null;
  };
};

export type AdminReview = MyReview & {
  author?: {
    displayName: string;
  };
};
