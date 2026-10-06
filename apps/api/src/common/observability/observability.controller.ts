import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator.js';
import { MetricsService } from './metrics.service.js';

@Roles('ADMIN')
@Controller('admin/observability')
export class ObservabilityController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  snapshot() {
    return this.metrics.snapshot();
  }
}
