import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Map as MapIcon,
  ShieldCheck,
  Gauge,
  Lightbulb,
  BatteryCharging,
  Satellite,
  Wind,
  LifeBuoy,
  Tent,
  ClipboardList,
  Shield,
  Shirt,
  Award,
  Truck,
  Compass,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustedBrands } from "@/components/TrustedBrands";
import { LifestyleSection } from "@/components/LifestyleSection";
import { ProductCard } from "@/components/ProductCard";
import logo from "@/assets/logo.png";
import heroGear from "@/assets/lifestyle-journey.jpg";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { routeMeta } from "@/lib/seo";
import { fetchFeaturedProducts } from "@/lib/shopify";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

const featuredQuery = queryOptions({
  queryKey: ["featured-products"],
  queryFn: () => fetchFeaturedProducts(8),
  staleTime: 5 * 60_000,
  retry: 1,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  head: () =>
    routeMeta({
      path: "/",
      title: "Roamforge — Forged for Adventure | 4WD, Camping & Touring Gear",
      description:
        "Premium 4WD, camping and touring gear selected for Australian adventures. Recovery, electrical, camping and Roamforge merch.",
    }),
  component: Index,
});

const CATEGORY_ICONS: Record<CategorySlug, React.ComponentType<{ className?: string }>> = {
  performance: Gauge,
  monitoring: BatteryCharging,
  "gps-tracking": Satellite,
  lighting: Lightbulb,
  "air-compressors": Wind,
  recovery: LifeBuoy,
  touring: Tent,
  "vehicle-protection": Shield,
  merch: Shirt,
  planners: ClipboardList,
};

const WHY = [
  { Icon: MapIcon, title: "AUSTRALIAN OWNED", desc: "WA based adventure brand supporting local." },
  {
    Icon: Award,
    title: "TRUSTED BRANDS",
    desc: "Curated gear from established Australian brands.",
  },
  { Icon: ShieldCheck, title: "SECURE CHECKOUT", desc: "Encrypted payments via Shopify." },
  { Icon: Truck, title: "AUSTRALIA-WIDE DELIVERY", desc: "Shipping right across Australia." },
  { Icon: Compass, title: "BUILT FOR TOURING", desc: "Selected for real Australian touring." },
];

function Index() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-rf-cream">
          <div className="relative">
            <img
              src={heroGear}
              alt="Roamforge 4WD, camping and touring gear"
              width={1920}
              height={620}
              fetchPriority="high"
              className="h-[420px] w-full object-cover object-center sm:h-[520px] lg:h-[620px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rf-dark/85 via-rf-dark/55 to-rf-dark/10" />
            <div className="absolute inset-0">
              <div className="mx-auto h-full max-w-7xl px-4 lg:px-8 flex items-center">
                <div className="max-w-xl text-rf-cream">
                  <h1
                    aria-label="Forged for adventure"
                    className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
                  >
                    <span aria-hidden="true">FORGED</span>
                    <br aria-hidden="true" />
                    <span aria-hidden="true" className="text-rf-tan">
                      FOR ADVENTURE
                    </span>
                  </h1>
                  <p className="mt-5 text-base sm:text-lg text-rf-cream/85 max-w-md">
                    Premium 4WD, camping and touring gear selected for Australian adventures.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      to="/shop"
                      className="min-h-11 inline-flex items-center bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-tan-bright transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-cream focus-visible:ring-offset-2 focus-visible:ring-offset-rf-dark"
                    >
                      SHOP THE RANGE
                    </Link>
                    <Link
                      to="/category/$slug"
                      params={{ slug: "recovery" }}
                      className="min-h-11 inline-flex items-center border border-rf-cream/80 text-rf-cream font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-cream hover:text-rf-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                    >
                      SHOP RECOVERY
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating watermark logo */}
            <img
              src={logo}
              alt=""
              aria-hidden
              className="hidden md:block absolute bottom-6 right-6 h-24 opacity-90"
            />
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="categories" className="bg-rf-cream py-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionHeading>SHOP BY CATEGORY</SectionHeading>
            {/* Mobile: horizontal scroll strip for compact browsing. md+: full grid. */}
            <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:hidden">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug];
                return (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="group relative flex-none w-40 snap-start overflow-hidden bg-rf-dark aspect-[4/5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                  >
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rf-dark via-rf-dark/40 to-transparent" />
                    <div className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-rf-cream/60 bg-rf-dark/40 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-rf-cream" aria-hidden />
                    </div>
                    <span className="absolute bottom-3 left-3 right-3 font-display text-xs tracking-[0.18em] text-rf-cream">
                      {c.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 hidden gap-5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug];
                return (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="group relative block aspect-[4/5] overflow-hidden bg-rf-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                  >
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-75 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rf-dark via-rf-dark/40 to-transparent transition-opacity duration-500 group-hover:from-rf-dark/95" />
                    <div className="absolute top-4 right-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-rf-cream/60 bg-rf-dark/40 backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-rf-cream" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="block font-display tracking-[0.18em] text-rf-cream text-sm leading-tight">
                        {c.label}
                      </span>
                      <span className="mt-1 inline-block text-[10px] font-semibold tracking-[0.25em] text-rf-tan opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        SHOP →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-10 flex justify-center">
              <Link
                to="/shop"
                className="min-h-11 inline-flex items-center border border-rf-dark px-6 py-3 text-sm font-semibold tracking-[0.15em] text-rf-dark hover:bg-rf-dark hover:text-rf-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
              >
                SHOP ALL PRODUCTS
              </Link>
            </div>
          </div>
        </section>

        <TrustedBrands />

        <LifestyleSection />

        {/* WHY */}
        <section className="bg-rf-dark py-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionHeading dark>WHY ROAMFORGE?</SectionHeading>
            <div className="mt-8 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {WHY.map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center px-3 py-4 border border-rf-cream/10 bg-rf-dark-2/40"
                >
                  <Icon className="h-9 w-9 text-rf-tan" strokeWidth={1.4} />
                  <h3 className="mt-3 font-display text-rf-tan text-xs tracking-[0.2em]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-rf-cream/75 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
