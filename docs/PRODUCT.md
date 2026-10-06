# Product Specification

## Product promise

Purrfect Stays makes pet travel bookable without forcing pet parents to call every property and verify policies manually.

The system must answer four questions reliably:

1. **Can my specific pet stay here?**
2. **What pet facilities are actually available?**
3. **What will the complete booking cost?**
4. **What happens from reservation through completion/cancellation?**

## Core actors

### Pet parent
Can create an account, maintain one or more pet profiles, search properties, inspect pet policies, save favourites, book stays, manage trips and review completed stays.

### Property partner
Can manage owned properties, room inventory, pet policies, amenities, blackout dates and booking operations.

### Platform admin
Can moderate properties, verify listings, manage users/partners and inspect operational state.

## Core domains

### Identity
- User
- Role
- Session / refresh token
- Account status

### Pets
- Pet profile
- Species
- Breed
- Size
- Weight
- Age
- Vaccination status
- Special requirements

### Catalogue
- Property
- Property image
- Property type
- Address / destination
- Amenity
- Pet policy
- Verification status
- Room type
- Room inventory

### Discovery
- Destination
- Date range
- Guest count
- Pet count
- Species
- Pet size
- Amenities
- Property type
- Price range
- Rating
- Sort order

### Booking
- Availability
- Quote
- Base price
- Pet fee
- taxes/fees
- Booking
- Booking guest/pet snapshot
- Status transitions
- Cancellation

### Trust
- Review
- Rating
- Favourite
- Property verification state

## Booking state model

```
PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED
   |          |
   +------> CANCELLED
```

Invalid state transitions must be rejected in the domain/service layer, not only hidden in the UI.

## Search semantics

Search results must be driven by database data rather than hard-coded cards. A property is eligible only when:
- it is published and active,
- the requested room/date combination has inventory,
- the pet count does not exceed policy limits,
- requested pet species/size is allowed,
- filters match.

## Pricing semantics

The backend is authoritative for quotes.

```
subtotal = nightly_rate * nights
pet_fee = configured_pet_fee * pets * applicable_units
tax = tax_rule(subtotal + taxable_fees)
total = subtotal + pet_fee + service_fee + tax - discounts
```

The browser must never be trusted to submit the final amount.

## Initial feature scope

### MVP / production core
- Registration/login
- Role-based access control
- Multiple pet profiles
- Property catalogue
- Search and filtering
- Property detail + pet policy
- Availability
- Server-generated quote
- Booking creation
- Booking history
- Cancellation rules
- Reviews after completed stays
- Favourites
- Partner property/inventory management
- Admin verification workflow
- Seed/demo dataset

### Post-core platform layers
These remain architecturally possible but are not represented as live until actually implemented:
- AI pet-property match score
- wearable/GPS integrations
- automated property certification from CV/NLP
- pet-safe transport marketplace
- grooming/vet commerce marketplace
- partner messaging

## Non-functional requirements

### Security
- Password hashes use Argon2id.
- Short-lived access tokens.
- Refresh-token rotation with hashed refresh-token persistence.
- Rate limits on auth-sensitive routes.
- Zod/class-validator validation at every external boundary.
- Centralized authorization checks.
- No pricing authority in the frontend.

### Reliability
- Database constraints backstop application rules.
- Idempotency support for booking creation.
- Transaction boundaries around inventory-sensitive booking operations.
- Structured error responses.
- Health/readiness endpoints.

### Maintainability
- Controllers remain thin.
- Domain/application services own business decisions.
- Database access is isolated through Prisma-backed services/repositories.
- Shared frontend/backend request contracts live in `packages/contracts`.

### Performance
- Indexed destination/property/status/date fields.
- Pagination on collection routes.
- Redis-compatible caching layer for read-heavy catalogue endpoints.
- No unbounded list endpoints.
