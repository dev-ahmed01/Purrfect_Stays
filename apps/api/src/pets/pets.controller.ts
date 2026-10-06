import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  createPetSchema,
  updatePetSchema,
  type CreatePetInput,
  type UpdatePetInput,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { PetsService } from './pets.service.js';

@Roles('USER')
@Controller('pets')
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedPrincipal) {
    return this.pets.list(currentUser.id);
  }

  @Get(':petId')
  detail(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
  ) {
    return this.pets.findOne(currentUser.id, petId);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createPetSchema)) input: CreatePetInput,
  ) {
    return this.pets.create(currentUser.id, input);
  }

  @Patch(':petId')
  update(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
    @Body(new ZodValidationPipe(updatePetSchema)) input: UpdatePetInput,
  ) {
    return this.pets.update(currentUser.id, petId, input);
  }

  @Delete(':petId')
  archive(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
  ) {
    return this.pets.archive(currentUser.id, petId);
  }
}
