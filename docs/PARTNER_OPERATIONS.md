# Partner & Property Operations

Phase 9 implements the operational backend for property partners and listing review.

## Roles

Partner routes require:

```
PARTNER
```

Listing-review routes require:

```
ADMIN
```

Every partner property, room, inventory and booking query is ownership-scoped in the API. A partner cannot read or mutate another partner's resources by supplying an ID.

---

## Partner dashboard

```
GET /api/v1/partner/dashboard
```

Returns:

- property counts by lifecycle state,
- upcoming confirmed stays,
- currently checked-in stays,
- arrivals today,
- departures today,
- total reservation value,
- next five arrivals,
- current India business date.

`reservationValue` is the sum of reservation totals for confirmed, checked-in and completed bookings. It is deliberately **not called payment revenue** because no payment processor has been integrated yet.

---

## Property lifecycle

The authoritative state machine is:

```
DRAFT
  -> PENDING_REVIEW

PENDING_REVIEW
  -> DRAFT
  -> PUBLISHED

PUBLISHED
  -> DRAFT
  -> SUSPENDED

SUSPENDED
  -> PUBLISHED
```

Every transition writes a `PropertyStatusEvent` containing:

- previous status,
- next status,
- actor,
- reason,
- timestamp.

Verification decisions remain separately recorded in `PropertyVerification`.

### Why listing claims are draft-only

These partner-controlled claims may only be changed while a property is `DRAFT`:

- property identity and description,
- address/location metadata,
- pet policy,
- images,
- claimed amenities.

A published listing must be withdrawn to draft before these claims can change.

That intentionally prevents a partner from obtaining verification and then silently replacing verified claims while remaining public.

Room pricing and calendar inventory are operational data and can continue to change on a published listing.

`PENDING_REVIEW` freezes room definitions as well, giving the administrator a stable listing definition to review.

---

## Property CRUD

```
GET    /api/v1/partner/properties
POST   /api/v1/partner/properties
GET    /api/v1/partner/properties/:propertyId
PATCH  /api/v1/partner/properties/:propertyId
DELETE /api/v1/partner/properties/:propertyId
```

New listings begin:

```
status = DRAFT
verificationStatus = UNVERIFIED
```

Slugs are generated server-side and remain stable when a property name changes.

A draft can only be physically deleted when it has no booking history. Properties with booking history are preserved for referential/audit integrity.

---

## Withdraw and resubmit

```
POST /api/v1/partner/properties/:propertyId/withdraw
POST /api/v1/partner/properties/:propertyId/submit
```

Withdrawal moves either:

```
PUBLISHED -> DRAFT
PENDING_REVIEW -> DRAFT
```

and sets current verification state back to `UNVERIFIED`.

The listing remains historically auditable through status/verification events.

Submission performs readiness checks before moving:

```
DRAFT -> PENDING_REVIEW
```

Required publication readiness:

- structured pet policy,
- at least one property image,
- at least one active room type,
- at least one open future inventory row.

Admin approval rechecks readiness inside the approval transaction.

---

## Pet policy management

```
PUT /api/v1/partner/properties/:propertyId/pet-policy
```

Partners configure:

- maximum pets,
- pet fee amount in paise,
- fee mode: `PER_STAY` or `PER_NIGHT`,
- supported species,
- allowed sizes,
- normalized allowed-breed keys,
- normalized restricted-breed keys,
- vaccination requirement,
- policy notes.

A breed cannot appear in both allow and restriction lists.

At least one species must be supported.

This data feeds the authoritative Phase 7 quote/booking compatibility engine.

---

## Images

```
PUT /api/v1/partner/properties/:propertyId/images
```

The endpoint replaces the ordered image collection atomically.

Current source accepts a maximum of 12 **HTTPS image URLs** with alt text.

This is metadata/media-reference management, not an object-storage upload service. Direct binary media upload/storage is not represented as implemented.

---

## Amenities

Available platform amenities:

```
GET /api/v1/partner/amenities
```

Partner claims:

```
PUT /api/v1/partner/properties/:propertyId/amenities
```

Partners can only select amenities that already exist in the platform amenity catalogue.

New/replaced claims have:

```
verifiedAt = null
```

They therefore cannot appear in the public verified-amenity catalogue merely because a partner selected them.

When an admin approves the submitted listing, the current claimed amenities are marked verified in the same approval transaction.

Admin rejection clears verification on the claims.

---

## Room types

```
POST  /api/v1/partner/properties/:propertyId/room-types
PATCH /api/v1/partner/room-types/:roomTypeId
```

Room type fields:

- name,
- description,
- guest capacity,
- default total units,
- default nightly rate,
- booking-level service fee,
- active/inactive state.

Room types use soft operational deactivation rather than destructive deletion.

When active room rates/states change, `Property.startingPricePaise` is recalculated from the minimum active base room rate inside the same serializable transaction.

If no active room types remain:

```
startingPricePaise = 0
```

and the existing public-catalogue rule requiring an active room type prevents the listing from being returned publicly.

### Room total vs date inventory

`RoomType.totalUnits` is the default used for newly created calendar rows.

Existing `RoomInventory.totalUnits` values remain date-specific and are not silently overwritten when the room-type default changes.

A room-type total cannot be lowered below units already reserved on any existing inventory row.

---

## Inventory calendar

Read:

```
GET /api/v1/partner/room-types/:roomTypeId/inventory?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Write:

```
PUT /api/v1/partner/room-types/:roomTypeId/inventory
```

Read ranges are limited to 366 days.

A write request can update up to 366 unique dates atomically.

Per-date controls:

- total units,
- nightly-rate override,
- closed/open state.

Rules:

- past inventory cannot be changed,
- total units cannot be lower than already-reserved units,
- new calendar rows default to the room type's current total units,
- closing a date prevents new booking availability but does not destroy existing reservations,
- `reservedUnits` is never accepted from partner input.

Partner inventory operations use serializable transactions and therefore compete safely with the Phase 7 booking transaction.

---

## Partner bookings

```
GET   /api/v1/partner/bookings
GET   /api/v1/partner/bookings/:bookingId
PATCH /api/v1/partner/bookings/:bookingId/status
```

Partner reads only return bookings attached to properties owned by the authenticated partner.

The operational view includes guest:

- name,
- email,
- phone,

because those details are required to service an existing reservation.

It does not expose booking idempotency fingerprints or internal authentication/session data.

Filtering supports:

- booking status,
- owned property,
- date overlap,
- bounded pagination.

---

## Operational booking transitions

Partners can request only:

```
CONFIRMED -> CHECKED_IN
CHECKED_IN -> COMPLETED
```

The shared booking state machine remains authoritative.

### Check-in gate

Check-in can be recorded only:

```
businessDate >= checkIn
businessDate < checkOut
```

### Completion gate

Completion can be recorded only:

```
businessDate >= checkOut
```

The business calendar uses `Asia/Kolkata`.

Each transition creates a `BookingStatusEvent` containing the partner actor and optional reason.

---

## Admin listing queue

Default queue:

```
GET /api/v1/admin/listings
```

With no explicit status, it defaults to:

```
PENDING_REVIEW
```

Admin detail:

```
GET /api/v1/admin/listings/:propertyId
```

The detail surface includes:

- partner identity/contact,
- listing content,
- pet policy,
- images,
- amenity claims and verification state,
- room types,
- status-event history,
- verification history.

---

## Approve / reject

```
POST /api/v1/admin/listings/:propertyId/decision
```

Approval requires:

```
status = PENDING_REVIEW
verificationStatus = PENDING
```

and re-runs publication readiness.

Approval transaction:

1. revalidate readiness,
2. verify current amenity claims,
3. append `PENDING_REVIEW -> PUBLISHED` status event,
4. append `VERIFIED` verification record,
5. set current status `PUBLISHED`,
6. set current verification `VERIFIED`,
7. set publication timestamp.

Rejection transaction:

1. unverify current amenity claims,
2. append `PENDING_REVIEW -> DRAFT` status event,
3. append `REJECTED` verification record,
4. return listing to draft,
5. clear publication timestamp.

Partners can edit a rejected draft and resubmit it.

---

## Suspend / restore

```
POST /api/v1/admin/listings/:propertyId/suspend
POST /api/v1/admin/listings/:propertyId/restore
```

Suspension:

```
PUBLISHED -> SUSPENDED
```

Immediately removes the property from the public catalogue because public discovery requires `PUBLISHED`.

Existing bookings remain intact.

Direct restoration is allowed only when the suspended listing still has current `VERIFIED` verification status and still satisfies publication readiness.

Restoration:

```
SUSPENDED -> PUBLISHED
```

is also recorded in the property lifecycle audit.

---

## Concurrency and trust

Important partner mutations use the same PostgreSQL SERIALIZABLE transaction helper used by booking flows.

This matters for:

- room-price updates racing booking creation,
- inventory edits racing inventory reservation,
- submission racing partner withdrawal,
- admin approval racing withdrawal,
- booking status transitions submitted concurrently.

The public catalogue remains a derived trusted surface. Partner-controlled draft claims do not become public merely because they exist in the database.
