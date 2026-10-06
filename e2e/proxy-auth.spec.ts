import { expect, test } from '@playwright/test';

test('same-origin API proxy preserves auth cookie rotation', async ({ page }) => {
  await page.goto('/');

  const email = `proxy-ci-${Date.now()}@example.com`;

  const result = await page.evaluate(async ({ email }) => {
    const register = await fetch('/api/v1/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'CI-Proxy-Purrfect-2026!',
        fullName: 'Proxy Verification User',
        city: 'Bengaluru',
      }),
    });

    const registerBody = await register.json();
    const initialAccessToken = registerBody?.data?.accessToken ?? null;

    const refresh = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    const refreshBody = await refresh.json();

    return {
      registerStatus: register.status,
      registerCacheControl: register.headers.get('cache-control'),
      refreshStatus: refresh.status,
      initialAccessToken,
      rotatedAccessToken: refreshBody?.data?.accessToken ?? null,
    };
  }, { email });

  expect(result.registerStatus).toBe(201);
  expect(result.registerCacheControl).toContain('no-store');
  expect(result.refreshStatus).toBe(200);
  expect(result.initialAccessToken).toBeTruthy();
  expect(result.rotatedAccessToken).toBeTruthy();
  expect(result.rotatedAccessToken).not.toBe(result.initialAccessToken);
});
