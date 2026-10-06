# Build Status

Current engineering milestone: **5/14 complete — Catalogue & search next**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | 🟡 Source complete | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Complete | Prisma relational schema and realistic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transaction helper, request IDs/context, structured errors, Zod pipe, pagination, logging, database readiness |
| 5/14 | ✅ Complete | Argon2id auth, access JWTs, opaque refresh rotation/replay detection, HttpOnly cookies, session revocation, deny-by-default auth and RBAC |
| 6/14 | ⏭️ Next | Property catalogue, pet-policy compatibility and search |
| 7/14 | Planned | Availability, quote engine, transactions and bookings |
| 8/14 | Planned | Pets, favourites and reviews |
| 9/14 | Planned | Partner/property-management backend |
| 10/14 | Planned | Full frontend design system and application shell |
| 11/14 | Planned | Discovery/search/detail/booking frontend |
| 12/14 | Planned | Account/trips/pets/partner frontend |
| 13/14 | Planned | Tests, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 5 security guarantees

- Public registration cannot assign privileged roles.
- Passwords are hashed with Argon2id and bounded before hashing.
- Unknown-account login attempts perform comparable password-hash work.
- Access JWTs validate algorithm, issuer, audience and expiry.
- Refresh tokens are random opaque secrets and only SHA-256 hashes are stored.
- Every refresh rotates the token inside a serializable transaction.
- Reuse of a rotated token revokes its active token family.
- Refresh cookies are HttpOnly, scoped to auth routes and Secure in production.
- Authentication is deny-by-default through a global access guard.
- Protected requests verify the JWT and the backing live PostgreSQL session.
- RBAC uses the current database-backed role.
- Users can inspect active sessions, revoke one device, or revoke all sessions.
- Auth endpoints have tighter rate limits than general API traffic.
- Health/readiness probes bypass request throttling.

## Verification note

The repository source is being committed directly to GitHub. This execution environment cannot currently perform a clean external package install from npm, so runtime build/test verification remains pending. Source completion is not represented as a passed runtime verification.

Current throttling uses the official Nest throttler's process-local storage. Redis-backed distributed throttling is explicitly required before the multi-instance production release in Phase 13.
