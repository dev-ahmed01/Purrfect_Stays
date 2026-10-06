# Build Status

Current engineering milestone: **9/14 complete — Frontend design system next**

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
| 9/14 | ✅ Complete | Partner-owned listing CRUD, draft/review/publish lifecycle, pet policy, images/amenities, room types, inventory calendar, partner dashboard/bookings and operational stay transitions |
| 10/14 | ⏭️ Next | Full frontend design system, reusable UI primitives and application shell |
| 11/14 | Planned | Discovery/search/detail/booking frontend |
| 12/14 | Planned | Account/trips/pets/partner frontend |
| 13/14 | Planned | Tests, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 9 partner/operations guarantees

- All partner property, room, inventory and booking operations are ownership-scoped.
- New partner properties begin as DRAFT + UNVERIFIED with server-generated stable slugs.
- Property lifecycle transitions are constrained by a shared state machine and recorded in PropertyStatusEvent.
- Verification history remains separate in PropertyVerification.
- Verified listing claims cannot be silently changed while a property remains public.
- Core property claims, pet policy, images and amenities are draft-only edits.
- Published/pending listings can be withdrawn to draft and must be reviewed again before publication.
- Submission requires pet policy, image, active room type and open future inventory.
- PENDING_REVIEW freezes listing/room definition changes; admin approval rechecks readiness transactionally.
- Partner amenity claims are unverified until admin approval.
- Room create/update operations transactionally recalculate the property's indexed starting price.
- Room defaults cannot be reduced below already-reserved inventory.
- Date-level inventory writes are bounded, unique by date, future-only and cannot reduce capacity below reserved units.
- reservedUnits is not partner-controlled input.
- Partner inventory writes and booking reservations both use serializable transactions.
- Partner booking reads expose only reservations for owned properties.
- Operational guest contact is exposed only to the owning partner for an existing reservation.
- CONFIRMED -> CHECKED_IN and CHECKED_IN -> COMPLETED use the shared booking state machine plus India-business-date gates.
- Operational booking transitions append BookingStatusEvent audit records.
- Admin review defaults to the PENDING_REVIEW queue.
- Approval verifies current amenity claims and records PUBLISHED + VERIFIED atomically.
- Rejection returns the listing to DRAFT + REJECTED and clears amenity verification.
- Admin suspension removes a listing from public discovery without destroying existing bookings.
- Direct restoration requires the listing to remain VERIFIED and publication-ready.
- Partner dashboard derives property/stay counts and upcoming arrivals from PostgreSQL rather than frontend state.
- Dashboard reservation value is explicitly not represented as captured payment revenue.
- Partner image management currently stores validated HTTPS asset references; binary object-storage upload is not represented as implemented.

## Verification note

The repository source is being committed directly to GitHub. This execution environment cannot currently perform a clean external package install from npm, so runtime build/test verification remains pending. Source completion is not represented as a passed runtime verification.

The accumulated Prisma schema changes still require generated migrations during the release/deployment verification phase.
