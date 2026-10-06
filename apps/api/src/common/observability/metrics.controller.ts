import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator.js';
import { MetricsService } from './metrics.service.js';

@Roles('ADMIN')
@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  snapshot() {
    return this.metrics.snapshot();
  }
}
