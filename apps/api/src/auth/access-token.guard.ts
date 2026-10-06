import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '@purrfect/database';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service.js';
import { AccessTokenService } from './access-token.service.js';
import type { AuthenticatedRequest } from './current-user.decorator.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: AccessTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    const token = this.extractBearer(request.headers.authorization);
    const claims = await this.tokens.verify(token);

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: claims.sid },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            status: true,
            city: true,
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Session is no longer active.');
    }

    request.authUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
      city: session.user.city,
      sessionId: session.id,
    };

    return true;
  }

  private extractBearer(header: string | undefined): string {
    if (!header) throw new UnauthorizedException('Authentication is required.');

    const [scheme, token, extra] = header.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
      throw new UnauthorizedException('A valid bearer access token is required.');
    }

    return token;
  }
}
