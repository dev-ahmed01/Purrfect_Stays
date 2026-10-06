import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  destinationsQuerySchema,
  featuredPropertiesQuerySchema,
  propertySearchSchema,
  type DestinationsQuery,
  type FeaturedPropertiesQuery,
  type PropertySearchInput,
} from '@purrfect/contracts';
import { z } from 'zod';
import { Public } from '../auth/public.decorator.js';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { PropertiesService } from './properties.service.js';

const propertySlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

type PropertySlugParams = z.infer<typeof propertySlugParamsSchema>;

@Public()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  search(
    @Query(new ZodValidationPipe(propertySearchSchema))
    query: PropertySearchInput,
  ) {
    return this.properties.search(query);
  }

  @Get('featured')
  featured(
    @Query(new ZodValidationPipe(featuredPropertiesQuerySchema))
    query: FeaturedPropertiesQuery,
  ) {
    return this.properties.featured(query);
  }

  @Get('destinations')
  destinations(
    @Query(new ZodValidationPipe(destinationsQuerySchema))
    query: DestinationsQuery,
  ) {
    return this.properties.destinations(query);
  }

  @Get('facets')
  facets() {
    return this.properties.facets();
  }

  @Get(':slug')
  detail(
    @Param(new ZodValidationPipe(propertySlugParamsSchema))
    params: PropertySlugParams,
  ) {
    return this.properties.findBySlug(params.slug);
  }
}
