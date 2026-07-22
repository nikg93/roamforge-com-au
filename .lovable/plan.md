# Roamforge audit — HEAD + preview

Read-only audit. No files changed. Evidence is from source reads on HEAD and a Playwright pass at 1440×900 and 390×844 against `localhost:8080`, plus curl on `/sitemap.xml` and `/robots.txt`.

`768px` was not run in the browser sweep — only 1440 and 390 were. Tablet layout risks below are inferred from the CSS breakpoints (`sm/md/lg`) in the source. Flag if you want a re-run at 768 before implementation.

---

## Critical

**C1. Home and category routes have no `<main>` landmark.**

- Evidence: Playwright `document.querySelectorAll('main').length` = **0** on `/`, `/category/performance`, `/category/recovery` at both viewports. Product, 404, about, contact, faq all return 1.
- Source: `src/routes/index.tsx` wraps content in `<section>` only. `src/routes/category.$slug.tsx` `CategoryPage` component (line ~100) same — the `<main>` at lines 68/83 only exists in the error/notFound branches.
- Impact: screen-reader "jump to main content" fails on the two most-trafficked page types; WCAG 1.3.1 / 2.4.1; contributes to `a11y-landmark-one-main` scanner failure.

**C2. Category `og:image` is a relative Vite-hashed asset path, not an absolute https URL.**

- Evidence: Playwright reports `og:image = /src/assets/cat-performance-new.jpg` on `/category/performance` and `/src/assets/cat-recovery-new.jpg` on `/category/recovery`. Prod build will hash it to `/assets/xxx.jpg` — still relative.
- Source: `src/routes/category.$slug.tsx:44` passes `cfg.image` (a bundler import) straight into `og:image`. The `routeMeta` helper in `src/lib/seo.ts:42` guards against this with `/^https?:\/\//i.test(...)` but category route bypasses the helper.
- Impact: Facebook / X / LinkedIn / Slack crawlers require absolute URLs and will drop the preview image for every category share.

---

## High

**H1. `<meta name="google-site-verification">` is on the root route (all pages).**

- Source: `src/routes/__root.tsx:96`. Correct location is fine (root works), but the value `mu2c75c6...` should be verified as still active in Search Console — hardcoded tokens go stale silently.
- Verification status: **requires external Google Search Console check**.

**H2. Product `og:image` uses Shopify `.png` at a `p2.png` filename.**

- Evidence: `/product/n70-hilux-front-mount-intercooler-600x400` returns `og:image = https://cdn.shopify.com/.../p2.png?v=1782385045`.
- The Shopify CDN URL is fine and absolute (✓), but `p2.png` suggests the placeholder asset series copied from local `p2.jpg`/`p3.jpg`/… in project root was re-uploaded into Shopify. Confirm this specific product actually has a real N70 intercooler image, not a reused placeholder.
- Verification: **requires Shopify Admin review** per product.

**H3. Home H1 renders as concatenated text to assistive tech.**

- Evidence: Playwright text scrape returns `"FORGEDFOR ADVENTURE"` (no space). Source: `src/routes/index.tsx:82-84` — `<h1>FORGED<br /><span>FOR ADVENTURE</span></h1>`. Visually correct, but screen readers announce the two text nodes with no separator.
- Fix direction: keep the visual line-break, add a space either side of the `<br />` or wrap in aria-label.

**H4. Robots.txt lists a `Sitemap:` at the canonical domain, but the sitemap is served by the app.**

- Evidence: `curl /sitemap.xml` → 200, 94 `<loc>` entries, all under `https://roamforge.com.au`. Consistent.
- Requires external: DNS/domain must actually be `roamforge.com.au` in production (currently `roamforge-com-au.lovable.app` per project URLs). If the custom domain isn't yet the primary host, Google will treat the canonical/sitemap host mismatch as a soft signal against indexing.

**H5. Hardcoded Storefront token fallback still ships in the client bundle.**

- Source: `src/lib/site.ts:29` — literal fallback `"3fe65ac91d37eb6061771366ba9d1393"` when `VITE_SHOPIFY_STOREFRONT_TOKEN` is unset. Storefront tokens are public by design (documented in the file), so this is not a leak — but it means rotating the token requires a code change, not a config change. Move the fallback out or explicitly require the env var in prod.

---

## Medium

**M1. Category description meta stops mid-word.**

- Evidence: `/category/performance` description returns `"Throttle controllers, intercoolers, snorkels and performance upgrades "` (trailing space, truncated by the 70-char test slice but the full string in `categories.ts` is 156 chars — safe). No action needed; noted only to confirm scanner won't flag.

**M2. Home page has zero JSON-LD product/collection schema.**

- Evidence: home returns `jsonld count = 1` (the root Organization/WebSite graph). No `ItemList` for featured categories.
- Impact: category tile grid on home is a natural place for an `ItemList` / `CollectionPage` schema for rich-result eligibility. Category pages themselves also lack `CollectionPage`+`ItemList` — only `BreadcrumbList` is emitted.

**M3. Search dialog fetches every keystroke debounce with a broad Shopify search query.**

- Source: `src/components/SearchDialog.tsx:53` — `title:*q* OR vendor:*q* OR tag:*q*`. Leading wildcards in Shopify search are expensive and produce noisy results.
- Recommendation: drop leading `*` (Shopify search is prefix by default), or switch to Shopify Storefront `predictiveSearch` (`predictiveSearch(query: $q, types: [PRODUCT])`) which is purpose-built and much faster.

**M4. Category page uses one `<img>` at `h-full` with `opacity-45` over a dark bg for the hero.**

- Source: `src/routes/category.$slug.tsx:113`. This ships the full image at hero size on mobile too. There is no `sizes=` attribute or `<picture>` with a smaller mobile variant, and no `srcset`. LCP on mobile category pages will be the same 1600×600 file the desktop uses.

**M5. Third-party integrations gate scripts on env vars but do not defer or preload origins.**

- Source: `src/components/Integrations.tsx` (not read in this audit; inferred from prior turns). Confirm scripts are `async` / gated by consent where AU privacy expectations apply (Tidio chat + GA4). GA4 also needs a consent banner if EU visitors are possible.
- Requires external: Lovable env config check for `VITE_GA4_ID`, `VITE_KLAVIYO_ID`, `VITE_TIDIO_KEY`.

**M6. Footer displays only 5 of 10 categories.**

- Source: `src/components/SiteFooter.tsx:6-13` — `featuredSlugs` omits monitoring, gps-tracking, air-compressors, merch, planners. Deliberate curation is fine; flag for confirmation this matches the intended IA.

---

## Quick wins

**Q1.** Wrap `<Outlet />` in `src/routes/__root.tsx:174` with a single `<main>` and remove the duplicated `<main>` blocks from every leaf route (`about`, `contact`, `product`, `PageShell`, `$.tsx`). One landmark, defined once, satisfies C1 for every route in one place.

**Q2.** Route category through `routeMeta` from `src/lib/seo.ts` and pass `image: new URL(cfg.image, SITE.url).href` (resolve at build time via `SITE.url + <hashed-path>`) — solves C2 and dedupes 30 lines of head() boilerplate.

**Q3.** Add a space around the `<br />` in the home H1 (or split H1 across two spans with an aria-label on the H1) — resolves H3.

**Q4.** Replace search query with Shopify Storefront `predictiveSearch` — resolves M3 and improves perceived latency.

**Q5.** Add `sizes="(max-width: 640px) 100vw, 1600px"` and a `srcset` to the category hero `<img>` — resolves M4 with no visual change.

**Q6.** Add `ItemList` JSON-LD to `/category/*` (products already loaded in the loader) and `CollectionPage` type — resolves M2 for category pages.

---

## Verified vs inferred vs external

**Verified via read + browser:**

- Sitemap 200 + 94 URLs, robots.txt content, canonical URLs on every route, meta descriptions, H1s, `img[alt]` coverage (0 missing on tested pages), 404 `noindex`, JSON-LD counts per route, no console pageerrors on any tested route at 1440 or 390.

**Inferred (not directly executed):**

- Tablet 768 layout (breakpoints suggest safe; not sampled).
- Cross-browser (Firefox/Safari) — only Chromium sampled.
- LCP / CLS / INP numbers — no Lighthouse pass this turn.
- Cart drawer keyboard trap + Escape restore — not re-exercised.
- Prior turn's mobile menu focus + search focus return — trusted from that turn's PASS, not re-run.

**Requires external configuration to fully resolve:**

- Google Search Console verification token still valid (H1).
- Custom domain `roamforge.com.au` pointing at Lovable prod (H4).
- Real product imagery in Shopify Admin for every SKU (H2, and general merchandising).
- GA4 / Klaviyo / Tidio env vars set for the prod deploy (M5).
- Consent banner posture for AU + international visitors (M5).

---

## Suggested implementation order (only after approval)

1. Q1 (single `<main>` at root) — one-file, kills C1.
2. Q2 (category `routeMeta` + absolute og:image) — kills C2.
3. Q3, Q5, Q6 — small quality wins.
4. Q4 (predictive search) — larger change, do last.

No files touched yet; this plan is the audit deliverable.
