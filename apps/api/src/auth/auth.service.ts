import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser, LoginInput, RegisterInput } from '@purrfect/contracts';
import { Prisma, UserRole, UserStatus } from '@purrfect/database';
import { PrismaService } from '../database/prisma.service.js';
import { AccessTokenService } from './access-token.service.js';
import type { AuthResult, ClientMetadata } from './auth.types.js';
import { PasswordService } from './password.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

type RefreshOutcome =
  | { type: 'ok'; user: AuthUser; sessionId: string; refreshToken: string }
  | { type: 'invalid' | 'expired' | 'reused' | 'inactive' };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(input: RegisterInput, metadata: ClientMetadata): Promise<AuthResult> {
    const passwordHash = await this.passwords.hash(input.password);
    const refresh = this.refreshTokens.issue();

    try {
      const result = await this.prisma.serializable(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            phone: input.phone,
            passwordHash,
            fullName: input.fullName,
            city: input.city,
            role: UserRole.USER,
          },
        });

        const session = await tx.refreshSession.create({
          data: {
            userId: user.id,
            familyId: refresh.familyId,
            tokenHash: refresh.tokenHash,
            expiresAt: refresh.expiresAt,
            userAgent: metadata.userAgent,
            ipAddress: metadata.ipAddress,
          },
        });

        return {
          user: this.toAuthUser(user),
          sessionId: session.id,
        };
      });

      return {
        user: result.user,
        accessToken: await this.accessTokens.sign({
          sub: result.user.id,
          sid: result.sessionId,
          role: result.user.role,
          email: result.user.email,
        }),
        refreshToken: refresh.rawToken,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with that email or phone already exists.');
      }

      throw error;
    }
  }

  async login(input: LoginInput, metadata: ClientMetadata): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      await this.passwords.consumeComparableWork(input.password);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await this.passwords.verify(user.passwordHash, input.password);

    if (!passwordValid || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const refresh = this.refreshTokens.issue();
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        familyId: refresh.familyId,
        tokenHash: refresh.tokenHash,
        expiresAt: refresh.expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    });

    const authUser = this.toAuthUser(user);

    return {
      user: authUser,
      accessToken: await this.accessTokens.sign({
        sub: authUser.id,
        sid: session.id,
        role: authUser.role,
        email: authUser.email,
      }),
      refreshToken: refresh.rawToken,
    };
  }

  async refresh(rawToken: string, metadata: ClientMetadata): Promise<AuthResult> {
    const tokenHash = this.refreshTokens.hash(rawToken);

    const outcome = await this.prisma.serializable<RefreshOutcome>(async (tx) => {
      const current = await tx.refreshSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!current) return { type: 'invalid' };

      const now = new Date();

      if (current.revokedAt) {
        await tx.refreshSession.updateMany({
          where: {
            userId: current.userId,
            familyId: current.familyId,
            revokedAt: null,
          },
          data: {
            revokedAt: now,
            revokedReason: 'REUSE_DETECTED',
          },
        });

        return { type: 'reused' };
      }

      if (current.expiresAt <= now) {
        await tx.refreshSession.update({
          where: { id: current.id },
          data: {
            revokedAt: now,
            revokedReason: 'EXPIRED',
            lastUsedAt: now,
          },
        });

        return { type: 'expired' };
      }

      if (current.user.status !== UserStatus.ACTIVE) {
        await tx.refreshSession.updateMany({
          where: {
            userId: current.userId,
            familyId: current.familyId,
            revokedAt: null,
          },
          data: {
            revokedAt: now,
            revokedReason: 'ACCOUNT_INACTIVE',
          },
        });

        return { type: 'inactive' };
      }

      const rotated = this.refreshTokens.rotate(current.familyId);
      const replacement = await tx.refreshSession.create({
        data: {
          userId: current.userId,
          familyId: current.familyId,
          tokenHash: rotated.tokenHash,
          expiresAt: rotated.expiresAt,
          userAgent: metadata.userAgent ?? current.userAgent,
          ipAddress: metadata.ipAddress ?? current.ipAddress,
        },
      });

      await tx.refreshSession.update({
        where: { id: current.id },
        data: {
          revokedAt: now,
          revokedReason: 'ROTATED',
          lastUsedAt: now,
        },
      });

      return {
        type: 'ok',
        user: this.toAuthUser(current.user),
        sessionId: replacement.id,
        refreshToken: rotated.rawToken,
      };
    });

    if (outcome.type !== 'ok') {
      const message =
        outcome.type === 'reused'
          ? 'Refresh token reuse was detected. Please sign in again.'
          : 'Refresh session is invalid or expired.';
      throw new UnauthorizedException(message);
    }

    return {
      user: outcome.user,
      accessToken: await this.accessTokens.sign({
        sub: outcome.user.id,
        sid: outcome.sessionId,
        role: outcome.user.role,
        email: outcome.user.email,
      }),
      refreshToken: outcome.refreshToken,
    };
  }

  async logoutSession(rawToken?: string) {
    if (!rawToken) return;

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash: this.refreshTokens.hash(rawToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'LOGOUT',
      },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'LOGOUT_ALL',
      },
    });

    return { revoked: true };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.refreshSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        userAgent: true,
        ipAddress: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (!session.revokedAt) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'USER_REVOKED',
        },
      });
    }

    return { revoked: true };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    city: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      city: user.city,
    };
  }
}
