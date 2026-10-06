# Authentication & Session Security

## Architecture

Purrfect Stays uses two credentials with different responsibilities:

### Access token
- short-lived JWT,
- signed with HS256,
- contains `sub` (user ID), `sid` (session ID), role and email,
- validated for issuer, audience, algorithm and expiration,
- sent by the web client as `Authorization: Bearer <token>`.

### Refresh token
- 48 cryptographically random bytes encoded as base64url,
- opaque: it contains no user/session data,
- delivered only through an `HttpOnly` cookie,
- only its SHA-256 hash is persisted,
- rotated on every successful refresh,
- grouped into a refresh-token family for replay detection.

The raw refresh token is never stored in PostgreSQL.

## Password security

Passwords are hashed with Argon2id.

Current parameters:
- memory: 19,456 KiB,
- iterations: 2,
- parallelism: 1.

Public registration requires:
- 12–128 characters,
- lowercase,
- uppercase,
- numeric,
- symbol.

Login failure returns the same external error for unknown users, incorrect passwords and inactive accounts. Unknown-user attempts still perform comparable Argon2 work to reduce simple timing-based email enumeration.

## Refresh rotation and replay detection

A login or registration creates a new refresh-token family.

On refresh:

1. Hash the presented refresh token.
2. Look up the exact stored token hash.
3. Reject missing or expired sessions.
4. If the token is already revoked, treat it as possible replay.
5. Revoke every still-active token in that token family.
6. Otherwise create a replacement session in the same family.
7. Mark the previous session `ROTATED`.
8. Return a new access token and replace the refresh cookie.

Rotation runs inside a serializable PostgreSQL transaction.

This intentionally uses strict replay detection. Two concurrent refreshes using the same old token may cause the second request to invalidate that family; clients should perform refresh as a single-flight operation.

## Protected-request validation

Authentication is deny-by-default via global Nest guards.

A protected request must have:

1. a valid Bearer JWT,
2. a valid JWT signature/issuer/audience/expiry,
3. a backing refresh-session record matching the JWT `sid`,
4. an unrevoked and unexpired session,
5. an ACTIVE user account.

This means revoking a session immediately invalidates access using its JWT instead of waiting for the access-token expiry.

## RBAC

Available roles:
- `USER`
- `PARTNER`
- `ADMIN`

Public registration always creates `USER`.

Feature controllers can require roles with:

```ts
@Roles('PARTNER', 'ADMIN')
```

The role guard reads the current database-backed user role rather than trusting the JWT role claim as the final authorization source.

## Endpoints

### Public
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Authenticated
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:sessionId`

## Refresh cookie

Default name:
`purrfect_refresh`

Properties:
- `HttpOnly`
- `Secure` in production
- `SameSite=Lax`
- path restricted to the API auth subtree

The intended production topology is a web app and API on the same registrable site, for example `app.example.com` + `api.example.com`. If a future deployment places them on unrelated sites, the cookie/CSRF strategy must be changed deliberately rather than simply switching to `SameSite=None`.

## Rate limiting

Current default:
- API: 120 requests/minute per tracked client
- registration: 5/minute
- login: 8/minute
- refresh: 20/minute

Health endpoints are excluded.

The current Nest throttler storage is in-process. It is valid for a single API instance. Before multi-instance production release, Phase 13 will move shared rate-limit state to Redis.

## Client rules

The frontend must:
- keep the access token in application memory rather than localStorage,
- send requests with `credentials: 'include'` where refresh/logout cookie handling is required,
- serialize refresh attempts so only one refresh request is active per browser session,
- clear in-memory auth state on refresh failure,
- never attempt to read the HttpOnly refresh cookie.

## Environment

Required auth-related configuration:

```
JWT_ACCESS_SECRET=<strong random secret, minimum 32 chars>
JWT_ACCESS_TTL=15m
JWT_ISSUER=purrfect-api
JWT_AUDIENCE=purrfect-web
REFRESH_TOKEN_TTL=30d
REFRESH_COOKIE_NAME=purrfect_refresh
```

Do not reuse development secrets in production.
