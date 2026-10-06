import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator.js';
import { DatabaseHealthService } from '../common/database/database-health.service.js';
import { MetricsService } from '../common/observability/metrics.service.js';
import { RedisHealthService } from '../redis/redis-health.service.js';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseHealth: DatabaseHealthService,
    private readonly redisHealth: RedisHealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  liveness() {
    return {
      status: 'ok',
      service: 'purrfect-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  metrics() {
    return this.metricsService.snapshot();
  }

  @Get('ready')
  async readiness() {
    const [database, redis] = await Promise.allSettled([
      this.databaseHealth.check(),
      this.redisHealth.check(),
    ]);

    const dependencies = {
      database: database.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
    };

    if (database.status === 'rejected' || redis.status === 'rejected') {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'One or more required dependencies are unavailable.',
        details: dependencies,
      });
    }

    return {
      status: 'ready',
      dependencies,
      timestamp: new Date().toISOString(),
    };
  }
}
