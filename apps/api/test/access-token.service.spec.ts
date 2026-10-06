import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenService } from '../src/auth/access-token.service.js';

function config(overrides: Record<string, string> = {}) {
  return new ConfigService({
    JWT_ACCESS_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
    JWT_ACCESS_TTL: '15m',
    JWT_ISSUER: 'purrfect-api-test',
    JWT_AUDIENCE: 'purrfect-web-test',
    ...overrides,
  }) as never;
}

describe('AccessTokenService', () => {
  it('signs and verifies the required session claims', async () => {
    const service = new AccessTokenService(config());
    const token = await service.sign({
      sub: 'user-1',
      sid: 'session-1',
      role: 'USER',
      email: 'user@example.com',
    });

    await expect(service.verify(token)).resolves.toEqual({
      sub: 'user-1',
      sid: 'session-1',
      role: 'USER',
      email: 'user@example.com',
    });
  });

  it('rejects a token under the wrong audience', async () => {
    const signer = new AccessTokenService(config());
    const verifier = new AccessTokenService(
      config({ JWT_AUDIENCE: 'another-audience' }),
    );
    const token = await signer.sign({
      sub: 'user-1',
      sid: 'session-1',
      role: 'USER',
      email: 'user@example.com',
    });

    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
