# Account, Favourites & Review Trust

Phase 8 implements the customer-owned profile and trust layer for Purrfect Stays.

## Pet profiles

Customer endpoints require the authenticated `USER` role.

```
GET    /api/v1/pets
GET    /api/v1/pets/:petId
POST   /api/v1/pets
PATCH  /api/v1/pets/:petId
DELETE /api/v1/pets/:petId
```

Pet records include:

- name
- species
- breed
- size
- weight
- birth date
- vaccination state
- special-needs notes

All reads and mutations are scoped to the authenticated owner.

### Archive instead of destructive deletion

`DELETE /pets/:petId` archives the pet by setting `archivedAt`.

Archived pets:

- disappear from normal pet-profile lists,
- cannot be used for a new booking quote or reservation,
- remain referenced safely by historical booking records,
- do not rewrite any `BookingPet` snapshot.

Booking snapshots remain the historical source of truth for what pet details applied when a booking was created.

## Favourites

```
GET    /api/v1/favourites
POST   /api/v1/favourites/:propertyId
DELETE /api/v1/favourites/:propertyId
```

Saving a favourite is idempotent through the existing composite primary key:

```
(userId, propertyId)
```

A property can only be newly favourited if it is currently part of the public catalogue boundary:

- PUBLISHED,
- VERIFIED,
- structured pet policy present,
- at least one active room type.

Repeated save/remove actions do not create duplicate rows or fail unnecessarily.

If a previously saved property later becomes unavailable publicly, it is omitted from the returned favourites list without destroying the stored relationship.

## Review eligibility

```
POST /api/v1/reviews
```

A review is accepted only when:

1. the booking belongs to the authenticated user,
2. the booking status is `COMPLETED`,
3. that booking has no existing review.

The review's property is derived from the booking. The client cannot choose another property ID.

The database unique constraint on `Review.bookingId` is the final one-review-per-stay backstop, including concurrent submissions.

New reviews enter:

```
PENDING
```

They do not affect public rating aggregates until moderated to `PUBLISHED`.

## Customer review management

```
GET    /api/v1/reviews
PATCH  /api/v1/reviews/:reviewId
DELETE /api/v1/reviews/:reviewId
```

Users can only access their own reviews.

Editing any non-withdrawn review sends it back to `PENDING` and clears its prior moderation decision. If the review had been public, the property's rating aggregate is recomputed in the same serializable transaction.

Deleting a review is a soft withdrawal:

- status becomes `HIDDEN`,
- `deletedAt` is recorded,
- the review row remains tied to the completed booking,
- the same stay cannot be used to create a second review.

This preserves the one-review-per-stay integrity rule.

## Public property reviews

```
GET /api/v1/properties/:slug/reviews
```

Only reviews satisfying both conditions are returned:

- `status = PUBLISHED`
- `deletedAt IS NULL`

Public sorting supports:

- recent
- highest rating
- lowest rating

Author names are privacy-reduced to first name plus surname initial rather than returning account details.

The response summary uses the property's aggregate `averageRating` and `reviewCount`.

## Imported rating baseline

The original Purrfect Stays prototype already contains historical rating/count values for seeded properties.

Those values are preserved as:

- `ratingBaselineCount`
- `ratingBaselineTotal`

Locally stored published reviews are then combined with that baseline.

Conceptually:

```
publicReviewCount = baselineCount + localPublishedCount
publicRatingTotal = baselineTotal + sum(localPublishedRatings)
averageRating = publicRatingTotal / publicReviewCount
```

This prevents moderation of one locally stored review from accidentally turning an imported property with 126 historical ratings into a property with only one rating.

Because the imported baseline does not include individual review bodies, `reviewCount` can legitimately be greater than the number of text reviews retrievable from the local public-review endpoint.

## Admin moderation

Admin-only endpoints:

```
GET   /api/v1/admin/reviews
PATCH /api/v1/admin/reviews/:reviewId/moderate
```

Moderation actions support:

- `PUBLISHED`
- `HIDDEN`

Each decision records:

- moderator user ID,
- moderation timestamp,
- moderation note.

A review withdrawn by its author cannot later be republished by moderation.

## Transactional rating recomputation

Whenever a public-state transition changes whether a review contributes to ratings, the same serializable transaction:

1. changes the review state,
2. aggregates all locally published non-withdrawn reviews,
3. combines them with the imported rating baseline,
4. updates `Property.averageRating`,
5. updates `Property.reviewCount`.

This applies to:

- publishing a review,
- hiding a published review,
- editing a published review,
- author withdrawal of a published review.

Search/catalogue ranking therefore uses the updated aggregate fields without computing review averages on every property query.

## Trust boundary

The trust model now distinguishes three concepts clearly:

- a **favourite** means the customer saved a currently public property,
- a **review** means the customer has a completed booking for that stay,
- a **published review** means an admin moderation decision made that review public.

This prevents the UI from manufacturing ratings, reviews or pet ownership purely client-side.
