import { jest } from '@jest/globals';
import { RedisThrottlerStorage } from '../src/redis/redis-throttler.storage.js';

describe('RedisThrottlerStorage', () => {
  it('maps Redis millisecond TTLs into the throttler second record', async () => {
    const evalMock = jest.fn().mockResolvedValue([4, 59_100, 0, 0]);
    const storage = new RedisThrottlerStorage({
      connection: () => ({ eval: evalMock }),
    } as never);

    await expect(
      storage.increment('raw-key', 60_000, 5, 60_000, 'default'),
    ).resolves.toEqual({
      totalHits: 4,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });

    const call = evalMock.mock.calls[0];
    expect(call[1].keys[0]).toMatch(/^purrfect:throttle:[a-f0-9]{64}$/);
    expect(call[1].keys[1]).toMatch(/:block$/);
  });

  it('uses ttl as the block duration when none is configured', async () => {
    const evalMock = jest.fn().mockResolvedValue([6, 50_000, 1, 60_000]);
    const storage = new RedisThrottlerStorage({
      connection: () => ({ eval: evalMock }),
    } as never);

    const result = await storage.increment('raw-key', 60_000, 5, 0, 'default');

    expect(result.isBlocked).toBe(true);
    expect(result.timeToBlockExpire).toBe(60);
    expect(evalMock.mock.calls[0][1].arguments).toEqual([
      '60000',
      '5',
      '60000',
    ]);
  });
});
