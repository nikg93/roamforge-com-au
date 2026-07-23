import { useEffect, useState } from "react";
import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { fetchProductsPage, type ProductPage, type ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CATEGORY_MAP, isCategorySlug } from "@/lib/categories";
import { canonicalFor, SITE_URL } from "@/lib/seo";

function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

const PAGE_SIZE = 24;

const categoryQuery = (slug: string, q: string) =>
  queryOptions({
    queryKey: ["products", "category", slug],
    queryFn: () => fetchProductsPage(PAGE_SIZE, q, null),
    staleTime: 60_000,
    retry: 1,
    retryDelay: 500,
  });

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    if (!isCategorySlug(params.slug)) throw notFound();
  },
  loader: ({ params, context }) => {
    if (!isCategorySlug(params.slug)) return;
    return context.queryClient.ensureQueryData(
      categoryQuery(params.slug, CATEGORY_MAP[params.slug].query),
    );
  },
  head: ({ params, loaderData }) => {
    const cfg = isCategorySlug(params.slug) ? CATEGORY_MAP[params.slug] : undefined;
    const title = cfg ? `${cfg.label} — Roamforge` : "Roamforge";
    const desc = cfg?.description ?? "Roamforge gear.";
    const url = canonicalFor(`/category/${params.slug}`);
    const absImage = cfg?.image ? toAbsoluteUrl(cfg.image) : undefined;
    const page = loaderData as ProductPage | undefined;
    const products = page?.products ?? [];
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(absImage
          ? [
              { property: "og:image", content: absImage },
              { name: "twitter:image", content: absImage },
            ]
          : []),
        { name: "robots", content: cfg ? "index, follow" : "noindex, follow" },
      ],
      links: cfg ? [{ rel: "canonical", href: url }] : [],
      scripts: cfg
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Shop",
                    item: `${SITE_URL}/shop`,
                  },
                  { "@type": "ListItem", position: 3, name: cfg.label, item: url },
                ],
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: cfg.label,
                description: cfg.description,
                url,
                mainEntity: {
                  "@type": "ItemList",
                  numberOfItems: products.length,
                  itemListElement: products.slice(0, 20).map((p, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: `${SITE_URL}/product/${p.node.handle}`,
                    name: p.node.title,
                  })),
                },
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">CATEGORY NOT FOUND</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The category you're looking for doesn't exist. Browse all categories from the homepage.
        </p>
        <Link to="/" className="mt-6 inline-block text-rf-tan underline">
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ reset }) => <CategoryErrorFallback reset={reset} />,
  component: CategoryPage,
});

function CategoryErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Category products couldn't load. Please check your connection and try again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
          >
            RETRY
          </button>
          <Link
            to="/"
            className="min-h-11 inline-flex items-center justify-center border border-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
          >
            BACK TO SHOP
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const cfg = isCategorySlug(slug) ? CATEGORY_MAP[slug] : undefined;
  const { data: initial } = useSuspenseQuery(categoryQuery(slug, cfg?.query ?? ""));
  const [extra, setExtra] = useState<ShopifyProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(initial?.pageInfo.endCursor ?? null);
  const [hasNext, setHasNext] = useState<boolean>(!!initial?.pageInfo.hasNextPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // Reset pagination state whenever the slug changes so switching categories
  // never leaks products from a previous category into the grid.
  useEffect(() => {
    setExtra([]);
    setCursor(initial?.pageInfo.endCursor ?? null);
    setHasNext(!!initial?.pageInfo.hasNextPage);
    setLoadMoreError(null);
  }, [slug, initial]);
  if (!cfg) return null;

  const seen = new Set<string>();
  const products = [...(initial?.products ?? []), ...extra].filter((p) => {
    if (seen.has(p.node.id)) return false;
    seen.add(p.node.id);
    return true;
  });

  const onLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const next = await fetchProductsPage(PAGE_SIZE, cfg.query, cursor);
      setExtra((cur) => [...cur, ...next.products]);
      setCursor(next.pageInfo.endCursor);
      setHasNext(next.pageInfo.hasNextPage);
    } catch (err) {
      console.error("[category] load more failed", err);
      setLoadMoreError("Couldn't load more products. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <section className="relative bg-rf-dark overflow-hidden">
          {cfg.image && (
            <img
              src={cfg.image}
              alt={cfg.label}
              width={1600}
              height={600}
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 1600px"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-rf-dark via-rf-dark/70 to-rf-dark/30" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-20 sm:py-24 text-rf-cream">
            <p className="font-display tracking-[0.3em] text-rf-tan text-xs">CATEGORY</p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">{cfg.label}</h1>
            <p className="mt-3 max-w-xl text-sm text-rf-cream/85">{cfg.description}</p>
            <nav aria-label="Breadcrumb" className="mt-4 text-xs text-rf-cream/75">
              <Link to="/" className="hover:text-rf-tan">
                Home
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link to="/shop" className="hover:text-rf-tan">
                Shop
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="text-rf-cream">{cfg.label}</span>
            </nav>
          </div>
        </section>
        <section className="bg-rf-cream py-14 flex-1">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionHeading>{cfg.label}</SectionHeading>
            {products.length > 0 && (
              <p
                className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground"
                aria-live="polite"
              >
                Showing {products.length} {products.length === 1 ? "product" : "products"}
                {hasNext ? " — load more below" : ""}
              </p>
            )}
            <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.length === 0 ? (
                <EmptyProducts />
              ) : (
                products.map((p) => <ProductCard key={p.node.id} product={p} />)
              )}
            </div>
            {hasNext && products.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-3">
                {loadMoreError && (
                  <p role="alert" className="text-sm text-destructive">
                    {loadMoreError}
                  </p>
                )}
                <Button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="min-h-11 min-w-44 rounded-none border-rf-dark text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
                  aria-label="Load more products"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading…
                    </>
                  ) : (
                    "LOAD MORE"
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
