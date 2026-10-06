# Demo seed data

The development seed is deterministic and intentionally refuses to run when `NODE_ENV=production`.

## Accounts created

- `admin@purrfect.local` — ADMIN
- `partner@purrfect.local` — PARTNER
- `ananya@purrfect.local` — USER

The password is **not stored in the repository**. Before seeding, set a local `SEED_DEMO_PASSWORD` value with at least 12 characters. The seed hashes it with Argon2id.

## Catalogue

The seed creates the eight stays represented by the original prototype:

- The Paw Villa — Goa
- Forest Paws Homestay — Coorg
- Snow Peaks Pet Resort — Manali
- Nilgiri Nature Stay — Ooty
- Haveli Paws — Jaipur
- Seaside Whiskers Cottage — Pondicherry
- Munnar Mist Retreat — Munnar
- Pawsome Beach Shack — Varkala

Each property receives a structured pet policy, verified amenities, a primary room type, 90 days of date-level room inventory, a verification audit record and a representative image.

The seed also creates Bruno (a Golden Retriever), a completed booking, a published review and a favourite so pet-profile, booking-history and trust flows have usable data immediately.

## Run

```bash
cp .env.example .env
# fill DATABASE_URL, JWT secrets and SEED_DEMO_PASSWORD
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The first migration is generated from `packages/database/prisma/schema.prisma` when database execution is available.
