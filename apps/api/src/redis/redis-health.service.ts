import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Injectable()
export class RedisHealthService {
  constructor(private readonly redis: RedisService) {}

  async check() {
    const pong = await this.redis.ping();
    if (pong !== 'PONG') throw new Error('Redis did not return PONG.');

    return {
      redis: 'up' as const,
    };
  }
}
