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
  moderateReviewSchema,
  reviewsQuerySchema,
  type ModerateReviewInput,
  type ReviewsQuery,
} from '@purrfect/contracts';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { ReviewsService } from './reviews.service.js';

@Roles('ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(reviewsQuerySchema)) query: ReviewsQuery,
  ) {
    return this.reviews.adminList(query);
  }

  @Patch(':reviewId/moderate')
  moderate(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Param('reviewId', new ParseUUIDPipe({ version: '4' })) reviewId: string,
    @Body(new ZodValidationPipe(moderateReviewSchema)) input: ModerateReviewInput,
  ) {
    return this.reviews.moderate(currentUser.id, reviewId, input);
  }
}
