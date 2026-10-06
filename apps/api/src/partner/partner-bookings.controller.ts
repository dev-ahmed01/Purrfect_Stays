import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  partnerBookingsQuerySchema,
  partnerBookingTransitionSchema,
  type PartnerBookingsQuery,
  type PartnerBookingTransitionInput,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { PartnerBookingsService } from './partner-bookings.service.js';

@Roles('PARTNER')
@Controller('partner/bookings')
export class PartnerBookingsController {
  constructor(private readonly bookings: PartnerBookingsService) {}

  @Get()
  list(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Query(new ZodValidationPipe(partnerBookingsQuerySchema))
    query: PartnerBookingsQuery,
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

  @Patch(':bookingId/status')
  transition(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' })) bookingId: string,
    @Body(new ZodValidationPipe(partnerBookingTransitionSchema))
    input: PartnerBookingTransitionInput,
  ) {
    return this.bookings.transition(currentUser.id, bookingId, input);
  }
}
