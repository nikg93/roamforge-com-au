import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchProducts } from "@/lib/shopify";
import catPerformance from "@/assets/cat-performance-new.jpg";
import catMonitoring from "@/assets/cat-monitoring.jpg";
import catGps from "@/assets/cat-gps.jpg";
import catLighting from "@/assets/cat-lighting.jpg";
import catCompressors from "@/assets/cat-compressors.jpg";
import catRecovery from "@/assets/cat-recovery-new.jpg";
import catTouring from "@/assets/cat-touring.jpg";
import catVehicleProtection from "@/assets/cat-vehicle-protection.jpg";
import catMerch from "@/assets/cat-merch.jpg";
import catPlanners from "@/assets/cat-planners.jpg";

type CategoryConfig = {
  title: string;
  description: string;
  query?: string;
  image?: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  performance: {
    title: "PERFORMANCE",
    description: "Throttle controllers, tuning and performance upgrades that sharpen throttle response and unlock your 4WD's true drivability.",
    query: "tag:cat-performance",
    image: catPerformance,
  },
  "throttle-controllers": {
    title: "THROTTLE CONTROLLERS",
    description: "Plug-and-play throttle controllers that kill factory pedal lag and sharpen response — Ultimate9 EVC and evcX Bluetooth units for every major 4WD.",
    query: "tag:cat-throttle-controllers OR tag:throttle-controllers OR tag:throttle-controller",
    image: catPerformance,
  },
  monitoring: {
    title: "12V & VEHICLE MONITORING",
    description: "Battery monitors, DC-DC chargers, isolators and live vehicle telemetry — full control over your 12V and touring electrical system.",
    query: "tag:cat-monitoring",
    image: catMonitoring,
  },
  "gps-tracking": {
    title: "GPS & TRACKING",
    description: "Live GPS trackers, anti-theft units and touring telemetry so you always know where your rig — and your convoy — is.",
    query: "tag:cat-gps-tracking",
    image: catGps,
  },
  lighting: {
    title: "LIGHTING",
    description: "Light bars, driving lights, work lights, rock lights, switches and wiring — engineered for touring 4WDs and long nights on the tracks.",
    query: "tag:cat-lighting",
    image: catLighting,
  },
  "air-compressors": {
    title: "AIR COMPRESSORS",
    description: "Portable and in-vehicle air compressors, tyre deflators and inflation kits — air up fast after every low-pressure run.",
    query: "tag:cat-air-compressors",
    image: catCompressors,
  },
  recovery: {
    title: "RECOVERY GEAR",
    description: "Snatch straps, soft shackles, recovery boards, kits and rated hardware — everything you need to get unstuck and keep touring.",
    query: "tag:cat-recovery",
    image: catRecovery,
  },
  touring: {
    title: "TOURING & CAMPING",
    description: "Awnings, rooftop tents, water tanks, storage, tailgate systems, snorkels and camp gear — the essentials that turn a 4WD into a proper touring rig.",
    query: "tag:cat-touring",
    image: catTouring,
  },
  "vehicle-protection": {
    title: "VEHICLE PROTECTION",
    description: "Nudge bars, bull bars, side steps, rock sliders and underbody protection — armour your 4WD for the tracks and the outback.",
    query: "tag:cat-vehicle-protection",
    image: catVehicleProtection,
  },
  merch: {
    title: "ROAMFORGE MERCH",
    description: "Roamforge branded apparel, caps and accessories — wear the brand on and off the tracks.",
    query: "tag:cat-merch",
    image: catMerch,
  },
  planners: {
    title: "PLANNERS",
    description: "Trip planners, build planners and vehicle setup guides — plan every touring mission and every upgrade before you commit.",
    query: "tag:cat-planners",
    image: catPlanners,
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
      <section className="relative bg-rf-dark overflow-hidden">
        {cfg.image && (
          <img
            src={cfg.image}
            alt={cfg.title}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-rf-dark via-rf-dark/70 to-rf-dark/30" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-20 sm:py-24 text-rf-cream">
          <p className="font-display tracking-[0.3em] text-rf-tan text-xs">CATEGORY</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">{cfg.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-rf-cream/85">{cfg.description}</p>
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