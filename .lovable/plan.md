# Roamforge — Read-Only Audit

**Scope:** HEAD `3e99698` + live `https://roamforge.com.au`. Chromium at 1440×900, 768×1024, 390×844, 360×780. Homepage, /shop, /category/recovery, /product/gq-patrol-airbox, invalid PDP, /faq, random 404. Cart drawer opened (no order placed).

**Overall:** Site is production-solid. Correct 404 HTTP status + `noindex` on `/nonexistent-*` and `/product/gu-patrol-airbox`; sitemap serves 95 URLs; robots.txt allows GPTBot/OAI/ChatGPT; HSTS + strict-origin referrer + X-Content-Type-Options set at the edge; PDP has Product + BreadcrumbList JSON-LD; category has CollectionPage + BreadcrumbList; homepage has Organization graph; no horizontal overflow at any viewport; single `<main>`, one H1 per page, no console/pageerror on valid routes; cart drawer opens; canonical + og:url self-reference correctly on indexable pages.

---

## Confirmed defects

### P1 — Homepage category tiles have no accessible name

- **Where:** `src/routes/index.tsx` "SHOP BY CATEGORY" grid (tiles rendered by `CATEGORIES.map` around lines 130–170).
- **Evidence:** Three `<a href="/category/performance">`, `/air-compressors`, `/vehicle-protection` returned by Playwright as anchors with no text and no `aria-label`. Their only child is a Lucide icon (SVG with no `<title>`) and the label text lives elsewhere in the DOM, not inside the anchor.
- **Impact:** Screen readers announce "link" with no destination; keyboard users tabbing the tiles hear nothing; VoiceOver rotor list is unusable. Also a Lighthouse "Links do not have a discernible name" fail.
- **Fix:** Add `aria-label={cat.title}` to each category `<Link>`, or move the visible title text inside the anchor. Prefer moving the text inside the anchor so the click target and label are one node.

### P1 — 404 / product-not-found pages serve a preview R2 URL as `og:image`

- **Where:** `src/routes/product.$handle.tsx` (notFoundComponent) and the root splat 404. `src/routes/__root.tsx` sets `og-default.jpg`, but the leaf notFound `head()` returns no `og:image`, and hosting overwrites the missing tag with the latest preview screenshot: `https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/…/id-preview-3e99698c--…lovable.app-…png`.
- **Evidence:** Every 404 across all four viewports shows the preview R2 URL in `<meta property="og:image">`; `og:url` is empty; `canonical` correctly absent (noindex).
- **Impact:** Any 404 link shared to Slack/Discord/WhatsApp/LinkedIn previews with a _Lovable preview screenshot_ branded URL, not Roamforge. Brand and trust hit.
- **Fix:** In the notFoundComponent's `head()` (leaf) and the splat route, explicitly return `{ property: "og:image", content: "https://roamforge.com.au/og-default.jpg" }` + matching `twitter:image`. Keep the existing `noindex, follow`.

### P2 — Klaviyo + Meta Pixel IDs hardcoded as fallbacks

- **Where:** `src/components/Integrations.tsx` — `import.meta.env.VITE_KLAVIYO_COMPANY_ID || "UwaEws"` and `VITE_META_PIXEL_ID || "1043681748196165"`.
- **Impact if these are not Roamforge's real IDs:** signup events, pageviews and ad-attribution flow into a stranger's Klaviyo/Meta account, and WelcomePopup stays permanently suppressed (it's Klaviyo-gated). If they _are_ correct real IDs, they still bypass the consent gate you built and load unconditionally.
- **Ask:** Confirm whether `UwaEws` and `1043681748196165` are the real Roamforge accounts.
- **Fix:** Drop the hardcoded fallbacks; require env vars; leave the component idle if unset. Popup will then render when Klaviyo is intentionally absent, matching the Section 4 spec.

### P3 — Homepage H1 puts the whole marketing sentence in `sr-only`

- **Where:** `src/routes/index.tsx` line 105–115. Visible text is "FORGED / FOR ADVENTURE"; screen readers hear a 90-char paragraph.
- **Impact:** Minor. Splitting keyword-rich copy from visible H1 is a common CRO pattern; it works but reads awkwardly aloud ("Premium 4WD accessories, recovery and touring gear in Australia — Forged for Adventure").
- **Fix (optional):** Trim sr-only to ~50 chars: "Roamforge — premium 4WD, recovery and touring gear in Australia."

### P3 — Homepage decorative images: 11 with empty alt vs 32 total

- **Where:** Category tile icons + why-us icons.
- **Impact:** Correct per spec (decorative). Non-issue; flagged only so it isn't re-raised in a future scan.

---

## Risks / assumptions (not defects, need confirmation)

- **Second `<nav>` on /shop, /category, /PDP** is the breadcrumb (`aria-label="Breadcrumb"`) — correct, not a defect.
- **"Failed to load resource: 404" console log on invalid PDPs** is the Shopify fetch returning 404 that _drives_ the notFound render — expected, not user-visible; no pageerror, no unhandled rejection.
- **Homepage empty-links finding is unrelated to LifestyleSection**; that "BUILT FOR / THE JOURNEY" heading appeared merged in evaluate output because the `<br>` was stripped when I read `.textContent`. Not a real defect.
- **No GA4 measurement ID observable** — either not deployed or consent-gated denied by default. Verify `VITE_GA_MEASUREMENT_ID` is set in production if analytics is expected.
- **No FAQPage JSON-LD on /faq** despite Q&A markup. Not a defect, but a straightforward SEO win if Roamforge wants rich-result eligibility.
- **Sitemap `<lastmod>` absent** on every entry — acceptable per policy (no authoritative page timestamp), no action.

---

## Executive summary

Roamforge's storefront is release-quality. Two evidence-based defects need action before further scale — one accessibility (homepage tile links), one brand (404 og:image leaking the preview URL). One config question needs an owner decision (hardcoded Klaviyo/Meta IDs). Everything else is polish.

## Critical bugs

1. Homepage category-tile anchors have no accessible name. **(P1, a11y)**
2. 404 / product-not-found pages surface a Lovable preview screenshot as their social share image. **(P1, brand/SEO)**

## Quick wins (≤15 min each)

- Add `aria-label` to the three homepage category tiles.
- Add explicit `og:image` + `twitter:image` = `https://roamforge.com.au/og-default.jpg` in the two notFoundComponent `head()` returns.
- Trim the sr-only H1 on homepage.
- Add FAQPage JSON-LD on `/faq`.

## 30-day prioritised action plan

- **Week 1** — Ship the two P1s + the four quick wins above.
- **Week 1** — Confirm/replace hardcoded Klaviyo `UwaEws` and Meta Pixel `1043681748196165`; if real, still remove the fallback so consent gating actually applies.
- **Week 2** — Add `Product.aggregateRating`/`review` schema only if genuine Judge.me reviews exist (schema without real reviews is a Google policy violation). Add `Product.brand` + `Product.sku` if not already emitted per variant (verify in Rich Results Test).
- **Week 3** — Wire GA4 in production behind consent; verify `add_to_cart` and `view_item` events fire once, not twice.
- **Week 4** — Add editorial "buying guide" content on the two thinnest category pages (recovery, air-compressors) for keyword coverage; add internal links from PDPs back to their category.

Nothing else in the audit warrants a code change. No P0s found.
