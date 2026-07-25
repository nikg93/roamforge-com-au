
# Roamforge — Read-Only Audit Report

Audit only. No code changes proposed for execution; recommended fixes are described so you can approve a separate build-mode pass.

## A. Executive Summary

The site is fundamentally healthy: 200s on all core routes, valid canonicals, per-route titles/descriptions/OG, breadcrumb + product JSON-LD, correct branded 404 status, no console errors on content routes, no horizontal overflow at any of the six audited viewports, no images missing `alt`, no unnamed links or buttons, single `<main>` per route, consent banner correctly offset above the mobile sticky ATC.

Two real issues showed up, both **deployment-lag / catalogue-integrity** rather than code defects on HEAD:

1. **P1 — Live production is serving a stale build.** Deployment id `94215776…` still returns the R2 preview URL as `og:image` on 404 responses. The fix (branded `og-default.jpg` on `NotFoundComponent` + product-not-found `head()`) is present at HEAD `d260c86` but has not been redeployed.
2. **P1 — Stale internal links / bookmarks to renamed Shopify handles 404.** Example: `/product/ultimate9-evcx-throttle-controller` returns 404 (correct HTTP behavior) but the handle is likely still referenced from campaign links, social, or older indexed pages. Current sitemap only lists live handles, so Google will heal — but any hard-coded reference in code/marketing needs an audit.

Everything else in this report is P2/P3 (CRO, polish, incremental SEO).

## B. Current Production / Commit Verification

- Local HEAD: `d260c86` ("Update plan"). Recent commits `95860da`, `f586b24`, `eb038e3`, `2dc48f5`.
- Live `https://roamforge.com.au/` → HTTP 200, `x-deployment-id: 94215776304aace25279b19a1c35fbd5466e632f361ec311b49ec0dbed6192d3`, Cloudflare edge, HSTS on.
- Live `/no-such-page-xyz` → HTTP 404 (correct).
- `robots.txt` allows all + explicit `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `Sitemap: https://roamforge.com.au/sitemap.xml`.
- `sitemap.xml` lists /, /shop, all 10 categories, /faq, /contact, /privacy, /terms, /returns, /shipping, and ~60 product URLs.
- Evidence live build ≠ HEAD: 404 responses still emit `og:image = https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/…lovable.app…png` (the Lovable preview screenshot). HEAD's `src/routes/__root.tsx` NotFoundComponent and `src/routes/product.$handle.tsx` notFound `head()` both explicitly emit `https://roamforge.com.au/og-default.jpg`. Conclusion: the branded-404 OG fix is in code but not deployed.

## C. Critical Bugs to Fix (P0 / P1)

No P0. Two P1s.

### P1 — SEO — 404 pages leak Lovable R2 preview as og:image (deployment lag)

- Evidence: `curl` + Playwright on `/no-such-page-xyz` and `/product/ultimate9-evcx-throttle-controller` at all six viewports → `<meta property="og:image">` = `pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/…id-preview-d260c86f…lovable.app…png`.
- Impact: When a broken/removed link is shared on social, the preview shows a Lovable preview screenshot instead of the Roamforge fallback. Brand and trust loss.
- Root cause: Stale production deployment. Code at HEAD is correct.
- Fix: Redeploy HEAD `d260c86`. No code change required.
- Effort: S. Risk: none — same code as previously verified LIVE PASS.

### P1 — Catalogue — legacy handles 404 without redirects

- Evidence: `/product/ultimate9-evcx-throttle-controller` → 404, `noindex, follow`, branded 404 UI (correct behavior). Handle is no longer in Shopify or the sitemap; other handles under the same brand exist.
- Impact: Any legacy backlink, ad, social post, email, or Google index entry pointing at a renamed handle now hits a 404. No 301 redirect path in place. This is invisible in-site but bleeds paid/organic traffic externally.
- Fix: Build a lightweight redirect map (`src/lib/redirects.ts`) of `legacy-handle → new-handle`, applied either in `product.$handle.tsx` loader (throw `redirect({ to: '/product/$handle', params: … })`) or in a Cloudflare `_redirects` file. Populate from Shopify redirect list + a one-off crawl of previously-indexed handles.
- Effort: M. Risk: low if list is scoped; add unit test asserting each redirect resolves to a live handle.

## D. Prioritized Action Plan

| Priority | Item | Category | Effort |
|---|---|---|---|
| P1 | Redeploy HEAD `d260c86` so branded 404 og:image ships | SEO / BRAND | S |
| P1 | Build legacy-handle → current-handle 301 map | SEO / BUG | M |
| P2 | Homepage `<h1>` uses `sr-only` + `aria-hidden` split — SR-only text and visible text combine in `textContent`. SR behavior is correct (visible is aria-hidden), but Google's rendered snapshot indexes the concatenated string as the H1. Split into a single truthful visible H1 + separate visual treatment, or move brand tagline into `<p>`. | SEO | S |
| P2 | Drop hardcoded Klaviyo (`UwaEws`) and Meta Pixel (`1043681748196165`) fallbacks in `src/components/Integrations.tsx`; require env vars. Consent gating is correct, but fallbacks risk cross-project attribution if a fork/preview loads them. | PRIVACY | S |
| P2 | `/shop` and category pages: add visible sort control (Featured / Price ↑ / Price ↓ / Newest) — currently server-side merch-first only. | CRO / UX | M |
| P2 | Category pages: no visible product count above grid (e.g. "24 products"). Reduces perceived selection depth. | CRO | S |
| P2 | PDP: no "Free shipping over $X" badge on the ATC area. `FreeShippingBar` lives in cart drawer only. Move progress hint into PDP price block to raise AOV. | CRO | S |
| P2 | PDP: no visible review count/stars in product card even after Judge.me gating fix. Add empty-state "Be the first to review" instead of hiding entirely. | CRO / TRUST | S |
| P2 | Trust bar copy is generic ("Fast dispatch", etc.) — no concrete numbers, no icons. Adding "1–2 day dispatch from Melbourne" + "30-day returns" specifics raises trust. | CRO | S |
| P2 | Add `Product` structured-data `aggregateRating` only when real reviews exist; ensure `availability` maps correctly to `https://schema.org/InStock` / `OutOfStock` per selected variant. Currently the "min 100 in stock" UI override is client-only — check that JSON-LD `availability` reflects real Shopify `availableForSale`, not the UI override. | SEO | M |
| P3 | Sitemap has no `<lastmod>` at all. Adding real per-product `updatedAt` from Shopify (not build time) would help crawl prioritization. Do NOT set to build time. | SEO | M |
| P3 | Category OG images use hashed asset filenames (e.g. `cat-performance-new-DgVuqt5q.jpg`). Fine, but each is ~a full-bleed hero — verify all ≥1200×630 for X large-card previews. | SEO | S |
| P3 | Homepage hero `h-[420px] sm:h-[520px] lg:h-[620px]` with `object-cover` crops most of the vehicle scene on 360–430 widths. Consider `object-position: 30% center` on mobile. | UX | S |
| P3 | Sticky mobile ATC + consent banner + Tidio launcher stack in the same bottom-right corner on 360×800. Verify Tidio z-index and position don't cover the ATC on first-visit devices where consent granted Tidio. | UX / A11Y | S |
| P3 | No breadcrumb visible on `/shop` (only JSON-LD). Adding a visible `Home / Shop` crumb helps orientation on mobile. | SEO / UX | S |
| P3 | Return-focus on cart drawer close and search dialog close — verify with keyboard-only pass; shadcn primitives should handle this, but confirm after `NewsletterForm` autofocus in `WelcomePopup`. | A11Y | S |
| P3 | Font strategy: local fonts good. Verify `font-display: swap` and preload of the primary display face used in hero for LCP. | PERF | S |

## E. UI/UX & Conversion Findings

**Working well**
- Consistent Roamforge palette (`rf-dark`, `rf-cream`, `rf-tan`), display font on headings, generous whitespace, product cards uniform.
- Sticky mobile ATC lives at `bottom-[calc(96px+env(safe-area-inset-bottom))]` — respects notch and clears consent banner. Verified 360, 390, 430.
- Cart drawer has SHOP ALL CTA when empty; shipping bar present; live-region for busy state.
- Category hero + description + product grid pattern is predictable across all 10 categories.
- Homepage rails: Featured Gear (diversified), Trusted Brands, Popular Categories — good funnel structure.
- Contrast: `rf-cream` on `rf-dark` and vice versa comfortably above WCAG AA at tested sizes.

**Opportunities (CRO)**
- No visible sort/filter on `/shop` — 60+ SKUs in a single scrolling grid depresses PDP CTR on mobile.
- No "recently viewed" surface on PDP even though `RecentlyViewedRail` exists — verify it's mounted on PDP, not just homepage.
- Newsletter popup timing/frequency not audited from a cold session; confirm 3–5s delay + 30-day suppression cookie, and that it doesn't fire on `/cart` or during checkout handoff.
- Trust signals under ATC are generic; adding shipping ETA, returns window, and payment icons (Afterpay/PayPal/etc.) in a compact row would lift conversion on mobile.
- No "Complete the Kit" cross-sell visible on the audited PDP even though `CompleteTheKit` component exists — verify it's rendering on the PDPs that have `related-*` tags.

**Defects (UX)**
- None confirmed. No overflow, no dead controls, no broken images across the audited surface.

## F. SEO Findings

**Working well**
- Per-route unique `<title>` and `<meta name="description">` on /, /shop, /category/*, /faq.
- Canonical present and self-referential on all indexable routes.
- `og:image` per category = the category hero image (correct, absolute, on-domain).
- `robots: index, follow` on category pages, `noindex, follow` on 404s.
- BreadcrumbList + Product + Organization JSON-LD present (LD counts: 1 on /, 3 on /shop and categories, 1 on /faq, 1 on 404s).
- Sitemap valid XML, complete, references correct product handles, no `<lastmod>` (safe — no fake build-time stamps).
- Localised for `.com.au` — Australian domain, Australian copy, AUD pricing on Shopify.

**Issues**
- (P1) 404 og:image = Lovable R2 preview (see §C).
- (P2) Homepage `<h1>` splits SR text from visible text via `aria-hidden`. Google reads the concatenation `Premium 4WD accessories, recovery and touring gear in Australia — Forged for AdventureFORGEDFOR ADVENTURE` as the H1. Fine for SR users, ugly for indexed snippet.
- (P2) FAQ has FAQPage JSON-LD (added recently) — validate live via Rich Results Test once redeployed.
- (P3) No BreadcrumbList visible on `/shop` (only structured data). Google surfaces both.
- (P3) Sitemap missing `<lastmod>` on any URL; per policy do NOT add build-time — only add real per-product `updatedAt` from Shopify.
- (Actions requiring GSC/Merchant Center, not code): submit sitemap, verify Merchant listings for Product SD, monitor coverage for the renamed handles.

## G. Code / Performance / Accessibility Findings

**Code / Architecture**
- TanStack Start routing is idiomatic: `createFileRoute` paths match filenames, per-route `head()`, notFound handled at both route and root levels.
- Shopify client (`src/lib/shopify.ts`) filters queries with `available_for_sale:true` and has diversified featured logic — good.
- Cart store (`src/lib/cartStore.ts`) uses mutex + versioned persistence — resilient.
- Consent gating (`src/lib/analytics.ts`, `Integrations.tsx`) fires GA4/Meta/Klaviyo only after grant.
- QA scripts (`bun run qa`) chain format · lint · typecheck · unit · static · catalogue · build.

**Risks**
- Hardcoded ID fallbacks in `Integrations.tsx` — see §D P2.
- No middleware/301 layer for renamed Shopify handles.
- "Min 100 in stock" UI override in `ProductCard.tsx` / `product.$handle.tsx` deliberately diverges from real inventory. Verify JSON-LD `availability` uses real Shopify data, not the UI override, or Merchant Center will flag mismatches.

**Performance**
- Hero image marked `fetchPriority="high"` with `decoding="async"` — good LCP posture.
- Category images `object-cover`, sized responsively — no layout shift observed.
- Third-party scripts (GA4, Klaviyo, Meta, Tidio) gated on consent → CWV protected for first-visit bots.
- Suggest verifying total JS payload with `bun run build && du -sh dist/client/assets`.

**Accessibility**
- Landmarks: 1 `<main>` per route. `<nav>` count = 1–2 (header + footer where applicable).
- No unnamed anchors, no unnamed buttons, no missing `alt` on any audited page.
- Skip link / `main-content` id present per earlier commits.
- Consent banner doesn't overlap sticky ATC.
- Focus management: shadcn Dialog/DropdownMenu → Radix (correct). Manual verification of return-focus on `WelcomePopup` autofocus recommended.

## H. Actionable Quick Wins (next 1–3 days)

1. **Redeploy HEAD `d260c86`** — restores branded 404 OG. Zero code change.
2. **Add legacy-handle 301 map** — capture at minimum: `ultimate9-evcx-throttle-controller` and any other handles referenced by Klaviyo/social campaigns. One file + one loader branch.
3. **Split homepage H1** — either single visible H1 with the real page heading, or move tagline into `<p>` so indexed snippet matches visible page.
4. **Strip hardcoded Klaviyo/Meta fallbacks** in `Integrations.tsx`; require env vars; log a dev warning when missing.
5. **Add visible product count + basic sort** to `/shop` and category pages.

## I. 30-Day Roadmap

- Week 1: Quick wins above + Merchant Center sanity check for Product SD `availability` alignment with real Shopify stock.
- Week 2: PDP conversion pass — Complete-the-Kit visibility check, free-shipping bar surfaced on PDP, payment-method row under ATC, "recently viewed" rail on PDP.
- Week 3: Reviews — Judge.me widget verification per PDP, `aggregateRating` in JSON-LD only when reviews render, empty-state CTA "Be the first to review".
- Week 4: Sitemap `<lastmod>` from real Shopify `updatedAt`, category filter/sort UI, image LCP audit with real device throttling.

## J. Verified Passes / What's Working

- HTTP: 200 on /, /shop, all 10 categories, /faq, valid PDPs. 404 on invalid PDPs and unknown routes.
- SEO: unique titles/descriptions, canonicals, per-route OG, per-route breadcrumb + product JSON-LD, robots.txt + sitemap.xml valid.
- A11Y: single `<main>`, all images have `alt`, no unnamed links/buttons, consent banner doesn't overlap sticky ATC, 44px touch targets on primary CTAs.
- Responsive: no horizontal overflow at 1440×900, 1024×768, 768×1024, 430×932, 390×844, 360×800 on any audited page.
- Console: no errors on content routes; only expected 404 network errors on invalid URLs.
- Consent + analytics gated correctly; cart drawer has empty-state CTA, shipping bar, live-region.
- Product catalogue integrity: `bun run qa`'s catalogue check has been passing for weeks; sitemap and grids only reference live handles.

---

Approve to switch to build mode and I'll implement P1 (redeploy nudge + legacy 301 map) plus the P2 quick wins in a single pass.
