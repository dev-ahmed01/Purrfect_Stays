import { z } from 'zod';

export const userRoleSchema = z.enum(['USER', 'PARTNER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const petSpeciesSchema = z.enum(['DOG', 'CAT', 'OTHER']);
export const petSizeSchema = z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']);

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Date is not a valid calendar date')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const propertyTypeSchema = z.enum([
  'VILLA',
  'HOMESTAY',
  'RESORT',
  'HOTEL',
  'COTTAGE',
  'APARTMENT',
]);

const amenitiesQuerySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : value.split(',')))
  .transform((values) =>
    Array.from(
      new Set(
        values
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  )
  .refine((values) => values.length <= 20, 'A maximum of 20 amenities can be requested');

export const propertySearchSchema = paginationSchema
  .extend({
    destination: z.string().trim().min(1).max(100).optional(),
    checkIn: dateOnlySchema.optional(),
    checkOut: dateOnlySchema.optional(),
    guests: z.coerce.number().int().min(1).max(20).optional(),
    pets: z.coerce.number().int().min(0).max(10).optional(),
    species: petSpeciesSchema.optional(),
    size: petSizeSchema.optional(),
    propertyType: propertyTypeSchema.optional(),
    minPrice: z.coerce.number().nonnegative().max(1_000_000).optional(),
    maxPrice: z.coerce.number().nonnegative().max(1_000_000).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    amenities: amenitiesQuerySchema.optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating']).default('recommended'),
  })
  .superRefine((value, context) => {
    if ((value.checkIn && !value.checkOut) || (!value.checkIn && value.checkOut)) {
      context.addIssue({
        code: 'custom',
        path: value.checkIn ? ['checkOut'] : ['checkIn'],
        message: 'Check-in and check-out must be supplied together',
      });
    }

    if (value.checkIn && value.checkOut && value.checkOut <= value.checkIn) {
      context.addIssue({
        code: 'custom',
        path: ['checkOut'],
        message: 'Check-out must be after check-in',
      });
    }

    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maxPrice'],
        message: 'Maximum price must be greater than or equal to minimum price',
      });
    }

    if (value.pets === 0 && (value.species !== undefined || value.size !== undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['pets'],
        message: 'Pet species or size filters require at least one pet',
      });
    }
  });

export const featuredPropertiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
});

export const destinationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type FeaturedPropertiesQuery = z.infer<typeof featuredPropertiesQuerySchema>;
export type DestinationsQuery = z.infer<typeof destinationsQuerySchema>;

export const quoteRequestSchema = z
  .object({
    roomTypeId: z.string().uuid(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z.number().int().positive(),
    petIds: z.array(z.string().uuid()).min(1),
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });

export const createBookingSchema = quoteRequestSchema.extend({
  idempotencyKey: z.string().min(8).max(128),
});

export const createPetSchema = z.object({
  name: z.string().trim().min(1).max(80),
  species: petSpeciesSchema,
  breed: z.string().trim().min(1).max(120),
  size: petSizeSchema,
  weightKg: z.number().positive().max(200).optional(),
  birthDate: z.coerce.date().optional(),
  vaccinated: z.boolean().default(false),
  specialNeeds: z.string().trim().max(1000).optional(),
});

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(10).max(3000),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;


const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

export const registerSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20).optional(),
  city: z.string().trim().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  city: string | null;
};

export type AccessTokenClaims = {
  sub: string;
  sid: string;
  role: UserRole;
  email: string;
};
