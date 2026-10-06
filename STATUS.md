# Build Status

Current engineering milestone: **6/14 complete — Booking & pricing next**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | 🟡 Source complete | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Complete | Prisma relational schema and realistic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transaction helper, request IDs/context, structured errors, Zod pipe, pagination, logging, database readiness |
| 5/14 | ✅ Complete | Argon2id auth, access JWTs, opaque refresh rotation/replay detection, HttpOnly cookies, session revocation, deny-by-default auth and RBAC |
| 6/14 | ✅ Complete | Verified property catalogue, destination/search filters, breed/species/size compatibility, verified amenities, indexed price sorting, date-range availability discovery and facets |
| 7/14 | ⏭️ Next | Authoritative availability, quote engine, idempotent booking creation, inventory reservation, cancellation and booking lifecycle |
| 8/14 | Planned | Pets, favourites and reviews |
| 9/14 | Planned | Partner/property-management backend |
| 10/14 | Planned | Full frontend design system and application shell |
| 11/14 | Planned | Discovery/search/detail/booking frontend |
| 12/14 | Planned | Account/trips/pets/partner frontend |
| 13/14 | Planned | Tests, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 6 catalogue guarantees

- Public catalogue queries return only PUBLISHED + VERIFIED properties.
- A public listing must have a structured pet policy and at least one active room type.
- Public amenity data must be verified; unverified partner claims do not satisfy filters.
- Destination, type, rating, price, amenity, guest and pet filters are validated and database-backed.
- Multiple requested amenities use all-of semantics.
- Pet compatibility supports species, size, pet count and normalized breed allow/restriction rules.
- Price sorting uses an indexed integer-paise starting-price field rather than loading and sorting all room types in application memory.
- Date searches are validated as calendar dates, paired check-in/check-out values, capped at 60 nights and checked against same-room inventory for every requested night.
- Search availability remains advisory; no search request reserves inventory.
- Search pagination is bounded and deterministic.
- Featured destinations and filter facets are driven from PostgreSQL rather than static frontend arrays.
- Property detail responses exclude partner/internal operational fields.

## Verification note

The repository source is being committed directly to GitHub. This execution environment cannot currently perform a clean external package install from npm, so runtime build/test verification remains pending. Source completion is not represented as a passed runtime verification.

A generated Prisma migration for the accumulated schema changes remains part of the release/deployment verification work. Phase 7 will make booking inventory checks authoritative inside serializable transactions rather than relying on discovery search state.
