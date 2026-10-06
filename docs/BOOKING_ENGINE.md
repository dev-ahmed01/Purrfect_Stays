# Booking, Pricing & Inventory Engine

Phase 7 implements the authoritative reservation path for Purrfect Stays.

## Customer endpoints

All booking endpoints require an authenticated `USER` role.

### Quote

```
POST /api/v1/bookings/quote
```

Body:

```json
{
  "roomTypeId": "uuid",
  "checkIn": "2026-12-10",
  "checkOut": "2026-12-13",
  "guests": 2,
  "petIds": ["uuid"]
}
```

A quote does **not** reserve inventory.

It validates:
- room is active,
- property is PUBLISHED + VERIFIED,
- room capacity,
- all pet IDs belong to the authenticated user,
- pet-count policy,
- species policy,
- size policy,
- breed allow/restriction rules,
- vaccination requirement,
- one inventory row per night,
- each inventory row is open and has capacity.

## Authoritative pricing

The server calculates all money values.

Nightly subtotal uses:

```
RoomInventory.nightlyRatePaise ?? RoomType.nightlyRatePaise
```

This means date-specific pricing overrides the base room rate when present.

Pet fee:

```
PER_STAY  = petFeePaise * petCount
PER_NIGHT = petFeePaise * petCount * nights
```

Service fee is currently one booking-level room service fee.

Tax:

```
taxable = subtotal + petFee + serviceFee
tax = round(taxable * BOOKING_TAX_RATE_BPS / 10000)
```

All values are persisted as integer paise.

`BOOKING_TAX_RATE_BPS` is a configurable platform pricing rule. The default demo value is `1200` (12%). It is not intended to represent a complete statutory tax engine; production tax configuration must be reviewed for the actual commercial model.

## Booking creation

```
POST /api/v1/bookings
Idempotency-Key: <client-generated-stable-key>
```

The request body is the same stay payload used for a quote.

Booking creation does **not** trust an earlier quote. Inside a PostgreSQL serializable transaction it repeats:

1. authenticated pet ownership,
2. pet-policy compatibility,
3. room/property eligibility,
4. full-night inventory availability,
5. current date-level rates,
6. current configured fees/tax,
7. conditional inventory reservation.

Only after those checks does the booking record get created.

## Idempotency semantics

Idempotency keys are scoped per user.

The database constraint is:

```
UNIQUE(userId, idempotencyKey)
```

The server also stores a SHA-256 request fingerprint.

### Same key + same request
Returns the already-created booking and:

```json
{
  "idempotentReplay": true
}
```

No inventory is reserved twice.

### Same key + different request
Returns HTTP 409 Conflict.

This also covers concurrent duplicate submissions: the serializable transaction and database uniqueness constraint provide the final backstop.

## Inventory reservation ledger

`RoomInventory.reservedUnits` is the fast aggregate counter.

Every booked night also creates:

```
BookingInventoryReservation(
  bookingId,
  roomInventoryId,
  createdAt,
  releasedAt
)
```

This gives each reservation an explicit nightly ownership record.

Benefits:
- cancellation releases the exact nights owned by the booking,
- the same booking cannot release inventory twice,
- reconciliation can compare ledger rows against aggregate counters,
- inventory rows with booking history cannot be silently deleted because the relation is restrictive.

## Booking state machine

Allowed core transitions:

```
PENDING   -> CONFIRMED | CANCELLED
CONFIRMED -> CHECKED_IN | CANCELLED
CHECKED_IN -> COMPLETED
COMPLETED -> no transition
CANCELLED -> no transition
```

Every state change is recorded in `BookingStatusEvent` with:
- previous status,
- next status,
- actor,
- reason,
- timestamp.

Customer-created bookings currently enter `CONFIRMED` immediately after inventory reservation.

**CONFIRMED means the stay reservation is confirmed. It does not claim that an external payment provider has captured funds.**

Partner check-in/completion operations will reuse the same state machine in the partner-management phase.

## Customer cancellation

```
POST /api/v1/bookings/:bookingId/cancel
```

Customers may cancel only:
- PENDING bookings,
- CONFIRMED bookings,
- before the India calendar check-in date.

Cancellation runs inside a serializable transaction:

1. verify booking belongs to the authenticated user,
2. verify status transition is allowed,
3. load unreleased nightly reservation-ledger rows,
4. require exactly one row per booked night,
5. conditionally decrement each matching `RoomInventory.reservedUnits`,
6. mark each reservation-ledger row released,
7. append a CANCELLED status event,
8. update the booking status and cancellation timestamp.

If the inventory ledger does not reconcile, the transaction aborts and the booking remains unchanged.

Repeated cancellation of an already-cancelled booking is idempotent and returns the existing cancelled booking.

## Booking history

```
GET /api/v1/bookings
GET /api/v1/bookings/:bookingId
```

List supports:
- bounded pagination,
- optional status filter.

Users can only read their own bookings.

Responses include:
- property snapshot reference,
- room type,
- booked pet snapshots,
- price breakdown,
- lifecycle timestamps,
- status-event history.

Booking pets are snapshots, so a later edit to a pet profile does not rewrite historical booking evidence.

## Business date

The product currently operates in India, so past-date and same-day cancellation rules use the `Asia/Kolkata` business calendar rather than the host server's local timezone.

## Concurrency guarantees

The booking path uses:
- PostgreSQL SERIALIZABLE isolation,
- bounded retry on transaction-conflict error `P2034`,
- conditional inventory increments,
- per-user idempotency,
- request fingerprints,
- a nightly ownership ledger.

A catalogue search can say a room is available, but only a successful booking transaction reserves it.
