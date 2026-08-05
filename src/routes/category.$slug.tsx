import { useEffect } from "react";
import {
  createFileRoute,
  notFound,
  Link,
  useRouter,
  stripSearchParams,
} from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { PaginatedProductGrid } from "@/components/PaginatedProductGrid";
import { fetchNumberedProductPage } from "@/lib/shopify";
import { PAGE_SIZE, pageRange, parsePageParam } from "@/lib/pagination";
import { CATEGORY_MAP, isCategorySlug } from "@/lib/categories";
import { canonicalForPage, SITE_URL } from "@/lib/seo";
import { faqPageJsonLd } from "@/lib/pdp-guidance";
import { trackViewItemList, toAnalyticsItem } from "@/lib/analytics";

function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

const categoryQuery = (slug: string, q: string, page: number) =>
  queryOptions({
    queryKey: ["products", "category", slug, "page", page],
    queryFn: async () => {
      const res = await fetchNumberedProductPage(page, PAGE_SIZE, q);
      // Out-of-range page → real 404 rather than a thin indexable page.
      if (!res) throw notFound();
      return res;
    },
    staleTime: 60_000,
    retry: 1,
    retryDelay: 500,
  });

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: Record<string, unknown>): { page?: number } => ({
    page: parsePageParam(search.page),
  }),
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  beforeLoad: ({ params }) => {
    if (!isCategorySlug(params.slug)) throw notFound();
  },
  loader: ({ params, context, deps }) => {
    if (!isCategorySlug(params.slug)) return;
    return context.queryClient.ensureQueryData(
      categoryQuery(params.slug, CATEGORY_MAP[params.slug].query, deps.page),
    );
  },
  head: ({ params, loaderData }) => {
    const cfg = isCategorySlug(params.slug) ? CATEGORY_MAP[params.slug] : undefined;
    const page = loaderData?.page ?? 1;
    const totalPages = loaderData?.totalPages ?? 1;
    const basePath = `/category/${params.slug}`;
    const baseTitle = cfg ? `${cfg.seoTitle} — Roamforge` : "Roamforge";
    const title = page > 1 ? `${baseTitle} — Page ${page} of ${totalPages}` : baseTitle;
    const baseDesc = cfg?.description ?? "Roamforge gear.";
    const desc = page > 1 ? `Page ${page} of ${totalPages}. ${baseDesc}` : baseDesc;
    const url = canonicalForPage(basePath, page);
    const absImage = cfg?.image ? toAbsoluteUrl(cfg.image) : undefined;
    const products = loaderData?.products ?? [];
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
      links: cfg
        ? [
            { rel: "canonical", href: url },
            ...(page > 1 ? [{ rel: "prev", href: canonicalForPage(basePath, page - 1) }] : []),
            ...(page < totalPages
              ? [{ rel: "next", href: canonicalForPage(basePath, page + 1) }]
              : []),
          ]
        : [],
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
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: cfg.label,
                    item: canonicalForPage(basePath, 1),
                  },
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
                  itemListElement: products.slice(0, 24).map((p, i) => ({
                    "@type": "ListItem",
                    position: (page - 1) * PAGE_SIZE + i + 1,
                    url: `${SITE_URL}/product/${p.node.handle}`,
                    name: p.node.title,
                  })),
                },
              }),
            },
            // FAQPage schema mirrors the visible FAQs rendered below the grid.
            ...(cfg.faqs && cfg.faqs.length > 0 && page === 1
              ? [
                  {
                    type: "application/ld+json",
                    children: JSON.stringify(faqPageJsonLd(cfg.faqs)),
                  },
                ]
              : []),
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">PAGE NOT FOUND</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          That category or catalogue page doesn&apos;t exist. Browse the full range instead.
        </p>
        <Link to="/shop" className="mt-6 inline-block text-rf-tan underline">
          Shop all gear
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
      <main id="main-content" className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Category products couldn&apos;t load. Please check your connection and try again.
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
  const { page = 1 } = Route.useSearch();
  const cfg = isCategorySlug(slug) ? CATEGORY_MAP[slug] : undefined;
  const { data } = useSuspenseQuery(categoryQuery(slug, cfg?.query ?? "", page));
  const products = data.products;

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
      `category_${slug}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  if (!cfg) return null;
  const range = pageRange(page, PAGE_SIZE, products.length, data.totalProducts);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="flex-1 flex flex-col">
        <section className="relative bg-rf-dark overflow-hidden">
          {cfg.image && (
            <img
              src={cfg.image}
              alt={`${cfg.label} — Roamforge 4WD gear`}
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
            {slug === "air-compressors" && (
              <Link
                to="/guides/how-to-choose-a-4wd-air-compressor"
                className="mt-5 min-h-11 inline-flex items-center justify-center border border-rf-tan px-5 py-3 text-xs font-medium tracking-widest text-rf-tan hover:bg-rf-tan hover:text-rf-dark"
              >
                READ: HOW TO CHOOSE A 4WD AIR COMPRESSOR
              </Link>
            )}
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
            <SectionHeading>{cfg.headingSubtitle}</SectionHeading>
            {products.length > 0 && (
              <p
                className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground"
                aria-live="polite"
              >
                Showing {range.from}–{range.to} of {range.total} products
                {data.totalPages > 1 ? ` — page ${page} of ${data.totalPages}` : ""}
              </p>
            )}
            <PaginatedProductGrid
              products={products}
              page={page}
              totalPages={data.totalPages}
              to="/category/$slug"
              params={{ slug }}
              resetKey={slug}
              label={`${cfg.label} pagination`}
              fetchPage={(n) => fetchNumberedProductPage(n, PAGE_SIZE, cfg.query)}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
