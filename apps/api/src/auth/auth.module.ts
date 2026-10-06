import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard.js';
import { AccessTokenService } from './access-token.service.js';
import { AuthCookieService } from './auth-cookie.service.js';
import { AuthController } from './auth.controller.js';
import { BrowserOriginGuard } from './browser-origin.guard.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { RefreshTokenService } from './refresh-token.service.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    AccessTokenService,
    RefreshTokenService,
    AuthCookieService,
    BrowserOriginGuard,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PasswordService, AccessTokenService],
})
export class AuthModule {}
