import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import type { AppEnv } from '../config/env.js';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;

  constructor(private readonly config: ConfigService<AppEnv>) {}

  async onModuleInit() {
    const url = this.config.get('REDIS_URL', { infer: true });
    if (!url) throw new Error('REDIS_URL is not configured.');

    const client = createClient({ url });
    client.on('error', (error) => {
      this.logger.error(
        JSON.stringify({
          event: 'redis_error',
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    });

    await client.connect();
    this.client = client;
    this.logger.log(JSON.stringify({ event: 'redis_connected' }));
  }

  async onApplicationShutdown() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  connection(): RedisClientType {
    if (!this.client?.isOpen) {
      throw new Error('Redis connection is not available.');
    }

    return this.client;
  }

  async ping() {
    return this.connection().ping();
  }
}
