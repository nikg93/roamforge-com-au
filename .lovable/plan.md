# Roamforge storefront repair — phased plan

The full scope is 10 workstreams. Attempting all at once is high-risk. I'll ship it in 4 phases, running format/lint/typecheck/build after each and a Playwright smoke sweep after phases 2 and 4.

## Phase 1 — Homepage, Shop All, nav (highest visible impact)

- Replace `/` hero: remove all TROLL3N/Patrol copy + `troll3n-real.jpg`. Neutral product-led hero using an existing category/lifestyle image; keep palette + typography.
- Add "SHOP THE RANGE" CTA linking to new `/shop` route.
- Add `src/routes/shop.tsx` — server-rendered first page of all Shopify products, cursor pagination, dedupe, visible load errors (reuse category page's loader shape).
- Add "Popular Gear" homepage section — real Shopify products (first N from a `query` like `available_for_sale:true` sorted by `BEST_SELLING`).
- Compact mobile category strip (horizontal scroll on `<md`, keep grid on `md+`).
- `SiteHeader`: add "Shop All" link; hide full nav until `xl:`, use hamburger + "More" collapse below. Enforce `min-h-11 min-w-11`, `focus-visible:ring` tokens sitewide.
- `SiteFooter`: audit links; only verified contact + Instagram; remove unsupported claims.
- Remove unsupported claims ("tested for…", delivery-time promises, payment guarantees) across home + footer copy.

## Phase 2 — Product cards + PDP

- `ProductCard`: already close; verify availability logic uses selected/first-available variant OR product-level `availableForSale`; ensure no nested `<button>` inside `<Link>`; add per-card busy state (already present); add responsive Shopify CDN `srcset`/`sizes`.
- `product.$handle.tsx`:
  - Multi-image gallery with thumbnail rail + arrow/swipe controls (keyboard-accessible).
  - Show compare-at strikethrough + savings.
  - Selected variant title + SKU + availability.
  - Fitment guidance derived ONLY from tags/description (no fabrication).
  - Sticky mobile add-to-cart bar (`md:hidden` bottom bar).
  - Related products (same first tag / vendor, exclude self).
  - No reviews UI.

## Phase 3 — Cart + Categories/Shop All hardening

- `cartStore`: wrap every mutation in try/catch with `sonner` toasts; on 404/expired-cart clear and recreate; add a simple in-store mutex (promise queue) so quantity spam serializes; surface currency; note "shipping calculated at checkout" in drawer.
- `CartDrawer`: `aria-live` region for errors; qty buttons 44×44; input labelled.
- `category.$slug.tsx` + new `/shop`: SSR initial page via loader (already ✓ for category), reset pagination on slug change (`useEffect` on slug resets `extra`/`cursor`/`hasNext`), dedupe by id (already ✓), visible load error (already ✓).

## Phase 4 — SEO, a11y, perf, privacy, QA

- SEO
  - Verify unique per-route metadata; absolute OG images already ✓ for categories — extend helper to PDP + shop.
  - JSON-LD: Organization + WebSite on `__root`, Product on PDP (omit `brand` when vendor empty), Breadcrumb on PDP + category, CollectionPage on category + `/shop`.
  - Sitemap: include `/shop` and all product handles (already paginated ✓); verify.
  - 404 route noindex (already ✓).
- A11y
  - Skip link in `__root`.
  - Confirm exactly one `<main>` per template (already ✓ on most; audit legal pages).
  - FAQ page H2 hierarchy check.
  - Global `@media (prefers-reduced-motion: reduce)` block in `styles.css`.
- Perf/privacy
  - Replace Google Fonts `<link>` with `@fontsource/*` local packages; drop remote font requests.
  - Consent gate: add a lightweight banner + `localStorage` `rf-consent` flag; only render `Integrations` (GA4/Klaviyo/Tidio scripts) when granted; add "Privacy preferences" link in footer opening the banner.
- QA infra
  - `package.json` scripts: `format:check`, `typecheck`, `qa:static` (format+lint+types), `qa:unit` (vitest run if config present; else no-op with message), `qa` (all).
  - `.github/workflows/quality.yml` running `bun install` + `bun run qa` + `bun run build`.

## Validation after each phase

`bun run format`, `bun run lint`, `bunx tsgo --noEmit`, `bun run build`. Playwright smoke sweep at desktop + 390px after phases 2 and 4 covering: home, search, `/shop`, `/category/performance`, one PDP (gallery + variant + add to cart), cart drawer open + qty + remove, checkout URL handoff (no order placed).

## Deferred / out of scope this pass

- Any product data changes in Shopify (Admin-only).
- Real review integration (needs an app — not fabricating).
- Custom-domain / DNS work.

## Approval

This is ~15–25 files across 4 phases. Please confirm you want me to execute all phases, or trim scope (e.g. Phase 1+2 only, or skip QA workflow if repo permissions block it).
