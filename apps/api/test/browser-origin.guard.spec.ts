import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { BrowserOriginGuard } from '../src/auth/browser-origin.guard.js';

function context(origin?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        get: (name: string) =>
          name.toLowerCase() === 'origin' ? origin : undefined,
      }),
    }),
  } as never;
}

function guard(nodeEnv: 'development' | 'test' | 'production') {
  return new BrowserOriginGuard(
    new ConfigService({
      WEB_ORIGIN: 'https://app.example.com',
      NODE_ENV: nodeEnv,
    }) as never,
  );
}

describe('BrowserOriginGuard', () => {
  it('accepts the configured browser origin', () => {
    expect(
      guard('production').canActivate(context('https://app.example.com')),
    ).toBe(true);
  });

  it('rejects a mismatched browser origin', () => {
    expect(() =>
      guard('production').canActivate(context('https://evil.example')),
    ).toThrow(ForbiddenException);
  });

  it('requires an Origin header in production', () => {
    expect(() => guard('production').canActivate(context())).toThrow(
      ForbiddenException,
    );
  });

  it('allows origin-less local/test tooling outside production', () => {
    expect(guard('test').canActivate(context())).toBe(true);
  });
});
