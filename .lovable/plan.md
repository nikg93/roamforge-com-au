## Live audit result — https://roamforge.com.au (read-only, nothing changed)

Chromium 1280x1800, fresh storage, "ACCEPT ALL" clicked (consent persisted: `{"analytics":true,"marketing":true,"decided":true}`).

| # | Check | Result | Exact evidence |
|---|---|---|---|
| 1 | Consent accepted, stored | PASS | localStorage `roamforge-consent-v1` = `{"version":1,...,"analytics":true,"marketing":true,"decided":true}` |
| 2 | GA4 script loads / valid ID | **FAIL** | `document.getElementById('ga4-loader')` = false, `typeof window.gtag` = `"undefined"`, `dataLayer.length` = 0. Zero requests to googletagmanager.com / google-analytics.com after consent. Only script on page: `/~flock.js` |
| 3 | Meta Pixel loads / valid ID | **FAIL** | `meta-pixel-loader` = false, `typeof window.fbq` = `"undefined"`, zero requests to connect.facebook.net or facebook.com/tr |
| 3b | Klaviyo / Tidio | not configured | `klaviyo-loader` = false, `tidio-loader` = false |
| 4 | PDP `view_item` / `ViewContent` | **FAIL (not emitted)** | `/product/lightforce-beast-190-3-mode-led-driving-light`, 3s wait: `dataLayer` = `[]`, no `/g/collect`, no `/tr?` |
| 5 | `add_to_cart` / `AddToCart` | **FAIL (not emitted)** | ADD TO CART clicked, drawer opened, no tracking network calls, `dataLayer` still empty |
| 6 | `begin_checkout` / `InitiateCheckout` | **FAIL (not emitted)** | "Checkout with Shopify" clicked → redirected to `xmszfz-pj.myshopify.com/checkouts/cn/hWNF1RWDHl3Lf3uaBAPg7WkN/en-au` (stopped before order). No pixel/GA hits fired on handoff |
| 7 | Storefront funnel itself | PASS | Home → PDP → ATC → Shopify checkout all worked, 0 console errors on roamforge.com.au; the only console errors (401, 403, permissions-policy `publickey-credentials-*`) came from Shopify's own checkout page after redirect |
| 8 | Purchase optimisation viable today? | **NO** | No pixel and no GA4 property receiving data, so no `Purchase` signal exists; Meta/Google campaigns can only run on link-click objectives |

### Root cause (code-confirmed, not changed)
`src/components/Integrations.tsx` deliberately loads each tag only when a validated env var is present — `VITE_GA4_MEASUREMENT_ID` (`G-XXXX…`) and `VITE_META_PIXEL_ID` (digits). Neither is set in the production build, so consent is honoured but there is nothing to load. The event layer in `src/lib/analytics.ts` is correct and consent-gated; it silently no-ops because `gtag`/`fbq`/`dataLayer` never exist.

### Proposed fix (only if you approve — needs values from you)
1. You supply GA4 Measurement ID and Meta Pixel ID; they are publishable, so they go in project env as `VITE_GA4_MEASUREMENT_ID` and `VITE_META_PIXEL_ID`.
2. Redeploy production, then re-run this exact browser audit to confirm `gtag`/`fbq` defined and `view_item`/`ViewContent`, `add_to_cart`/`AddToCart`, `begin_checkout`/`InitiateCheckout` fire once each.
3. For `Purchase` (the event ad platforms optimise on), the conversion happens on Shopify's checkout, not this site — install the same GA4 + Meta Pixel in the Shopify admin (Customer events / Meta sales channel) using the identical IDs so the funnel is attributed end to end. This is a Shopify-admin step, not a code change.
4. Optional hardening: Meta Conversions API for server-side `Purchase` de-duplication, once step 3 is live.

No code, commits, or deploys were made during this audit.