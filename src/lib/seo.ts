// SEO helpers. Canonical URLs always point at the production domain from
// SITE (src/lib/site.ts) so crawlers attribute content to roamforge.com.au —
// never preview / lovable hosts.
import { SITE } from "./site";

// Re-export for callers that historically imported SITE_URL from here.
export const SITE_URL = SITE.url;

// Branded default social preview served from our own domain. Used whenever
// a route doesn't provide a page-specific hero image, so shared links show
// Roamforge branding instead of an auto-generated preview screenshot.
export const DEFAULT_OG_IMAGE = `${SITE.url}/og-default.jpg`;

export function canonicalFor(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Strip trailing slash except for root, and drop any query string.
  const noQuery = clean.split("?")[0];
  const normalized = noQuery.length > 1 && noQuery.endsWith("/") ? noQuery.slice(0, -1) : noQuery;
  return `${SITE_URL}${normalized}`;
}

export interface RouteMetaInput {
  path: string;
  title: string;
  description: string;
  /** Absolute https URL to a route-specific hero/cover image. Never a Vite-hashed asset URL. */
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
}

export function routeMeta(input: RouteMetaInput) {
  const url = canonicalFor(input.path);
  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:type", content: input.type ?? "website" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
  ];
  // Prefer a page-specific absolute image; otherwise fall back to a
  // branded default hosted on our own domain so shared links never rely on
  // an auto-generated preview screenshot.
  const image = input.image && /^https?:\/\//i.test(input.image) ? input.image : DEFAULT_OG_IMAGE;
  meta.push({ property: "og:image", content: image });
  meta.push({ name: "twitter:image", content: image });
  if (input.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return {
    meta,
    // No canonical on noindex pages — canonicalising a not-found or error
    // page would encourage crawlers to index it under the canonical URL.
    links: input.noindex ? [] : [{ rel: "canonical", href: url }],
  };
}
