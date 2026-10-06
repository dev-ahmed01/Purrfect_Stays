# Deployment & Release Runbook

Purrfect Stays is release-ready as a two-application deployment:

- **Web:** Next.js on Vercel.
- **API:** NestJS container on Railway.
- **Database:** managed PostgreSQL attached to the Railway API.
- **Rate limiting/readiness:** managed Redis attached to the Railway API.

The repository does not assume that these cloud resources already exist. Provisioning them is a separate explicit action because it can create billable infrastructure.

## Request topology

Browser traffic should stay first-party:

```text
Browser
  -> https://<web-host>/
  -> https://<web-host>/api/v1/*
       Next.js rewrite
       -> https://<api-host>/api/v1/*
            -> PostgreSQL
            -> Redis
```

Server-rendered Next.js requests use the direct API URL instead of the browser proxy.

This layout is intentional. The refresh session remains a Secure, HttpOnly, SameSite=Lax host-only cookie while browser auth calls remain on the web origin. It avoids depending on third-party-cookie behavior between a Vercel domain and a Railway domain.

## Release prerequisites

Before any production deployment:

1. The latest `main` Verify workflow must be green.
2. `pnpm-lock.yaml` must be committed and CI must pass `pnpm install --frozen-lockfile`.
3. Every Prisma schema change must have a committed migration.
4. `pnpm db:status` must report the migration history clean in the target environment.
5. The production database must have a restorable backup/snapshot before a risky migration.
6. Production must never run `pnpm db:seed`.

## Database migrations

The initial schema is represented by:

```text
packages/database/prisma/migrations/00000000000000_init/migration.sql
```

It was generated from the current Prisma schema, applied to an empty PostgreSQL database in CI, and checked for zero schema drift.

Production deployment uses:

```bash
pnpm db:deploy
pnpm db:status
```

Do not use `prisma db push` in production.

For future schema changes, generate a migration in development, review the SQL, commit it with the Prisma schema, and let CI apply the complete migration history to a clean database. Prefer expand/contract migrations for changes that must remain compatible with the previous application version.

If a production database already contains this schema but predates Prisma migration history, do **not** blindly run the baseline migration. First prove that the database matches `schema.prisma`, then baseline it with Prisma's migration resolution workflow. Only mark `00000000000000_init` applied after that verification.

Database rollback is not the same as code rollback. Prefer a forward corrective migration. Restore from a snapshot only when recovery requirements justify the data loss/downtime tradeoff.

## Railway API

Create a dedicated Purrfect Stays Railway project rather than reusing an unrelated project.

Recommended services:

- API service from `dev-ahmed01/Purrfect_Stays`
- PostgreSQL
- Redis

API service configuration:

```text
Dockerfile path: apps/api/Dockerfile
Health check: /api/v1/health/ready
Pre-deploy command: pnpm db:deploy
Restart policy: ON_FAILURE
```

The API accepts Railway's standard injected `PORT`; do not hard-code a production port.

Recommended production variables:

```text
NODE_ENV=production
API_PREFIX=api/v1
WEB_ORIGIN=https://<production-web-host>
TRUST_PROXY_HOPS=1
JSON_BODY_LIMIT=128kb
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_LIMIT=120

JWT_ACCESS_SECRET=<strong random secret, at least 32 characters>
JWT_ACCESS_TTL=15m
JWT_ISSUER=purrfect-api
JWT_AUDIENCE=purrfect-web
REFRESH_TOKEN_TTL=30d
REFRESH_COOKIE_NAME=purrfect_refresh
BOOKING_TAX_RATE_BPS=1200

DATABASE_URL=<Railway PostgreSQL connection reference>
REDIS_URL=<Railway Redis connection reference>
```

Do not configure `SEED_DEMO_PASSWORD` in production.

After deployment, verify:

```text
GET /api/v1/health
GET /api/v1/health/ready
```

Readiness must report both PostgreSQL and Redis as up before the API is considered releasable.

## Vercel web

Create a Vercel Git project connected to `dev-ahmed01/Purrfect_Stays`.

Recommended project settings:

```text
Framework: Next.js
Root directory: apps/web
Node.js: 20.x
Source files outside root: enabled
Install command: pnpm install --frozen-lockfile
```

Because the web imports workspace packages outside `apps/web`, the Vercel project must retain monorepo access to those source files.

Production variables:

```text
NEXT_PUBLIC_API_URL=/api/v1
API_INTERNAL_URL=https://<railway-api-host>/api/v1
API_PROXY_ORIGIN=https://<railway-api-host>
```

`NEXT_PUBLIC_API_URL=/api/v1` is deliberate. Browser calls go to the Vercel origin and are rewritten to Railway, preserving the first-party refresh cookie.

The API's `WEB_ORIGIN` must exactly equal the production browser origin used by Vercel/custom-domain traffic. If the production web domain changes, update `WEB_ORIGIN` before switching traffic.

For preview deployments, auth is fully valid only when the API accepts that preview origin. Do not broaden production CORS/Origin checks to wildcard preview hosts simply for convenience; use a dedicated preview API/origin policy if preview authentication is required.

## Release sequence

Use this order:

1. Confirm latest `main` Verify run is green.
2. Confirm a current database backup/snapshot exists when the migration warrants one.
3. Deploy the Railway API revision. Its pre-deploy step runs `pnpm db:deploy`.
4. Confirm Railway health check reaches `/api/v1/health/ready`.
5. Deploy/promote the Vercel web revision with the matching API variables.
6. Run the **Production Smoke** GitHub workflow with the real web origin and direct API base URL.
7. Check API error logs and ADMIN observability.
8. Only then treat the release as complete.

The reusable local/CI smoke command is:

```bash
WEB_BASE_URL=https://<web-host> \
API_BASE_URL=https://<api-host>/api/v1 \
pnpm smoke:release
```

It is read-only and checks direct API liveness/readiness, the same-origin web API proxy, the homepage and a live Goa search result.

## Rollback

### Web

Promote/redeploy the previous known-good Vercel deployment.

### API

Redeploy the previous known-good Railway deployment only when its code remains compatible with the already-applied database schema.

### Database

Do not automatically reverse migrations during an application rollback.

For a failed Prisma migration:

1. stop further releases,
2. inspect `pnpm db:status`,
3. determine exactly which SQL statements were applied,
4. correct the database or migration,
5. use Prisma migration resolution only when the real database state is understood,
6. prefer a forward fix.

Restore a database snapshot only for severe corruption/data-loss scenarios where the recovery point and downtime are accepted.

## Secret rotation

Rotating `JWT_ACCESS_SECRET` invalidates existing access tokens. Existing refresh sessions remain in the database, but newly issued access tokens use the new secret; plan a deliberate sign-in reset when rotating this value.

Database and Redis credentials should be referenced from the managed services rather than copied into source control.

No production secret belongs in Git, `.env.example`, Docker image layers, or public build logs.

## Release verification boundary

Repository verification proves:

- the immutable dependency graph installs,
- committed Prisma migrations apply cleanly to empty PostgreSQL,
- migration status is clean,
- migrated schema has zero drift from `schema.prisma`,
- the API production container builds,
- the production web build succeeds,
- same-origin proxy auth works in a real browser,
- customer booking/session flows work against PostgreSQL + Redis.

It does not prove a cloud deployment exists until Vercel/Railway resources are actually provisioned and the Production Smoke workflow passes against those live URLs.
