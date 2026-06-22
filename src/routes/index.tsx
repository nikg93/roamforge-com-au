import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mountain, Map, ShieldCheck, Wrench, Zap, Tent, Shirt } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchProducts } from "@/lib/shopify";
import logo from "@/assets/logo.png";
import heroPatrolAsset from "@/assets/troll3n-real.jpg.asset.json";
import troll3n from "@/assets/troll3n.jpg";
const heroPatrol = heroPatrolAsset.url;
import catRecovery from "@/assets/cat-recovery.jpg";
import catElectrical from "@/assets/cat-electrical.jpg";
import catCamping from "@/assets/cat-camping.jpg";
import catMerch from "@/assets/cat-merch.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roamforge — Forged for Adventure | 4WD, Camping & Touring Gear" },
      {
        name: "description",
        content:
          "Premium 4WD, camping and touring gear tested for Australian conditions. Recovery, electrical, camping and Roamforge merch.",
      },
      { property: "og:title", content: "Roamforge — Forged for Adventure" },
      {
        property: "og:description",
        content: "Premium 4WD, camping and touring gear tested for Australian conditions.",
      },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { label: "RECOVERY GEAR", img: catRecovery, Icon: Wrench },
  { label: "ELECTRICAL", img: catElectrical, Icon: Zap },
  { label: "CAMPING", img: catCamping, Icon: Tent },
  { label: "MERCH", img: catMerch, Icon: Shirt },
];

const WHY = [
  {
    Icon: Mountain,
    title: "BUILT FOR REAL TOURING",
    desc: "Products chosen by 4WD enthusiasts who live the lifestyle.",
  },
  {
    Icon: Map,
    title: "AUSTRALIAN OWNED",
    desc: "WA based adventure brand supporting local.",
  },
  {
    Icon: ShieldCheck,
    title: "QUALITY FIRST",
    desc: "Gear we'd run on our own vehicles.",
  },
];

function Index() {
  useCartSync();
  const { data: products = [] } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts(12),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-rf-cream">
        <div className="relative">
          <img
            src={heroPatrol}
            alt="Roamforge TROLL3N Nissan Patrol"
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
                  Premium 4WD, camping and touring gear tested for Australian conditions.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#featured"
                    className="bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-tan-bright transition-colors"
                  >
                    SHOP GEAR
                  </a>
                  <a
                    href="#categories"
                    className="border border-rf-cream/80 text-rf-cream font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-cream hover:text-rf-dark transition-colors"
                  >
                    SHOP MERCH
                  </a>
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(({ label, img, Icon }) => (
              <Link
                key={label}
                to="/"
                className="group relative block aspect-[4/3] overflow-hidden bg-rf-dark"
              >
                <img
                  src={img}
                  alt={label}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rf-dark/85 via-rf-dark/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-rf-cream">
                  <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-rf-cream/80 bg-rf-dark/60">
                    <Icon className="h-6 w-6 text-rf-cream" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="font-display tracking-[0.2em] text-rf-cream text-sm">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="bg-rf-dark py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading dark>WHY ROAMFORGE?</SectionHeading>
          <div className="mt-8 grid gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rf-cream/10">
            {WHY.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 px-2 md:px-6 py-4 md:py-0">
                <Icon className="h-10 w-10 text-rf-tan shrink-0" strokeWidth={1.4} />
                <div>
                  <h3 className="font-display text-rf-tan text-sm tracking-[0.2em]">{title}</h3>
                  <p className="mt-1 text-sm text-rf-cream/75">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section id="featured" className="bg-rf-cream py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading>FEATURED PRODUCTS</SectionHeading>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.length === 0 ? (
              <EmptyProducts />
            ) : (
              products.map((p) => <ProductCard key={p.node.id} product={p} />)
            )}
          </div>
        </div>
      </section>

      {/* MEET TROLL3N */}
      <section className="bg-rf-cream pb-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="relative overflow-hidden bg-rf-dark">
            <img
              src={troll3n}
              alt="Roamforge project vehicle TROLL3N"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rf-dark via-rf-dark/70 to-transparent" />
            <div className="relative p-8 sm:p-12 lg:p-16 max-w-xl text-rf-cream">
              <p className="font-display tracking-[0.3em] text-rf-tan text-xs">MEET</p>
              <h2 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">TROLL3N</h2>
              <p className="mt-4 text-sm text-rf-cream/80 max-w-sm">
                The Roamforge project vehicle. Real reviews, real installs and real adventures.
              </p>
              <a
                href="#"
                className="mt-6 inline-block bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-xs px-5 py-3"
              >
                VIEW BUILD
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
