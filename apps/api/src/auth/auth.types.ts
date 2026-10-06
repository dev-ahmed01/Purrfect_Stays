import type { AuthUser, UserRole } from '@purrfect/contracts';

export type AuthenticatedPrincipal = AuthUser & {
  sessionId: string;
};

export type AccessTokenPayload = {
  sub: string;
  sid: string;
  role: UserRole;
  email: string;
};

export type ClientMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};
