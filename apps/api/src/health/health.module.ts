import { Module } from '@nestjs/common';
import { DatabaseHealthService } from '../common/database/database-health.service.js';
import { HealthController } from './health.controller.js';
import { RedisHealthService } from '../redis/redis-health.service.js';

@Module({
  controllers: [HealthController],
  providers: [DatabaseHealthService, RedisHealthService],
})
export class HealthModule {}
