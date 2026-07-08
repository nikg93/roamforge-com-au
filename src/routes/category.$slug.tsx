import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
  parent?: string;
  subcategories?: { slug: string; label: string }[];
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  performance: {
    title: "PERFORMANCE",
    description: "Throttle controllers, tuning and performance upgrades that sharpen throttle response and unlock your 4WD's true drivability.",
    query: "tag:cat-performance",
    image: catPerformance,
    subcategories: [
      { slug: "throttle-controllers", label: "Throttle Controllers" },
      { slug: "intercoolers", label: "Intercoolers" },
      { slug: "snorkels", label: "Snorkels" },
      { slug: "airboxes", label: "Airboxes" },
    ],
  },
  "throttle-controllers": {
    title: "THROTTLE CONTROLLERS",
    description: "Plug-and-play throttle controllers that kill factory pedal lag and sharpen response — Ultimate9 EVC and evcX Bluetooth units for every major 4WD.",
    query: "tag:cat-throttle-controllers",
    image: catPerformance,
    parent: "performance",
  },
  intercoolers: {
    title: "INTERCOOLERS",
    description: "High-flow intercoolers and upgrades — reduce intake temps and unlock consistent power on long touring runs.",
    query: "tag:cat-intercoolers",
    image: catPerformance,
    parent: "performance",
  },
  snorkels: {
    title: "SNORKELS",
    description: "Vehicle-specific snorkels — raise your air intake for river crossings, dusty tracks and remote touring.",
    query: "tag:cat-snorkels",
    image: catPerformance,
    parent: "performance",
  },
  airboxes: {
    title: "AIRBOXES",
    description: "Upgraded airboxes and induction systems — cleaner, cooler airflow for touring 4WDs.",
    query: "tag:cat-airboxes",
    image: catPerformance,
    parent: "performance",
  },
  "evc-classic": {
    title: "EVC CLASSIC",
    description: "Classic Ultimate9 EVC throttle controllers — the original wired unit with proven performance for older-model 4WDs.",
    query: "tag:cat-evc-classic OR tag:evc-classic",
    image: catPerformance,
    parent: "performance",
  },
  "gift-vouchers": {
    title: "GIFT VOUCHERS",
    description: "Roamforge and Ultimate9 gift vouchers — the easy gift for the 4WD-obsessed in your life.",
    query: "tag:cat-gift-vouchers OR tag:gift-voucher",
    image: catPerformance,
    parent: "performance",
  },
  monitoring: {
    title: "12V & VEHICLE MONITORING",
    description: "Battery monitors, DC-DC chargers, isolators and live vehicle telemetry — full control over your 12V and touring electrical system.",
    query: "tag:cat-monitoring",
    image: catMonitoring,
    subcategories: [
      { slug: "battery-monitors", label: "Battery Monitors" },
      { slug: "obd2-scanners", label: "OBD2 Scanners" },
      { slug: "hud-displays", label: "HUD Displays" },
    ],
  },
  "battery-monitors": {
    title: "BATTERY MONITORS",
    description: "Bluetooth battery monitors for lead-acid, AGM and lithium — live voltage, current and health data straight to your phone.",
    query: "tag:cat-battery-monitors OR tag:battery-monitor",
    image: catMonitoring,
    parent: "monitoring",
  },
  "obd2-scanners": {
    title: "OBD2 SCANNERS",
    description: "Codebreaker OBD2 scanners and code readers — diagnose faults, clear codes and monitor live vehicle data.",
    query: "tag:cat-obd2-scanners OR tag:obd2",
    image: catMonitoring,
    parent: "monitoring",
  },
  "hud-displays": {
    title: "HUD DISPLAYS",
    description: "Codebreaker head-up displays — live speed, RPM, temperature and diagnostic data projected right where you need it.",
    query: "tag:cat-hud-displays OR tag:hud",
    image: catMonitoring,
    parent: "monitoring",
  },
  "gps-tracking": {
    title: "GPS & TRACKING",
    description: "Live GPS trackers, anti-theft units and touring telemetry so you always know where your rig — and your convoy — is.",
    query: "tag:cat-gps-tracking",
    image: catGps,
    subcategories: [
      { slug: "gps-trackers", label: "GPS Trackers" },
      { slug: "gps-hud", label: "GPS HUD" },
    ],
  },
  "gps-trackers": {
    title: "GPS TRACKERS",
    description: "LiveTrack Stealth GPS trackers with SIM — real-time anti-theft tracking for your 4WD, caravan or trailer.",
    query: "tag:cat-gps-trackers OR tag:gps-tracker",
    image: catGps,
    parent: "gps-tracking",
  },
  "gps-hud": {
    title: "GPS HUD",
    description: "Codebreaker GPS head-up displays — accurate GPS speed and heading, projected onto the windscreen.",
    query: "tag:cat-gps-hud OR tag:gps-hud",
    image: catGps,
    parent: "gps-tracking",
  },
  lighting: {
    title: "LIGHTING",
    description: "Light bars, driving lights, work lights, rock lights, switches and wiring — engineered for touring 4WDs and long nights on the tracks.",
    query: "tag:cat-lighting",
    image: catLighting,
    subcategories: [
      { slug: "light-bars", label: "Light Bars" },
      { slug: "work-lamps", label: "Work Lamps" },
      { slug: "rock-lights", label: "Rock Lights" },
      { slug: "wiring-looms", label: "Wiring & Looms" },
      { slug: "high-beam-adaptors", label: "High Beam Adaptors" },
    ],
  },
  "light-bars": {
    title: "LIGHT BARS",
    description: "LED light bars from 20\" to 50\" — combo, spot and flood beams to light up the tracks ahead.",
    query: "tag:cat-light-bars OR tag:light-bar",
    image: catLighting,
    parent: "lighting",
  },
  "work-lamps": {
    title: "WORK LAMPS",
    description: "Pedestal and flush-mount LED work lamps — camp lighting, reverse lighting and awning lighting for touring rigs.",
    query: "tag:cat-work-lamps OR tag:work-lamp",
    image: catLighting,
    parent: "lighting",
  },
  "rock-lights": {
    title: "ROCK LIGHTS",
    description: "Under-vehicle LED rock lights — colour-changing underbody lighting for the campsite and the tracks.",
    query: "tag:cat-rock-lights OR tag:rock-light",
    image: catLighting,
    parent: "lighting",
  },
  "wiring-looms": {
    title: "WIRING & LOOMS",
    description: "Auxiliary wiring looms and harnesses — plug-and-play power for driving lights, light bars and camp accessories.",
    query: "tag:cat-wiring-looms OR tag:wiring-loom",
    image: catLighting,
    parent: "lighting",
  },
  "high-beam-adaptors": {
    title: "HIGH BEAM ADAPTORS",
    description: "Vehicle-specific high beam adaptors and piggyback harnesses — clean, no-cut wiring for factory high beam control.",
    query: "tag:cat-high-beam-adaptors OR tag:high-beam-adaptor",
    image: catLighting,
    parent: "lighting",
  },
  "air-compressors": {
    title: "AIR COMPRESSORS",
    description: "Portable and in-vehicle air compressors, tyre deflators and inflation kits — air up fast after every low-pressure run.",
    query: "tag:cat-air-compressors",
    image: catCompressors,
    subcategories: [
      { slug: "portable-compressors", label: "Portable Compressors" },
      { slug: "in-vehicle-compressors", label: "In-Vehicle Compressors" },
      { slug: "tyre-deflators", label: "Tyre Deflators" },
    ],
  },
  "portable-compressors": {
    title: "PORTABLE COMPRESSORS",
    description: "Portable 12V air compressors — fast, reliable tyre inflation for beach, sand and rocky recoveries.",
    query: "tag:cat-portable-compressors OR tag:portable-compressor",
    image: catCompressors,
    parent: "air-compressors",
  },
  "in-vehicle-compressors": {
    title: "IN-VEHICLE COMPRESSORS",
    description: "Permanently-mounted in-vehicle air compressor systems — always-ready air for tyres, tools and lockers.",
    query: "tag:cat-in-vehicle-compressors OR tag:in-vehicle-compressor",
    image: catCompressors,
    parent: "air-compressors",
  },
  "tyre-deflators": {
    title: "TYRE DEFLATORS",
    description: "Rapid tyre deflators and pressure gauges — drop pressures accurately before you hit the sand.",
    query: "tag:cat-tyre-deflators OR tag:tyre-deflator",
    image: catCompressors,
    parent: "air-compressors",
  },
  recovery: {
    title: "RECOVERY GEAR",
    description: "Snatch straps, soft shackles, recovery boards, kits and rated hardware — everything you need to get unstuck and keep touring.",
    query: "tag:cat-recovery",
    image: catRecovery,
    subcategories: [
      { slug: "recovery-boards", label: "Recovery Boards" },
      { slug: "snatch-straps", label: "Snatch Straps" },
      { slug: "shackles", label: "Shackles" },
      { slug: "recovery-jacks", label: "Jacks & Bases" },
    ],
  },
  "recovery-boards": {
    title: "RECOVERY BOARDS",
    description: "Recovery boards for sand, mud and snow — get unstuck fast and get back to touring.",
    query: "tag:cat-recovery-boards OR tag:recovery-board",
    image: catRecovery,
    parent: "recovery",
  },
  "snatch-straps": {
    title: "SNATCH STRAPS",
    description: "Kinetic snatch straps and tree trunk protectors — rated recovery gear for serious vehicle recoveries.",
    query: "tag:cat-snatch-straps OR tag:snatch-strap",
    image: catRecovery,
    parent: "recovery",
  },
  shackles: {
    title: "SHACKLES",
    description: "Soft shackles, bow shackles and rated hardware — safer, lighter connections for every recovery.",
    query: "tag:cat-shackles OR tag:shackle",
    image: catRecovery,
    parent: "recovery",
  },
  "recovery-jacks": {
    title: "JACKS & BASES",
    description: "Recovery jack bases and jacking accessories — stable, safe lifting on sand and soft ground.",
    query: "tag:cat-recovery-jacks OR tag:jack-base",
    image: catRecovery,
    parent: "recovery",
  },
  touring: {
    title: "TOURING & CAMPING",
    description: "Awnings, rooftop tents, water tanks, storage, tailgate systems, snorkels and camp gear — the essentials that turn a 4WD into a proper touring rig.",
    query: "tag:cat-touring",
    image: catTouring,
    subcategories: [
      { slug: "water-tanks", label: "Water Tanks" },
      { slug: "storage-bags", label: "Storage & Bags" },
      { slug: "protection-platforms", label: "Protection Platforms" },
      { slug: "drinkware", label: "Drinkware" },
      { slug: "dash-accessories", label: "Dash Accessories" },
    ],
  },
  "water-tanks": {
    title: "WATER TANKS",
    description: "PAK vehicle-specific water tanks — tub, wheel arch, footwell and Rak tanks for touring hydration.",
    query: "tag:cat-water-tanks OR tag:water-tank",
    image: catTouring,
    parent: "touring",
  },
  "storage-bags": {
    title: "STORAGE & BAGS",
    description: "TAC9 tailgate bags and vehicle storage solutions — organised touring for every rig.",
    query: "tag:cat-storage-bags OR tag:storage-bag OR tag:tailgate-bag",
    image: catTouring,
    parent: "touring",
  },
  "protection-platforms": {
    title: "PROTECTION PLATFORMS",
    description: "TAC9 protection platforms — rugged load-carrying platforms built for touring and camping setups.",
    query: "tag:cat-protection-platforms OR tag:protection-platform",
    image: catTouring,
    parent: "touring",
  },
  drinkware: {
    title: "DRINKWARE",
    description: "Roamforge drink bottles and touring drinkware — hydration built for the tracks.",
    query: "tag:cat-drinkware OR tag:drink-bottle",
    image: catTouring,
    parent: "touring",
  },
  "dash-accessories": {
    title: "DASH ACCESSORIES",
    description: "Vehicle-specific dash and radio surrounds — clean, integrated mounting for gauges and accessories.",
    query: "tag:cat-dash-accessories OR tag:radio-surround",
    image: catTouring,
    parent: "touring",
  },
  "vehicle-protection": {
    title: "VEHICLE PROTECTION",
    description: "Nudge bars, bull bars, side steps, rock sliders and underbody protection — armour your 4WD for the tracks and the outback.",
    query: "tag:cat-vehicle-protection",
    image: catVehicleProtection,
    subcategories: [
      { slug: "nudge-bars", label: "Nudge Bars" },
      { slug: "bull-bars", label: "Bull Bars" },
      { slug: "side-steps", label: "Side Steps" },
      { slug: "underbody-protection", label: "Underbody Protection" },
    ],
  },
  "nudge-bars": {
    title: "NUDGE BARS",
    description: "Vehicle-specific nudge bars with and without sensor cut-outs — front-end protection for D-Max, Shark 6 and more.",
    query: "tag:cat-nudge-bars OR tag:nudge-bar",
    image: catVehicleProtection,
    parent: "vehicle-protection",
  },
  "bull-bars": {
    title: "BULL BARS",
    description: "Full-height bull bars — serious front-end protection for outback touring and remote travel.",
    query: "tag:cat-bull-bars OR tag:bull-bar",
    image: catVehicleProtection,
    parent: "vehicle-protection",
  },
  "side-steps": {
    title: "SIDE STEPS & RAILS",
    description: "Side steps, rock sliders and side rails — sill protection and easy entry for touring 4WDs.",
    query: "tag:cat-side-steps OR tag:side-step",
    image: catVehicleProtection,
    parent: "vehicle-protection",
  },
  "underbody-protection": {
    title: "UNDERBODY PROTECTION",
    description: "Bash plates and underbody armour — protect engine, transmission and diffs from the tracks.",
    query: "tag:cat-underbody-protection OR tag:bash-plate",
    image: catVehicleProtection,
    parent: "vehicle-protection",
  },
  merch: {
    title: "ROAMFORGE MERCH",
    description: "Roamforge branded apparel, caps and accessories — wear the brand on and off the tracks.",
    query: "tag:cat-merch",
    image: catMerch,
    subcategories: [
      { slug: "apparel", label: "Apparel" },
      { slug: "headwear", label: "Headwear" },
      { slug: "accessories", label: "Accessories" },
    ],
  },
  apparel: {
    title: "APPAREL",
    description: "Roamforge branded tees, hoodies and workwear — built for the tracks and the campsite.",
    query: "tag:cat-apparel OR tag:apparel",
    image: catMerch,
    parent: "merch",
  },
  headwear: {
    title: "HEADWEAR",
    description: "Roamforge caps, beanies and hats — everyday touring headwear.",
    query: "tag:cat-headwear OR tag:headwear",
    image: catMerch,
    parent: "merch",
  },
  accessories: {
    title: "ACCESSORIES",
    description: "Roamforge branded accessories, stickers and everyday touring extras.",
    query: "tag:cat-accessories OR tag:accessory",
    image: catMerch,
    parent: "merch",
  },
  planners: {
    title: "PLANNERS",
    description: "Trip planners, build planners and vehicle setup guides — plan every touring mission and every upgrade before you commit.",
    query: "tag:cat-planners",
    image: catPlanners,
    subcategories: [
      { slug: "trip-planners", label: "Trip Planners" },
      { slug: "build-planners", label: "Build Planners" },
    ],
  },
  "trip-planners": {
    title: "TRIP PLANNERS",
    description: "Touring trip planners — plan routes, campsites and fuel stops before you commit.",
    query: "tag:cat-trip-planners OR tag:trip-planner",
    image: catPlanners,
    parent: "planners",
  },
  "build-planners": {
    title: "BUILD PLANNERS",
    description: "4WD build planners — spec every upgrade, budget and fitment before you buy.",
    query: "tag:cat-build-planners OR tag:build-planner",
    image: catPlanners,
    parent: "planners",
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
  const parentCfg = cfg.parent ? CATEGORY_MAP[cfg.parent] : undefined;
  const subs = cfg.subcategories ?? parentCfg?.subcategories;
  const activeSlug = slug;
  // Parent categories act as landing pages: image cards for each subcategory,
  // an optional featured strip (max 4), a lifestyle banner and related
  // collections. Subcategory pages keep the full product grid.
  const isLandingPage = !!cfg.subcategories && cfg.subcategories.length > 0;
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "category", slug],
    queryFn: () => (cfg.query ? fetchProducts(50, cfg.query) : Promise.resolve([])),
    enabled: !!cfg.query && !isLandingPage,
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
          <p className="font-display tracking-[0.3em] text-rf-tan text-xs">
            {parentCfg ? (
              <a href={`/category/${cfg.parent}`} className="hover:text-rf-cream">
                {parentCfg.title}
              </a>
            ) : (
              "CATEGORY"
            )}
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl tracking-tight">{cfg.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-rf-cream/85">{cfg.description}</p>
          {!isLandingPage && subs && subs.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {parentCfg && (
                <Link
                  to="/category/$slug"
                  params={{ slug: cfg.parent! }}
                  className="rounded-full border border-rf-cream/30 px-3 py-1 text-[11px] font-display tracking-widest text-rf-cream/80 hover:border-rf-tan hover:text-rf-tan"
                >
                  ALL
                </Link>
              )}
              {subs.map((s) => (
                <Link
                  key={s.slug}
                  to="/category/$slug"
                  params={{ slug: s.slug }}
                  className={`rounded-full border px-3 py-1 text-[11px] font-display tracking-widest ${
                    activeSlug === s.slug
                      ? "border-rf-tan bg-rf-tan/20 text-rf-tan"
                      : "border-rf-cream/30 text-rf-cream/80 hover:border-rf-tan hover:text-rf-tan"
                  }`}
                >
                  {s.label.toUpperCase()}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="bg-rf-cream py-14 flex-1">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {isLandingPage ? (
            <div className="space-y-20">
              <div>
                <div className="flex items-end justify-between gap-4 border-b border-rf-dark/10 pb-3">
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-rf-dark">
                    SHOP BY CATEGORY
                  </h2>
                  <span className="font-display text-[11px] tracking-widest text-rf-dark/50">
                    {cfg.subcategories!.length} CATEGORIES
                  </span>
                </div>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {cfg.subcategories!.map((s) => {
                    const subCfg = CATEGORY_MAP[s.slug];
                    return (
                      <SubcategoryCard
                        key={s.slug}
                        slug={s.slug}
                        label={s.label}
                        image={subCfg?.image ?? cfg.image}
                      />
                    );
                  })}
                </div>
              </div>

              {featured.length > 0 && (
                <div>
                  <div className="flex items-end justify-between gap-4 border-b border-rf-dark/10 pb-3">
                    <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-rf-dark">
                      FEATURED PRODUCTS
                    </h2>
                  </div>
                  <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {featured.map((p) => (
                      <ProductCard key={p.node.id} product={p} />
                    ))}
                  </div>
                </div>
              )}

              {cfg.image && (
                <div className="relative overflow-hidden rounded-sm">
                  <img
                    src={cfg.image}
                    alt={cfg.title}
                    className="h-64 sm:h-80 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-rf-dark/85 via-rf-dark/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center px-8 sm:px-12">
                    <div className="max-w-md text-rf-cream">
                      <p className="font-display tracking-[0.3em] text-rf-tan text-xs">
                        BUILT FOR THE TRACKS
                      </p>
                      <p className="mt-3 font-display text-2xl sm:text-3xl tracking-tight">
                        {cfg.title} — engineered for touring 4WDs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {relatedParents.length > 0 && (
                <div>
                  <div className="flex items-end justify-between gap-4 border-b border-rf-dark/10 pb-3">
                    <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-rf-dark">
                      RELATED COLLECTIONS
                    </h2>
                  </div>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {relatedParents.map(([relSlug, relCfg]) => (
                      <SubcategoryCard
                        key={relSlug}
                        slug={relSlug}
                        label={relCfg.title}
                        image={relCfg.image}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function SubcategoryCard({
  slug,
  label,
  image,
}: {
  slug: string;
  label: string;
  image?: string;
}) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug }}
      className="group relative block overflow-hidden rounded-sm bg-rf-dark aspect-[4/5]"
    >
      {image && (
        <img
          src={image}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-rf-dark via-rf-dark/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-lg sm:text-xl tracking-tight text-rf-cream">
          {label.toUpperCase()}
        </h3>
        <span className="mt-1 inline-block font-display text-[11px] tracking-widest text-rf-tan opacity-0 transition group-hover:opacity-100">
          SHOP NOW →
        </span>
      </div>
    </Link>
  );
}