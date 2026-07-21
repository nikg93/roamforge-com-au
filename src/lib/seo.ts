// SEO helpers. Canonical URLs always point at https://roamforge.com.au — never at
// preview/lovable hosts — so crawlers attribute content to the production domain.
export const SITE_URL = "https://roamforge.com.au";

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
  if (input.image) {
    meta.push({ property: "og:image", content: input.image });
    meta.push({ name: "twitter:image", content: input.image });
  }
  if (input.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return {
    meta,
    links: input.noindex ? [] : [{ rel: "canonical", href: url }],
  };
}