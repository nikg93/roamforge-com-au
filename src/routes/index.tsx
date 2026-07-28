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
import { TrustStrip } from "@/components/TrustStrip";
import logo from "@/assets/logo.png";
import heroGear from "@/assets/lifestyle-journey.jpg";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { routeMeta } from "@/lib/seo";
import { fetchHomepageFeatured, type ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/")({
  // Server-render featured products. The loader is bounded: any Shopify
  // failure resolves to an empty list so the homepage renders cleanly and
  // the Featured Gear section hides itself. Router SSR serialises the
  // result and hydrates it on the client — no client refetch, no
  // hydration mismatch.
  loader: async () => {
    try {
      // Lightforce dealer stock first, then category-diverse best sellers,
      // so the first product-led section spans the catalogue.
      const featured = await fetchHomepageFeatured(8);
      return { featured };
    } catch {
      return { featured: [] as ShopifyProduct[] };
    }
  },
  head: () =>
    routeMeta({
      path: "/",
      title: "4WD Accessories Australia | Touring & Recovery Gear | Roamforge",
      description:
        "Shop premium 4WD accessories, recovery gear, vehicle monitoring, performance and touring equipment from trusted brands at Roamforge.",
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
  // Progressive enhancement: the anchor works without JS; this just adds
  // smooth scrolling and moves focus for keyboard/AT users.
  const scrollToFeatured = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("featured-gear");
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  };

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
              height={1080}
              fetchPriority="high"
              decoding="async"
              sizes="100vw"
              className="h-[420px] w-full object-cover object-center sm:h-[520px] lg:h-[620px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rf-dark/85 via-rf-dark/55 to-rf-dark/10" />
            <div className="absolute inset-0">
              <div className="mx-auto h-full max-w-7xl px-4 lg:px-8 flex items-center">
                <div className="max-w-xl text-rf-cream">
                  <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                    FORGED
                    <br />
                    <span className="text-rf-tan">FOR ADVENTURE</span>
                  </h1>
                  <p className="mt-5 text-base sm:text-lg text-rf-cream/85 max-w-md">
                    Roamforge — premium 4WD, recovery and touring gear selected for Australian
                    adventures.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href="#featured-gear"
                      onClick={scrollToFeatured}
                      className="min-h-11 inline-flex items-center bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-tan-bright transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-cream focus-visible:ring-offset-2 focus-visible:ring-offset-rf-dark"
                    >
                      SHOP FEATURED GEAR
                    </a>
                    <Link
                      to="/category/$slug"
                      params={{ slug: "lighting" }}
                      className="min-h-11 inline-flex items-center border border-rf-cream/80 text-rf-cream font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-cream hover:text-rf-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                    >
                      SHOP LIGHTFORCE
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating watermark logo */}
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="hidden md:block absolute bottom-6 right-6 h-24 opacity-90"
            />
          </div>
        </section>

        <TrustStrip />

        <FeaturedGear />

        {/* CATEGORIES */}
        <section id="categories" className="bg-rf-cream py-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <SectionHeading>SHOP BY CATEGORY</SectionHeading>
            {/* Single responsive category grid — one image structure across
                every breakpoint, no mobile/desktop duplication. */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug];
                return (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    aria-label={c.label}
                    className="group relative block aspect-[4/5] overflow-hidden bg-rf-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                  >
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className="h-full w-full object-cover opacity-75 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rf-dark via-rf-dark/40 to-transparent transition-opacity duration-500 group-hover:from-rf-dark/95" />
                    <div className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-rf-cream/60 bg-rf-dark/40 backdrop-blur-sm sm:top-4 sm:right-4 sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 text-rf-cream" aria-hidden />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                      <span className="block font-display text-xs sm:text-sm leading-tight tracking-[0.18em] text-rf-cream">
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

function FeaturedGear() {
  // Data is provided by the route loader (see Route.loader above). It is
  // serialised on the server and hydrated on the client, so this section
  // is fully server-rendered without any hydration mismatch or refetch.
  // The loader swallows Shopify failures into an empty list, so a bad
  // Storefront response just hides the section cleanly.
  const { featured } = Route.useLoaderData();
  if (!featured || featured.length === 0) return null;
  return (
    <section
      id="featured-gear"
      tabIndex={-1}
      aria-labelledby="featured-heading"
      className="scroll-mt-24 bg-background py-14 focus:outline-none"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading>
            <span id="featured-heading">FEATURED 4WD GEAR</span>
          </SectionHeading>
          <Link
            to="/shop"
            className="hidden text-xs font-semibold tracking-[0.15em] text-rf-dark hover:text-rf-tan sm:inline"
          >
            SHOP ALL →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {featured.slice(0, 8).map((p: ShopifyProduct) => (
            <ProductCard key={p.node.id} product={p} />
          ))}
        </div>
        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            to="/shop"
            className="min-h-11 inline-flex items-center border border-rf-dark px-6 py-3 text-sm font-semibold tracking-[0.15em] text-rf-dark hover:bg-rf-dark hover:text-rf-cream transition-colors"
          >
            SHOP ALL PRODUCTS
          </Link>
        </div>
      </div>
    </section>
  );
}
