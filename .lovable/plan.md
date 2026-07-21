# Roamforge — Technical Audit (Read-Only)

Scope: source review only. Rankings — **P0** blocker, **P1** high, **P2** medium, **P3** low. "Confirmed" = visible in code; "Risk" = likely but not verified at runtime.

---

## P0 — Blocker / User-Impacting

**1. Storefront access token is hardcoded in the client bundle.** Confirmed.
`src/lib/shopify.ts:6` — `SHOPIFY_STOREFRONT_TOKEN = "3fe65ac91d37eb..."`. Shopify Storefront tokens are technically "public", but committing them in source ties the site to that specific token permanently and exposes it to any scraper. Should live behind `VITE_SHOPIFY_STOREFRONT_TOKEN` env var so it's rotatable, and the store domain likewise.

**2. Product route: `<title>` is the raw handle.** Confirmed.
`src/routes/product.$handle.tsx:14` sets `title: "${params.handle} | Roamforge"` → e.g. "ultimate9-codebreaker-gps-head-up-display | Roamforge". No product title, no `og:image`, no schema, no canonical. This is every product page's SEO — currently near-zero.

**3. No canonical tags on any route.** Confirmed.
Neither `__root.tsx` nor any leaf route emits `<link rel="canonical">` or `og:url`. Combined with the sitemap advertising `https://roamforge.com.au` while the site is also live at `roamforge-com-au.lovable.app` and the preview URL, this creates duplicate-content risk across mirrored domains.

---

## P1 — High

**4. Sitemap references categories that don't exist.** Confirmed.
`sitemap[.]xml.ts:13–31` lists 8 categories but omits `vehicle-protection` and `merch` while `CATEGORY_MAP` has them. Missing URLs will never be indexed.

**5. Footer "SHOP" column links to slugs that don't exist in `CATEGORY_MAP`.** Confirmed.
`SiteFooter.tsx:13–17` — `throttle-controllers`, `tailgate-systems`, `nudge-bars`, `lighting-packs`. Only `lighting` is valid; the other four will trigger the category `notFound` boundary. Same issue in `TrustedBrands.tsx:8` (`throttle-controllers`).

**6. Footer newsletter form is inert.** Confirmed.
`SiteFooter.tsx:77–84` — `<form>` with no action, submit button is `type="button"`, no handler, no storage of email. Users think they've subscribed.

**7. Social icons link to `href="#"`.** Confirmed.
`SiteFooter.tsx:91–93`. Dead links; jumps user to top of page.

**8. Header search & account buttons do nothing.** Confirmed.
`SiteHeader.tsx:62–67` — no onClick, no dialog, no route. Visible UI implies functionality that isn't there.

**9. No mobile navigation.** Confirmed.
`SiteHeader.tsx:31` — main nav is `hidden lg:flex`. Below ~1024 px there is no menu button, no drawer — categories are unreachable except via the homepage grid. Major conversion problem on mobile.

**10. Cart drawer sync/checkout race conditions.** Risk (code review).
`CartDrawer.tsx:26` opens checkout in a new tab via `window.open` from an async callback. On iOS Safari popup blockers commonly reject async `window.open`; the checkout URL is cached in the store so this usually works but not always. Also, `syncCart` on drawer open (`:22–24`) can clear the cart mid-render if Shopify reports 0 quantity while a request is still in flight.

**11. Duplicate Storefront domain / token in source.** Confirmed.
Same as #1; also blocks connecting a different Shopify store without a code change.

**12. `product.$handle` route missing `beforeLoad`/`loader`.** Confirmed.
Data is fetched only in the component with `useQuery`, so SSR emits a shell with a spinner (no title/description populated from real product) and Googlebot won't see product content. Titles/descriptions can't derive from product data because the loader is empty (see #2).

---

## P2 — Medium

**13. Heading hierarchy: `<SectionHeading>` always renders `<h2>` regardless of nesting.** Confirmed.
`SectionHeading.tsx:7`. Homepage has `<h1>`FORGED..., then multiple `<h2>` — fine. But `PageShell` article children use `H2` (`mt-10`) inside `<article>` — acceptable but inconsistent skip levels vs. no `<h3>` usage.

**14. Category not-found + error components lack `<main>` + `notFound` metadata.** Confirmed.
`category.$slug.tsx:108–125` — no `<meta name="robots" content="noindex">` on the notFound component. `$.tsx` sets `noindex, follow` — inconsistent.

**15. `<img alt="Roamforge">` used twice on every page** (header + footer logos). Confirmed.
Screen readers announce "Roamforge, Roamforge, image, Roamforge". One should be `alt=""` (decorative) or wrapped in the link with `aria-label="Roamforge home"` and empty alt.

**16. Category `<img>` uses full-cover `absolute inset-0` without `width`/`height`.** Confirmed.
`category.$slug.tsx:144–149`, `LifestyleSection.tsx:8–12`, `SiteHeader.tsx:29`. No CLS reservation. Also hero `img` in `index.tsx:73–77` uses fixed CSS heights so CLS is bounded, but no `fetchpriority="high"` or preload — LCP candidate is unmarked.

**17. `defaultPreloadStaleTime: 0` on router.** Confirmed.
`src/router.tsx:12`. Every link hover refetches → wasted network calls and Shopify quota burn.

**18. Every route mounts `useCartSync()` independently.** Confirmed.
Root + index + category + product all call it (via component + `<Toaster>` in `__root`). This fires a `cart` query on every navigation and every tab-visibility change. Move `useCartSync` into `__root.tsx` once, remove from routes.

**19. Icon-only mobile tap targets are 36×36.** Confirmed.
`SiteHeader.tsx:62,65` (`h-9 w-9`). Below WCAG 2.5.5 44×44 target size, and below the shadcn `size="icon"` bump you already noted in a11y guide.

**20. Cart drawer decrement past 1 calls `removeItem`.** Not confirmed — actually, `updateQuantity(_, quantity - 1)` calls `updateQuantity`, which for `quantity <= 0` returns `removeItem` (`cartStore.ts:154`). Fine, but clicking "-" at qty=1 silently removes with no confirmation.

**21. Klaviyo/Tidio/GA4 env vars — script tags render undefined if empty string.** Risk.
`Integrations.tsx:15–17` treats `undefined | ""` the same because `if (ga4)` is falsy for empty string, so OK. But since the user says the apps are "installed", none of them are wired via `VITE_*` — they're not loading, confirmed by the earlier diagnostic.

**22. Category page loader-less; SSR renders skeleton.** Same as #12 for categories.
Product grid depends on `useQuery` client-side; server response never carries product data. Google can index the H1/description but not the products themselves.

---

## P3 — Low / Recommendations

**23. Duplicate/dead image assets.** Confirmed.
`cat-electrical.jpg`, `cat-camping.jpg`, `cat-nudge.jpg`, `product-*.jpg` (throttle, snatch-strap, watertank, tailgate, snorkel, obd2, rocklights, recovery-kit, nudgebar, nudge-lights, lightbar, isolator, gps, dcdc, deflator, compressor, battmonitor, hero-patrol) and `evc-controller.webp` are not imported anywhere. Bundle bloat.

**24. No JSON-LD schema anywhere.** Confirmed.
No `Organization`, `WebSite`, `BreadcrumbList`, or `Product` schema. `Product` schema on product page + `Organization`/`WebSite` on root would materially improve rich-result eligibility.

**25. `<html lang="en">` — should be `en-AU` for an AU store.** Confirmed. `__root.tsx:114`.

**26. `min-h-screen` used everywhere.** Confirmed.
On iOS this excludes address bar chrome. Should be `min-h-dvh`.

**27. Header nav order duplicates category grid but with different labels.** Confirmed.
Nav says "PROTECTION", grid says "VEHICLE PROTECTION"; nav "12V & MONITORING", grid "12V & VEHICLE MONITORING". Not broken, just inconsistent branding.

**28. `PRODUCTS_QUERY` fetches 5 images + 10 variants for grid rendering.** Confirmed.
`shopify.ts:57–70`. Grid only uses first image + first variant. Trim to `images(first:1) variants(first:1)` for category listings to cut payload ~5×.

**29. Product page description printed as `whitespace-pre-line`.** Confirmed.
Shopify descriptions come back as HTML; you're rendering as plain text, so `<p>`/`<ul>` tags appear as literal text. Either strip tags or render sanitized HTML.

**30. Cart persisted to `localStorage` but only re-validated on drawer open / tab focus.** Confirmed.
If a variant is deleted in Shopify, users can add stale line items before validation runs.

**31. robots.txt: no explicit disallow of `/cart`, `/checkout`, `/product/*?variant=`.** Minor.

**32. Newsletter compliance.** If wired later, needs an opt-in and privacy notice next to the input for AU spam law.

**33. `Integrations.tsx` never removes GA4 dataLayer/gtag once injected.** Confirmed.
Cleanup on `:57` only removes script tags, not the globals. Non-issue in production (component never unmounts), but flag for future SSR/hot-reload cleanliness.

**34. Type-narrowing in `SiteHeader` NavItem union is over-engineered.** P3 refactor.

---

## Build / Lint / Type Risks

- `defaultPreloadStaleTime: 0` — see #17.
- `useCartSync` in `__root` via `<Integrations />` sibling AND in every route — double-registration risk if a future edit turns `syncCart` non-idempotent.
- All Shopify calls throw to nearest error boundary; category route has one, product route does not have a full-page one — only inline text (`product.$handle.tsx:19–22`), no header/footer.
- `SiteFooter.tsx` FooterLink union uses hard-coded slug type unions; adding a new category doesn't fail typecheck unless slug is one of these — future footer entries can silently 404 (see #5).
- `eslint` script exists; recommend running `bun run lint` and `tsgo --noEmit` at build time. Not run in this audit.

---

## Fix Order (Recommended)

1. Fix P0 items #1, #2, #3 in one PR.
2. Sweep P1 broken links (#4, #5), inert form (#6), dead socials (#7), header ghost buttons (#8), and ship mobile nav (#9).
3. Cart reliability pass — checkout popup (#10), single `useCartSync` (#18), stale-variant refresh (#30).
4. Loaders + SEO — move category/product fetches into loaders, add canonical, product JSON-LD (#12, #22, #24), sitemap parity (#4).
5. Polish — a11y (#15, #19), CLS (#16), payload trim (#28), asset cleanup (#23).

No files will be modified in plan mode. Approve to have any subset of the above implemented.
