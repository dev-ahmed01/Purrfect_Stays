# Frontend Foundation

Phase 10 turns the original static Purrfect Stays prototype into a reusable Next.js application system.

## Design contract

The implementation preserves the original visual identity:

- Playfair Display for display typography,
- DM Sans for product UI,
- coral primary actions,
- warm off-white/beige surfaces,
- sage supporting states,
- soft rounded cards,
- low-contrast warm borders,
- restrained shadows,
- calm travel-oriented hierarchy.

The palette remains anchored to:

```
#E67E5F coral
#C96245 coral dark
#F8F3EC beige
#9CAF88 sage
#D9A441 mustard
#2F2F2F charcoal
#6E6A66 warm gray
#FFFDF9 off-white
```

## Next.js structure

The frontend continues to use the App Router.

Server Components remain the default.

Client Components are used only where browser state or navigation hooks are required, including:

- authentication/session state,
- responsive mobile navigation,
- workspace route highlighting,
- interactive filters/buttons,
- login/signup form submission.

The root layout keeps font loading through `next/font`.

## Auth client

`AuthProvider` owns browser authentication state.

Access tokens:

- exist only in memory,
- are never persisted to `localStorage` or `sessionStorage`,
- are attached as Bearer tokens to authenticated API requests.

Refresh sessions:

- continue to use the backend's HttpOnly refresh cookie,
- are refreshed with `credentials: include`,
- use a single-flight refresh promise so simultaneous 401 responses do not trigger competing refresh rotations.

Authenticated API requests:

1. send the current in-memory access token,
2. if the API returns 401, attempt one refresh,
3. retry the original request once when refresh succeeds,
4. return to anonymous state if refresh fails.

This matches the backend refresh-rotation model and avoids multiple browser refresh calls replaying the same rotated token.

## Login and signup

```
/login
/signup
```

Both are connected to the real backend auth endpoints.

The forms reuse shared Zod contracts from `@purrfect/contracts` before submission.

Successful authentication redirects by role:

```
USER    -> /account
PARTNER -> /partner
ADMIN   -> /admin
```

Authentication errors use the API's human-readable error response.

## Application shells

Three protected workspace roots now exist:

```
/account
/partner
/admin
```

Each uses:

- `RoleGate`,
- `AppShell`,
- shared sidebar/topbar structure,
- role-specific navigation,
- account identity display,
- sign-out action,
- return-to-public-site action.

Unauthorized roles do not render the protected workspace content.

Current shell routes are the reusable foundation; domain-rich account and partner data screens are added in Phase 12.

## Public navigation

The public header is:

- sticky,
- translucent,
- responsive,
- keyboard accessible,
- role-aware after session restoration.

Desktop navigation shows direct links.

Mobile uses an explicit menu button with `aria-expanded`.

Authenticated users receive a workspace action appropriate to their role.

## Reusable component vocabulary

Phase 10 now includes reusable implementations for:

- `BrandLogo`
- `Button`
- `Card`
- `CardHeader`
- `CardBody`
- `FieldFrame`
- `TextInput`
- `SelectInput`
- `TextArea`
- `StatusBadge`
- `Alert`
- `EmptyState`
- `Skeleton`
- `PageHeader`
- `DestinationCard`
- `PropertyCard`
- `RatingBadge`
- `AmenityBadge`
- `FilterPill`
- `BookingCardShell`
- `AuthCard`
- `AppShell`

The discovery/detail flows in Phase 11 should compose these primitives rather than recreate visual patterns.

## Property images

`PropertyCard` uses `next/image`.

The current seeded catalogue uses HTTPS Unsplash assets, so:

```
images.unsplash.com
```

is explicitly allowed through `next.config.ts`.

Remote images have responsive `sizes` and a visual fallback.

Future partner-uploaded image domains must be explicitly reviewed/configured rather than enabling unrestricted remote hosts.

## Global states

App Router UI states now include:

- `loading.tsx`
- `error.tsx`
- `not-found.tsx`

Loading uses content-shaped skeletons rather than a full-screen spinner.

Errors explain that data is safe and provide a retry action.

Not-found content returns users to the product rather than exposing a generic framework page.

## Accessibility

The frontend foundation includes:

- a skip-to-content link,
- stable `main#main-content` landmarks,
- visible focus states,
- semantic button/link controls,
- accessible mobile navigation state,
- form labels and inline validation messages,
- status/error roles,
- meaningful image alt text,
- reduced-motion support.

## Responsive behavior

The global stylesheet defines behavior for:

- desktop public navigation,
- mobile menu,
- stacked hero search,
- 3/2/1-column property grids,
- destination/service grid collapse,
- account/partner/admin sidebar transformation into compact mobile navigation,
- stacked page headers,
- single-column summary cards,
- mobile auth forms.

## Design tokens

The stylesheet now centralizes:

- brand colors,
- neutral colors,
- shadows,
- border colors,
- radii,
- content widths.

Future screens should use these tokens instead of introducing route-specific raw values unless a genuinely new semantic token is needed.

## Homepage

The homepage has been refactored onto the shared components.

It currently presents the seeded catalogue visual preview while preserving the supplied prototype hierarchy:

1. sticky navigation,
2. hero badge/headline,
3. search module,
4. catalogue highlights,
5. destinations,
6. featured stays,
7. trust reasons,
8. services,
9. branded footer.

The live database-driven home/search experience is implemented in Phase 11.

## Verification status

Source-level frontend architecture is complete.

A clean `pnpm install`, `next build`, browser rendering pass and automated accessibility/browser checks have not yet been executed in the current execution environment because external package installation remains unavailable.

Phase 10 must therefore be read as **source complete**, not runtime-verified.
