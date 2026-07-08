import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, ShieldCheck, Gauge, Lightbulb, BatteryCharging, Satellite, Wind, LifeBuoy, Tent, ClipboardList, Shield, Shirt, Award, Truck, Compass } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustedBrands } from "@/components/TrustedBrands";
import { LifestyleSection } from "@/components/LifestyleSection";
import { useCartSync } from "@/hooks/useCartSync";
import logo from "@/assets/logo.png";
import heroPatrolAsset from "@/assets/troll3n-real.jpg.asset.json";
const heroPatrol = heroPatrolAsset.url;
import catLighting from "@/assets/cat-lighting.jpg";
import catMonitoring from "@/assets/cat-monitoring.jpg";
import catPerformance from "@/assets/cat-performance-new.jpg";
import catTouring from "@/assets/cat-touring.jpg";
import catGps from "@/assets/cat-gps.jpg";
import catCompressors from "@/assets/cat-compressors.jpg";
import catRecovery from "@/assets/cat-recovery-new.jpg";
import catPlanners from "@/assets/cat-planners.jpg";
import catVehicleProtection from "@/assets/cat-vehicle-protection.jpg";
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
  { label: "PERFORMANCE", slug: "performance", img: catPerformance, Icon: Gauge },
  { label: "12V & VEHICLE MONITORING", slug: "monitoring", img: catMonitoring, Icon: BatteryCharging },
  { label: "GPS & TRACKING", slug: "gps-tracking", img: catGps, Icon: Satellite },
  { label: "LIGHTING", slug: "lighting", img: catLighting, Icon: Lightbulb },
  { label: "AIR COMPRESSORS", slug: "air-compressors", img: catCompressors, Icon: Wind },
  { label: "RECOVERY GEAR", slug: "recovery", img: catRecovery, Icon: LifeBuoy },
  { label: "TOURING & CAMPING", slug: "touring", img: catTouring, Icon: Tent },
  { label: "VEHICLE PROTECTION", slug: "vehicle-protection", img: catVehicleProtection, Icon: Shield },
  { label: "ROAMFORGE MERCH", slug: "merch", img: catMerch, Icon: Shirt },
  { label: "PLANNERS", slug: "planners", img: catPlanners, Icon: ClipboardList },
];

const WHY = [
  { Icon: MapIcon, title: "AUSTRALIAN OWNED", desc: "WA based adventure brand supporting local." },
  { Icon: Award, title: "TRUSTED BRANDS", desc: "Only gear from proven Australian manufacturers." },
  { Icon: ShieldCheck, title: "SECURE CHECKOUT", desc: "Encrypted payments, buy with confidence." },
  { Icon: Truck, title: "FAST SHIPPING", desc: "Quick dispatch Australia-wide." },
  { Icon: Compass, title: "ADVENTURE READY", desc: "Tested and ready for real touring conditions." },
];

function Index() {
  useCartSync();

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
                  <Link
                    to="/category/$slug"
                    params={{ slug: "performance" }}
                    className="bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-tan-bright transition-colors"
                  >
                    SHOP GEAR
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map(({ label, slug, img, Icon }) => (
              <Link
                key={label}
                to="/category/$slug"
                params={{ slug }}
                className="group relative block aspect-[4/5] overflow-hidden bg-rf-dark"
              >
                <img
                  src={img}
                  alt={label}
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
                    {label}
                  </span>
                  <span className="mt-1 inline-block text-[10px] font-semibold tracking-[0.25em] text-rf-tan opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    SHOP →
                  </span>
                </div>
              </Link>
            ))}
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
              <div key={title} className="flex flex-col items-center text-center px-3 py-4 border border-rf-cream/10 bg-rf-dark-2/40">
                <Icon className="h-9 w-9 text-rf-tan" strokeWidth={1.4} />
                <h3 className="mt-3 font-display text-rf-tan text-xs tracking-[0.2em]">{title}</h3>
                <p className="mt-1 text-xs text-rf-cream/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
