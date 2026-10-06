import { ConfigService } from '@nestjs/config';
import { AuthCookieService } from '../src/auth/auth-cookie.service.js';

function service(nodeEnv: 'test' | 'production') {
  const config = new ConfigService({
    NODE_ENV: nodeEnv,
    API_PREFIX: 'api/v1',
    REFRESH_COOKIE_NAME: 'purrfect_refresh',
  });

  const refreshTokens = {
    cookieMaxAgeMs: () => 30 * 86_400_000,
  };

  return new AuthCookieService(config as never, refreshTokens as never);
}

function responseMock() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('AuthCookieService', () => {
  it('sets a Secure HttpOnly SameSite cookie in production', () => {
    const response = responseMock();

    service('production').setRefreshToken(response as never, 'opaque-token');

    expect(response.cookie).toHaveBeenCalledWith(
      'purrfect_refresh',
      'opaque-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 30 * 86_400_000,
      }),
    );
  });

  it('permits the local HTTP test harness without changing production defaults', () => {
    const response = responseMock();

    service('test').setRefreshToken(response as never, 'opaque-token');

    expect(response.cookie).toHaveBeenCalledWith(
      'purrfect_refresh',
      'opaque-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      }),
    );
  });

  it('reads only non-empty string refresh cookies', () => {
    const cookies = service('test');

    expect(cookies.readRefreshToken({ purrfect_refresh: 'token' })).toBe('token');
    expect(cookies.readRefreshToken({ purrfect_refresh: '' })).toBeUndefined();
    expect(cookies.readRefreshToken({ purrfect_refresh: 42 })).toBeUndefined();
  });
});
