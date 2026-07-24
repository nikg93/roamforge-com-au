## Context found during inspection

- Klaviyo, GA4, Tidio, Judge.me, Meta Pixel — **no `VITE_*` identifiers are configured** in project secrets. Only Shopify + Lovable + Google Search Console keys exist. All UI will be built, but network activation for Klaviyo/GA4/Judge.me/Meta requires the user to add public IDs.
- Existing `Integrations.tsx` already consent-gates GA4/Klaviyo/Tidio script loaders.
- `cartStore.ts` has a serialised mutation queue + drawer state — good hook point for analytics.
- Homepage already has a "WHY" section with 5 tiles; I'll add a slimmer trust strip below the hero.
- No newsletter form, no popup, no recommendations, no recently-viewed, no analytics events, no shipping bar exist yet.

## Deliverables

### 1. Email capture

- `src/lib/klaviyo.ts` — thin client-side subscribe helper hitting Klaviyo's public `client/subscriptions` endpoint using `VITE_KLAVIYO_COMPANY_ID` + `VITE_KLAVIYO_NEWSLETTER_LIST_ID`. If either is missing → returns `{ ok: false, reason: "not-configured" }`; form shows an honest "Signups aren't wired up yet" error and never fakes success.
- `src/components/NewsletterForm.tsx` — branded form with email input, consent microcopy, aria-live success/error states, honeypot, marketing-consent gating.
- Add footer signup block in `SiteFooter.tsx`.
- `src/components/WelcomePopup.tsx` — mobile-first modal offering 10% off, shown once per visitor (localStorage flag), 12s delay + exit intent on desktop, dismissible, respects consent + Escape/focus trap via existing shadcn Dialog.

### 2. Trust & social proof

- `src/components/TrustStrip.tsx` — compact strip (Australian owned · Secure checkout · Trusted 4WD brands) rendered below hero.
- `src/components/MiniTrustRow.tsx` — smaller version near PDP Add-to-Cart.
- Judge.me: add `src/components/JudgeMeBadge.tsx` + `JudgeMeReviews.tsx` mount points guarded by `VITE_JUDGEME_SHOP_DOMAIN`+`VITE_JUDGEME_PUBLIC_TOKEN`. If missing, the component renders `null` (no fake empty stars).

### 3. Cart & AOV

- `src/lib/recommendations.ts` — pure ranking utility. Given a source product + candidate list, scores by shared `cat-*` tag, product type, then vendor. Never surface a "compatible with" claim unless the target's title/tags/desc references the source vendor or model token. Unit-tested.
- `src/components/CompleteTheKit.tsx` — rail rendering top 4 recommendations. Mounted in `CartDrawer.tsx` (recommendations for last-added item) and in `product.$handle.tsx`.
- `src/lib/recently-viewed.ts` — localStorage list (dedup, cap 12), SSR-safe.
- `src/components/RecentlyViewedRail.tsx` — mounted on PDP + shop + cart drawer when list non-empty.
- `src/components/FreeShippingBar.tsx` — progress bar; reads threshold from `VITE_FREE_SHIPPING_THRESHOLD_AUD`. If unset → renders `null`. Reported to user as a required business decision.

### 4. Analytics

- `src/lib/analytics.ts` — consent-aware event dispatcher: reads consent, buffers, pushes `gtag('event', ...)` for GA4, and `fbq('track', ...)` for Meta if `VITE_META_PIXEL_ID` is configured. Exports typed helpers: `trackViewItem`, `trackViewItemList`, `trackSelectItem`, `trackAddToCart`, `trackRemoveFromCart`, `trackViewCart`, `trackBeginCheckout`, `trackSearch`, `trackSignUp`.
- Wire into `ProductCard`, `product.$handle.tsx`, `shop.tsx`, `category.$slug.tsx`, `cartStore.ts`, `CartDrawer.tsx` (view + checkout), `SearchDialog.tsx`, `NewsletterForm.tsx`.
- Meta Pixel loader added to `Integrations.tsx` (marketing-consent gated), only when `VITE_META_PIXEL_ID` set.
- Purchase event: NOT tracked client-side (checkout is on Shopify). Documented — user must enable GA4 + Meta Pixel from Shopify admin (Online Store → Preferences / customer events).

### 5. Tests

- `tests/unit/recommendations.test.mjs` — scoring, tie-breaking, no cross-category leakage.
- `tests/unit/recently-viewed.test.mjs` — add, dedupe, cap.
- `tests/unit/analytics.test.mjs` — no fire when analytics consent denied, payload shape for each event.
- `tests/unit/newsletter.test.mjs` — Klaviyo helper reports `not-configured` when env missing; success payload shape when configured.
- Wire into `scripts/qa-unit.mjs`. Run `bun run qa`.

### Explicitly NOT doing

- No Shopify product edits.
- No publish.
- No fake reviews, fake stars, fake stock, fake shipping promises.
- No visual redesign — reuses existing rf-\* tokens.

## What will need user input at completion

- `VITE_KLAVIYO_COMPANY_ID` + `VITE_KLAVIYO_NEWSLETTER_LIST_ID` — enable newsletter.
- `VITE_GA4_MEASUREMENT_ID` — enable GA4 events (already scaffolded).
- `VITE_META_PIXEL_ID` — optional, enables Meta Pixel.
- `VITE_JUDGEME_SHOP_DOMAIN` + `VITE_JUDGEME_PUBLIC_TOKEN` — enable reviews.
- `VITE_FREE_SHIPPING_THRESHOLD_AUD` — business decision from user before shipping bar shows.
