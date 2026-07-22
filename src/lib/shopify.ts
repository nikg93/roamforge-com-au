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
  constructor(
    message: string,
    public status?: number,
  ) {
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 11_000);
  // Extract the GraphQL operation name for diagnostic logs — no token/PII.
  const opName = /(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? "anonymous";

  let response: Response;
  try {
    response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    console.error("[shopify] network failure", { op: opName, aborted });
    throw new ShopifyRequestError(
      aborted
        ? `Shopify request timed out (${opName}).`
        : `Shopify request failed to reach the network (${opName}).`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 402) throw new ShopifyBillingError();
  if (!response.ok) {
    console.error("[shopify] http error", { op: opName, status: response.status });
    throw new ShopifyRequestError(`Shopify HTTP ${response.status}`, response.status);
  }

  let data: { errors?: Array<{ message: string }>; data?: unknown };
  try {
    data = await response.json();
  } catch (err) {
    console.error("[shopify] invalid JSON", { op: opName, err });
    throw new ShopifyRequestError(`Shopify returned invalid JSON (${opName}).`);
  }
  if (data.errors) {
    console.error("[shopify] graphql errors", { op: opName, errors: data.errors });
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
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          variants(first: 10) {
            edges {
              node {
                id title sku availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

// Grid query with cursor-based pagination for category pages.
export const PRODUCTS_PAGE_QUERY = `
  query GetProductsPage($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          id title handle vendor
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          variants(first: 10) {
            edges {
              node {
                id title sku availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
              }
            }
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

// Predictive search: Shopify's purpose-built autocomplete endpoint. Faster
// and more relevant than wildcard products(query:) — used by the search UI.
const PREDICTIVE_SEARCH_QUERY = `
  query PredictiveSearch($query: String!, $limit: Int!) {
    predictiveSearch(query: $query, limit: $limit, types: [PRODUCT]) {
      products {
        id title handle vendor
        priceRange { minVariantPrice { amount currencyCode } }
        featuredImage { url altText }
      }
    }
  }
`;

export async function predictiveSearchProducts(
  query: string,
  limit = 10,
): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(PREDICTIVE_SEARCH_QUERY, { query, limit });
  const rows = data?.data?.predictiveSearch?.products ?? [];
  return rows.map((n: ShopifyProduct["node"]) => {
    const img = n.featuredImage;
    return {
      node: {
        ...n,
        description: n.description ?? "",
        images: img ? { edges: [{ node: img }] } : { edges: [] },
        variants: n.variants ?? { edges: [] },
        options: n.options ?? [],
      },
    } as ShopifyProduct;
  });
}

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

export interface ProductPage {
  products: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

/**
 * Cursor-paginated fetch for category grids. Returns products plus
 * pageInfo so callers can render a Load More affordance.
 */
export async function fetchProductsPage(
  first = 24,
  query?: string,
  after?: string | null,
): Promise<ProductPage> {
  const availabilityQuery = "available_for_sale:true";
  const combinedQuery = query ? `(${query}) AND ${availabilityQuery}` : availabilityQuery;
  const data = await storefrontApiRequest(PRODUCTS_PAGE_QUERY, {
    first,
    after: after ?? null,
    query: combinedQuery,
  });
  const page = data?.data?.products;
  const edges = page?.edges ?? [];
  const products: ShopifyProduct[] = edges.map((e: { node: ShopifyProduct["node"] }) => {
    const img = e.node.featuredImage;
    return {
      node: {
        ...e.node,
        description: e.node.description ?? "",
        images: img ? { edges: [{ node: img }] } : { edges: [] },
        options: e.node.options ?? [],
      },
    };
  });
  return {
    products,
    pageInfo: {
      hasNextPage: !!page?.pageInfo?.hasNextPage,
      endCursor: page?.pageInfo?.endCursor ?? null,
    },
  };
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
export async function fetchAllProductHandles(pageSize = 100, maxPages = 50): Promise<string[]> {
  const handles: string[] = [];
  let after: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const data: {
      data?: {
        products?: {
          edges: Array<{ node: { handle: string } }>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      };
    } = await storefrontApiRequest(PRODUCT_HANDLES_QUERY, { first: pageSize, after });
    const page = data?.data?.products;
    if (!page) break;
    for (const e of page.edges) handles.push(e.node.handle);
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return handles;
}
