import { useEffect } from "react";
import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
  stripSearchParams,
} from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { CataloguePagination } from "@/components/CataloguePagination";
import { fetchTwoPhaseNumberedPage } from "@/lib/shopify";
import { PAGE_SIZE, pageRange, parsePageParam } from "@/lib/pagination";
import { canonicalForPage, routeMeta, SITE_URL } from "@/lib/seo";
import { trackViewItemList, toAnalyticsItem } from "@/lib/analytics";

// Merchandising rule: surface core 4WD gear first, put Roamforge merch
// (apparel / caps) at the end of the flat Shop All list. Numbered pages
// paginate the core catalogue first, then merch — a stable, duplicate-free
// ordering that every `?page=N` URL resolves against identically.
const SHOP_CORE_QUERY = "-tag:cat-merch";
const SHOP_MERCH_QUERY = "tag:cat-merch";

const shopQuery = (page: number) =>
  queryOptions({
    queryKey: ["products", "shop", "page", page],
    queryFn: async () => {
      const res = await fetchTwoPhaseNumberedPage(
        page,
        PAGE_SIZE,
        SHOP_CORE_QUERY,
        SHOP_MERCH_QUERY,
      );
      // Beyond the end of the catalogue: a real 404, never an empty
      // indexable page or a silent redirect to page 1.
      if (!res) throw notFound();
      return res;
    },
    staleTime: 60_000,
    retry: 1,
    retryDelay: 500,
  });

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { page: number } => ({
    page: parsePageParam(search.page),
  }),
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(shopQuery(deps.page)),
  head: ({ loaderData }) => {
    const page = loaderData?.page ?? 1;
    const totalPages = loaderData?.totalPages ?? 1;
    const url = canonicalForPage("/shop", page);
    const base = routeMeta({
      path: "/shop",
      title:
        page > 1
          ? `Shop All Gear — Page ${page} of ${totalPages} — Roamforge`
          : "Shop All Gear — Roamforge",
      description:
        page > 1
          ? `Page ${page} of every product at Roamforge — 4WD, camping, touring and recovery gear selected for Australian adventures.`
          : "Browse every product at Roamforge — 4WD, camping, touring and recovery gear selected for Australian adventures.",
    });
    // Self-referencing canonical per page; page 2+ must not canonicalise
    // back to page 1 or its products fall out of the index.
    const meta = base.meta.map((m) =>
      m.property === "og:url" ? { property: "og:url", content: url } : m,
    );
    return {
      meta,
      links: [
        { rel: "canonical", href: url },
        ...(page > 1 ? [{ rel: "prev", href: canonicalForPage("/shop", page - 1) }] : []),
        ...(page < totalPages ? [{ rel: "next", href: canonicalForPage("/shop", page + 1) }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Shop All Gear",
            url,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: loaderData?.products?.length ?? 0,
              itemListElement: (loaderData?.products ?? []).map((p, i) => ({
                "@type": "ListItem",
                position: (page - 1) * PAGE_SIZE + i + 1,
                url: `${SITE_URL}/product/${p.node.handle}`,
                name: p.node.title,
              })),
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Shop All", item: `${SITE_URL}/shop` },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => <ShopPageNotFound />,
  errorComponent: ({ reset }) => <ShopErrorFallback reset={reset} />,
  component: ShopPage,
});

function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function ShopPageNotFound() {
  return (
    <ShopShell>
      <h1 className="font-display text-3xl tracking-widest text-rf-dark">PAGE NOT FOUND</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        That catalogue page doesn&apos;t exist. Start from the first page of Shop All.
      </p>
      <Link
        to="/shop"
        className="mt-6 min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
      >
        BACK TO SHOP ALL
      </Link>
    </ShopShell>
  );
}

function ShopErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <ShopShell>
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
    </ShopShell>
  );
}

function ShopPage() {
  const { page } = Route.useSearch();
  const { data } = useSuspenseQuery(shopQuery(page));
  const products = data.products;
  const range = pageRange(page, PAGE_SIZE, products.length, data.totalProducts);

  useEffect(() => {
    if (products.length === 0) return;
    trackViewItemList(
      products.map((p) =>
        toAnalyticsItem({
          id: p.node.id,
          title: p.node.title,
          vendor: p.node.vendor,
          productType: p.node.productType,
          price: p.node.priceRange.minVariantPrice.amount,
          currency: p.node.priceRange.minVariantPrice.currencyCode,
        }),
      ),
      "shop_all",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="flex-1 flex flex-col">
        <section className="bg-rf-dark py-16 text-rf-cream">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <p className="font-display tracking-[0.3em] text-rf-tan text-xs">SHOP ALL</p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">
              THE FULL RANGE
            </h1>
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
            {products.length > 0 && (
              <p
                className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground"
                aria-live="polite"
              >
                Showing {range.from}–{range.to} of {range.total} products
                {data.totalPages > 1 ? ` — page ${page} of ${data.totalPages}` : ""}
              </p>
            )}
            <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.length === 0 ? (
                <EmptyProducts />
              ) : (
                products.map((p) => <ProductCard key={p.node.id} product={p} />)
              )}
            </div>
            <CataloguePagination
              page={page}
              totalPages={data.totalPages}
              to="/shop"
              label="Shop All pagination"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
