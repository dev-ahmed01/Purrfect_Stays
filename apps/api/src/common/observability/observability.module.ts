import { Global, Module } from '@nestjs/common';
import { MetricsMiddleware } from './metrics.middleware.js';
import { MetricsService } from './metrics.service.js';

@Global()
@Module({
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware],
})
export class ObservabilityModule {}
