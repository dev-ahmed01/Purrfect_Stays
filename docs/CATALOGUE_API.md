# Catalogue & Search API

Phase 6 turns the original static stay cards into a database-backed public catalogue.

## Public endpoints

### Search stays

```
GET /api/v1/properties
```

Supported query parameters:

- `destination`
- `checkIn` — `YYYY-MM-DD`
- `checkOut` — `YYYY-MM-DD`
- `guests`
- `pets`
- `species` — `DOG | CAT | OTHER`
- `size` — `SMALL | MEDIUM | LARGE | EXTRA_LARGE`
- `breed` — normalized to lowercase for policy matching
- `propertyType`
- `minPrice` / `maxPrice` — rupees in the query string
- `minRating`
- `amenities` — comma-separated slug list or repeated values
- `sort` — `recommended | price_asc | price_desc | rating`
- `page`
- `pageSize`

Example:

```
GET /api/v1/properties?destination=Goa&checkIn=2026-12-10&checkOut=2026-12-13&guests=2&pets=1&species=DOG&size=LARGE&breed=golden%20retriever&amenities=pool,vet-nearby&sort=rating
```

## Catalogue trust boundary

A public property must satisfy all of the following:

- `status = PUBLISHED`
- `verificationStatus = VERIFIED`
- a structured pet policy exists
- at least one active room type exists

Unpublished or unverified partner data is never returned through the public catalogue.

Only amenities with a non-null `verifiedAt` are exposed publicly or used to satisfy amenity filters.

## Pet compatibility

Compatibility is evaluated against structured policy data.

### Species

The policy stores explicit support for:
- dogs,
- cats,
- other pet types.

### Size

The policy stores an allowed size list.

### Breed

Policies support:

- `allowedBreedKeys`
- `restrictedBreedKeys`

Both are normalized lowercase keys.

Compatibility rule:

1. a restricted breed never matches;
2. an empty allow-list means no breed-specific allow-list restriction;
3. a non-empty allow-list requires the requested breed to be present.

Public search registration/login data is not used to fake pet compatibility. Search operates only on explicit query criteria until user-pet profile integration is added.

## Amenity matching

When multiple amenities are requested, **all requested amenities must match**.

For example:

```
amenities=pool,vet-nearby
```

means the result must have both verified amenities.

## Calendar availability during search

If `checkIn` and `checkOut` are provided, search requires a single active room type to have:

- a `RoomInventory` row for every night,
- `closed = false`,
- `reservedUnits < totalUnits`,
- enough room capacity for the requested guest count.

The search window is capped at 60 nights.

This is a **discovery availability check**, not a reservation guarantee. Search and booking can race. Phase 7 rechecks inventory inside a serializable transaction before any reservation is created.

## Price semantics

`Property.startingPricePaise` is an indexed catalogue field used for:

- search result display,
- price sorting,
- catalogue price filters.

It represents the property's base starting price.

It is **not** the final payable price.

Phase 7 will calculate the authoritative quote from:

- date-level room rates,
- stay length,
- pet fees,
- service fees,
- tax,
- discounts.

All persisted money remains integer paise.

## Sorting

### recommended
1. featured first
2. rating descending
3. review count descending
4. name

### price ascending / descending
1. indexed starting price
2. rating
3. name

### rating
1. rating descending
2. review count descending
3. name

Stable tie-breakers are intentional so paginated results do not randomly reorder.

## Featured properties

```
GET /api/v1/properties/featured?limit=6
```

Returns verified, published featured stays only.

## Destinations

```
GET /api/v1/properties/destinations?limit=12
```

Returns city/state stay counts for the public catalogue.

## Search facets

```
GET /api/v1/properties/facets
```

Returns:

- verified amenity options,
- property-type counts,
- catalogue starting-price range.

The frontend should use this endpoint rather than hard-coding filters.

## Property detail

```
GET /api/v1/properties/:slug
```

Returns:

- public identity/location,
- complete image list,
- verified amenities,
- structured pet policy,
- breed policy metadata,
- active room types,
- base room prices and service fees.

Partner ownership, internal verification history, inventory reservation counts and other operational fields are intentionally excluded.
