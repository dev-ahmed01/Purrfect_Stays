# Purrfect Design System

This document converts the supplied HTML prototype into an implementation contract.

## Brand personality

Warm, trustworthy, calm and travel-oriented. The UI should feel closer to a boutique travel product than a generic admin template.

## Typography

### Display
**Playfair Display**
- Hero headlines
- Section titles
- Property-detail title
- Auth headline
- Brand wordmark

### Product UI
**DM Sans**
- Body copy
- Buttons
- Form controls
- Filters
- Price/meta text
- Navigation

Use `next/font/google` in the production frontend instead of runtime CSS `@import`.

## Colour tokens

```css
--coral:       #E67E5F;
--coral-dark:  #C96245;
--beige:       #F8F3EC;
--sage:        #9CAF88;
--mustard:     #D9A441;
--charcoal:    #2F2F2F;
--warm-gray:   #6E6A66;
--offwhite:    #FFFDF9;
--white:       #FFFFFF;
--border-warm: #F0ECE6;
```

## Layout principles

- Prefer generous whitespace over density.
- Main content width: roughly 1000–1200px depending on screen.
- Cards use soft 14–18px radii.
- Auth surfaces may use up to 24px radius.
- Shadows are low contrast and reserved for raised/interactive surfaces.
- Borders are warm neutral rather than grey-blue.
- Primary actions are coral.
- Supporting state colours remain desaturated.

## Hierarchy

### Home
1. Sticky navigation
2. Hero badge
3. Playfair headline with coral emphasis
4. Short supporting copy
5. Raised search module
6. Trust/stat strip
7. destinations
8. featured stays
9. trust reasons
10. pet services
11. reviews
12. dark footer

### Search/listings
- Warm beige filter header
- Compact pill controls
- Result count
- Responsive property grid

### Property detail
- Large visual gallery/hero
- Type + location eyebrow
- Playfair title
- rating + pet compatibility information
- policy and amenities
- sticky booking/quote panel

### Auth
- Beige background
- centered white card
- display-font heading
- compact forms
- rounded controls

## Component vocabulary

- `BrandLogo`
- `PrimaryButton`
- `OutlineButton`
- `SectionHeading`
- `SearchBar`
- `DestinationCard`
- `PropertyCard`
- `AmenityBadge`
- `RatingBadge`
- `FilterPill`
- `BookingCard`
- `FormField`
- `EmptyState`
- `StatusBadge`

## Interaction rules

- Hover movement is subtle: 3–5px maximum.
- Buttons change colour, not scale dramatically.
- Search/filter state must be reflected in the URL.
- Full cards may be clickable, but nested buttons must remain keyboard accessible.
- Visible focus rings are mandatory.
- Loading uses skeletons shaped like final content, not full-screen spinners.
- Errors are human-readable and located close to the action that failed.

## Responsive behaviour

- Mobile navigation collapses cleanly.
- Hero search becomes stacked fields.
- Property grid: 1 column mobile, 2 tablet, 3+ desktop where space allows.
- Property booking panel becomes inline below details on narrow screens.
- Filters move into an accessible drawer/sheet on mobile.

## What must not change

- Playfair + DM Sans pairing.
- Coral-led primary CTA identity.
- Warm off-white/beige visual system.
- Soft rounded travel cards.
- Calm, low-clutter hierarchy.
- Pet-first copy and visual cues.

## What will improve from the static prototype

- Real photography via `next/image`.
- Accessible semantic controls instead of clickable `div` elements.
- Reusable components instead of inline styles.
- URL-driven search state.
- Real API/database data.
- Real empty/loading/error states.
- Real form validation.
- Responsive and keyboard-complete behaviour.
