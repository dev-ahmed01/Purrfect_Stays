import { Prisma } from '@purrfect/database';

export function mapPartnerPropertySummary(property: {
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
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    roomTypes: number;
    images: number;
    amenities: number;
    bookings: number;
  };
}) {
  return {
    ...property,
    startingPrice: {
      currency: 'INR',
      amountPaise: property.startingPricePaise,
    },
  };
}

export function mapPartnerPropertyDetail(property: {
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
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  averageRating: Prisma.Decimal;
  reviewCount: number;
  startingPricePaise: number;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  petPolicy: unknown;
  images: unknown[];
  amenities: unknown[];
  roomTypes: unknown[];
  statusEvents: unknown[];
  verifications: unknown[];
  _count: {
    bookings: number;
    favourites: number;
    reviews: number;
  };
}) {
  return {
    ...property,
    latitude: property.latitude === null ? null : Number(property.latitude),
    longitude: property.longitude === null ? null : Number(property.longitude),
    averageRating: Number(property.averageRating),
    startingPrice: {
      currency: 'INR',
      amountPaise: property.startingPricePaise,
    },
  };
}
