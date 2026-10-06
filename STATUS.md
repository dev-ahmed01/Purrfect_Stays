# Build Status

Current engineering milestone: **14/14 complete — Release-ready**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | ✅ Verified | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Verified | Prisma relational schema, durable baseline migration and deterministic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transactions, request context, structured errors, validation, pagination, logging and readiness |
| 5/14 | ✅ Verified | Argon2id auth, JWT access tokens, opaque refresh rotation/replay detection, secure cookies, session revocation and RBAC |
| 6/14 | ✅ Verified | Verified catalogue, search/filtering, pet compatibility, amenities, availability and facets |
| 7/14 | ✅ Verified | Authoritative quote/pricing, idempotency, serializable inventory reservation, cancellation and lifecycle audit |
| 8/14 | ✅ Verified | Pet ownership, favourites, completed-stay reviews, moderation and rating aggregates |
| 9/14 | ✅ Verified | Partner listing lifecycle, policies, rooms, inventory, dashboard/bookings and stay transitions |
| 10/14 | ✅ Verified | Frontend design system, auth client, role-gated shells and reusable UI primitives |
| 11/14 | ✅ Verified | Live home/search/detail/reviews, authoritative quote display and idempotent booking confirmation |
| 12/14 | ✅ Verified | Customer, partner and admin operational workspaces |
| 13/14 | ✅ Verified | Unit/E2E/browser checks, Redis throttling, HTTP/auth hardening, readiness and observability |
| 14/14 | ✅ Release-ready | Frozen dependency graph, durable Prisma migrations, release CI, API Docker image, Vercel/Railway topology, same-origin auth proxy, smoke workflow and rollback runbook |

## Final release verification

The release pipeline now passes end-to-end on the repository's production topology assumptions.

A green Verify run proves:

- `pnpm install --frozen-lockfile` succeeds from the committed `pnpm-lock.yaml`.
- Prisma client generation succeeds.
- the committed migration history deploys to empty PostgreSQL with `prisma migrate deploy`.
- `prisma migrate status` is clean.
- the migrated database has zero drift from `schema.prisma`.
- deterministic test seed succeeds after migrations.
- monorepo TypeScript checks pass.
- API unit tests pass.
- the production Next.js/NestJS monorepo build passes.
- the production API Docker image builds.
- the compiled API and production web server start.
- direct PostgreSQL + Redis readiness passes.
- the web-origin `/api/v1` proxy reaches the API.
- the reusable release smoke suite passes.
- public Chromium and baseline accessibility checks pass.
- customer auth/session/pet/quote/idempotent-booking/cancellation E2E passes.
- partner/admin protected API surfaces pass.
- browser registration + refresh-cookie rotation passes through the same-origin web API proxy.

## Durable release artifacts

The repository now contains:

- `pnpm-lock.yaml` as the immutable dependency graph used by CI and container builds.
- `packages/database/prisma/migrations/00000000000000_init/migration.sql`.
- `packages/database/prisma/migrations/migration_lock.toml`.
- `apps/api/Dockerfile` for the production API artifact.
- `.dockerignore` for deterministic container context.
- `.github/workflows/verify.yml` for release-style continuous verification.
- `.github/workflows/production-smoke.yml` for manual live-environment smoke verification.
- `scripts/release-smoke.mjs` for reusable non-destructive release checks.
- `docs/DEPLOYMENT.md` for deployment, migration, secret and rollback procedures.

## Production topology

The intended release topology is:

```text
Browser
  -> Vercel Next.js
       -> /api/v1/* same-origin rewrite
            -> Railway NestJS API
                 -> Railway PostgreSQL
                 -> Railway Redis

Next.js server rendering
  -> direct Railway API URL
```

This keeps browser authentication first-party even when Vercel and Railway use different provider domains, preserving Secure + HttpOnly + SameSite=Lax refresh-cookie behavior.

The API accepts the platform-standard `PORT` variable while retaining `API_PORT` for local development.

## Database policy

Production uses only committed Prisma migrations:

```bash
pnpm db:deploy
pnpm db:status
```

`prisma db push` is not part of the release path.

The baseline migration was generated from the actual schema, deployed to fresh PostgreSQL and checked for zero drift before it was committed.

Future schema changes must include reviewed migration SQL and remain backward compatible with the previous release when rolling deployments require it.

Production must never execute the demo seed.

## Release operations

Deployment configuration and sequencing are documented in `docs/DEPLOYMENT.md`.

After any real production deployment, run the **Production Smoke** GitHub workflow with:

- the production web origin,
- the direct API base URL ending in `/api/v1`.

The smoke suite verifies direct liveness/readiness, proxied readiness, homepage rendering and live search without mutating business data.

## Cloud provisioning boundary

The repository is **release-ready but not claimed as production-deployed**.

Connected account inspection showed:

- the connected Vercel Hobby team currently has no Purrfect Stays project linked,
- the connected Railway account has an existing unrelated project and no dedicated Purrfect Stays project.

No Vercel/Railway project, database, Redis service, domain or production secret was created automatically during this phase. Provisioning cloud resources can create usage/cost and therefore remains an explicit deployment action.

Once those services are deliberately provisioned, the final external proof is to run Production Smoke against the live URLs.

## Out-of-scope production claims

The current system does not claim:

- payment processing,
- a measured throughput/load SLA,
- exhaustive multi-browser/manual assistive-technology certification,
- the future AI matching/wearable/dynamic-certification layers described in product concepts.

Those remain separate future capabilities rather than being presented as implemented.
