# Build Status

Current engineering milestone: **7/14 complete — Pets, favourites & reviews next**

| Phase | Status | Scope |
|---|---|---|
| 1/14 | ✅ Complete | Requirements, product invariants, design system, architecture decision |
| 2/14 | 🟡 Source complete | Monorepo, Next.js app, NestJS API bootstrap, shared contracts, Docker services |
| 3/14 | ✅ Complete | Prisma relational schema and realistic seed data |
| 4/14 | ✅ Complete | Prisma lifecycle, serializable transaction helper, request IDs/context, structured errors, Zod pipe, pagination, logging, database readiness |
| 5/14 | ✅ Complete | Argon2id auth, access JWTs, opaque refresh rotation/replay detection, HttpOnly cookies, session revocation, deny-by-default auth and RBAC |
| 6/14 | ✅ Complete | Verified property catalogue, destination/search filters, breed/species/size compatibility, verified amenities, indexed price sorting, date-range availability discovery and facets |
| 7/14 | ✅ Complete | Authoritative quote engine, pet ownership/policy validation, date-level pricing, per-user idempotency, serializable inventory reservation, nightly reservation ledger, cancellation and lifecycle audit |
| 8/14 | ⏭️ Next | Pet-profile CRUD, favourites and verified-stay reviews |
| 9/14 | Planned | Partner/property-management backend and operational booking transitions |
| 10/14 | Planned | Full frontend design system and application shell |
| 11/14 | Planned | Discovery/search/detail/booking frontend |
| 12/14 | Planned | Account/trips/pets/partner frontend |
| 13/14 | Planned | Tests, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 7 booking guarantees

- Customer booking endpoints are restricted to authenticated USER accounts.
- Quote and booking inputs use validated date-only travel dates and unique owned pet IDs.
- Quotes validate room/property eligibility, guest capacity, pet ownership and full structured pet compatibility.
- Final nightly price uses date-level inventory overrides when present.
- Pet fees respect PER_STAY versus PER_NIGHT policy modes.
- Tax is calculated from a configurable basis-point rule and persisted as a booking snapshot.
- The frontend never supplies authoritative totals.
- Booking creation re-runs the complete quote/availability logic inside a SERIALIZABLE transaction.
- Inventory is incremented conditionally, preventing oversell at the write boundary.
- Idempotency is scoped per user and backed by a request fingerprint.
- Same-key/same-request replay returns the original booking without a second reservation.
- Same-key/different-request reuse fails with conflict.
- Every reserved night has a BookingInventoryReservation ownership row.
- Customer cancellation releases only that booking's unreleased nightly ledger rows.
- Cancellation and booking status changes append immutable BookingStatusEvent audit records.
- Invalid booking-state transitions are rejected by a shared state machine.
- Booking/pet data is snapshotted for historical integrity.
- Customer booking reads are ownership-scoped and paginated.
- India calendar rules use Asia/Kolkata rather than the deployment host timezone.

## Product semantics

A newly created booking currently enters CONFIRMED after successful inventory reservation. CONFIRMED means the reservation is confirmed; it does not assert that any external payment has been captured.

Payment-provider integration is not represented as implemented.

## Verification note

The repository source is being committed directly to GitHub. This execution environment cannot currently perform a clean external package install from npm, so runtime build/test verification remains pending. Source completion is not represented as a passed runtime verification.

The accumulated Prisma schema changes still require generated migrations during the release/deployment verification phase.
