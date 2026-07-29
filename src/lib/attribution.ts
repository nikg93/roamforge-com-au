// Campaign attribution capture + checkout handoff.
//
// Ad clicks land on roamforge.com.au with `utm_*` and click identifiers
// (`gclid`, `fbclid`, `ttclid`, ...). The order itself completes on Shopify's
// checkout, on a different origin, so those parameters are lost unless we
// forward them on the outbound handoff. We capture them on first landing,
// persist them for the session, and re-append them to the Shopify checkout
// URL so Shopify's own attribution (and any pixel installed inside checkout)
// sees the originating campaign.
//
// Only known, non-sensitive marketing parameters are stored/forwarded — never
// arbitrary query strings, so no PII leaks across the origin boundary.

export const ATTRIBUTION_STORAGE_KEY = "roamforge-attribution-v1";

export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "ttclid",
  "msclkid",
  "epik",
  "ref",
] as const;

export type AttributionParams = Record<string, string>;

const MAX_VALUE_LENGTH = 256;

function sanitize(value: string): string | null {
  const v = value.trim();
  if (!v || v.length > MAX_VALUE_LENGTH) return null;
  return v;
}

/** Extract the known marketing params from a query string. */
export function parseAttribution(search: string): AttributionParams {
  const out: AttributionParams = {};
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return out;
  }
  for (const key of ATTRIBUTION_PARAMS) {
    const raw = params.get(key);
    if (raw === null) continue;
    const clean = sanitize(raw);
    if (clean) out[key] = clean;
  }
  return out;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readAttribution(): AttributionParams {
  const s = storage();
  if (!s) return {};
  try {
    const raw = s.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: AttributionParams = {};
    for (const key of ATTRIBUTION_PARAMS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === "string") {
        const clean = sanitize(v);
        if (clean) out[key] = clean;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Store any marketing params present on the current URL. First touch wins for
 * the session — a later internal navigation without params must never wipe the
 * original campaign, but a genuinely new ad click (fresh params) overwrites.
 */
export function captureAttribution(
  search = typeof window === "undefined" ? "" : window.location.search,
) {
  const incoming = parseAttribution(search);
  if (Object.keys(incoming).length === 0) return readAttribution();
  const s = storage();
  if (s) {
    try {
      s.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(incoming));
    } catch {
      /* storage unavailable — forwarding simply degrades to none */
    }
  }
  return incoming;
}

/**
 * Append the captured campaign params to an outbound Shopify checkout URL.
 * Existing params on the checkout URL always win (Shopify sets `channel`,
 * `key`, etc.) so this can never break the handoff.
 */
export function appendAttribution(url: string, attribution: AttributionParams = readAttribution()) {
  const entries = Object.entries(attribution);
  if (entries.length === 0) return url;
  try {
    const u = new URL(url);
    for (const [k, v] of entries) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return url;
  }
}
