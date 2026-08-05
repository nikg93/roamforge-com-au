// Regression cover for the demand-led PDP/category SEO+CRO pass:
// curated guidance, FAQ schema parity, breadcrumbs, internal links,
// cross-sells from real handles and mobile touch targets.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const read = (p) => readFileSync(p, "utf8");
const GUIDANCE = read("src/lib/pdp-guidance.ts");
const COMPONENT = read("src/components/ProductGuidance.tsx");
const PDP = read("src/routes/product.$handle.tsx");
const CATEGORIES = read("src/lib/categories.ts");
const CATEGORY_ROUTE = read("src/routes/category.$slug.tsx");

export default {
  "guidance: covers the three verified demand pages"() {
    assert.match(GUIDANCE, /lightforce-beast-230-led-driving-light-single/);
    assert.match(GUIDANCE, /lightforce-switch-fascia-next-gen-ford-ranger/);
    assert.match(GUIDANCE, /cat-air-compressors/);
  },
  "guidance: unique curated title and meta description for the demand pages"() {
    assert.match(
      GUIDANCE,
      /seoTitle: "Lightforce BEAST 230mm LED Driving Light – Single \| Roamforge"/,
    );
    assert.match(
      GUIDANCE,
      /seoTitle: "Lightforce Switch Fascia – Next-Gen Ford Ranger \| Roamforge"/,
    );
    const descs = [...GUIDANCE.matchAll(/seoDescription:\s*\n?\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(descs.length >= 2, "expected curated meta descriptions");
    assert.equal(new Set(descs).size, descs.length, "meta descriptions must be unique");
    for (const d of descs) assert.ok(d.length <= 200, `meta description too long: ${d}`);
  },
  "guidance: neutral check-fitment guidance, never invented compatibility"() {
    assert.match(GUIDANCE, /Check fitment before ordering/);
    assert.doesNotMatch(GUIDANCE, /guaranteed fit|fits all|universal fit/i);
  },
  "guidance: no fabricated schema/commerce fields"() {
    assert.doesNotMatch(
      GUIDANCE,
      /aggregateRating|"review"|\bgtin\b|\bmpn\b|in stock now|free shipping/i,
    );
    assert.doesNotMatch(GUIDANCE, /10%/);
  },
  "guidance: cross-sells reference real catalogue handles only"() {
    const handles = [...GUIDANCE.matchAll(/"(aob-[a-z0-9-]+|lightforce-[a-z0-9-]+)"/g)].map(
      (m) => m[1],
    );
    assert.ok(handles.length >= 8, "expected curated cross-sell handles");
    for (const h of handles) assert.match(h, /^(aob|lightforce)-[a-z0-9-]+$/);
  },
  "guidance: FAQ schema is generated from the visible FAQ array"() {
    assert.match(GUIDANCE, /export function faqPageJsonLd/);
    assert.match(GUIDANCE, /"@type": "FAQPage"/);
    assert.match(GUIDANCE, /faqs\.map\(\(\[q, a\]\) =>/);
    assert.match(COMPONENT, /guidance\.faqs\.map\(\(\[q, a\]\) =>/);
  },
  "pdp: renders guidance and emits FAQPage schema from the same data"() {
    assert.match(PDP, /<ProductGuidance guidance=\{guidance\} \/>/);
    assert.match(PDP, /faqPageJsonLd\(guidance\.faqs\)/);
  },
  "pdp: breadcrumb includes the real category in DOM and schema"() {
    assert.match(PDP, /categoryFromTags\(p\.tags\)/);
    assert.match(PDP, /to="\/category\/\$slug"/);
    assert.match(PDP, /position: 4, name: displayTitle/);
  },
  "pdp: canonical, product schema and merchant policies preserved"() {
    assert.match(PDP, /links: \[\{ rel: "canonical", href: url \}\]/);
    assert.match(PDP, /shippingDetails: offerShippingDetails\(\)/);
    assert.match(PDP, /hasMerchantReturnPolicy: merchantReturnPolicy\(\)/);
  },
  "pdp: descriptive image alt derived from title and product type"() {
    assert.match(PDP, /activeImage\.altText \?\?/);
    assert.match(PDP, /p\.productType \? ` — \$\{p\.productType\}` : ""/);
  },
  "guidance component: CTA touch targets are at least 44px"() {
    const ctas = COMPONENT.match(/className="[^"]*inline-flex[^"]*"/g) ?? [];
    assert.ok(ctas.length > 0, "no CTA found");
    for (const c of ctas) assert.match(c, /min-h-11/, `CTA below 44px: ${c}`);
  },
  "category: air compressors targets verified buyer queries"() {
    assert.match(
      CATEGORIES,
      /seoTitle: "4WD Air Compressor Kits — Portable & Onboard Compressors"/,
    );
    assert.match(CATEGORIES, /vehicle-mounted 4WD air compressor kits/);
    assert.match(CATEGORIES, /guidePath: "\/guides\/how-to-choose-a-4wd-air-compressor"/);
  },
  "category: visible FAQs plus matching FAQPage schema on page 1 only"() {
    assert.match(CATEGORY_ROUTE, /cfg\.faqs\.map\(\(\[q, a\]\) =>/);
    assert.match(CATEGORY_ROUTE, /faqPageJsonLd\(cfg\.faqs\)/);
    assert.match(CATEGORY_ROUTE, /cfg\.faqs\.length > 0 && page === 1/);
  },
  "analytics and offer wording untouched"() {
    for (const src of [GUIDANCE, COMPONENT, CATEGORY_ROUTE]) {
      assert.doesNotMatch(src, /G-[A-Z0-9]{8,}|metaPixelId|10% off/);
    }
  },
};
