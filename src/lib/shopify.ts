import { SHOPIFY, SHOPIFY_STOREFRONT_URL } from "./site";

// Re-exported for backwards compatibility with existing imports.
export const SHOPIFY_API_VERSION = SHOPIFY.apiVersion;
export const SHOPIFY_STORE_PERMANENT_DOMAIN = SHOPIFY.storeDomain;
export { SHOPIFY_STOREFRONT_URL };
export const SHOPIFY_STOREFRONT_TOKEN = SHOPIFY.storefrontToken;

/** Thrown by storefrontApiRequest when Shopify billing is not active (HTTP 402). */
export class ShopifyBillingError extends Error {
  status = 402 as const;
  constructor() {
    super(
      "Shopify Storefront API returned 402 Payment Required. The store needs an active Shopify billing plan.",
    );
    this.name = "ShopifyBillingError";
  }
}

/** Thrown by storefrontApiRequest for GraphQL / HTTP failures. */
export class ShopifyRequestError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ShopifyRequestError";
  }
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    /** Rich-text HTML. Only present in detail query. Sanitize before render. */
    descriptionHtml?: string;
    handle: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    seo?: { title: string | null; description: string | null };
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
    featuredImage?: { url: string; altText: string | null } | null;
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          sku?: string | null;
          price: { amount: string; currencyCode: string };
          compareAtPrice?: { amount: string; currencyCode: string } | null;
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

function assertShopifyConfig() {
  if (!SHOPIFY.storeDomain || !SHOPIFY.storefrontToken) {
    throw new ShopifyRequestError(
      "Shopify Storefront is not configured. Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.",
    );
  }
}

/**
 * Runs a Storefront GraphQL request.
 *
 * NOTE: this module is imported by SSR route loaders and the sitemap handler,
 * so it MUST stay free of browser-only side effects (no `toast`, no window
 * access). Callers are responsible for surfacing failures via route error
 * boundaries or their own UI.
 */
export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  assertShopifyConfig();

  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) throw new ShopifyBillingError();
  if (!response.ok) {
    throw new ShopifyRequestError(`Shopify HTTP ${response.status}`, response.status);
  }

  const data = await response.json();
  if (data.errors) {
    throw new ShopifyRequestError(
      `Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
  return data;
}

// Lightweight query for grids/search: only the fields the card renders.
export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title handle vendor
          priceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          variants(first: 1) {
            edges { node { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
          }
        }
      }
    }
  }
`;

// Rich detail query for the product route: description HTML, SEO, vendor,
// SKU, compare-at price, all images and variants.
export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id title handle vendor productType tags
      description descriptionHtml
      seo { title description }
      priceRange { minVariantPrice { amount currencyCode } }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      featuredImage { url altText }
      images(first: 10) { edges { node { url altText } } }
      variants(first: 25) {
        edges {
          node {
            id title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

// Handle-only pagination query for the sitemap. Kept tiny to minimise cost.
const PRODUCT_HANDLES_QUERY = `
  query ProductHandles($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges { cursor node { handle } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function fetchProducts(first = 20, query?: string): Promise<ShopifyProduct[]> {
  const availabilityQuery = "available_for_sale:true";
  const combinedQuery = query ? `(${query}) AND ${availabilityQuery}` : availabilityQuery;
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, query: combinedQuery });
  const edges = data?.data?.products?.edges ?? [];
  return edges.map((e: { node: ShopifyProduct["node"] }) => {
    const img = e.node.featuredImage;
    const withImages: ShopifyProduct["node"] = {
      ...e.node,
      description: e.node.description ?? "",
      images: img ? { edges: [{ node: img }] } : { edges: [] },
      options: e.node.options ?? [],
    };
    return { node: withImages };
  });
}

export async function fetchProductByHandle(handle: string) {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const product = data?.data?.product;
  if (!product) return null;
  return { node: product } as ShopifyProduct;
}

/**
 * Paginate every published product handle. Used by the sitemap; kept as its
 * own tiny query so we don't ship the full product payload just to build URLs.
 * Bounded by `maxPages` as a safety fuse for huge stores.
 */
export async function fetchAllProductHandles(
  pageSize = 100,
  maxPages = 50,
): Promise<string[]> {
  const handles: string[] = [];
  let after: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const data: { data?: { products?: { edges: Array<{ node: { handle: string } }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } } =
      await storefrontApiRequest(PRODUCT_HANDLES_QUERY, { first: pageSize, after });
    const page = data?.data?.products;
    if (!page) break;
    for (const e of page.edges) handles.push(e.node.handle);
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return handles;
}
