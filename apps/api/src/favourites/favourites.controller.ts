import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { FavouritesService } from './favourites.service.js';

@Roles('USER')
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favourites: FavouritesService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedPrincipal) {
    return this.favourites.list(currentUser.id);
  }

  @Post(':propertyId')
  add(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.favourites.add(currentUser.id, propertyId);
  }

  @Delete(':propertyId')
  remove(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
  ) {
    return this.favourites.remove(currentUser.id, propertyId);
  }
}
