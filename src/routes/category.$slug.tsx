import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchProducts } from "@/lib/shopify";

type CategoryConfig = {
  title: string;
  description: string;
  query?: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  performance: {
    title: "PERFORMANCE",
    description: "Airboxes, snorkels, intercoolers and more from JM FAB.",
    query: 'vendor:"JM FAB"',
  },
  merch: {
    title: "MERCH",
    description: "Roamforge apparel and lifestyle.",
    query: 'vendor:"The Print Bar"',
  },
  planners: {
    title: "ADVENTURE PLANNERS",
    description: "Digital trip-planning bundles for 4WD touring across Australia.",
    query: "tag:planner",
  },
  recovery: {
    title: "RECOVERY GEAR",
    description: "Recovery boards, straps, shackles and winches.",
  },
  electrical: {
    title: "ELECTRICAL",
    description: "Dual battery systems, wiring and lighting.",
  },
  camping: {
    title: "CAMPING",
    description: "Swags, awnings, cookware and touring essentials.",
  },
};

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    if (!CATEGORY_MAP[params.slug]) throw notFound();
  },
  head: ({ params }) => {
    const cfg = CATEGORY_MAP[params.slug];
    const title = cfg ? `${cfg.title} — Roamforge` : "Roamforge";
    const desc = cfg?.description ?? "Roamforge gear.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">CATEGORY NOT FOUND</h1>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  useCartSync();
  const { slug } = Route.useParams();
  const cfg = CATEGORY_MAP[slug];
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "category", slug],
    queryFn: () => (cfg.query ? fetchProducts(50, cfg.query) : Promise.resolve([])),
    enabled: !!cfg.query,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <section className="bg-rf-dark py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-rf-cream">
          <p className="font-display tracking-[0.3em] text-rf-tan text-xs">CATEGORY</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">{cfg.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-rf-cream/75">{cfg.description}</p>
        </div>
      </section>
      <section className="bg-rf-cream py-14 flex-1">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading>{cfg.title}</SectionHeading>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {isLoading && cfg.query ? (
              <p className="col-span-full text-center text-sm text-muted-foreground">Loading...</p>
            ) : products.length === 0 ? (
              <EmptyProducts />
            ) : (
              products.map((p) => <ProductCard key={p.node.id} product={p} />)
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}