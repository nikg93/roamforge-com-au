import { SHOPIFY, SHOPIFY_STOREFRONT_URL } from "./site";

// Re-exported for backwards compatibility with existing imports.
export const SHOPIFY_API_VERSION = SHOPIFY.apiVersion;
export const SHOPIFY_STORE_PERMANENT_DOMAIN = SHOPIFY.storeDomain;
export { SHOPIFY_STOREFRONT_URL };
export const SHOPIFY_STOREFRONT_TOKEN = SHOPIFY.storefrontToken;

/**
 * Build a responsive srcset for a Shopify CDN image URL. Shopify's image CDN
 * honours a `width` query param and reformats the source, so we can request
 * multiple sizes for the browser to pick from.
 */
export function shopifySrcSet(url: string, widths: number[] = [400, 600, 900, 1200, 1600]): string {
  try {
    return widths
      .map((w) => {
        const u = new URL(url);
        u.searchParams.set("width", String(w));
        return `${u.toString()} ${w}w`;
      })
      .join(", ");
  } catch {
    return "";
  }
}

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
    /** Product-level availability. Reflects Shopify's overall stock signal
     * across every variant, not just the first 10 we ship to the card. */
    availableForSale?: boolean;
    /** Shopify's own resolution of "the variant a customer should see first".
     * Prefer this over scanning `variants.edges` — it survives beyond the
     * variants(first:) limit and matches Shopify's own storefronts. */
    selectedOrFirstAvailableVariant?: {
      id: string;
      title: string;
      sku?: string | null;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      compareAtPrice?: { amount: string; currencyCode: string } | null;
      image?: { url: string; altText: string | null } | null;
      selectedOptions: Array<{ name: string; value: string }>;
    } | null;
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
          image?: { url: string; altText: string | null } | null;
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

  // GraphQL responses vary per operation; callers narrow.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
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
          id title handle vendor availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          selectedOrFirstAvailableVariant {
            id title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

// Grid query with cursor-based pagination for category pages.
export const PRODUCTS_PAGE_QUERY = `
  query GetProductsPage($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          id title handle vendor availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          selectedOrFirstAvailableVariant {
            id title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText }
            selectedOptions { name value }
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
      id title handle vendor productType tags availableForSale
      description descriptionHtml
      seo { title description }
      priceRange { minVariantPrice { amount currencyCode } }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      featuredImage { url altText }
      images(first: 20) { edges { node { url altText } } }
      selectedOrFirstAvailableVariant {
        id title sku availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        image { url altText }
        selectedOptions { name value }
      }
      variants(first: 100) {
        edges {
          node {
            id title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText }
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
  // Sanitize: strip GraphQL-breaking quotes/backslashes and control chars,
  // then clamp to Shopify's documented limits (predictiveSearch: 1–10).
  const cleaned = query
    .replace(/["\\]/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, " ")
    .trim();
  if (!cleaned) return [];
  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit) || 10));
  const shape = (rows: ShopifyProduct["node"][]) =>
    rows.map((n) => {
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

  try {
    const data = await storefrontApiRequest(PREDICTIVE_SEARCH_QUERY, {
      query: cleaned,
      limit: safeLimit,
    });
    const rows = data?.data?.predictiveSearch?.products ?? [];
    if (rows.length > 0) return shape(rows);
    // Fall through to products(query:) fallback when predictiveSearch is empty.
  } catch (err) {
    console.warn("[shopify] predictiveSearch failed, falling back to products()", err);
  }

  // Fallback: standard products query with a permissive title/vendor/tag
  // predicate. Never fabricates — returns whatever Shopify actually matches.
  try {
    const terms = cleaned.split(/\s+/).filter(Boolean).slice(0, 6);
    const clauses = terms.map(
      (t) => `(title:*${t}* OR vendor:*${t}* OR tag:*${t}* OR product_type:*${t}*)`,
    );
    const fallbackQuery = clauses.join(" AND ");
    const rows = await fetchProducts(safeLimit, fallbackQuery);
    return rows;
  } catch (err) {
    console.error("[shopify] fallback search failed", err);
    throw err;
  }
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
      variants: e.node.variants ?? { edges: [] },
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
        variants: e.node.variants ?? { edges: [] },
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

// Best-selling / featured product query for the homepage. Storefront API
// supports the BEST_SELLING sortKey out of the box — we do not invent
// popularity signals. If Shopify returns an empty list (e.g. store has no
// sales history) the caller falls back to a neutral "Featured Gear" heading.
export const FEATURED_PRODUCTS_QUERY = `
  query FeaturedProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING, query: "available_for_sale:true") {
      edges {
        node {
          id title handle vendor availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          selectedOrFirstAvailableVariant {
            id title sku availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            image { url altText }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

export async function fetchFeaturedProducts(first = 8): Promise<ShopifyProduct[]> {
  return fetchFeaturedProductsImpl(first);
}

// Shopify's own recommendation graph — same shape as the grid query.
const PRODUCT_RECOMMENDATIONS_QUERY = `
  query ProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id title handle vendor availableForSale
      priceRange { minVariantPrice { amount currencyCode } }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      featuredImage { url altText }
      selectedOrFirstAvailableVariant {
        id title sku availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        image { url altText }
        selectedOptions { name value }
      }
    }
  }
`;

async function fetchFeaturedProductsImpl(first: number): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(FEATURED_PRODUCTS_QUERY, { first });
  const edges = data?.data?.products?.edges ?? [];
  return edges.map((e: { node: ShopifyProduct["node"] }) => {
    const img = e.node.featuredImage;
    return {
      node: {
        ...e.node,
        description: e.node.description ?? "",
        images: img ? { edges: [{ node: img }] } : { edges: [] },
        variants: e.node.variants ?? { edges: [] },
        options: e.node.options ?? [],
      },
    };
  });
}

/**
 * Related-product search. Uses vendor/productType/tags to build a
 * Storefront `query` predicate, excluding the current product and any that
 * come back unavailable. Returns up to `limit` products, or an empty list
 * if Shopify can't find a good match — never fabricates.
 */
export async function fetchRelatedProducts(
  currentHandle: string,
  opts: { productId?: string; vendor?: string; productType?: string; tags?: string[] },
  limit = 4,
): Promise<ShopifyProduct[]> {
  // Prefer Shopify's own productRecommendations API when we have a product id.
  // Falls back to a vendor / productType / tag query if the API returns nothing.
  if (opts.productId) {
    try {
      const rec = await storefrontApiRequest(PRODUCT_RECOMMENDATIONS_QUERY, {
        productId: opts.productId,
      });
      const rows: Array<ShopifyProduct["node"]> = rec?.data?.productRecommendations ?? [];
      const shaped: ShopifyProduct[] = [];
      const seen = new Set<string>();
      for (const n of rows) {
        if (!n || n.handle === currentHandle) continue;
        if (n.availableForSale === false) continue;
        if (seen.has(n.handle)) continue;
        seen.add(n.handle);
        const img = n.featuredImage;
        shaped.push({
          node: {
            ...n,
            description: n.description ?? "",
            images: img ? { edges: [{ node: img }] } : { edges: [] },
            variants: n.variants ?? { edges: [] },
            options: n.options ?? [],
          },
        });
        if (shaped.length >= limit) break;
      }
      if (shaped.length > 0) return shaped;
    } catch {
      // Fall through to vendor/tag query below.
    }
  }

  const clauses: string[] = [];
  const safe = (s: string) => s.replace(/["\\]/g, "").trim();
  if (opts.vendor && opts.vendor.trim()) clauses.push(`vendor:"${safe(opts.vendor)}"`);
  if (opts.productType && opts.productType.trim())
    clauses.push(`product_type:"${safe(opts.productType)}"`);
  const catTag = (opts.tags ?? []).find((t) => /^cat-/i.test(t));
  if (catTag) clauses.push(`tag:"${safe(catTag)}"`);
  if (clauses.length === 0) return [];
  const query = `(${clauses.join(" OR ")}) AND available_for_sale:true`;
  const data = await storefrontApiRequest(PRODUCTS_QUERY, {
    first: limit + 4,
    query,
  });
  const edges: Array<{ node: ShopifyProduct["node"] }> = data?.data?.products?.edges ?? [];
  const out: ShopifyProduct[] = [];
  for (const e of edges) {
    if (e.node.handle === currentHandle) continue;
    if (e.node.availableForSale === false) continue;
    const img = e.node.featuredImage;
    out.push({
      node: {
        ...e.node,
        description: e.node.description ?? "",
        images: img ? { edges: [{ node: img }] } : { edges: [] },
        variants: e.node.variants ?? { edges: [] },
        options: e.node.options ?? [],
      },
    });
    if (out.length >= limit) break;
  }
  return out;
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
