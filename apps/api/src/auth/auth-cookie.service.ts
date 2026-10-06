import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { AppEnv } from '../config/env.js';
import { RefreshTokenService } from './refresh-token.service.js';

@Injectable()
export class AuthCookieService {
  constructor(
    private readonly config: ConfigService<AppEnv>,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  setRefreshToken(response: Response, token: string) {
    response.cookie(this.name(), token, {
      ...this.baseOptions(),
      maxAge: this.refreshTokens.cookieMaxAgeMs(),
    });
  }

  clearRefreshToken(response: Response) {
    response.clearCookie(this.name(), this.baseOptions());
  }

  readRefreshToken(cookies: Record<string, unknown> | undefined): string | undefined {
    const value = cookies?.[this.name()];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private name() {
    return this.config.get('REFRESH_COOKIE_NAME', { infer: true }) ?? 'purrfect_refresh';
  }

  private baseOptions(): CookieOptions {
    const prefix = this.config.get('API_PREFIX', { infer: true }) ?? 'api/v1';
    const isProduction = this.config.get('NODE_ENV', { infer: true }) === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: `/${prefix.replace(/^\/+|\/+$/g, '')}/auth`,
    };
  }
}
