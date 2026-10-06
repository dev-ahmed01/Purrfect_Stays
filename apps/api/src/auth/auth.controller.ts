import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@purrfect/contracts';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe.js';
import { AuthCookieService } from './auth-cookie.service.js';
import { BrowserOriginGuard } from './browser-origin.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthenticatedPrincipal, ClientMetadata } from './auth.types.js';
import { Public } from './public.decorator.js';

type RequestWithCookies = Request & {
  cookies?: Record<string, unknown>;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(input, this.metadata(request));
    this.cookies.setRefreshToken(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(input, this.metadata(request));
    this.cookies.setRefreshToken(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @UseGuards(BrowserOriginGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawToken = this.cookies.readRefreshToken(request.cookies);

    if (!rawToken) {
      throw new UnauthorizedException('Refresh session is missing.');
    }

    const result = await this.auth.refresh(rawToken, this.metadata(request));
    this.cookies.setRefreshToken(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @UseGuards(BrowserOriginGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawToken = this.cookies.readRefreshToken(request.cookies);
    await this.auth.logoutSession(rawToken);
    this.cookies.clearRefreshToken(response);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logoutAll(currentUser.id);
    this.cookies.clearRefreshToken(response);
    return result;
  }

  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedPrincipal) {
    const { sessionId: _sessionId, ...user } = currentUser;
    return user;
  }

  @Get('sessions')
  sessions(@CurrentUser() currentUser: AuthenticatedPrincipal) {
    return this.auth.listSessions(currentUser.id, currentUser.sessionId);
  }

  @Delete('sessions/:sessionId')
  async revokeSession(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @CurrentUser() currentUser: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.revokeSession(currentUser.id, sessionId);

    if (sessionId === currentUser.sessionId) {
      this.cookies.clearRefreshToken(response);
    }

    return result;
  }

  private metadata(request: Request): ClientMetadata {
    return {
      userAgent: request.get('user-agent')?.slice(0, 512),
      ipAddress: request.ip?.slice(0, 64),
    };
  }
}
