import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import { durationToMilliseconds } from './duration.js';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly config: ConfigService<AppEnv>) {}

  issue() {
    const rawToken = randomBytes(48).toString('base64url');

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
      familyId: randomUUID(),
      expiresAt: this.expiresAt(),
    };
  }

  rotate(familyId: string) {
    const rawToken = randomBytes(48).toString('base64url');

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
      familyId,
      expiresAt: this.expiresAt(),
    };
  }

  hash(rawToken: string) {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }

  expiresAt() {
    const ttl = this.config.get('REFRESH_TOKEN_TTL', { infer: true }) ?? '30d';
    return new Date(Date.now() + durationToMilliseconds(ttl));
  }

  cookieMaxAgeMs() {
    const ttl = this.config.get('REFRESH_TOKEN_TTL', { infer: true }) ?? '30d';
    return durationToMilliseconds(ttl);
  }
}
