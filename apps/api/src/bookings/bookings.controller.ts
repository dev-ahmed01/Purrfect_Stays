import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  bookingsQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  idempotencyKeySchema,
  quoteRequestSchema,
  type BookingsQuery,
  type CancelBookingInput,
  type CreateBookingInput,
  type QuoteRequest,
} from '@purrfect/contracts';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { BookingsService } from './bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('quote')
  quote(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(quoteRequestSchema)) input: QuoteRequest,
  ) {
    return this.bookings.quote(currentUser.id, input);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Headers('idempotency-key') rawIdempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(createBookingSchema)) input: CreateBookingInput,
  ) {
    const parsed = idempotencyKeySchema.safeParse(rawIdempotencyKey);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'A valid Idempotency-Key header is required.',
        details: parsed.error.issues,
      });
    }

    return this.bookings.create(currentUser.id, input, parsed.data);
  }

  @Get()
  list(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Query(new ZodValidationPipe(bookingsQuerySchema)) query: BookingsQuery,
  ) {
    return this.bookings.list(currentUser.id, query);
  }

  @Get(':bookingId')
  detail(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' })) bookingId: string,
  ) {
    return this.bookings.findOne(currentUser.id, bookingId);
  }

  @Post(':bookingId/cancel')
  cancel(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' })) bookingId: string,
    @Body(new ZodValidationPipe(cancelBookingSchema)) input: CancelBookingInput,
  ) {
    return this.bookings.cancel(currentUser.id, bookingId, input);
  }
}
