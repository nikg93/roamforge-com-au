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
  apiVersion: "2025-07",
  // Fallbacks are the current published Storefront credentials; they keep
  // production working until the deploy env sets the VITE_ vars.
  storeDomain: (ENV_DOMAIN as string) || "xmszfz-pj.myshopify.com",
  storefrontToken: (ENV_TOKEN as string) || "3fe65ac91d37eb6061771366ba9d1393",
} as const;

export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY.storeDomain}/api/${SHOPIFY.apiVersion}/graphql.json`;
