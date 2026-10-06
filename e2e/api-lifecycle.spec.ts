import { expect, request as playwrightRequest, test } from '@playwright/test';

const apiBaseURL = (
  process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1'
).replace(/\/?$/, '/');
const webOrigin =
  process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3000';

function dateOnly(daysAhead: number) {
  const date = new Date(Date.now() + daysAhead * 86_400_000);
  return date.toISOString().slice(0, 10);
}

test('customer auth, pet, quote, idempotent booking and cancellation', async () => {
  const api = await playwrightRequest.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: {
      Origin: webOrigin,
      Accept: 'application/json',
    },
  });

  try {
    const email = 'ci-' + Date.now() + '@example.com';
    const register = await api.post('auth/register', {
      data: {
        email,
        password: 'CI-Purrfect-User-2026!',
        fullName: 'CI Pet Parent',
        city: 'Bengaluru',
      },
    });
    expect(register.ok()).toBeTruthy();
    const registerBody = await register.json();
    const initialAccessToken = registerBody.data.accessToken as string;
    expect(initialAccessToken).toBeTruthy();

    const refresh = await api.post('auth/refresh');
    expect(refresh.ok()).toBeTruthy();
    const refreshBody = await refresh.json();
    const accessToken = refreshBody.data.accessToken as string;
    expect(accessToken).toBeTruthy();
    expect(accessToken).not.toBe(initialAccessToken);

    const staleSession = await api.get('auth/me', {
      headers: {
        Authorization: 'Bearer ' + initialAccessToken,
      },
    });
    expect(staleSession.status()).toBe(401);

    const authHeaders = {
      Authorization: 'Bearer ' + accessToken,
    };

    const petResponse = await api.post('pets', {
      headers: authHeaders,
      data: {
        name: 'Pixel',
        species: 'DOG',
        breed: 'Beagle',
        size: 'SMALL',
        vaccinated: true,
      },
    });
    expect(petResponse.ok()).toBeTruthy();
    const petBody = await petResponse.json();
    const petId = petBody.data.id as string;

    const propertyResponse = await api.get('properties/the-paw-villa');
    expect(propertyResponse.ok()).toBeTruthy();
    const propertyBody = await propertyResponse.json();
    const roomTypeId = propertyBody.data.roomTypes[0].id as string;

    const bookingInput = {
      roomTypeId,
      checkIn: dateOnly(10),
      checkOut: dateOnly(12),
      guests: 2,
      petIds: [petId],
    };

    const quote = await api.post('bookings/quote', {
      headers: authHeaders,
      data: bookingInput,
    });
    expect(quote.ok()).toBeTruthy();
    const quoteBody = await quote.json();
    expect(quoteBody.data.availability).toBe('AVAILABLE');
    expect(quoteBody.data.pricing.totalPaise).toBeGreaterThan(0);

    const idempotencyKey = 'ci-booking-' + Date.now();
    const firstBooking = await api.post('bookings', {
      headers: {
        ...authHeaders,
        'Idempotency-Key': idempotencyKey,
      },
      data: bookingInput,
    });
    expect(firstBooking.ok()).toBeTruthy();
    const firstBody = await firstBooking.json();
    expect(firstBody.data.idempotentReplay).toBe(false);

    const replay = await api.post('bookings', {
      headers: {
        ...authHeaders,
        'Idempotency-Key': idempotencyKey,
      },
      data: bookingInput,
    });
    expect(replay.ok()).toBeTruthy();
    const replayBody = await replay.json();
    expect(replayBody.data.idempotentReplay).toBe(true);
    expect(replayBody.data.booking.id).toBe(firstBody.data.booking.id);

    const cancel = await api.post(
      'bookings/' + firstBody.data.booking.id + '/cancel',
      {
        headers: authHeaders,
        data: { reason: 'CI verifies transactional inventory release.' },
      },
    );
    expect(cancel.ok()).toBeTruthy();
    const cancelBody = await cancel.json();
    expect(cancelBody.data.status).toBe('CANCELLED');
  } finally {
    await api.dispose();
  }
});

test('seeded partner/admin role surfaces and dependency readiness are reachable', async () => {
  const api = await playwrightRequest.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: { Origin: webOrigin, Accept: 'application/json' },
  });

  try {
    const ready = await api.get('health/ready');
    expect(ready.ok()).toBeTruthy();
    const readyBody = await ready.json();
    expect(readyBody.data.dependencies).toEqual({
      database: 'up',
      redis: 'up',
    });

    for (const [email, path] of [
      ['partner@purrfect.local', 'partner/dashboard'],
      ['admin@purrfect.local', 'admin/listings?status=PENDING_REVIEW&page=1&pageSize=1'],
    ] as const) {
      const login = await api.post('auth/login', {
        data: {
          email,
          password: process.env.SEED_DEMO_PASSWORD,
        },
      });
      expect(login.ok()).toBeTruthy();
      const loginBody = await login.json();

      const response = await api.get(path, {
        headers: {
          Authorization: 'Bearer ' + loginBody.data.accessToken,
        },
      });
      expect(response.ok()).toBeTruthy();
    }
  } finally {
    await api.dispose();
  }
});
