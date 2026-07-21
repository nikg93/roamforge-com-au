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
  label: string;
  navLabel: string;
  description: string;
  query: string;
  image: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "performance",
    label: "PERFORMANCE",
    navLabel: "PERFORMANCE",
    description:
      "Throttle controllers, intercoolers, snorkels and performance upgrades that sharpen response and unlock your 4WD's true drivability.",
    query: "tag:cat-performance",
    image: catPerformance,
  },
  {
    slug: "monitoring",
    label: "12V & VEHICLE MONITORING",
    navLabel: "12V & VEHICLE MONITORING",
    description:
      "Battery monitors, DC-DC chargers, isolators and live vehicle telemetry — full control over your 12V and touring electrical system.",
    query: "tag:cat-monitoring",
    image: catMonitoring,
  },
  {
    slug: "gps-tracking",
    label: "GPS & TRACKING",
    navLabel: "GPS & TRACKING",
    description:
      "Live GPS trackers, anti-theft units and touring telemetry so you always know where your rig — and your convoy — is.",
    query: "tag:cat-gps-tracking",
    image: catGps,
  },
  {
    slug: "lighting",
    label: "LIGHTING",
    navLabel: "LIGHTING",
    description:
      "Light bars, driving lights, work lights, rock lights, switches and wiring — engineered for touring 4WDs and long nights on the tracks.",
    query: "tag:cat-lighting",
    image: catLighting,
  },
  {
    slug: "air-compressors",
    label: "AIR COMPRESSORS",
    navLabel: "AIR COMPRESSORS",
    description:
      "Portable and in-vehicle air compressors, tyre deflators and inflation kits — air up fast after every low-pressure run.",
    query: "tag:cat-air-compressors",
    image: catCompressors,
  },
  {
    slug: "recovery",
    label: "RECOVERY GEAR",
    navLabel: "RECOVERY GEAR",
    description:
      "Snatch straps, soft shackles, recovery boards, kits and rated hardware — everything you need to get unstuck and keep touring.",
    query: "tag:cat-recovery",
    image: catRecovery,
  },
  {
    slug: "touring",
    label: "TOURING & CAMPING",
    navLabel: "TOURING & CAMPING",
    description:
      "Awnings, rooftop tents, water tanks, storage, tailgate systems, snorkels and camp gear — the essentials that turn a 4WD into a proper touring rig.",
    query: "tag:cat-touring",
    image: catTouring,
  },
  {
    slug: "vehicle-protection",
    label: "VEHICLE PROTECTION",
    navLabel: "VEHICLE PROTECTION",
    description:
      "Nudge bars, bull bars, side steps, rock sliders and underbody protection — armour your 4WD for the tracks and the outback.",
    query: "tag:cat-vehicle-protection",
    image: catVehicleProtection,
  },
  {
    slug: "merch",
    label: "ROAMFORGE MERCH",
    navLabel: "ROAMFORGE MERCH",
    description:
      "Roamforge branded apparel, caps and accessories — wear the brand on and off the tracks.",
    query: "tag:cat-merch",
    image: catMerch,
  },
  {
    slug: "planners",
    label: "PLANNERS",
    navLabel: "PLANNERS",
    description:
      "Trip planners, build planners and vehicle setup guides — plan every touring mission and every upgrade before you commit.",
    query: "tag:cat-planners",
    image: catPlanners,
  },
];

export const CATEGORY_MAP: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function isCategorySlug(slug: string): slug is CategorySlug {
  return slug in CATEGORY_MAP;
}
