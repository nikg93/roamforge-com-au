// Central site configuration. Single source of truth for canonical base URL,
// social links, and Shopify Storefront config. Import from here instead of
// hardcoding domain/URL/token strings throughout the app.

export const SITE = {
  name: "Roamforge",
  description: "Premium 4WD, camping and touring gear selected for Australian adventures.",
  url: "https://roamforge.com.au",
  locale: "en-AU",
  currency: "AUD",
  social: {
    instagram: "https://instagram.com/roam_forge",
  },
} as const;

// Storefront (public) credentials. VITE_ vars are inlined at build time and
// are safe to expose in the browser bundle — the Storefront token is a
// public read-only key by design. Admin credentials MUST never be added here.
const ENV_DOMAIN =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN : undefined;
const ENV_TOKEN =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN : undefined;

export const SHOPIFY = {
  apiVersion: "2026-07",
  // Fallbacks are the current published Storefront credentials; they keep
  // production working until the deploy env sets the VITE_ vars.
  storeDomain: (ENV_DOMAIN as string) || "xmszfz-pj.myshopify.com",
  storefrontToken: (ENV_TOKEN as string) || "3fe65ac91d37eb6061771366ba9d1393",
} as const;

export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY.storeDomain}/api/${SHOPIFY.apiVersion}/graphql.json`;

/**
 * Brand claims rendered in the announcement strip. Every flag must be
 * backed by current written evidence.
 *
 * Lightforce stockist/dealer messaging is disabled until written
 * authorisation for Roamforge is retained in the compliance record.
 */
export const BRAND_CLAIMS = {
  australianOwned: true,
  lightforceStockist: false,
  authorisedLightforceDealer: false,
} as const;

/**
 * Public analytics identifiers. A GA4 Measurement ID is a client-side public
 * identifier (it ships in every page that loads gtag.js) — it is not a secret
 * and carries no write access. The env var still wins so forks/previews can
 * point at their own property; the fallback is Roamforge's verified
 * production web-stream ID so live tracking works without build-time env.
 */
const ENV_GA4 =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_GA4_MEASUREMENT_ID : undefined;

const ENV_META =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_META_PIXEL_ID : undefined;

/**
 * Normalise a public numeric analytics ID. Env values are frequently pasted
 * with stray quotes/whitespace ("'1043681748196165'"), which would make the
 * pixel init silently fail — strip everything that is not a digit and reject
 * anything that is not a plausible ID.
 */
export function sanitizeNumericId(value: unknown): string {
  const digits = (typeof value === "string" ? value : "").replace(/[^0-9]/g, "");
  return /^\d{6,}$/.test(digits) ? digits : "";
}

export const ANALYTICS = {
  ga4MeasurementId: ((ENV_GA4 as string) || "G-QGGYL7FRLG").trim(),
  // Meta Pixel: intentionally NO hardcoded fallback. Shopify Customer Events
  // was directly verified as the authoritative Meta integration — the
  // Facebook & Instagram channel reports "Optimized" with both Server and Web
  // collection, so Shopify already emits browser + CAPI events for this
  // dataset. Loading a second top-level pixel here would duplicate events.
  // Setting VITE_META_PIXEL_ID explicitly re-enables the storefront pixel.
  metaPixelId: sanitizeNumericId(ENV_META as string),
} as const;
