# Discovery, Property Detail & Booking Frontend

Phase 11 connects the public Purrfect Stays experience to the backend catalogue and booking engine.

## Live homepage

The homepage no longer uses hard-coded property cards or platform counts.

It loads:

- featured properties from `GET /api/v1/properties/featured`,
- destination counts from `GET /api/v1/properties/destinations`,
- verified amenity facets from `GET /api/v1/properties/facets`.

The public homepage remains request-time rendered while catalogue subrequests may reuse a short 60-second cache.

Displayed counts therefore describe the current backend catalogue rather than invented marketing totals.

## Hero search

The hero submits a normal GET request to:

```
/stays
```

with:

- destination,
- check-in,
- check-out,
- guests,
- pets.

Check-in and check-out are submitted as a pair because the backend intentionally rejects one-sided availability searches.

## Search page

```
/stays
```

is driven by:

```
GET /api/v1/properties
GET /api/v1/properties/facets
```

Search result requests use `cache: no-store` so availability-oriented discovery does not show stale result pages.

Facet metadata can use a short cache because property-type/amenity options change less frequently.

## URL-driven state

Search state lives in the URL rather than hidden component state.

Supported controls include:

- destination,
- check-in / check-out,
- guest count,
- pet count,
- species,
- pet size,
- breed,
- property type,
- min/max price,
- minimum rating,
- verified amenities,
- sort mode,
- pagination.

Benefits:

- searches can be bookmarked,
- searches can be shared,
- browser Back/Forward remains meaningful,
- pagination preserves active filters,
- sort changes preserve active filters.

The search page validates URL parameters with the same shared `propertySearchSchema` used by the API contract before making a catalogue request.

Malformed or incomplete search URLs therefore show a local filter error rather than falling into the global application error page.

## Search semantics

The frontend does not reinterpret backend search rules.

In particular:

- multiple amenity selections retain backend all-of semantics,
- pet compatibility remains server-defined,
- date availability remains server-defined,
- price filtering uses catalogue starting price,
- no matching result is replaced with an unrelated fallback stay.

The empty state tells the user to widen filters instead.

## Search context into property detail

Property-card links preserve the full current catalogue query string.

For example, a user can move:

```
/stays?destination=Goa&checkIn=...&checkOut=...&guests=2&species=DOG
```

to:

```
/stays/the-paw-villa?destination=Goa&checkIn=...&checkOut=...&guests=2&species=DOG
```

The property-detail breadcrumb reconstructs the exact search URL, allowing the user to return to the same filtered result set.

Dates and guest count are also prefilled into the booking card.

## Property detail

```
/stays/:slug
```

loads:

```
GET /api/v1/properties/:slug
GET /api/v1/properties/:slug/reviews
```

The page exposes only information already allowed by the public backend boundary:

- verified/public property identity,
- public address/location,
- public images,
- verified amenities,
- structured pet policy,
- active room types,
- public prices,
- public review summary,
- published non-withdrawn review text.

A missing/non-public property maps to the product 404 surface.

## Gallery

Property photography uses `next/image`.

The currently approved optimized remote source is:

```
images.unsplash.com
```

If a public listing references a remote host that is not yet approved in the frontend image configuration, the frontend displays its visual fallback rather than broadening Next.js image optimization to arbitrary internet hosts.

A production partner-media pipeline/storage domain should later be explicitly approved.

## Pet policy presentation

The detail page surfaces:

- supported species,
- maximum pets,
- allowed sizes,
- vaccination requirement,
- pet-fee amount and fee mode,
- breed-restriction presence,
- partner policy notes.

This is descriptive only.

The browser does not decide that a selected pet is compatible. The booking API remains authoritative.

## Public reviews

The detail page displays published locally stored review text from completed stays.

Public summary rating/count comes from the property's aggregate fields and may include imported historical rating baseline data.

Therefore:

```
public rating count
```

can legitimately be larger than:

```
number of locally retrievable review bodies
```

The UI labels the aggregate as ratings rather than implying every aggregate rating has a local written review.

## Authentication-aware booking

The booking card has three account modes.

### Anonymous

The user sees the starting catalogue price and a sign-in action.

The sign-in URL includes a guarded internal `returnTo` path.

After login or signup the user returns to the same property/search context rather than being redirected away from the booking journey.

`returnTo` is restricted to same-application paths and rejects protocol-relative/external destinations.

### USER

The booking card loads:

```
GET /api/v1/pets
```

and allows selection only from active pet profiles owned by the current account.

### PARTNER / ADMIN

Partner/admin sessions cannot use the customer booking form.

The frontend mirrors the backend role boundary instead of letting those accounts attempt customer reservations.

## Quote

The browser sends only:

- room type ID,
- check-in,
- check-out,
- guest count,
- owned pet IDs.

It sends those to:

```
POST /api/v1/bookings/quote
```

The frontend does not calculate a trusted total.

The quote shown in the UI is the authoritative server response containing:

- nightly subtotal,
- pet fee,
- service fee,
- configured tax,
- discount snapshot,
- total,
- number of nights.

Any change to room, dates, guests or selected pets immediately invalidates the displayed quote.

## Booking creation

After a current quote exists, the user can confirm through:

```
POST /api/v1/bookings
```

The same booking payload is sent again.

The backend deliberately recomputes all rules and prices inside its serializable transaction.

The quote is therefore a user-facing preview, not a reservation lock.

## Browser idempotency

For booking creation, the frontend generates:

```
Idempotency-Key: web-<random UUID>
```

The key is retained for retries of the same unchanged booking payload.

If the payload changes, the browser discards that key and creates a new one.

This complements the backend's:

- per-user idempotency constraint,
- request fingerprint,
- serializable transaction,
- nightly reservation ledger.

A failed network response can therefore be safely retried without intentionally creating another reservation.

## Confirmation semantics

Successful booking displays:

- booking reference,
- travel dates,
- whether the response was an idempotent replay.

The wording says reservation/inventory is confirmed.

It does not claim payment was captured because payment-provider integration is not implemented.

## Auth-state isolation

Booking-specific state is cleared when the authenticated user/session identity changes.

This prevents:

- selected pet IDs,
- quotes,
- booking confirmations,
- idempotency keys

from being reused across different signed-in users in the same browser session.

## Business date

Minimum booking date is calculated server-side against:

```
Asia/Kolkata
```

using date parts, matching the Phase 7 backend business-calendar rule.

The browser's local timezone is not treated as the booking authority.

## Loading behavior

Dedicated loading surfaces exist for:

- stay search,
- property detail.

They use content-shaped skeletons reflecting the actual page structure.

## Phase boundary

Phase 11 does not implement the full account-management frontend.

A pet parent with existing pet profiles can complete the public booking flow now.

Creating/editing pet profiles, trip management, favourites, review management, and the full partner/admin operational interfaces are Phase 12.

## Verification status

Phase 11 is source complete.

The current execution environment still cannot perform the clean external dependency installation required to run:

- `next build`,
- browser rendering verification,
- end-to-end booking interaction tests,
- automated accessibility tests.

No runtime-pass claim is being made until those checks are actually executed.
