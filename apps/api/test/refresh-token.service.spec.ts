import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from '../src/auth/refresh-token.service.js';

function service() {
  return new RefreshTokenService(
    new ConfigService({ REFRESH_TOKEN_TTL: '30d' }) as never,
  );
}

describe('RefreshTokenService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('issues opaque tokens and stores only a deterministic SHA-256 hash', () => {
    const tokens = service();
    const issued = tokens.issue();

    expect(issued.rawToken).not.toBe(issued.tokenHash);
    expect(issued.rawToken.length).toBeGreaterThan(40);
    expect(issued.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokens.hash(issued.rawToken)).toBe(issued.tokenHash);
  });

  it('rotates within the same token family with a new secret', () => {
    const tokens = service();
    const issued = tokens.issue();
    const rotated = tokens.rotate(issued.familyId);

    expect(rotated.familyId).toBe(issued.familyId);
    expect(rotated.rawToken).not.toBe(issued.rawToken);
    expect(rotated.tokenHash).not.toBe(issued.tokenHash);
  });

  it('uses the configured refresh TTL for cookie/session expiry', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T00:00:00.000Z'));
    const tokens = service();

    expect(tokens.cookieMaxAgeMs()).toBe(30 * 86_400_000);
    expect(tokens.expiresAt().toISOString()).toBe('2026-11-05T00:00:00.000Z');
  });
});
