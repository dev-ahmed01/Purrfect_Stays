# Build Status

Current engineering milestone: **13/14 complete — Release & deployment next**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | ✅ Verified | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Verified | Prisma relational schema and deterministic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transactions, request context, structured errors, validation, pagination, logging and readiness |
| 5/14 | ✅ Verified | Argon2id auth, JWT access tokens, opaque refresh rotation/replay detection, secure cookies, session revocation and RBAC |
| 6/14 | ✅ Verified | Verified catalogue, search/filtering, pet compatibility, amenities, availability and facets |
| 7/14 | ✅ Verified | Authoritative quote/pricing, idempotency, serializable inventory reservation, cancellation and lifecycle audit |
| 8/14 | ✅ Verified | Pet ownership, favourites, completed-stay reviews, moderation and rating aggregates |
| 9/14 | ✅ Verified | Partner listing lifecycle, policies, rooms, inventory, dashboard/bookings and stay transitions |
| 10/14 | ✅ Verified | Frontend design system, auth client, role-gated shells and reusable UI primitives |
| 11/14 | ✅ Verified | Live home/search/detail/reviews, authoritative quote display and idempotent booking confirmation |
| 12/14 | ✅ Verified | Customer, partner and admin operational workspaces |
| 13/14 | ✅ Complete | CI verification, unit/E2E/browser checks, Redis distributed throttling, HTTP/auth hardening, readiness and observability |
| 14/14 | ⏭️ Next | Production migrations, frozen dependency graph, deployment environments, secrets/configuration, release sequencing and final production smoke verification |

## Phase 13 verification evidence

GitHub Actions now succeeds end-to-end against disposable PostgreSQL and Redis services. A green run proves dependency installation, Prisma client generation, ephemeral schema creation, deterministic seeding, monorepo typechecking, API unit tests, production build, plain-Node startup of the compiled Nest API, production Next.js startup, Chromium browser smoke checks, baseline accessibility checks and authenticated full-stack API workflows.

The shared @purrfect/contracts and @purrfect/database packages now emit real ESM JavaScript for production runtime use. Express is also an explicit API runtime dependency rather than an undeclared transitive dependency.

## Verified full-stack flows

Customer verification covers:

register -> refresh rotation -> stale access-token rejection -> pet creation -> verified property read -> authoritative quote -> transactional booking -> idempotent replay -> cancellation/inventory release

Operational verification covers PostgreSQL + Redis readiness, seeded PARTNER authentication and protected partner access, seeded ADMIN authentication and protected admin access, non-cacheable auth/session responses, PARTNER denial from admin observability and ADMIN access to low-cardinality telemetry.

Public Chromium verification covers homepage rendering, destination search, property detail, anonymous booking CTA, a stable main landmark, skip-to-content, image alt attributes, labelled form controls and accessible button names.

## Security hardening

- Global throttling uses Redis-backed atomic storage shared across API instances.
- Endpoint-specific authentication and booking throttles remain layered on top.
- Redis is a required readiness dependency.
- Refresh/logout cookie mutations require the exact configured browser origin in production.
- Production refresh cookies remain HttpOnly, Secure and SameSite=Lax.
- Auth/session responses are explicitly non-cacheable.
- JSON request bodies are size bounded.
- Trusted proxy hops are explicit/configurable.
- HTTP request, header and keep-alive timeouts are bounded.
- Helmet and exact-origin credentialed CORS remain enabled.
- Request logs do not include request bodies, bearer tokens or cookies.

## Observability

The API records low-cardinality request/process metrics from the final HTTP response event: total and in-flight requests, average duration, counts by method, counts by status class, process uptime and RSS/heap usage.

Metrics intentionally exclude route URLs, user IDs, emails and other high-cardinality/private identifiers.

ADMIN-only telemetry is available at:

GET /api/v1/admin/observability/metrics

Public health remains limited to:

GET /api/v1/health

GET /api/v1/health/ready

Readiness returns HTTP 503 when PostgreSQL or Redis is unavailable.

## CI behavior

Verification uses PostgreSQL 16, Redis 7.4, Node 20.19 and Chromium.

The production build is created with NODE_ENV=production.

The already-built API is started with NODE_ENV=test only during loopback E2E because GitHub Actions reaches it over plain HTTP and browsers correctly refuse to send production Secure cookies over HTTP. A separate unit test proves production cookies remain Secure.

The already-built Next.js application runs in production mode during E2E.

Superseded verification runs are cancelled through branch-level workflow concurrency.

## Remaining release boundary

Phase 13 intentionally uses prisma db push only for disposable CI databases. It does not claim production migration files have been generated/applied, a production domain/TLS environment is deployed, production secrets are provisioned, rollback has been exercised, payment processing exists, multi-browser/manual assistive-technology testing is complete or a throughput/load SLA has been established.

Those release/deployment concerns are the objective of Phase 14.
