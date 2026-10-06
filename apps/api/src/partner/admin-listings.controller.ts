import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  adminListingActionSchema,
  adminListingDecisionSchema,
  adminListingQueueQuerySchema,
  type AdminListingActionInput,
  type AdminListingDecisionInput,
  type AdminListingQueueQuery,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { AdminListingsService } from './admin-listings.service.js';

@Roles('ADMIN')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listings: AdminListingsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminListingQueueQuerySchema))
    query: AdminListingQueueQuery,
  ) {
    return this.listings.list(query);
  }

  @Get(':propertyId')
  detail(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.listings.findOne(propertyId);
  }

  @Post(':propertyId/decision')
  decide(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(adminListingDecisionSchema))
    input: AdminListingDecisionInput,
  ) {
    return this.listings.decide(currentUser.id, propertyId, input);
  }

  @Post(':propertyId/suspend')
  suspend(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(adminListingActionSchema))
    input: AdminListingActionInput,
  ) {
    return this.listings.suspend(currentUser.id, propertyId, input);
  }

  @Post(':propertyId/restore')
  restore(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(adminListingActionSchema))
    input: AdminListingActionInput,
  ) {
    return this.listings.restore(currentUser.id, propertyId, input);
  }
}
