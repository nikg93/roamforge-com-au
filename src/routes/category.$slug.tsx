import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { fetchProducts } from "@/lib/shopify";
import { CATEGORY_MAP, isCategorySlug } from "@/lib/categories";
import { canonicalFor, SITE_URL } from "@/lib/seo";

function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

const categoryQuery = (slug: string, q: string) =>
  queryOptions({
    queryKey: ["products", "category", slug],
    queryFn: () => fetchProducts(50, q),
    staleTime: 60_000,
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
    const products = (loaderData as Awaited<ReturnType<typeof fetchProducts>> | undefined) ?? [];
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
                  { "@type": "ListItem", position: 2, name: cfg.label, item: url },
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
  errorComponent: () => (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Category products failed to load. Try refreshing.
        </p>
        <Link to="/" className="mt-6 inline-block text-rf-tan underline">
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cfg = isCategorySlug(slug) ? CATEGORY_MAP[slug] : undefined;
  const { data: products = [] } = useSuspenseQuery(categoryQuery(slug, cfg?.query ?? ""));
  if (!cfg) return null;

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
        </div>
      </section>
      <section className="bg-rf-cream py-14 flex-1">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading>{cfg.label}</SectionHeading>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.length === 0 ? (
              <EmptyProducts />
            ) : (
              products.map((p) => <ProductCard key={p.node.id} product={p} />)
            )}
          </div>
        </div>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
