// Legacy Shopify product handles that have been renamed. Loader on
// /product/$handle looks up the incoming handle here and issues a
// permanent redirect so external backlinks, ad URLs, and stale
// bookmarks land on the current product instead of a 404.
//
// Add entries as: [legacyHandle]: currentHandle
// - Keys and values MUST be lowercase, hyphenated Shopify handles.
// - Never map a handle to itself.
// - Prefer 1:1 redirects to a live PDP; if the product is truly gone,
//   omit it and let the branded 404 handle it.
export const LEGACY_PRODUCT_REDIRECTS: Readonly<Record<string, string>> = {
  // Ultimate9 throttle controller family — old marketing handle → current PDP.
  "ultimate9-evcx-throttle-controller": "ultimate9-evc-x-throttle-controller",
};

export function resolveLegacyProductHandle(handle: string): string | null {
  const key = handle.trim().toLowerCase();
  const next = LEGACY_PRODUCT_REDIRECTS[key];
  if (!next || next === key) return null;
  return next;
}
