import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { storefrontApiRequest } from "@/lib/shopify";
import { SITE } from "@/lib/site";

/**
 * Google Merchant Center supplemental feed.
 *
 * Overrides the customer-facing `link` / `canonical_link` and assigns
 * shipping labels that reflect Shopify's active delivery profiles. Shopify
 * remains the authoritative source for price, availability and every other
 * product attribute.
 *
 * Offer ids follow the Shopify sales-channel convention:
 *   shopify_<COUNTRY>_<numeric product id>_<numeric variant id>
 * with ZZ as the Shopify-assigned feed region label already used in Merchant
 * Center for this store.
 */
const FEED_COUNTRY = "ZZ";

const PRODUCT_SHIPPING_LABELS: Record<string, string> = {
  "15054622458221": "supplier-aob",
  "15054623146349": "supplier-aob",
  "15054623637869": "supplier-aob",
  "15054623998317": "supplier-aob",
  "15054624588141": "supplier-aob",
  "15054626161005": "supplier-aob",
  "15054627111277": "supplier-aob",
  "15064334795117": "supplier-aob",
  "15064337580397": "supplier-aob",
  "15064337809773": "supplier-aob",
  "15064338006381": "supplier-aob",
  "15064338694509": "supplier-aob",
  "15064339153261": "supplier-aob",
  "15064340889965": "supplier-aob",
  "15064341643629": "supplier-aob",
  "15052787581293": "courier-oversize",
  "15052787679597": "courier-oversize",
  "15052788597101": "courier-oversize",
  "15054046036333": "courier-oversize",
  "15054046069101": "courier-oversize",
  "15054046134637": "courier-oversize",
  "15054046167405": "courier-oversize",
  "15061536866669": "courier-oversize",
  "15061537358189": "courier-oversize",
  "15061542273389": "courier-oversize",
  "15061542928749": "courier-oversize",
  "15061543125357": "courier-oversize",
  "15061545222509": "courier-oversize",
  "15088507715949": "courier-oversize",
  "15061547712877": "freight-pallet",
  "15061548532077": "freight-pallet",
  "15061549613421": "freight-pallet",
};

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
            const shippingLabel = PRODUCT_SHIPPING_LABELS[productId] ?? "";

            for (const variant of edge.node.variants.edges) {
              const variantId = numericId(variant.node.id);
              if (!variantId) continue;

              const id = `shopify_${FEED_COUNTRY}_${productId}_${variantId}`;
              if (seen.has(id)) continue;
              seen.add(id);
              rows.push(`${id}\t${url}\t${url}\t${shippingLabel}`);
            }
          }

          if (!page.pageInfo.hasNextPage) break;
          after = page.pageInfo.endCursor;
        }

        const body =
          ["id\tlink\tcanonical_link\tshipping_label", ...rows].join("\n") + "\n";

        return new Response(body, {
          headers: {
            "Content-Type": "text/tab-separated-values; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
