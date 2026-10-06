# Backend Conventions

These conventions apply to every NestJS module in Purrfect Stays.

## 1. Request flow

```
HTTP request
  -> RequestIdMiddleware
  -> controller
  -> Zod validation pipe
  -> application service
  -> PrismaService / transaction
  -> response interceptors
```

Controllers translate transport concerns. Business rules belong in services. Database calls do not belong directly in controllers.

## 2. Request correlation

Every request receives an `x-request-id`.

- A valid caller-provided ID is preserved.
- Invalid or oversized IDs are replaced.
- Generated IDs use `crypto.randomUUID()`.
- The ID is echoed in the response header.
- `RequestContextService` stores it with `AsyncLocalStorage` so deeper services can correlate logs without passing IDs through every method.

Request bodies, passwords, tokens and cookies must never be written to request logs.

## 3. Success responses

Successful controller output is globally wrapped as:

```json
{
  "data": {},
  "requestId": "..."
}
```

Pagination stays inside the data payload:

```json
{
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "pageSize": 12,
      "totalItems": 0,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "requestId": "..."
}
```

## 4. Error responses

All errors use one external shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": []
  },
  "requestId": "...",
  "timestamp": "...",
  "path": "/api/v1/..."
}
```

Unexpected server errors return a generic message. Stack traces remain server-side.

Known Prisma cases are normalized:
- `P2002` -> HTTP 409 conflict
- `P2025` -> HTTP 404 not found
- `P2034` -> HTTP 409 transaction conflict

## 5. Validation

Use schemas from `@purrfect/contracts` wherever the browser and API share the same contract.

At controllers:

```ts
@Post()
create(
  @Body(new ZodValidationPipe(createPetSchema))
  input: CreatePetInput,
) {
  return this.petsService.create(input);
}
```

Do not trust frontend TypeScript types as validation.

## 6. Database transactions

Normal independent reads/writes can use `PrismaService` directly.

Inventory-sensitive workflows—especially booking creation and cancellation—must use:

```ts
prisma.serializable(async (tx) => {
  // check availability
  // reserve inventory
  // create booking
});
```

The helper runs at PostgreSQL serializable isolation and retries Prisma transaction-conflict error `P2034` with bounded exponential backoff.

External network calls must not run inside a database transaction.

## 7. Money

Persist money as integer paise.

Examples:
- ₹5,800.00 -> `580000`
- ₹500.00 -> `50000`

Never use JavaScript floating point as the source of truth for stored prices.

## 8. Pagination

No public collection endpoint may be unbounded.

Use:
- `toPrismaPagination()` for `skip/take`
- `buildPaginationMeta()` for response metadata

Default and maximum page sizes live in shared Zod contracts.

## 9. Health

- `GET /api/v1/health` is liveness and does not require the database.
- `GET /api/v1/health/ready` executes `SELECT 1` against PostgreSQL.

A deployment should only receive normal traffic when readiness succeeds.

## 10. Logging

HTTP completion logs include:
- request ID
- method
- path
- status code
- duration

Unexpected failures include safe exception metadata server-side.

Do not log:
- Authorization headers
- refresh/access tokens
- passwords
- raw request bodies
- payment credentials
- private pet/health notes unless a future explicit audit policy requires a redacted form.

## 11. Module boundaries

Feature modules should follow:

```
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  schemas or DTO adapters where needed
```

Split repositories only when query complexity or testing value justifies the extra layer. Avoid ceremonial abstractions that simply mirror Prisma one-to-one.

## 12. Authorization

Authentication and RBAC are implemented in Phase 5. Until then, no new endpoint should fake identity using a client-provided user ID.
