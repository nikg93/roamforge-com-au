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

export type CategorySlug =
  | "performance"
  | "monitoring"
  | "gps-tracking"
  | "lighting"
  | "air-compressors"
  | "recovery"
  | "touring"
  | "vehicle-protection"
  | "merch"
  | "planners";

export interface Category {
  slug: CategorySlug;
  /** Page H1 — kept in the shouty Roamforge display voice. */
  label: string;
  /** Full nav label used in the mobile drawer and the desktop "More" menu. */
  navLabel: string;
  /** Compact label for the single-row desktop nav. */
  shortLabel: string;
  /** Search-intent `<title>` text (brand suffix is appended by the route). */
  seoTitle: string;
  /** Descriptive H2 above the grid — never a duplicate of the H1. */
  headingSubtitle: string;
  description: string;
  query: string;
  image: string;
  /** Shown directly in the desktop nav row; the rest live under "More". */
  primary: boolean;
  /**
   * Optional visible FAQs for the category page. Answers must be supported
   * by the live catalogue, published policies or an on-site guide — the same
   * array feeds FAQPage structured data.
   */
  faqs?: Array<[question: string, answer: string]>;
  /** Optional on-site buyer guide surfaced on the category page. */
  guidePath?: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "performance",
    label: "PERFORMANCE",
    navLabel: "PERFORMANCE",
    shortLabel: "PERFORMANCE",
    seoTitle: "4WD Performance Upgrades & Throttle Controllers",
    headingSubtitle: "THROTTLE CONTROLLERS, INTERCOOLERS & SNORKELS",
    description:
      "Throttle controllers, intercoolers, snorkels and performance upgrades that sharpen response and unlock your 4WD's true drivability.",
    query: "tag:cat-performance",
    image: catPerformance,
    primary: true,
  },
  {
    slug: "monitoring",
    label: "12V & VEHICLE MONITORING",
    navLabel: "12V & VEHICLE MONITORING",
    shortLabel: "12V",
    seoTitle: "12V Battery Monitors, DC-DC Chargers & Vehicle Monitoring",
    headingSubtitle: "BATTERY MONITORS, DC-DC CHARGERS & ISOLATORS",
    description:
      "Battery monitors, DC-DC chargers, isolators and live vehicle telemetry — full control over your 12V and touring electrical system.",
    query: "tag:cat-monitoring",
    image: catMonitoring,
    primary: false,
  },
  {
    slug: "gps-tracking",
    label: "GPS & TRACKING",
    navLabel: "GPS & TRACKING",
    shortLabel: "GPS",
    seoTitle: "4WD GPS Trackers & Anti-Theft Vehicle Tracking",
    headingSubtitle: "LIVE TRACKERS, ANTI-THEFT & CONVOY TELEMETRY",
    description:
      "Live GPS trackers, anti-theft units and touring telemetry so you always know where your rig — and your convoy — is.",
    query: "tag:cat-gps-tracking",
    image: catGps,
    primary: false,
  },
  {
    slug: "lighting",
    label: "LIGHTING",
    navLabel: "LIGHTING",
    shortLabel: "LIGHTING",
    seoTitle: "4WD Driving Lights, Light Bars & Wiring",
    headingSubtitle: "DRIVING LIGHTS, LIGHT BARS, WORK LIGHTS & WIRING",
    description:
      "Light bars, driving lights, work lights, rock lights, switches and wiring — engineered for touring 4WDs and long nights on the tracks.",
    query: "tag:cat-lighting",
    image: catLighting,
    primary: true,
  },
  {
    slug: "air-compressors",
    label: "AIR COMPRESSORS",
    navLabel: "AIR COMPRESSORS",
    shortLabel: "COMPRESSORS",
    seoTitle: "4WD Air Compressor Kits — Portable & Onboard Compressors",
    headingSubtitle: "PORTABLE, ONBOARD & VEHICLE-MOUNTED COMPRESSOR KITS",
    description:
      "Portable, onboard and vehicle-mounted 4WD air compressor kits, tyre deflators and inflation kits — air down for traction off road, then air up fast for the drive home.",
    query: "tag:cat-air-compressors",
    image: catCompressors,
    primary: false,
    guidePath: "/guides/how-to-choose-a-4wd-air-compressor",
    faqs: [
      [
        "What's the difference between a portable and an onboard air compressor kit?",
        "A portable compressor stows in the tub or boot and can move between vehicles. An onboard or vehicle-mounted kit is fitted permanently and stays wired and ready to use. Both are listed in this range — our buyer guide compares duty cycle, airflow, pressure and hose reach.",
      ],
      [
        "Do I need a tyre deflator as well as a compressor?",
        "Most 4WD owners run both. This range also lists AOB tyre deflators and an inflator/deflator kit with a gauge, so you can drop pressure quickly before a track and check it again as you air up.",
      ],
      [
        "How do I know a compressor kit will suit my vehicle?",
        "Check fitment before ordering. Listings only state the vehicles and applications the manufacturer specifies, so if yours isn't named, contact us with your make, model, series and build year and we'll confirm before you buy.",
      ],
    ],
  },
  {
    slug: "recovery",
    label: "RECOVERY GEAR",
    navLabel: "RECOVERY GEAR",
    shortLabel: "RECOVERY",
    seoTitle: "4WD Recovery Gear — Snatch Straps, Shackles & Boards",
    headingSubtitle: "SNATCH STRAPS, SOFT SHACKLES, BOARDS & RATED HARDWARE",
    description:
      "Snatch straps, soft shackles, recovery boards, kits and rated hardware — everything you need to get unstuck and keep touring.",
    query: "tag:cat-recovery",
    image: catRecovery,
    primary: true,
  },
  {
    slug: "touring",
    label: "TOURING & CAMPING",
    navLabel: "TOURING & CAMPING",
    shortLabel: "TOURING",
    seoTitle: "4WD Touring & Camping Gear — Awnings, Tents & Storage",
    headingSubtitle: "AWNINGS, ROOFTOP TENTS, WATER, STORAGE & CAMP GEAR",
    description:
      "Awnings, rooftop tents, water tanks, storage, tailgate systems, snorkels and camp gear — the essentials that turn a 4WD into a proper touring rig.",
    query: "tag:cat-touring",
    image: catTouring,
    primary: true,
  },
  {
    slug: "vehicle-protection",
    label: "VEHICLE PROTECTION",
    navLabel: "VEHICLE PROTECTION",
    shortLabel: "PROTECTION",
    seoTitle: "4WD Bull Bars, Rock Sliders & Underbody Protection",
    headingSubtitle: "BULL BARS, NUDGE BARS, SIDE STEPS & UNDERBODY ARMOUR",
    description:
      "Nudge bars, bull bars, side steps, rock sliders and underbody protection — armour your 4WD for the tracks and the outback.",
    query: "tag:cat-vehicle-protection",
    image: catVehicleProtection,
    primary: true,
  },
  {
    slug: "merch",
    label: "ROAMFORGE MERCH",
    navLabel: "ROAMFORGE MERCH",
    shortLabel: "MERCH",
    seoTitle: "Roamforge Merch — 4WD Apparel, Caps & Accessories",
    headingSubtitle: "APPAREL, CAPS & ACCESSORIES",
    description:
      "Roamforge branded apparel, caps and accessories — wear the brand on and off the tracks.",
    query: "tag:cat-merch",
    image: catMerch,
    primary: false,
  },
  {
    slug: "planners",
    label: "PLANNERS",
    navLabel: "PLANNERS",
    shortLabel: "PLANNERS",
    seoTitle: "4WD Trip Planners, Build Planners & Setup Guides",
    headingSubtitle: "TRIP PLANNERS, BUILD PLANNERS & SETUP GUIDES",
    description:
      "Trip planners, build planners and vehicle setup guides — plan every touring mission and every upgrade before you commit.",
    query: "tag:cat-planners",
    image: catPlanners,
    primary: false,
  },
];

export const CATEGORY_MAP: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function isCategorySlug(slug: string): slug is CategorySlug {
  return slug in CATEGORY_MAP;
}

/** Categories rendered directly in the single-row desktop navigation. */
export const PRIMARY_CATEGORIES = CATEGORIES.filter((c) => c.primary);

/** Remaining categories, surfaced under the desktop "More" menu. */
export const SECONDARY_CATEGORIES = CATEGORIES.filter((c) => !c.primary);

/**
 * Resolve a product's category from its real Shopify `cat-*` tags so PDP
 * breadcrumbs and back-links point at the collection the product is
 * actually merchandised in. Returns null when no tag maps to a category.
 */
export function categoryFromTags(tags: string[] | undefined): Category | null {
  for (const tag of tags ?? []) {
    const slug = tag.trim().toLowerCase().replace(/^cat-/, "");
    if (slug !== tag.trim().toLowerCase() && isCategorySlug(slug)) return CATEGORY_MAP[slug];
  }
  return null;
}
