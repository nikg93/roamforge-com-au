# Roamforge Production Audit — 29 Jul 2026

Read-only. Evidence gathered with headless Chromium against https://roamforge.com.au at 1440x900, 768x1024 and 390x844, plus repository inspection at local HEAD `7323b8a`.

## Executive Summary

The storefront is in good shape structurally. All audited routes return correct status codes (`/`, `/shop`, `/category/lighting`, `/faq` = 200; `/nonexistent-page-xyz` = true 404 with `PAGE NOT FOUND` H1 and no canonical). No horizontal overflow at any of the three widths (`scrollWidth == clientWidth` = 1440/768/390 on every route). Zero JavaScript console errors or page errors across all runs — the only console 404 is the intentional not-found probe. The full purchase path works end to end: add-to-cart on `/product/ultimate9-led-light-bar-20-inch` opens the cart drawer with correct line item and total, and Checkout hands off to `https://xmszfz-pj.myshopify.com/checkouts/cn/...` in a new tab. GA4 is confirmed live — two `google-analytics.com/g/collect?v=2&tid=G-QGGYL7FRLG` hits observed, `typeof window.gtag === "function"`, dataLayer length 6.

SEO fundamentals are sound: unique titles/descriptions and canonicals per route, robots.txt allows all crawlers and advertises the sitemap, sitemap.xml is valid, and Product JSON-LD on PDPs now carries `shippingDetails` and `hasMerchantReturnPolicy` with no fabricated `aggregateRating`.

The remaining issues are conversion and polish, not stability. The two that cost money are the mobile consent banner obscuring the buy zone and the missing Meta Pixel.

## Critical Bugs to Fix

**P0 — Mobile consent banner covers the PDP purchase area.** At 390x844 on `/product/ultimate9-led-light-bar-20-inch`, the banner (`src/components/ConsentBanner.tsx:108`, `fixed inset-x-3 bottom-[calc(96px+env(safe-area-inset-bottom))]`) sits directly on top of the price, the "In Stock" line and the top of the description, stacked immediately above the sticky ADD TO CART bar. Roughly the bottom 40% of the first mobile viewport is consent UI. The same overlay hides the top of the Featured Gear rail on the homepage. Impact: high (first-view buy signal hidden on the dominant device). Effort: low.

**P1 — Meta Pixel is not firing in production.** `typeof window.fbq === "undefined"` on the live PDP; no `facebook.net`/`facebook.com/tr` requests observed. `src/components/Integrations.tsx:36` reads `VITE_META_PIXEL_ID`, which is unset in the production environment. The pixel ID `1043681748196165` was previously observed on the Shopify checkout. Impact: high (no Meta ad attribution or retargeting audiences). Effort: low.

## Prioritised Action Plan

### P1
1. **Consent banner placement** — mobile banner and sticky ATC compete for the same space; buttons also wrap to two lines ("REJECT ALL" over two lines at 390px). Reflow to a compact single-row bar docked below the ATC bar, or suppress the ATC bar while consent is open. Effort: low.
2. **Meta Pixel ID** — add the verified ID as an env value (or a public fallback in `src/lib/site.ts` alongside the GA4 pattern) so `fbq` initialises and PageView/AddToCart/InitiateCheckout fire. Effort: low.
3. **Sub-44px tap targets on mobile** — measured button heights on the PDP at 390px: `ADD TO CART` in the Complete-the-Kit rail = 36px, main in-page ADD TO CART = 40px (only the sticky bar reaches 44px). WCAG 2.5.8 / iOS guidance is 44px. Files: `src/components/ProductCard.tsx`, `src/components/CompleteTheKit.tsx`. Effort: low.

### P2
4. **Missing alt text on two recurring images** — the header logo (`/assets/logo-Cke_sw9X.png`) has an empty `alt` on every page at all three widths, and the category hero (`/assets/cat-lighting-D0rKd_C9.jpg`) has none on `/category/lighting`. Files: `src/components/SiteHeader.tsx`, `src/routes/category.$slug.tsx`. Effort: low.
5. **Duplicated H1/H2 on category pages** — `/category/lighting` renders `H1: LIGHTING` immediately followed by `H2: LIGHTING`. Thin duplication with no added keyword value; make the H2 descriptive (e.g. "Driving Lights, Light Bars & Wiring") or drop it. Effort: low.
6. **Category page titles are bare** — `LIGHTING — Roamforge` (shouty, no intent keywords) versus the strong homepage title. Rewrite as e.g. "4WD Driving Lights & Light Bars | Roamforge". Effort: low.
7. **Checkout domain is unbranded** — handoff lands on `xmszfz-pj.myshopify.com`, which reads as a different business at the moment of payment. Configuring a branded checkout domain in Shopify is a trust win. Effort: medium, external to the repo.

### P3
8. **`/shop` merchandising order** — the first products shown are `N70 Hilux Front Mount Intercooler`, `GU Patrol Radiator Shroud`, `GQ Patrol Airbox`, and three `Roamforge Adventure Planner` digital SKUs appear high in the grid, ahead of hero Lightforce and recovery stock. Reorder so flagship physical gear leads. Effort: medium.
9. **Internal linking depth** — PDP breadcrumb is `Home / Shop / <product>`; it skips the product's category, so category pages gain no internal link equity from PDPs. Effort: low.
10. **Homepage H1 renders as "FORGEDFOR ADVENTURE"** when the DOM text is concatenated (line-break markup with no space). Visually fine; assistive tech and any text-extraction read it as one word. Effort: low.

## Actionable Quick Wins

- Add `alt` to the header logo and the category hero image (2 files, ~5 minutes).
- Raise all `ADD TO CART` buttons to `min-h-11` (44px).
- Rewrite the nine category `head()` titles with search-intent keywords.
- Replace the duplicate category H2 with descriptive copy.
- Set the Meta Pixel ID so the already-written pixel code activates.
- Insert a non-breaking space (or `{" "}`) in the homepage H1 line break.

## Verified as passing (no action)

Route status codes and true 404; zero console/runtime errors; no horizontal overflow at 1440/768/390; canonical, robots.txt, sitemap.xml; unique per-route titles and meta descriptions; Product/BreadcrumbList JSON-LD with `shippingDetails` + `hasMerchantReturnPolicy` and no fabricated reviews; GA4 collect hits; cart drawer contents, totals, "Shipping calculated at checkout" disclosure, and Shopify checkout handoff.
