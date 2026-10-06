import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  createPartnerPropertySchema,
  createRoomTypeSchema,
  inventoryCalendarQuerySchema,
  partnerPropertiesQuerySchema,
  replacePropertyAmenitiesSchema,
  replacePropertyImagesSchema,
  updateInventoryCalendarSchema,
  updatePartnerPropertySchema,
  updateRoomTypeSchema,
  upsertPetPolicySchema,
  type CreatePartnerPropertyInput,
  type CreateRoomTypeInput,
  type InventoryCalendarQuery,
  type PartnerPropertiesQuery,
  type ReplacePropertyAmenitiesInput,
  type ReplacePropertyImagesInput,
  type UpdateInventoryCalendarInput,
  type UpdatePartnerPropertyInput,
  type UpdateRoomTypeInput,
  type UpsertPetPolicyInput,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { PartnerPropertiesService } from './partner-properties.service.js';

@Roles('PARTNER')
@Controller('partner')
export class PartnerPropertiesController {
  constructor(private readonly properties: PartnerPropertiesService) {}

  @Get('amenities')
  amenities() {
    return this.properties.availableAmenities();
  }

  @Get('properties')
  list(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Query(new ZodValidationPipe(partnerPropertiesQuerySchema))
    query: PartnerPropertiesQuery,
  ) {
    return this.properties.list(currentUser.id, query);
  }

  @Post('properties')
  create(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createPartnerPropertySchema))
    input: CreatePartnerPropertyInput,
  ) {
    return this.properties.create(currentUser.id, input);
  }

  @Get('properties/:propertyId')
  detail(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.properties.findOne(currentUser.id, propertyId);
  }

  @Patch('properties/:propertyId')
  update(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(updatePartnerPropertySchema))
    input: UpdatePartnerPropertyInput,
  ) {
    return this.properties.update(currentUser.id, propertyId, input);
  }

  @Delete('properties/:propertyId')
  remove(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.properties.remove(currentUser.id, propertyId);
  }

  @Post('properties/:propertyId/withdraw')
  withdraw(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.properties.withdraw(currentUser.id, propertyId);
  }

  @Get('properties/:propertyId/readiness')
  readiness(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.properties.readiness(currentUser.id, propertyId);
  }

  @Post('properties/:propertyId/submit')
  submit(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.properties.submit(currentUser.id, propertyId);
  }

  @Put('properties/:propertyId/pet-policy')
  petPolicy(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(upsertPetPolicySchema))
    input: UpsertPetPolicyInput,
  ) {
    return this.properties.upsertPetPolicy(currentUser.id, propertyId, input);
  }

  @Put('properties/:propertyId/images')
  images(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(replacePropertyImagesSchema))
    input: ReplacePropertyImagesInput,
  ) {
    return this.properties.replaceImages(currentUser.id, propertyId, input);
  }

  @Put('properties/:propertyId/amenities')
  propertyAmenities(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(replacePropertyAmenitiesSchema))
    input: ReplacePropertyAmenitiesInput,
  ) {
    return this.properties.replaceAmenities(currentUser.id, propertyId, input);
  }

  @Post('properties/:propertyId/room-types')
  createRoomType(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body(new ZodValidationPipe(createRoomTypeSchema))
    input: CreateRoomTypeInput,
  ) {
    return this.properties.createRoomType(currentUser.id, propertyId, input);
  }

  @Patch('room-types/:roomTypeId')
  updateRoomType(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('roomTypeId', new ParseUUIDPipe({ version: '4' })) roomTypeId: string,
    @Body(new ZodValidationPipe(updateRoomTypeSchema))
    input: UpdateRoomTypeInput,
  ) {
    return this.properties.updateRoomType(currentUser.id, roomTypeId, input);
  }

  @Get('room-types/:roomTypeId/inventory')
  inventory(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('roomTypeId', new ParseUUIDPipe({ version: '4' })) roomTypeId: string,
    @Query(new ZodValidationPipe(inventoryCalendarQuerySchema))
    query: InventoryCalendarQuery,
  ) {
    return this.properties.inventory(currentUser.id, roomTypeId, query);
  }

  @Put('room-types/:roomTypeId/inventory')
  updateInventory(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('roomTypeId', new ParseUUIDPipe({ version: '4' })) roomTypeId: string,
    @Body(new ZodValidationPipe(updateInventoryCalendarSchema))
    input: UpdateInventoryCalendarInput,
  ) {
    return this.properties.updateInventory(currentUser.id, roomTypeId, input);
  }
}
