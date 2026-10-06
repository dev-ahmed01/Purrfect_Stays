import { Global, Module } from '@nestjs/common';
import { RedisHealthService } from './redis-health.service.js';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';
import { RedisService } from './redis.service.js';

@Global()
@Module({
  providers: [RedisService, RedisThrottlerStorage, RedisHealthService],
  exports: [RedisService, RedisThrottlerStorage, RedisHealthService],
})
export class RedisModule {}
