import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from './auth.types.js';

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedPrincipal;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authUser) {
      throw new Error('Authenticated user is unavailable on this request.');
    }

    return request.authUser;
  },
);
