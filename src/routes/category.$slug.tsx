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
    description: "Throttle controllers, tuning and performance upgrades that sharpen throttle response and unlock your 4WD's true drivability.",
    query: "tag:cat-performance",
  },
  monitoring: {
    title: "12V & VEHICLE MONITORING",
    description: "Battery monitors, DC-DC chargers, isolators and live vehicle telemetry — full control over your 12V and touring electrical system.",
    query: "tag:cat-monitoring",
  },
  "gps-tracking": {
    title: "GPS & TRACKING",
    description: "Live GPS trackers, anti-theft units and touring telemetry so you always know where your rig — and your convoy — is.",
    query: "tag:cat-gps-tracking",
  },
  lighting: {
    title: "LIGHTING",
    description: "Light bars, driving lights, work lights, rock lights, switches and wiring — engineered for touring 4WDs and long nights on the tracks.",
    query: "tag:cat-lighting",
  },
  "air-compressors": {
    title: "AIR COMPRESSORS",
    description: "Portable and in-vehicle air compressors, tyre deflators and inflation kits — air up fast after every low-pressure run.",
    query: "tag:cat-air-compressors",
  },
  recovery: {
    title: "RECOVERY GEAR",
    description: "Snatch straps, soft shackles, recovery boards, kits and rated hardware — everything you need to get unstuck and keep touring.",
    query: "tag:cat-recovery",
  },
  touring: {
    title: "TOURING ESSENTIALS",
    description: "Water tanks, storage, tailgate systems, snorkels and camp gear — the essentials that turn a 4WD into a proper touring rig.",
    query: "tag:cat-touring",
  },
  planners: {
    title: "PLANNERS",
    description: "Trip planners, build planners and vehicle setup guides — plan every touring mission and every upgrade before you commit.",
    query: "tag:cat-planners",
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