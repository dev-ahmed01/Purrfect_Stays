import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller.js';
import { MetricsMiddleware } from './metrics.middleware.js';
import { ObservabilityController } from './observability.controller.js';
import { MetricsService } from './metrics.service.js';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware],
})
export class ObservabilityModule {}
