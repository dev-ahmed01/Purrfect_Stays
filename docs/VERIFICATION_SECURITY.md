# Verification, Security & Observability

Phase 13 turns the Purrfect Stays repository from a source-complete implementation into a continuously verified system.

## Verification pipeline

GitHub Actions runs the repository against disposable PostgreSQL and Redis services.

The verification job performs, in order:

1. dependency installation,
2. Prisma client generation,
3. creation of an ephemeral PostgreSQL schema with `prisma db push`,
4. deterministic demo seed,
5. monorepo TypeScript checks,
6. Nest API unit tests,
7. a production monorepo build,
8. Chromium installation,
9. startup of the compiled API and production Next.js server,
10. Playwright full-stack verification.

A failed browser/runtime job uploads:

- API logs,
- web logs,
- Playwright HTML report,
- traces/screenshots/test results.

The CI database uses `db push` only as an isolated verification mechanism. Production migration files are intentionally a Phase 14 release concern.

## Production artifact verification

The API is not verified through a TypeScript development loader.

Shared workspace packages now emit real ESM JavaScript:

```
packages/contracts/dist
packages/database/dist
```

Their package exports use source TypeScript for editor/type resolution and compiled ESM for runtime imports.

This caught and fixed two issues that static type checking alone did not detect:

- Express was being consumed as an undeclared transitive dependency.
- shared workspace packages originally resolved to raw `.ts` files under plain Node.

The CI server now starts the compiled Nest output using plain Node.

## Cookie transport in CI

Production refresh cookies intentionally use:

```
HttpOnly
Secure
SameSite=Lax
```

GitHub Actions reaches the local API over plain loopback HTTP. A browser-compatible client correctly refuses to round-trip a `Secure` cookie over that transport.

Therefore the verification job separates two concerns:

- the application is **built with `NODE_ENV=production`**,
- the already-built API is started with **`NODE_ENV=test` only for the HTTP loopback E2E process**,
- the already-built Next.js application is started with `NODE_ENV=production`.

An API unit test separately asserts that `NODE_ENV=production` produces a Secure, HttpOnly, SameSite=Lax refresh cookie with the expected auth-scoped path.

This does not weaken the production cookie default.

## Authentication verification

Deterministic/unit coverage includes:

- access-token signing and verification,
- issuer/audience rejection,
- opaque refresh-token generation,
- SHA-256 refresh-token hashing,
- refresh family rotation,
- configured refresh expiry,
- production/test refresh-cookie flags,
- trusted browser-origin enforcement.

Full-stack coverage includes:

- user registration,
- refresh-cookie round trip,
- refresh-session rotation,
- rejection of the stale pre-rotation access token,
- authenticated pet creation,
- seeded PARTNER login and protected partner access,
- seeded ADMIN login and protected admin access.

Auth/session responses are explicitly marked:

```
Cache-Control: no-store
Pragma: no-cache
```

The full-stack suite checks the `no-store` boundary.

## Browser-origin protection

Cookie-authenticated refresh/logout mutations use an explicit origin guard.

In production:

- an Origin header is required,
- the value must exactly equal `WEB_ORIGIN`.

Development/test tooling may omit Origin so non-browser local clients remain usable.

Bearer-token business APIs do not rely on cookies and therefore do not use this CSRF guard.

## Distributed rate limiting

The API's `@nestjs/throttler` storage is backed by Redis.

The storage uses an atomic Lua script to coordinate:

- request count,
- TTL,
- block state,
- block expiry

across API instances.

Rate-limit storage keys are SHA-256 digests rather than raw tracker/route values.

Authentication and booking endpoints retain their tighter endpoint-specific throttles on top of the global policy.

Redis is now treated as a required production dependency and participates in readiness.

## Health

Public health routes are deliberately narrow.

```
GET /api/v1/health
GET /api/v1/health/ready
```

Liveness reports that the process is alive.

Readiness checks both:

- PostgreSQL,
- Redis.

If either dependency is unavailable, readiness returns HTTP 503 with a normalized `SERVICE_UNAVAILABLE` response rather than claiming the service is ready.

## Operational metrics

The API records low-cardinality in-process metrics from the real HTTP response `finish` event:

- total requests,
- in-flight requests,
- average duration,
- counts by HTTP method,
- counts by status class,
- process uptime,
- RSS/heap memory.

The metrics intentionally do **not** include URLs, user IDs, email addresses or other high-cardinality/private identifiers.

Operational telemetry is not exposed on the public health surface.

It is available only to ADMIN accounts:

```
GET /api/v1/admin/observability/metrics
```

The full-stack suite verifies that PARTNER receives 403 and ADMIN can read it.

## HTTP hardening

The API applies:

- Helmet security headers,
- exact configured CORS origin,
- credentialed CORS only for the configured web origin,
- bounded JSON request bodies,
- optional explicit trusted-proxy hop count,
- request timeout,
- header timeout,
- keep-alive timeout,
- sanitized request IDs,
- structured errors,
- structured request completion logging.

Request logs do not log request bodies, bearer tokens or cookies.

## Deterministic domain tests

The API test suite covers domain/boundary logic including:

- booking lifecycle transitions,
- customer cancellation state eligibility,
- property lifecycle transitions,
- India business calendar behavior,
- stay-night calculations,
- catalogue/date search validation,
- pet date-only conversion,
- pet-policy breed conflicts,
- access-token claims,
- refresh-token primitives,
- distributed-throttle result mapping,
- browser-origin rules,
- metrics accounting,
- refresh-cookie security attributes.

## Full-stack booking verification

Against real PostgreSQL and Redis, CI exercises:

```
register
  -> refresh/rotate session
  -> reject stale access token
  -> create owned pet
  -> read verified seeded property
  -> authoritative quote
  -> transactional booking create
  -> replay same Idempotency-Key
  -> verify same booking is returned
  -> customer cancellation
  -> transactional inventory release
```

The browser/API test does not calculate its own price or inventory result.

It asserts the real backend response.

## Public browser verification

Chromium smoke coverage checks:

- live homepage rendering,
- destination search,
- seeded property result,
- property-detail rendering,
- anonymous booking CTA.

Basic accessibility contracts check:

- a stable main landmark,
- skip-to-content link,
- image alt attributes,
- labels/accessible names on form controls,
- accessible names on buttons.

This is a baseline automated accessibility gate, not a substitute for manual assistive-technology testing.

## What Phase 13 does not claim

Phase 13 does not claim:

- production infrastructure has been deployed,
- real production TLS/domain configuration has been exercised,
- database migration files have been generated/applied to a production target,
- payment processing exists,
- load/stress testing proves a specific throughput SLA,
- automated accessibility tests cover every WCAG criterion.

Deployment, durable migrations, environment provisioning, release sequencing and final production smoke verification are Phase 14.
