# Account & Operations Frontend

Phase 12 completes the role-specific product workspaces for Purrfect Stays.

The frontend remains intentionally thin: ownership, eligibility, lifecycle transitions, pricing, availability, moderation, review uniqueness and inventory invariants are enforced by the NestJS/Prisma backend. The browser collects intent, validates with shared contracts where practical, presents backend state, and refreshes after mutations.

## Customer workspace

Protected customer routes require a USER account:

```
/account
/account/trips
/account/pets
/account/favourites
/account/reviews
```

### Account overview

The overview derives counts from API pagination totals rather than the length of a bounded first page.

It shows:

- confirmed reservations,
- active pet profiles,
- saved public stays,
- completed reservations,
- total reservation history,
- total authored reviews,
- published reviews.

### Trips

`/account/trips` consumes the authenticated booking history.

It presents:

- booking reference,
- property and room,
- check-in/check-out,
- guests,
- booking pet snapshots,
- total price snapshot,
- lifecycle status.

Confirmed reservations expose customer cancellation. The frontend validates the cancellation reason, but cancellation date/state/inventory-release rules remain authoritative on the backend.

Completed stays only show a review CTA when the booking's one-to-one review relation is null.

Trip history is paginated.

### Pet profiles

`/account/pets` supports:

- create,
- edit,
- archive.

The form uses shared pet schemas.

Because shared date-only Zod schemas transform strings to Date objects, the browser explicitly serializes birth dates back to `YYYY-MM-DD` before calling the API.

Archival remains non-destructive; historical `BookingPet` snapshots are unchanged.

### Saved stays

`/account/favourites` lists the user's currently public/verified favourite properties.

Users can remove favourites from the workspace.

Property detail pages also expose a USER-only Save/Unsave control using the idempotent favourite endpoints.

Anonymous users who choose Save are sent through the guarded same-app authentication return flow.

### Reviews

`/account/reviews` supports:

- completed-stay review creation,
- author review editing,
- moderation-state display,
- author withdrawal,
- moderation-note display.

Review eligibility is derived from `Booking.review`, not from a paginated review page.

Withdrawn reviews stay visible in the author's history and cannot be edited or withdrawn again.

Completed stays and authored review history have independent pagination.

If a review flow is opened from an older trip page, the specific booking is fetched directly when it is outside the current completed-stay page.

## Partner workspace

Protected partner routes require PARTNER:

```
/partner
/partner/bookings
/partner/properties
/partner/properties/:propertyId
```

### Dashboard

The partner dashboard displays backend-derived:

- property counts by lifecycle state,
- upcoming confirmed stays,
- checked-in stays,
- arrivals today,
- departures today,
- reservation value,
- next arrivals,
- India business date.

Reservation value is explicitly labelled as reservation value, not captured payment revenue.

### Guest-stay operations

`/partner/bookings` supports:

- status filtering,
- date-overlap filtering,
- pagination,
- guest contact required to service the reservation,
- pet snapshot display,
- server-controlled check-in,
- server-controlled completion.

The UI only offers:

```
CONFIRMED -> CHECKED_IN
CHECKED_IN -> COMPLETED
```

Date gates and transition validity remain backend-enforced.

### Property portfolio

`/partner/properties` supports:

- paginated partner-owned portfolio,
- new DRAFT listing creation,
- lifecycle/verification badges,
- navigation to property operations,
- public-page link for published properties.

New listings are never created as published or verified by the browser.

### Property operations

`/partner/properties/:propertyId` includes:

- publication readiness,
- submit for review,
- withdraw to draft,
- draft deletion attempt,
- core listing metadata,
- structured pet policy,
- HTTPS image references,
- amenity claims,
- room-type create/update/activation,
- inventory calendar reads,
- single-date inventory create/update,
- listing status history,
- verification history.

The UI follows the backend lifecycle:

- listing claims are disabled outside DRAFT,
- room definitions are disabled in PENDING_REVIEW,
- inventory remains operational,
- readiness is read from the backend,
- submission is disabled until backend readiness reports ready.

Room and pet fee inputs are displayed in rupees and converted to integer paise before calling shared backend contracts.

Inventory date validation uses the shared schema and converts transformed Date objects back to `YYYY-MM-DD` for the JSON API.

`reservedUnits` is displayed but never accepted as partner input.

## Admin workspace

Protected admin routes require ADMIN:

```
/admin
/admin/listings
/admin/listings/:propertyId
/admin/reviews
```

### Admin overview

The overview derives queue totals from pagination metadata:

- pending listing reviews,
- pending guest reviews,
- suspended listings.

### Listing queues

Admin listing queues are paginated and filterable by listing lifecycle state.

The URL-supplied initial status is allow-listed before it becomes frontend state.

### Listing review detail

The listing review page exposes the submitted evidence required to make a decision:

- partner account/contact,
- listing identity and description,
- address,
- submitted image references and alt text,
- pet policy,
- amenity claims and verification state,
- room capacity/rates,
- lifecycle history,
- verification history.

Admin actions call the existing transactional backend endpoints:

```
PENDING_REVIEW -> PUBLISHED
PENDING_REVIEW -> DRAFT
PUBLISHED -> SUSPENDED
SUSPENDED -> PUBLISHED
```

Approve/reject and suspend/restore require the backend-defined admin note rules.

The frontend does not mark amenities verified itself and does not reproduce listing readiness logic.

### Review moderation

`/admin/reviews` is paginated and filterable by review status.

Moderation supports:

- publish,
- hide,
- optional moderation note.

The frontend does not calculate rating aggregates. Backend moderation transactions update review state and property aggregates together.

Withdrawn author reviews remain absent from this admin queue.

## Workspace pagination

Bounded pagination controls are implemented for:

- customer trips,
- customer authored reviews,
- completed stays used for review creation,
- partner properties,
- partner bookings,
- admin listing queues,
- admin review queues.

Summary metrics use API `meta.totalItems` rather than assuming the current page is the complete dataset.

## Shared trust boundaries

Phase 12 preserves these boundaries:

- USER cannot operate PARTNER or ADMIN surfaces.
- PARTNER cannot mutate another partner's resources.
- ADMIN review/listing actions go through dedicated admin endpoints.
- browser forms do not create trusted pricing or availability.
- property verification remains server-side.
- review uniqueness remains database-backed.
- booking review eligibility is read from the booking relation.
- inventory reservations remain server-controlled.
- saved stays must remain in the public catalogue boundary.

## UX/system behavior

All workspaces reuse the Phase 10 design system:

- role-aware app shell,
- cards,
- fields,
- buttons,
- alerts,
- badges,
- empty states,
- responsive navigation,
- responsive operational grids,
- loading skeletons.

Internal build-phase terminology is not shown in user-facing product copy.

## Verification status

Phase 12 is source complete.

The current execution environment still cannot perform a clean external dependency installation, so this phase does not claim successful:

- TypeScript/Next production build,
- browser rendering,
- authenticated end-to-end workflow execution,
- automated accessibility checks,
- cross-browser responsive verification.

Those runtime checks move into Phase 13.
