// Regression cover for the /guides/how-to-choose-a-4wd-air-compressor buyer
// guide: route presence, SEO metadata/schema, internal links, mobile targets.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const GUIDE = "src/routes/guides.how-to-choose-a-4wd-air-compressor.tsx";
const read = (p) => readFileSync(p, "utf8");

export default {
  "guide route: file exists with the correct route id"() {
    const src = read(GUIDE);
    assert.match(src, /createFileRoute\("\/guides\/how-to-choose-a-4wd-air-compressor"\)/);
    assert.match(src, /How to Choose a 4WD Air Compressor/);
  },
  "guide route: canonical + commercial title and description"() {
    const src = read(GUIDE);
    assert.match(src, /routeMeta\(/);
    assert.match(src, /path: GUIDE_PATH/);
    assert.match(src, /GUIDE_PATH = "\/guides\/how-to-choose-a-4wd-air-compressor"/);
    assert.match(src, /title: "How to Choose a 4WD Air Compressor \| Buyer's Guide \| Roamforge"/);
    assert.match(src, /type: "article"/);
    assert.doesNotMatch(src, /lovable\.app/);
  },
  "guide route: Article, BreadcrumbList and FAQPage JSON-LD"() {
    const src = read(GUIDE);
    for (const type of ["Article", "BreadcrumbList", "FAQPage"]) {
      assert.match(src, new RegExp(`"@type": "${type}"`), `${type} JSON-LD missing`);
    }
    assert.match(src, /FAQ_JSONLD/);
    // FAQ schema is generated from the same visible FAQS array — never hardcoded.
    assert.match(src, /mainEntity: FAQS\.map/);
  },
  "guide route: FAQ answers are all rendered visibly"() {
    const src = read(GUIDE);
    assert.match(src, /FAQS\.map\(\(\[q, a\]\) => \(/);
    assert.match(src, /<dd className="mt-2 text-rf-dark\/80">\{a\}<\/dd>/);
  },
  "guide route: links to the air-compressors category"() {
    const src = read(GUIDE);
    assert.match(src, /params=\{\{ slug: "air-compressors" \}\}/);
    assert.match(src, /SHOP AIR COMPRESSORS/);
  },
  "guide route: surfaces live catalogue products, no invented specs"() {
    const src = read(GUIDE);
    assert.match(src, /fetchProducts\(4, CATEGORY_MAP\["air-compressors"\]\.query\)/);
    assert.match(src, /<ProductCard key=\{p\.node\.id\} product=\{p\} \/>/);
    assert.doesNotMatch(src, /aggregateRating|"review"|\bgtin\b|\bmpn\b/i);
  },
  "guide route: CTA touch targets are at least 44px"() {
    const src = read(GUIDE);
    const ctas = src.match(/className="[^"]*inline-flex[^"]*"/g) ?? [];
    assert.ok(ctas.length > 0, "no CTA found");
    for (const c of ctas) assert.match(c, /min-h-11/, `CTA below 44px: ${c}`);
  },
  "category page: links to the guide from air-compressors"() {
    const src = read("src/routes/category.$slug.tsx");
    assert.match(src, /slug === "air-compressors"/);
    assert.match(src, /to="\/guides\/how-to-choose-a-4wd-air-compressor"/);
    assert.match(src, /READ: HOW TO CHOOSE A 4WD AIR COMPRESSOR/);
  },
  "sitemap: includes the guide URL"() {
    const src = read("src/routes/sitemap[.]xml.ts");
    assert.match(src, /path: "\/guides\/how-to-choose-a-4wd-air-compressor"/);
  },
  "guide route: does not touch pricing, discounts or analytics IDs"() {
    const src = read(GUIDE);
    assert.doesNotMatch(src, /10%|WELCOME_DISCOUNT|G-[A-Z0-9]{8,}|metaPixelId/);
  },
};
