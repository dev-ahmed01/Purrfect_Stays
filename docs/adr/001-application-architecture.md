# Architecture Decision Record 001 — Application Shape

## Status
Accepted for implementation.

## Decision

Use a TypeScript monorepo with:
- **Next.js App Router** for the customer/partner web application.
- **NestJS** for the backend API.
- **PostgreSQL** as the transactional source of truth.
- **Prisma** for relational schema and migrations.
- **Redis** for caching, rate-limit support and future jobs.
- **Zod** shared contracts where client/server types should agree.
- **pnpm workspaces** for dependency management.

## Why not a frontend-only Next.js app?

The product has meaningful backend invariants: availability, pet-policy compatibility, quote calculation, booking transitions, partner ownership and authorization. A dedicated API makes these boundaries explicit and gives the project a backend architecture that can evolve independently of the UI.

## Backend layering

```
HTTP controller
  -> application service
      -> domain rules
          -> database/cache adapters
```

Controllers translate transport concerns. Services orchestrate use cases. Database code does not decide business policy.

## Main API modules

- auth
- users
- pets
- properties
- amenities
- search
- bookings
- reviews
- favourites
- partner
- admin
- health

## Data ownership

PostgreSQL is authoritative for:
- users
- pets
- properties/policies
- rooms/inventory
- bookings
- reviews
- favourites
- session/token metadata

Redis is never the only copy of critical booking data.

## Deployment shape

The web and API are independently deployable. Local development uses Docker Compose for PostgreSQL and Redis.

## Future extensions

The architecture deliberately leaves seams for:
- payment provider integration,
- object storage for property media,
- background jobs,
- search engine integration,
- AI match scoring,
- partner messaging,
- certification workflows.
