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
    breed: z.string().trim().min(1).max(120).transform((value) => value.toLowerCase()).optional(),
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
      value.checkIn &&
      value.checkOut &&
      (value.checkOut.getTime() - value.checkIn.getTime()) / 86_400_000 > 60
    ) {
      context.addIssue({
        code: 'custom',
        path: ['checkOut'],
        message: 'Search stays are limited to 60 nights',
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

    if (
      value.pets === 0 &&
      (value.species !== undefined || value.size !== undefined || value.breed !== undefined)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['pets'],
        message: 'Pet species, size or breed filters require at least one pet',
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

const bookingStayFields = {
  roomTypeId: z.string().uuid(),
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
  guests: z.coerce.number().int().min(1).max(20),
  petIds: z
    .array(z.string().uuid())
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, 'Pet IDs must be unique'),
};

export const quoteRequestSchema = z.object(bookingStayFields).superRefine((value, context) => {
  if (value.checkOut <= value.checkIn) {
    context.addIssue({
      code: 'custom',
      path: ['checkOut'],
      message: 'Check-out must be after check-in',
    });
  }

  if ((value.checkOut.getTime() - value.checkIn.getTime()) / 86_400_000 > 60) {
    context.addIssue({
      code: 'custom',
      path: ['checkOut'],
      message: 'Bookings are limited to 60 nights',
    });
  }
});

export const createBookingSchema = z.object(bookingStayFields).superRefine((value, context) => {
  if (value.checkOut <= value.checkIn) {
    context.addIssue({
      code: 'custom',
      path: ['checkOut'],
      message: 'Check-out must be after check-in',
    });
  }

  if ((value.checkOut.getTime() - value.checkIn.getTime()) / 86_400_000 > 60) {
    context.addIssue({
      code: 'custom',
      path: ['checkOut'],
      message: 'Bookings are limited to 60 nights',
    });
  }
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(12)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/, 'Idempotency-Key contains unsupported characters');

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
]);

export const bookingsQuerySchema = paginationSchema.extend({
  status: bookingStatusSchema.optional(),
});

const petProfileFields = {
  name: z.string().trim().min(1).max(80),
  species: petSpeciesSchema,
  breed: z.string().trim().min(1).max(120),
  size: petSizeSchema,
  weightKg: z.coerce.number().positive().max(200).optional(),
  birthDate: dateOnlySchema.optional(),
  vaccinated: z.boolean(),
  specialNeeds: z.string().trim().max(1000).optional(),
};

export const createPetSchema = z.object({
  ...petProfileFields,
  vaccinated: z.boolean().default(false),
});

export const updatePetSchema = z
  .object({
    name: petProfileFields.name.optional(),
    species: petProfileFields.species.optional(),
    breed: petProfileFields.breed.optional(),
    size: petProfileFields.size.optional(),
    weightKg: z.union([z.coerce.number().positive().max(200), z.null()]).optional(),
    birthDate: z.union([dateOnlySchema, z.null()]).optional(),
    vaccinated: petProfileFields.vaccinated.optional(),
    specialNeeds: z.union([z.string().trim().max(1000), z.null()]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one pet field must be provided',
  });

const reviewContentFields = {
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(10).max(3000),
};

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  ...reviewContentFields,
});

export const updateReviewSchema = z
  .object({
    rating: reviewContentFields.rating.optional(),
    title: reviewContentFields.title.optional(),
    body: reviewContentFields.body.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one review field must be provided',
  });

export const reviewsQuerySchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'PUBLISHED', 'HIDDEN']).optional(),
});

export const publicReviewsQuerySchema = paginationSchema.extend({
  sort: z.enum(['recent', 'rating_high', 'rating_low']).default('recent'),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN']),
  note: z.string().trim().min(3).max(500).optional(),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type BookingsQuery = z.infer<typeof bookingsQuerySchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewsQuery = z.infer<typeof reviewsQuerySchema>;
export type PublicReviewsQuery = z.infer<typeof publicReviewsQuerySchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;


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
