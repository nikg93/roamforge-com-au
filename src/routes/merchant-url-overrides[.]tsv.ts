import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { storefrontApiRequest } from "@/lib/shopify";
import { SITE } from "@/lib/site";

/**
 * Google Merchant Center supplemental feed.
 *
 * Overrides only the customer-facing `link` / `canonical_link` of each offer
 * so shoppers land on the public Roamforge storefront. Shopify remains the
 * authoritative source for price, availability and every other attribute.
 *
 * Offer ids follow the Shopify sales-channel convention:
 *   shopify_<COUNTRY>_<numeric product id>_<numeric variant id>
 * with ZZ as the Shopify-assigned feed region label already used in Merchant
 * Center for this store.
 */
const FEED_COUNTRY = "ZZ";

const OFFERS_QUERY = `
  query MerchantOffers($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          handle
          variants(first: 250) {
            edges { node { id } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/** Extract the trailing numeric id from a Shopify GID. Empty when absent. */
function numericId(gid: string): string {
  const m = /(\d+)(?:\?.*)?$/.exec(gid ?? "");
  return m ? m[1] : "";
}

interface OffersPage {
  data?: {
    products?: {
      edges: Array<{
        node: {
          id: string;
          handle: string;
          variants: { edges: Array<{ node: { id: string } }> };
        };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
}

export const Route = createFileRoute("/merchant-url-overrides.tsv")({
  server: {
    handlers: {
      GET: async () => {
        const rows: string[] = [];
        const seen = new Set<string>();
        let after: string | null = null;

        // Same availability predicate as the storefront grid and sitemap, so
        // the feed only ever points at URLs the PDP loader can resolve.
        for (let i = 0; i < 50; i++) {
          const data: OffersPage = await storefrontApiRequest(OFFERS_QUERY, {
            first: 50,
            after,
            query: "available_for_sale:true",
          });
          const page = data?.data?.products;
          if (!page) break;
          for (const edge of page.edges) {
            const productId = numericId(edge.node.id);
            const handle = edge.node.handle;
            if (!productId || !handle) continue;
            const url = `${SITE.url}/product/${handle}`;
            for (const v of edge.node.variants.edges) {
              const variantId = numericId(v.node.id);
              if (!variantId) continue;
              const id = `shopify_${FEED_COUNTRY}_${productId}_${variantId}`;
              if (seen.has(id)) continue;
              seen.add(id);
              rows.push(`${id}\t${url}\t${url}`);
            }
          }
          if (!page.pageInfo.hasNextPage) break;
          after = page.pageInfo.endCursor;
        }

        const body = ["id\tlink\tcanonical_link", ...rows].join("\n") + "\n";

        return new Response(body, {
          headers: {
            "Content-Type": "text/tab-separated-values; charset=utf-8",
            "Cache-Control":
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
