// Regression guards for the mobile consent/sticky-CTA repair, touch targets,
// the exact homepage H1 text, Meta Pixel ID sanitisation, and the absence of
// fabricated product schema fields.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sanitizeNumericId, ANALYTICS } from "../../src/lib/site.ts";

const read = (p) => readFileSync(p, "utf8");
const consent = read("src/components/ConsentBanner.tsx");
const styles = read("src/styles.css");
const pdp = read("src/routes/product.$handle.tsx");
const home = read("src/routes/index.tsx");
const card = read("src/components/ProductCard.tsx");
const drawer = read("src/components/CartDrawer.tsx");
const header = read("src/components/SiteHeader.tsx");

export default {
  "consent UI flags the document so the sticky CTA is hidden"() {
    assert.match(consent, /data-consent-open/);
    assert.match(consent, /consentUiOpen/);
    assert.match(styles, /\[data-consent-open="true"\] \[data-sticky-atc\]/);
    assert.match(styles, /display: none !important/);
    assert.match(pdp, /data-sticky-atc/);
  },
  "consent UI is never stacked above the sticky bar height"() {
    assert.doesNotMatch(consent, /bottom-\[calc\(96px/);
    assert.match(consent, /bottom-\[calc\(env\(safe-area-inset-bottom,0px\)\+0\.75rem\)\]/);
  },
  "safe-area handling preserved on banner and dialog"() {
    const matches = consent.match(/env\(safe-area-inset-bottom,0px\)/g) ?? [];
    assert.ok(matches.length >= 2, "banner and dialog must both respect the safe area");
  },
  "Accept All and Reject All are visually equal"() {
    assert.match(consent, /const CONSENT_ACTION_CLASS =/);
    const uses = consent.match(/className=\{CONSENT_ACTION_CLASS\}/g) ?? [];
    assert.equal(uses.length, 4, "reject+accept in both banner and dialog");
    assert.doesNotMatch(consent, /onClick=\{rejectAll\}\s+className="/);
  },
  "commerce controls keep >=44px touch targets"() {
    for (const [name, src] of Object.entries({ card, drawer, pdp, consent })) {
      assert.match(src, /min-h-11|h-11/, `${name} must use 44px controls`);
    }
    assert.equal((drawer.match(/h-11 w-11/g) ?? []).length >= 4, true);
    assert.equal((pdp.match(/min-h-11/g) ?? []).length >= 4, true);
    assert.match(header, /min-h-11|h-11/);
  },
  "disabled/loading/sold-out states preserved"() {
    assert.match(pdp, /disabled=\{adding \|\| !canAdd\}/);
    assert.match(pdp, /SOLD OUT/);
    assert.match(card, /disabled/);
  },
  "homepage H1 text content is exactly FORGED FOR ADVENTURE"() {
    const h1 = home.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    assert.ok(h1, "homepage must render an h1");
    const body = h1[1].replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    const text = body
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    assert.equal(text, "FORGED FOR ADVENTURE");
    assert.doesNotMatch(body, /<br\s*\/?>/);
  },
  "Meta Pixel ID is sanitised and unquoted"() {
    assert.equal(sanitizeNumericId("'1043681748196165'"), "1043681748196165");
    assert.equal(sanitizeNumericId(' "1043681748196165" '), "1043681748196165");
    assert.equal(sanitizeNumericId("abc"), "");
    assert.equal(sanitizeNumericId(undefined), "");
    assert.equal(ANALYTICS.metaPixelId, "1043681748196165");
    assert.equal(ANALYTICS.ga4MeasurementId, "G-QGGYL7FRLG");
  },
  "product schema adds no fabricated fields"() {
    assert.doesNotMatch(pdp, /aggregateRating|ratingValue|reviewCount/);
    assert.doesNotMatch(pdp, /gtin1[0-9]|"gtin"|\bmpn\b/);
    // brand and sku are only emitted from genuine Shopify data
    assert.match(pdp, /if \(sku\) productSchema\.sku = sku;/);
    assert.match(pdp, /productSchema\.brand = \{ "@type": "Brand", name: p\.vendor\.trim\(\) \}/);
  },
  "first-order offer stays at 5%"() {
    const promo = read("src/lib/promo.ts");
    assert.match(promo, /WELCOME_DISCOUNT_PERCENT\s*=\s*5\b/);
    assert.doesNotMatch(promo, /\b10%/);
  },
};
