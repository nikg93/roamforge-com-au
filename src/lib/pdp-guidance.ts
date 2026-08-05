/**
 * Demand-led buying guidance for specific live catalogue products.
 *
 * Every sentence here is traceable to the current Shopify listing copy,
 * the published Roamforge policies, or the on-site buyer guide. Nothing in
 * this file may state a specification, measurement, rating, review,
 * availability, delivery time or vehicle fitment that isn't already in the
 * live catalogue data.
 */
import type { CategorySlug } from "./categories";

export interface PdpGuidance {
  /** Stable id, used for keys and tests. */
  id: string;
  /** Optional sharper title tag. Falls back to the Shopify SEO title. */
  seoTitle?: string;
  /** Optional sharper meta description. Falls back to the Shopify SEO description. */
  seoDescription?: string;
  /** Supporting H2 for the guidance block. */
  heading: string;
  /** Short benefit paragraph, drawn only from listing copy. */
  intro: string;
  /** Visible FAQs; the same array feeds FAQPage structured data. */
  faqs: Array<[question: string, answer: string]>;
  /** Curated cross-sells that genuinely exist in the catalogue. */
  crossSell?: { heading: string; handles: string[] };
  /** Category to link back to. */
  category?: CategorySlug;
  /** On-site guide to link to. */
  guide?: { path: string; label: string };
}

const FITMENT_ANSWER =
  "Check fitment before ordering. Product listings only state the vehicles and applications the manufacturer specifies, so if your vehicle or configuration isn't named, contact us with your make, model, series and build year and we'll confirm before you buy.";

const AIR_COMPRESSOR_GUIDE = {
  path: "/guides/how-to-choose-a-4wd-air-compressor",
  label: "How to choose a 4WD air compressor",
};

const BEAST_HANDLES = [
  "lightforce-beast-230-led-driving-light-single",
  "lightforce-beast-230-3-mode-led-driving-light",
  "lightforce-beast-190-3-mode-led-driving-light",
];

const FR23_SWITCH_HANDLES = [
  "lightforce-htx-switch-fr23-fascia",
  "lightforce-lightbar-single-switch-fr23",
  "lightforce-driving-lights-single-switch-fr23",
  "lightforce-beacon-single-switch-fr23",
  "lightforce-single-switch-next-gen-ford-fascia",
];

interface GuidanceRule {
  match: (input: GuidanceInput) => boolean;
  guidance: PdpGuidance;
}

export interface GuidanceInput {
  handle: string;
  tags?: string[];
  productType?: string | null;
}

const RULES: GuidanceRule[] = [
  {
    // Highest-intent lighting page: queries "beast230pk" / "lightforce beast".
    match: (p) => p.handle === "lightforce-beast-230-led-driving-light-single",
    guidance: {
      id: "beast-230-single",
      seoTitle: "Lightforce BEAST 230mm LED Driving Light – Single | Roamforge",
      seoDescription:
        "Single Lightforce BEAST 230mm 12V LED driving light supplied with a clear spot filter and black protective cover. Wiring harness sold separately. Buy online at Roamforge.",
      heading: "What's in the box, and what you'll still need",
      intro:
        "This listing is a single BEAST 230mm 12V LED driving light for long-range touring and off-road illumination. It comes with one driving light, a clear spot filter and a black protective cover — the wiring harness is a separate purchase.",
      faqs: [
        [
          "Does this driving light include a wiring harness?",
          "No. The wiring harness is sold separately. The Lightforce BEAST Universal Wiring Harness listed in our catalogue is the Lightforce harness for BEAST driving lights.",
        ],
        [
          "Is this a pair or a single light?",
          "A single light. If you're running a pair, order two, or look at the BEAST 3-mode listings in the same range.",
        ],
        ["Will it suit my vehicle?", FITMENT_ANSWER],
      ],
      crossSell: {
        heading: "Pairs with",
        handles: [
          "lightforce-beast-universal-wiring-harness",
          "lightforce-beast-230-3-mode-led-driving-light",
          "lightforce-beast-190-3-mode-led-driving-light",
        ],
      },
      category: "lighting",
    },
  },
  {
    match: (p) => BEAST_HANDLES.includes(p.handle),
    guidance: {
      id: "beast-3-mode",
      heading: "Before you order",
      intro:
        "Lightforce BEAST driving lights are wired through a Lightforce harness. Confirm pack configuration, wiring and installation requirements against your vehicle before ordering.",
      faqs: [
        [
          "Do I need a separate wiring harness?",
          "Driving lights and harnesses are listed separately in our catalogue. The Lightforce BEAST Universal Wiring Harness is the Lightforce harness listed for BEAST driving lights.",
        ],
        ["Will it suit my vehicle?", FITMENT_ANSWER],
      ],
      crossSell: {
        heading: "Pairs with",
        handles: [
          "lightforce-beast-universal-wiring-harness",
          "lightforce-beast-230-led-driving-light-single",
          "lightforce-beast-switch-ty4-cyan",
        ],
      },
      category: "lighting",
    },
  },
  {
    // Queries "ford ranger switch fascia" / "switch fascia".
    match: (p) => p.handle === "lightforce-switch-fascia-next-gen-ford-ranger",
    guidance: {
      id: "ranger-switch-fascia",
      seoTitle: "Lightforce Switch Fascia – Next-Gen Ford Ranger | Roamforge",
      seoDescription:
        "Add up to five accessory switch positions to compatible next-generation Ford vehicles without cutting the factory interior. Switches sold separately. Buy online at Roamforge.",
      heading: "How the fascia works",
      intro:
        "The fascia replaces the existing OEM faceplate for a clean, factory-style fit and adds up to five accessory switch positions — no cutting or permanent modification of the factory interior. Switches are sold separately, so you choose only the ones you need.",
      faqs: [
        [
          "Are switches included with the fascia?",
          "No. Switches are sold separately so you can pick the functions you actually run.",
        ],
        [
          "How many switches does it take?",
          "Up to five accessory switch positions on compatible next-generation Ford vehicles.",
        ],
        [
          "Which switches fit this fascia?",
          "Our catalogue lists the Lightforce FR23-fascia switch range: an HTX dual switch, plus single lightbar, driving-light, beacon and roo-icon switches with a 23.9mm × 18mm cutout.",
        ],
        ["Will it suit my Ranger?", FITMENT_ANSWER],
      ],
      crossSell: { heading: "Switches for this fascia", handles: FR23_SWITCH_HANDLES },
      category: "lighting",
    },
  },
  {
    match: (p) => FR23_SWITCH_HANDLES.includes(p.handle),
    guidance: {
      id: "fr23-switch",
      heading: "Fascia and switch compatibility",
      intro:
        "This switch is designed for the Lightforce FR23 switch fascia. The fascia is listed separately in our catalogue and adds up to five accessory switch positions to compatible next-generation Ford vehicles.",
      faqs: [
        [
          "Do I need the fascia as well?",
          "Yes — these switches are designed for the Lightforce FR23 switch fascia, which is a separate listing.",
        ],
        [
          "Can I mix switch types in one fascia?",
          "The fascia takes up to five accessory switch positions, and each switch in the FR23 range is listed with the same 23.9mm × 18mm cutout.",
        ],
        ["Will it suit my vehicle?", FITMENT_ANSWER],
      ],
      crossSell: {
        heading: "Complete the fascia",
        handles: [
          "lightforce-switch-fascia-next-gen-ford-ranger",
          ...FR23_SWITCH_HANDLES.slice(0, 4),
        ],
      },
      category: "lighting",
    },
  },
  {
    // Category-level demand: "air compressor kit", "onboard air compressor kit".
    match: (p) => (p.tags ?? []).some((t) => t.toLowerCase() === "cat-air-compressors"),
    guidance: {
      id: "air-compressors",
      heading: "Choosing and using this compressor setup",
      intro:
        "Air compressors are how you air down for traction on sand and rock, then air back up for the drive home. Portable units stow in the tub or boot; in-vehicle kits mount permanently and stay ready to go.",
      faqs: [
        [
          "Portable or in-vehicle — which should I buy?",
          "Portable units are simplest if you air up a few times a trip and want to share the compressor between vehicles. In-vehicle kits suit regular touring where you want a permanent, always-connected setup. Our buyer guide walks through duty cycle, airflow, pressure and hose reach.",
        ],
        [
          "Do I need a tyre deflator as well?",
          "Most people run one. Our air compressor range also lists AOB tyre deflators and an inflator/deflator kit with a gauge, so you can drop pressure quickly before a track and check it as you air up.",
        ],
        ["Will this kit suit my vehicle?", FITMENT_ANSWER],
      ],
      crossSell: {
        heading: "Often bought together",
        handles: [
          "aob-multi-tyre-inflator-deflator-kit-with-gauge",
          "aob-tyre-deflator-70psi-pressure-gauge-with-bag",
          "aob-12v-200psi-portable-air-compressor",
          "aob-12v-120psi-compressor-3l-tank-universal-kit",
        ],
      },
      category: "air-compressors",
      guide: AIR_COMPRESSOR_GUIDE,
    },
  },
];

/** Resolve buying guidance for a product, or null when none is curated. */
export function getPdpGuidance(input: GuidanceInput): PdpGuidance | null {
  const rule = RULES.find((r) => r.match(input));
  if (!rule) return null;
  const g = rule.guidance;
  // Never cross-sell the product back to itself.
  if (!g.crossSell) return g;
  const handles = g.crossSell.handles.filter((h) => h !== input.handle);
  return { ...g, crossSell: { ...g.crossSell, handles } };
}

/** FAQPage structured data for visible FAQs only. */
export function faqPageJsonLd(faqs: Array<[string, string]>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
