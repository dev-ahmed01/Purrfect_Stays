# Build Status

Current engineering milestone: **11/14 complete — Account & operations frontend next**

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
| 10/14 | ✅ Source complete | Full frontend design system, in-memory auth client, login/signup, public navigation, reusable travel/UI primitives, role-gated account/partner/admin shells and global UX states |
| 11/14 | ✅ Source complete | Live database-driven home/search, URL filters, property detail/reviews, auth-aware pet selection, authoritative quote display and idempotent booking confirmation |
| 12/14 | ⏭️ Next | Account/trips/pets/favourites/reviews plus full partner/admin operational frontend |
| 13/14 | Planned | Tests, browser verification, Redis-backed distributed rate limits, security hardening, observability |
| 14/14 | Planned | CI/CD, deployment, migrations, final release verification |

## Phase 11 discovery/booking guarantees

- Homepage featured stays, destination counts and amenity counts come from public catalogue APIs rather than hard-coded arrays.
- Hero search sends paired travel dates plus guest and pet counts.
- /stays is database-driven and uses no-store catalogue-result requests.
- Search/facet state is represented in the URL and survives sort/pagination navigation.
- Frontend URL input is validated by the shared propertySearchSchema before a catalogue request.
- Invalid/incomplete filter state gets an inline search error rather than unrelated fallback results.
- Multiple amenity filters preserve backend all-of semantics.
- Search cards preserve the complete filtered search query when opening a property.
- Property-detail breadcrumbs return to the exact originating search state.
- Property detail uses the public verified property endpoint and published public-review endpoint.
- Public detail pages show verified amenities and structured pet policy without making client-side compatibility claims.
- Approved seeded remote photography uses next/image; unapproved remote image hosts degrade to a safe visual fallback.
- Public rating count remains distinct from number of locally retrievable review bodies.
- Anonymous booking CTAs preserve a guarded same-app return path through login/signup.
- Customer booking UI is available only to USER sessions.
- Booking pet choices come from the authenticated user's active /pets endpoint.
- Booking state is cleared when authenticated identity changes.
- Quote requests send only room/dates/guests/pet IDs; totals are supplied by the backend.
- Changing any booking input invalidates the current quote.
- Booking creation resends the booking inputs and relies on the backend to revalidate price, compatibility and inventory transactionally.
- Browser booking creation uses a stable idempotency key for retries of an unchanged payload.
- A changed booking payload receives a new idempotency key.
- Confirmation language represents a reservation, not payment capture.
- Minimum travel date follows the Asia/Kolkata business calendar used by the backend.
- Search and detail routes have dedicated content-shaped loading skeletons.

## Verification note

Phases 10 and 11 are source complete, but frontend runtime verification has not been performed in this execution environment because clean external dependency installation remains unavailable.

The current status therefore does **not** claim that `next build`, browser rendering, end-to-end booking tests or automated accessibility checks have passed.

Generated Prisma migrations and full release verification remain outstanding.
