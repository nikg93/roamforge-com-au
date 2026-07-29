# Audit result + repair plan

Nothing was created, modified or deleted in Shopify. No token, secret or credential value is reproduced below.

## Part A — Shopify Admin questions: BLOCKED (evidence)

Two blockers, both verified.

**Blocker 1 — the Admin credentials in this project do not authenticate.**
Direct Admin API calls against `xmszfz-pj.myshopify.com` return `401 / "[API] Invalid API key or access token"` on every attempt:

```text
POST /admin/api/2025-07/graphql.json   -> 401  (offline token)
POST /admin/api/2025-07/graphql.json   -> 401  (online token)
GET  /admin/api/2025-07/shop.json      -> 401  (both, 2025-07 and 2024-10)
```

The offline token has a valid `shpat_` shape, so this is a rejected/rotated credential or one bound to a different app context — not a malformed value. The managed Shopify tooling available here only covers products, variants, discounts, price rules, storefront token and shop domain; it exposes no app, pixel, theme or customer-events surface.

**Blocker 2 — the granted scope set cannot answer these questions even with a working token.** The online credential self-reports its granted scopes:

```text
read_themes, unauthenticated_read_product_listings, write_discounts,
write_inventory, write_price_rules, write_products, write_publications
```

| # | Question | Verdict | Blocked by |
|---|---|---|---|
| 1 | Facebook & Instagram/Meta app or sales channel installed? | UNKNOWN | 401, and no `read_apps` scope. Shopify also exposes no Admin query that lists *other* apps installed on a shop. |
| 2 | Meta pixel/dataset linked; numeric Pixel ID? | UNKNOWN | 401, and no `read_pixels`. The `webPixel` query returns only the *calling* app's own pixel, never Meta's. |
| 3 | Custom app `Windsor AI` exists / install status? | UNKNOWN | 401, and no `read_apps`. Same API limitation as #1. |
| 4 | GA4 `G-QGGYL7FRLG` in Shopify customer events / checkout? | UNKNOWN | 401. `read_themes` is granted but unusable while the token 401s; customer-events pixels need `read_pixels` regardless. |

I will not guess any of these four. Even a fully-scoped token cannot answer 1-3, so these are permanently manual checks in Shopify admin.

## Part B — GA4 live verification on roamforge.com.au: 3 of 4 PASS

Real browser, fresh storage, consent accepted, observing actual `/g/collect` requests (query and batched POST bodies), all on `tid=G-QGGYL7FRLG`. Stopped before any order.

| Event | Result | Evidence |
|---|---|---|
| `page_view` | PASS | fires on load and again on SPA navigation |
| `view_item` | PASS | on `/product/n70-hilux-front-mount-intercooler-600x400` |
| `add_to_cart` | PASS | on ADD TO CART |
| `begin_checkout` | **FAIL** | zero `/g/collect` hits after "Checkout with Shopify" |

Also observed passing: `view_item_list`, `select_item`, `view_cart`, `user_engagement`. Zero console errors on the storefront.

The handoff itself works — the click lands on `https://xmszfz-pj.myshopify.com/checkouts/cn/...?_r=...`, correct store domain, attribution params forwarded. Only the analytics hit is lost.

**Root cause, confirmed by isolation test, not inferred.** On the live page I fired `begin_checkout` two ways:

```text
A) gtag event, no navigation, wait 4s   -> no /g/collect
B) gtag event + immediate same-origin navigation -> begin_checkout DOES arrive
```

GA4 batches events and flushes them on unload. In case B the same-origin unload flush delivers it. In the real checkout path `CartDrawer.handleCheckout` calls `trackBeginCheckout(...)` and then `window.location.assign()` to a **cross-origin** Shopify URL in the same tick — the queued hit is discarded before any flush. `getCheckoutUrl()` is not the problem; it returns a valid URL and the browser reaches checkout.

## Part C — Proposed fix (one defect, narrow)

Make the checkout hit survive the cross-origin unload:

1. In `src/lib/analytics.ts`, set GA4 `transport_type: "beacon"` so hits use `navigator.sendBeacon` and survive page teardown. Apply it at `config` time in `src/components/Integrations.tsx` so every event benefits, not just checkout.
2. In `src/lib/analytics.ts`, give `trackBeginCheckout` an `event_callback` plus a short failsafe timeout (~250ms), and have `CartDrawer.handleCheckout` navigate from that callback — whichever fires first — so the hit is dispatched before unload. Keep the navigation inside the click handler's synchronous path where iOS popup rules require it, and keep the existing `items.length === 0` guard and `shouldEmit` dedupe untouched.
3. Add a unit test asserting `begin_checkout` is dispatched before the navigation callback runs, and that an empty cart still emits nothing.
4. Run the full gate: format, lint, typecheck, unit, static, catalogue, production build.
5. Re-verify live after deploy by replaying the same journey and confirming a real `begin_checkout` `/g/collect` hit on `G-QGGYL7FRLG`, stopping before an order.

No visual, copy, pricing, offer or business-rule changes. The 5% welcome offer is not touched.

## Exact remaining actions you must take (external)

1. **Reissue Shopify Admin access.** The current token 401s. If you want questions 1-4 answered by API rather than by eye, the app needs reinstalling with `read_apps`, `read_pixels` and `read_script_tags` added — but note 1-3 still are not answerable via Admin API even then.
2. **Check in Shopify admin manually** (30 seconds each): Settings, Apps and sales channels — is *Facebook & Instagram* listed, and is *Windsor AI* listed under "Develop apps"? Settings, Customer events — is there a GA4 or Meta pixel entry?
3. **Meta Pixel ID** still does not exist anywhere in this project. Send me the numeric ID from Events Manager and I will wire it exactly as GA4 is wired.
4. **Purchase tracking** remains impossible from this codebase alone — the order confirmation happens on Shopify's domain, so GA4 and Meta must be installed inside Shopify checkout. I have not verified and will not claim any Purchase or checkout-side tracking works.
