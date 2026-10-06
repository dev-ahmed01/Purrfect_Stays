# Purrfect Stays

A full-stack pet-friendly travel platform for India.

> **Build status:** active development. The system is being implemented in numbered engineering phases. Product claims are kept separate from implemented capabilities.

## Product direction

Purrfect Stays helps pet parents discover, evaluate and book stays that are genuinely compatible with their pets. The core system is built around verified property policies, pet profiles, search/filtering, booking lifecycle management, reviews, favourites and partner operations.

The visual system intentionally preserves the supplied prototype's hierarchy and personality:
- Playfair Display for editorial/display typography
- DM Sans for product UI
- Coral primary actions
- Warm beige/off-white surfaces
- Sage and mustard supporting accents
- Rounded cards, soft borders and restrained shadows
- Spacious, calm travel-commerce layouts

## Architecture

This repository is structured as a production-oriented TypeScript monorepo:

```
apps/
  web/        Next.js App Router frontend
  api/        NestJS REST API
packages/
  database/   Prisma schema, migrations and seed data
  contracts/  Shared Zod schemas and API contracts
  config/     Shared TypeScript/ESLint configuration
docs/         Product and engineering documentation
```

Primary infrastructure:
- PostgreSQL — transactional source of truth
- Redis — cache, rate-limit primitives and asynchronous-work foundation
- Prisma — database access and migrations
- JWT access/refresh sessions with rotation
- Zod — input and shared contract validation
- Docker Compose — local PostgreSQL + Redis

## Engineering phases

1. Repository, requirements and design-system audit
2. Monorepo and production architecture foundation
3. Relational domain model, migrations and seed data
4. API platform foundation and cross-cutting backend concerns
5. Authentication, session security and RBAC
6. Property catalogue, pet policy and search
7. Booking, availability, pricing and booking lifecycle
8. Reviews, favourites and user pet profiles
9. Partner/property-management workflows
10. Frontend design system and application shell
11. Discovery, search, property detail and booking experience
12. Account, trips, pets and partner UI
13. Tests, security hardening, observability and failure handling
14. CI/CD, deployment configuration and release documentation

The phase count may be extended if an implementation area deserves its own engineering milestone rather than being compressed.

## Local development

Local commands will be activated as the scaffold lands in Phase 2.

## Product integrity

AI matching, wearable wellness integrations and dynamic certification are future platform layers. They will only be presented as implemented after their real services, data contracts and validation paths exist.
