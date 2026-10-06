import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  publicReviewsQuerySchema,
  type PublicReviewsQuery,
} from '@purrfect/contracts';
import { z } from 'zod';
import { Public } from '../auth/public.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { ReviewsService } from './reviews.service.js';

const slugSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

@Public()
@Controller('properties')
export class PublicReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':slug/reviews')
  list(
    @Param(new ZodValidationPipe(slugSchema)) params: { slug: string },
    @Query(new ZodValidationPipe(publicReviewsQuerySchema)) query: PublicReviewsQuery,
  ) {
    return this.reviews.publicForProperty(params.slug, query);
  }
}
