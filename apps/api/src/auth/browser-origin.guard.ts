import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppEnv } from '../config/env.js';

@Injectable()
export class BrowserOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppEnv>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const nodeEnv = this.config.get('NODE_ENV', { infer: true }) ?? 'development';
    const origin = request.get('origin');

    if (!origin) {
      if (nodeEnv === 'production') {
        throw new ForbiddenException('A trusted browser origin is required.');
      }
      return true;
    }

    if (!expectedOrigin || origin !== expectedOrigin) {
      throw new ForbiddenException('Request origin is not allowed.');
    }

    return true;
  }
}
