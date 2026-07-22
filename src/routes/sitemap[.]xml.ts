import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchAllProductHandles } from "@/lib/shopify";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";

const BASE_URL = SITE.url;

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "weekly", priority: "0.9" },
  ...CATEGORIES.map((c) => ({
    path: `/category/${c.slug}`,
    changefreq: "weekly" as const,
    priority: "0.9",
  })),
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping", changefreq: "monthly", priority: "0.5" },
  { path: "/returns", changefreq: "monthly", priority: "0.5" },
  { path: "/warranty", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let productEntries: SitemapEntry[] = [];
        try {
          // Paginate every live handle. Falls back to static entries only if
          // Shopify fails — the sitemap still validates and remains useful.
          const handles = await fetchAllProductHandles(100);
          productEntries = handles.map((h) => ({
            path: `/product/${h}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          }));
        } catch (err) {
          console.error("[sitemap] product handle fetch failed", err);
        }

        // De-duplicate by path so accidental duplicates never emit twice.
        const seen = new Set<string>();
        const entries: SitemapEntry[] = [];
        for (const e of [...staticEntries, ...productEntries]) {
          if (seen.has(e.path)) continue;
          seen.add(e.path);
          entries.push(e);
        }

        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${xmlEscape(`${BASE_URL}${e.path}`)}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            // 1h edge cache, allow stale for a day so a Shopify blip doesn't
            // wipe the sitemap for crawlers.
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
