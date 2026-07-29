// Consent-aware analytics dispatcher. Fires GA4 `gtag` events and Meta Pixel
// `fbq` events (when a Pixel ID is configured). All calls are SSR-safe and
// no-op when analytics consent is denied or the required scripts aren't
// loaded. Payload shapes match GA4 recommended ecommerce events.
//
// Kept dependency-free so it can be unit-tested by injecting a fake window.

import { readConsent } from "@/lib/consent";

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  currency?: string;
}

type GtagFn = (...args: unknown[]) => void;
type FbqFn = (...args: unknown[]) => void;

interface AnalyticsWindow {
  gtag?: GtagFn;
  dataLayer?: unknown[];
  fbq?: FbqFn;
}

function getWindow(): AnalyticsWindow | null {
  if (typeof window === "undefined") return null;
  return window as unknown as AnalyticsWindow;
}

/**
 * Build a native `arguments` object. gtag.js only recognises commands pushed
 * to `dataLayer` as `arguments`; a plain array is silently ignored.
 */
function toGtagArguments(...args: unknown[]): IArguments {
  return (function () {
    // eslint-disable-next-line prefer-rest-params
    return arguments;
  })(...(args as []));
}

function analyticsAllowed(): boolean {
  try {
    return readConsent().analytics === true;
  } catch {
    return false;
  }
}

function marketingAllowed(): boolean {
  try {
    return readConsent().marketing === true;
  } catch {
    return false;
  }
}

// --- Single-fire guard -------------------------------------------------
// React StrictMode double-invokes effects in development, and route
// re-renders can re-run view/list effects. Passive + handoff events are
// deduped on an identity key inside a short window so GA4 never receives
// two hits for one genuine user action. `add_to_cart` is intentionally NOT
// deduped by payload alone beyond a very short window, so a shopper adding
// the same item twice still yields two events.
const DEDUPE_WINDOW_MS = 1500;
const lastFired = new Map<string, number>();

function shouldEmit(key: string, windowMs = DEDUPE_WINDOW_MS): boolean {
  const now = Date.now();
  const prev = lastFired.get(key);
  if (typeof prev === "number" && now - prev < windowMs) {
    devLog("suppressed duplicate", key);
    return false;
  }
  lastFired.set(key, now);
  return true;
}

/** Test-only: clear the dedupe window between assertions. */
export function __resetAnalyticsDedupe() {
  lastFired.clear();
}

function isDev(): boolean {
  try {
    return (
      typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true
    );
  } catch {
    return false;
  }
}

function devLog(...args: unknown[]) {
  if (isDev()) console.debug("[analytics]", ...args);
}

/**
 * Push a GA4 event. Returns `false` when consent is denied or gtag isn't
 * loaded so callers/tests can assert on gating behaviour.
 */
export function trackGa4(event: string, params: Record<string, unknown> = {}): boolean {
  if (!analyticsAllowed()) return false;
  const w = getWindow();
  if (!w) return false;
  const gtag = w.gtag;
  devLog(event, params);
  if (typeof gtag !== "function") {
    // Buffer via dataLayer if gtag hasn't attached yet — GA4 replays it.
    // Must be pushed as a native `arguments` object: gtag.js ignores plain
    // arrays, so an array push would look successful yet never transmit.
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push(toGtagArguments("event", event, params));
      return true;
    }
    return false;
  }
  gtag("event", event, params);
  return true;
}

/** Fire a Meta Pixel `track` call. Gated on marketing consent + fbq presence. */
export function trackMeta(event: string, params: Record<string, unknown> = {}): boolean {
  if (!marketingAllowed()) return false;
  const w = getWindow();
  if (!w || typeof w.fbq !== "function") return false;
  w.fbq("track", event, params);
  return true;
}

const AUD = "AUD";

export function trackViewItem(item: AnalyticsItem, currency = AUD) {
  if (!shouldEmit(`view_item:${item.item_id}:${item.item_variant ?? ""}`)) return;
  const price = item.price ?? 0;
  trackGa4("view_item", { currency, value: price, items: [item] });
  trackMeta("ViewContent", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    value: price,
    currency,
  });
}

export function trackViewItemList(items: AnalyticsItem[], listName: string) {
  if (!shouldEmit(`view_item_list:${listName}:${items.map((i) => i.item_id).join(",")}`)) return;
  trackGa4("view_item_list", { item_list_name: listName, items });
}

export function trackSelectItem(item: AnalyticsItem, listName: string) {
  if (!shouldEmit(`select_item:${listName}:${item.item_id}`, 400)) return;
  trackGa4("select_item", { item_list_name: listName, items: [item] });
}

export function trackAddToCart(item: AnalyticsItem, currency = AUD) {
  // Short window only — guards against a double-bound click handler while
  // still allowing a shopper to genuinely add the same item twice.
  if (!shouldEmit(`add_to_cart:${item.item_id}:${item.quantity ?? 1}`, 400)) return;
  const qty = item.quantity ?? 1;
  const value = (item.price ?? 0) * qty;
  trackGa4("add_to_cart", { currency, value, items: [item] });
  trackMeta("AddToCart", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    value,
    currency,
  });
}

export function trackRemoveFromCart(item: AnalyticsItem, currency = AUD) {
  if (!shouldEmit(`remove_from_cart:${item.item_id}`, 400)) return;
  const qty = item.quantity ?? 1;
  trackGa4("remove_from_cart", {
    currency,
    value: (item.price ?? 0) * qty,
    items: [item],
  });
}

export function trackViewCart(items: AnalyticsItem[], currency = AUD) {
  if (items.length === 0) return;
  if (!shouldEmit(`view_cart:${items.map((i) => `${i.item_id}x${i.quantity ?? 1}`).join(",")}`))
    return;
  const value = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  trackGa4("view_cart", { currency, value, items });
}

/**
 * Fire `begin_checkout`, then invoke `onDispatched` once the hit has been
 * handed to the transport (or after a short failsafe timeout).
 *
 * Checkout navigates cross-origin to Shopify immediately after this call.
 * GA4 batches events, so a hit queued in the same tick as the navigation is
 * discarded and never reaches /g/collect. Waiting for gtag's `event_callback`
 * lets the beacon leave first; the timeout guarantees the shopper is never
 * stranded if analytics is blocked, denied or slow.
 */
export function trackBeginCheckout(
  items: AnalyticsItem[],
  currency = AUD,
  onDispatched?: () => void,
) {
  const proceed = once(onDispatched);
  // Never emit a phantom checkout: no line items means no genuine handoff.
  if (items.length === 0) return proceed();
  if (
    !shouldEmit(`begin_checkout:${items.map((i) => `${i.item_id}x${i.quantity ?? 1}`).join(",")}`)
  )
    return proceed();
  const value = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const sent = trackGa4("begin_checkout", {
    currency,
    value,
    items,
    ...(onDispatched ? { event_callback: proceed } : {}),
  });
  trackMeta("InitiateCheckout", {
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1 })),
    num_items: items.reduce((s, i) => s + (i.quantity ?? 1), 0),
    value,
    currency,
  });
  if (!sent) return proceed();
  // Failsafe: gtag may never call back (ad blocker, offline, buffered hit).
  if (onDispatched && typeof setTimeout === "function") setTimeout(proceed, CHECKOUT_FLUSH_MS);
}

export function trackSearch(term: string) {
  const clean = term.trim();
  if (!clean) return;
  if (!shouldEmit(`search:${clean.toLowerCase()}`)) return;
  trackGa4("search", { search_term: clean });
  trackMeta("Search", { search_string: clean });
}

export function trackSignUp(method = "newsletter") {
  trackGa4("sign_up", { method });
  trackMeta("Lead", { method });
}

// Convert a Shopify-shaped product/variant snapshot into a GA4 item.
export function toAnalyticsItem(input: {
  id: string;
  title: string;
  vendor?: string;
  productType?: string;
  variantTitle?: string;
  price?: string | number;
  quantity?: number;
  currency?: string;
}): AnalyticsItem {
  const price =
    typeof input.price === "number"
      ? input.price
      : input.price
        ? Number.parseFloat(input.price)
        : undefined;
  const item: AnalyticsItem = {
    item_id: input.id,
    item_name: input.title,
  };
  if (input.vendor) item.item_brand = input.vendor;
  if (input.productType) item.item_category = input.productType;
  if (input.variantTitle && input.variantTitle !== "Default Title")
    item.item_variant = input.variantTitle;
  if (typeof price === "number" && Number.isFinite(price)) item.price = price;
  if (typeof input.quantity === "number") item.quantity = input.quantity;
  if (input.currency) item.currency = input.currency;
  return item;
}
