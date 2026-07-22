import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { fetchProductsPage, type ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { routeMeta, SITE_URL } from "@/lib/seo";

const PAGE_SIZE = 24;

const shopQuery = queryOptions({
  queryKey: ["products", "shop", "all"],
  queryFn: () => fetchProductsPage(PAGE_SIZE, undefined, null),
  staleTime: 60_000,
  retry: 1,
  retryDelay: 500,
});

export const Route = createFileRoute("/shop")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  head: () => ({
    ...routeMeta({
      path: "/shop",
      title: "Shop All Gear — Roamforge",
      description:
        "Browse every product at Roamforge — 4WD, camping, touring and recovery gear selected for Australian adventures.",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Shop All Gear",
          url: `${SITE_URL}/shop`,
        }),
      },
    ],
  }),
  errorComponent: ({ reset }) => <ShopErrorFallback reset={reset} />,
  component: ShopPage,
});

function ShopErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Products couldn&apos;t load. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            router.invalidate();
          }}
          className="mt-6 min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
        >
          RETRY
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

function ShopPage() {
  const { data: initial } = useSuspenseQuery(shopQuery);
  const [extra, setExtra] = useState<ShopifyProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(initial?.pageInfo.endCursor ?? null);
  const [hasNext, setHasNext] = useState<boolean>(!!initial?.pageInfo.hasNextPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

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
      const next = await fetchProductsPage(PAGE_SIZE, undefined, cursor);
      setExtra((cur) => [...cur, ...next.products]);
      setCursor(next.pageInfo.endCursor);
      setHasNext(next.pageInfo.hasNextPage);
    } catch (err) {
      console.error("[shop] load more failed", err);
      setLoadMoreError("Couldn't load more products. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="flex-1 flex flex-col">
        <section className="bg-rf-dark py-16 text-rf-cream">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <p className="font-display tracking-[0.3em] text-rf-tan text-xs">SHOP ALL</p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">THE FULL RANGE</h1>
            <p className="mt-3 max-w-xl text-sm text-rf-cream/85">
              Every product currently available at Roamforge.
            </p>
            <nav aria-label="Breadcrumb" className="mt-4 text-xs text-rf-cream/70">
              <Link to="/" className="hover:text-rf-tan">
                Home
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="text-rf-cream">Shop All</span>
            </nav>
          </div>
        </section>
        <section className="bg-rf-cream py-14 flex-1">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionHeading>ALL PRODUCTS</SectionHeading>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
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
