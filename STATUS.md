# Build Status

Current engineering milestone: **8/14 complete — Partner operations next**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | 🟡 Source complete | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Complete | Prisma relational schema and realistic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transaction helper, request IDs/context, structured errors, Zod pipe, pagination, logging, database readiness |
| 5/14 | ✅ Complete | Argon2id auth, access JWTs, opaque refresh rotation/replay detection, HttpOnly cookies, session revocation, deny-by-default auth and RBAC |
| 6/14 | ✅ Complete | Verified property catalogue, destination/search filters, breed/species/size compatibility, verified amenities, indexed price sorting, date-range availability discovery and facets |
| 7/14 | ✅ Complete | Authoritative quote engine, pet ownership/policy validation, date-level pricing, per-user idempotency, serializable inventory reservation, nightly reservation ledger, cancellation and lifecycle audit |
| 8/14 | ✅ Complete | Owned pet CRUD/archive, booking-safe pet history, idempotent favourites, completed-stay reviews, moderation and transactional rating aggregates |
| 9/14 | ⏭️ Next | Partner/property-management backend, inventory operations and booking check-in/completion transitions |
| 10/14 | Planned | Full frontend design system and application shell |
| 11/14 | Planned | Discovery/search/detail/booking frontend |
| 12/14 | Planned | Account/trips/pets/partner frontend |
| 13/14 | Planned | Tests, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 8 account/trust guarantees

- Pet-profile create/read/update/archive operations are ownership-scoped to USER accounts.
- Pet deletion is non-destructive archival; historical booking snapshots remain intact.
- Archived pets cannot be selected for new quotes or bookings.
- Nullable pet-profile fields can be explicitly cleared through update validation.
- Favourites use the user/property composite key and idempotent save/remove behavior.
- New favourites must point to a currently public, verified, bookable property.
- Reviews can only be created from the authenticated user's COMPLETED booking.
- The review property is derived from the booking rather than accepted from client input.
- Review.bookingId remains unique, enforcing at most one review per stay at the database boundary.
- New and edited reviews enter PENDING moderation.
- Author review withdrawal is soft and permanent for that booking; historical evidence remains.
- Public review feeds expose only PUBLISHED, non-withdrawn reviews.
- Public author identity is reduced to display name rather than exposing account data.
- Admin-only moderation records moderator, timestamp and optional note.
- Published-review changes recompute property rating/count in the same serializable transaction.
- Prototype historical rating counts are preserved as an imported baseline and combined with locally moderated reviews.
- Seed reset order now covers booking reservation/status audit tables and seeded review moderation is internally consistent.

## Verification note

The repository source is being committed directly to GitHub. This execution environment cannot currently perform a clean external package install from npm, so runtime build/test verification remains pending. Source completion is not represented as a passed runtime verification.

The accumulated Prisma schema changes still require generated migrations during the release/deployment verification phase.
