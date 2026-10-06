# Purrfect Stays

A full-stack pet-friendly travel platform for India, built around verified pet policies, pet profiles, availability-aware search, authoritative pricing, transactional bookings, reviews, favourites, partner operations and admin moderation.

> **Engineering status:** all 14 implementation phases are release-engineered in the repository. CI verifies the complete application and release artifacts. Live Vercel/Railway production resources are intentionally not provisioned by repository code alone.

## Product

Purrfect Stays helps pet parents answer the questions that matter before travelling:

- Is this stay actually compatible with my pet?
- What pet rules and verified facilities apply?
- Is there real inventory for my travel dates?
- What is the authoritative total price?
- Can I manage the booking, pet profile, saved stays and review history safely?

The product preserves the supplied visual direction: Playfair Display + DM Sans, coral primary actions, warm beige/off-white surfaces, sage/mustard accents, rounded travel cards and spacious hierarchy.

## Architecture

```text
apps/
  web/        Next.js App Router frontend
  api/        NestJS REST API
packages/
  database/   Prisma/PostgreSQL schema, migrations and seed
  contracts/  Shared Zod schemas and API contracts
docs/         Product, architecture, verification and release documentation
```

Runtime infrastructure:

- PostgreSQL — transactional source of truth
- Redis — distributed rate limiting and required readiness dependency
- Prisma — database access and durable migration history
- JWT access tokens + opaque rotating refresh sessions
- Zod — shared boundary validation
- GitHub Actions — immutable install, migration, build and full-stack verification
- Docker — production API artifact
- Vercel-ready Next.js web + Railway-ready API/PostgreSQL/Redis deployment topology

Browser authentication is designed to remain first-party in production: the web uses `/api/v1` and Next.js rewrites that traffic to the API service, while server-rendered pages use a direct API URL.

## Local development

Requirements:

- Node.js 20.19+
- pnpm 10.17.1 through Corepack
- Docker

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Create a local environment file from `.env.example`, set a development `JWT_ACCESS_SECRET`, and set `SEED_DEMO_PASSWORD` only if you want the deterministic demo users/data.

Install the committed dependency graph and prepare the database:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy
SEED_DEMO_PASSWORD=<your-local-demo-password> pnpm db:seed
```

Then start the applications:

```bash
pnpm dev
```

Web defaults to `http://localhost:3000` and API defaults to `http://localhost:4000/api/v1`.

Never seed production.

## Verification

The normal CI pipeline proves:

```text
frozen install
-> Prisma client generation
-> migrate deploy to fresh PostgreSQL
-> migration status
-> zero schema drift
-> deterministic test seed
-> typecheck
-> API unit tests
-> production monorepo build
-> production API Docker build
-> API + web startup
-> release smoke
-> Chromium public/accessibility tests
-> auth/session/booking E2E
-> same-origin proxy auth E2E
```

Useful local commands:

```bash
pnpm typecheck
pnpm --filter @purrfect/api test
pnpm build
pnpm db:status
pnpm test:e2e
pnpm smoke:release
```

## Database policy

Production schema changes must use committed Prisma migrations.

```bash
pnpm db:deploy
pnpm db:status
```

Do not use `prisma db push` as a production deployment mechanism.

The baseline migration at `packages/database/prisma/migrations/00000000000000_init` was generated from the current schema, applied to an empty PostgreSQL instance and checked for zero drift in CI.

## Release

See:

- `docs/DEPLOYMENT.md` — Vercel/Railway configuration, production variables, migration sequencing, smoke checks and rollback
- `docs/VERIFICATION_SECURITY.md` — test/security/observability guarantees
- `STATUS.md` — exact completion and deployment boundary

A manual **Production Smoke** GitHub workflow accepts live web/API URLs and runs the non-destructive production smoke suite after deployment.

## Product integrity

AI matching, wearable wellness integrations and dynamic certification remain future platform layers. They are not represented as implemented production capabilities until their real services, data contracts and validation paths exist.
