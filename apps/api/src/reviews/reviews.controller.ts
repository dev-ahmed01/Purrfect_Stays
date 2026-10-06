import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  createReviewSchema,
  reviewsQuerySchema,
  updateReviewSchema,
  type CreateReviewInput,
  type ReviewsQuery,
  type UpdateReviewInput,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { ReviewsService } from './reviews.service.js';

@Roles('USER')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewInput,
  ) {
    return this.reviews.create(currentUser.id, input);
  }

  @Get()
  listMine(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Query(new ZodValidationPipe(reviewsQuerySchema)) query: ReviewsQuery,
  ) {
    return this.reviews.listMine(currentUser.id, query);
  }

  @Patch(':reviewId')
  update(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('reviewId', new ParseUUIDPipe({ version: '4' })) reviewId: string,
    @Body(new ZodValidationPipe(updateReviewSchema)) input: UpdateReviewInput,
  ) {
    return this.reviews.update(currentUser.id, reviewId, input);
  }

  @Delete(':reviewId')
  withdraw(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('reviewId', new ParseUUIDPipe({ version: '4' })) reviewId: string,
  ) {
    return this.reviews.withdraw(currentUser.id, reviewId);
  }
}
