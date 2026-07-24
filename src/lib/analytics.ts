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

/**
 * Push a GA4 event. Returns `false` when consent is denied or gtag isn't
 * loaded so callers/tests can assert on gating behaviour.
 */
export function trackGa4(event: string, params: Record<string, unknown> = {}): boolean {
  if (!analyticsAllowed()) return false;
  const w = getWindow();
  if (!w) return false;
  const gtag = w.gtag;
  if (typeof gtag !== "function") {
    // Buffer via dataLayer if gtag hasn't attached yet — GA4 replays it.
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push(["event", event, params]);
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
  trackGa4("view_item_list", { item_list_name: listName, items });
}

export function trackSelectItem(item: AnalyticsItem, listName: string) {
  trackGa4("select_item", { item_list_name: listName, items: [item] });
}

export function trackAddToCart(item: AnalyticsItem, currency = AUD) {
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
  const qty = item.quantity ?? 1;
  trackGa4("remove_from_cart", {
    currency,
    value: (item.price ?? 0) * qty,
    items: [item],
  });
}

export function trackViewCart(items: AnalyticsItem[], currency = AUD) {
  const value = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  trackGa4("view_cart", { currency, value, items });
}

export function trackBeginCheckout(items: AnalyticsItem[], currency = AUD) {
  const value = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  trackGa4("begin_checkout", { currency, value, items });
  trackMeta("InitiateCheckout", {
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1 })),
    num_items: items.reduce((s, i) => s + (i.quantity ?? 1), 0),
    value,
    currency,
  });
}

export function trackSearch(term: string) {
  const clean = term.trim();
  if (!clean) return;
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
