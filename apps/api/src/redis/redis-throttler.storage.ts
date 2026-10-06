import { Injectable } from '@nestjs/common';
import type {
  ThrottlerStorage,
  ThrottlerStorageRecord,
} from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { RedisService } from './redis.service.js';

const INCREMENT_SCRIPT = `
local block_ttl = redis.call('PTTL', KEYS[2])
if block_ttl > 0 then
  local hits = tonumber(redis.call('GET', KEYS[1]) or '0')
  local rate_ttl = redis.call('PTTL', KEYS[1])
  if rate_ttl < 0 then
    rate_ttl = tonumber(ARGV[1])
  end
  return {hits, rate_ttl, 1, block_ttl}
end

local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end

local rate_ttl = redis.call('PTTL', KEYS[1])
if hits > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], '1', 'PX', ARGV[3], 'NX')
  block_ttl = redis.call('PTTL', KEYS[2])
  return {hits, rate_ttl, 1, block_ttl}
end

return {hits, rate_ttl, 0, 0}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const effectiveBlockDuration = blockDuration > 0 ? blockDuration : ttl;
    const digest = createHash('sha256')
      .update(throttlerName + ':' + key, 'utf8')
      .digest('hex');
    const rateKey = 'purrfect:throttle:' + digest;
    const blockKey = rateKey + ':block';

    const result = (await this.redis.connection().eval(INCREMENT_SCRIPT, {
      keys: [rateKey, blockKey],
      arguments: [
        String(ttl),
        String(limit),
        String(effectiveBlockDuration),
      ],
    })) as unknown;

    if (
      !Array.isArray(result) ||
      result.length !== 4 ||
      result.some((value) => typeof value !== 'number')
    ) {
      throw new Error('Redis throttler returned an invalid result.');
    }

    const [totalHits, ttlMs, blocked, blockTtlMs] = result as number[];

    return {
      totalHits,
      timeToExpire: Math.max(0, Math.ceil(ttlMs / 1000)),
      isBlocked: blocked === 1,
      timeToBlockExpire: Math.max(0, Math.ceil(blockTtlMs / 1000)),
    };
  }
}
