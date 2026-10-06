import { z } from 'zod';

export const userRoleSchema = z.enum(['USER', 'PARTNER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const petSpeciesSchema = z.enum(['DOG', 'CAT', 'OTHER']);
export const petSizeSchema = z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE']);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const propertySearchSchema = paginationSchema.extend({
  destination: z.string().trim().min(1).optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  guests: z.coerce.number().int().positive().optional(),
  pets: z.coerce.number().int().min(0).optional(),
  species: petSpeciesSchema.optional(),
  size: petSizeSchema.optional(),
  propertyType: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .optional(),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating']).default('recommended'),
});

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
