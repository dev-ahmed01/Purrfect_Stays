import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserRole } from '@purrfect/contracts';
import { jwtVerify, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { AccessTokenPayload } from './auth.types.js';

@Injectable()
export class AccessTokenService {
  private readonly encoder = new TextEncoder();

  constructor(private readonly config: ConfigService<AppEnv>) {}

  async sign(payload: AccessTokenPayload): Promise<string> {
    const secret = this.secret();
    const ttl = this.config.get('JWT_ACCESS_TTL', { infer: true }) ?? '15m';
    const issuer = this.config.get('JWT_ISSUER', { infer: true }) ?? 'purrfect-api';
    const audience = this.config.get('JWT_AUDIENCE', { infer: true }) ?? 'purrfect-web';

    return new SignJWT({
      sid: payload.sid,
      role: payload.role,
      email: payload.email,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(payload.sub)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setJti(randomUUID())
      .setExpirationTime(ttl)
      .sign(secret);
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    try {
      const issuer = this.config.get('JWT_ISSUER', { infer: true }) ?? 'purrfect-api';
      const audience = this.config.get('JWT_AUDIENCE', { infer: true }) ?? 'purrfect-web';
      const { payload } = await jwtVerify(token, this.secret(), {
        algorithms: ['HS256'],
        issuer,
        audience,
      });

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        typeof payload.email !== 'string' ||
        !this.isRole(payload.role)
      ) {
        throw new UnauthorizedException('Invalid access token.');
      }

      return {
        sub: payload.sub,
        sid: payload.sid,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private secret() {
    const value = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    if (!value) throw new Error('JWT_ACCESS_SECRET is not configured.');
    return this.encoder.encode(value);
  }

  private isRole(value: unknown): value is UserRole {
    return value === 'USER' || value === 'PARTNER' || value === 'ADMIN';
  }
}
