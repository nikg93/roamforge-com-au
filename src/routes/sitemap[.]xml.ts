import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchProducts } from "@/lib/shopify";

const BASE_URL = "https://roamforge.com.au";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/category/electrical", changefreq: "weekly", priority: "0.9" },
  { path: "/category/recovery", changefreq: "weekly", priority: "0.9" },
  { path: "/category/lighting", changefreq: "weekly", priority: "0.8" },
  { path: "/category/monitoring", changefreq: "weekly", priority: "0.8" },
  { path: "/category/gps", changefreq: "weekly", priority: "0.8" },
  { path: "/category/performance", changefreq: "weekly", priority: "0.8" },
  { path: "/category/touring", changefreq: "weekly", priority: "0.8" },
  { path: "/category/compressors", changefreq: "weekly", priority: "0.8" },
  { path: "/category/nudge", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping", changefreq: "monthly", priority: "0.5" },
  { path: "/returns", changefreq: "monthly", priority: "0.5" },
  { path: "/warranty", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let productEntries: SitemapEntry[] = [];
        try {
          const products = await fetchProducts(100);
          productEntries = products.map((p) => ({
            path: `/product/${p.node.handle}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          }));
        } catch {
          // fall back to static entries only
        }
        const urls = [...staticEntries, ...productEntries]
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
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
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});