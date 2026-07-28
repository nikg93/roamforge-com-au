// Source-level guards for the first-sales conversion pass. These assert the
// homepage discovery path, hero CTA wiring and product-card purchase controls
// stay intact — cheap regression cover that runs without a browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("src/routes/index.tsx", "utf8");
const card = readFileSync("src/components/ProductCard.tsx", "utf8");
const announce = readFileSync("src/components/AnnouncementBar.tsx", "utf8");

export default {
  "homepage discovery: featured rail renders live Shopify products"() {
    assert.match(home, /fetchHomepageFeatured\(8\)/);
    assert.match(home, /featured\.slice\(0, 8\)/);
    assert.match(home, /<ProductCard key=\{p\.node\.id\} product=\{p\} \/>/);
  },
  "homepage discovery: featured section is the first block after the hero"() {
    const trust = home.indexOf("<TrustStrip />");
    const featured = home.indexOf("<FeaturedGear />");
    const categories = home.indexOf("SHOP BY CATEGORY");
    assert.ok(featured > trust, "featured rail must follow the hero/trust strip");
    assert.ok(featured < categories, "featured rail must precede the category grid");
  },
  "hero CTAs: primary scrolls to featured gear, secondary opens Lighting"() {
    assert.match(home, /href="#featured-gear"[\s\S]{0,300}SHOP FEATURED GEAR/);
    assert.match(home, /slug: "lighting"[\s\S]{0,400}SHOP LIGHTFORCE/);
    assert.match(home, /id="featured-gear"/);
    assert.match(home, /getElementById\("featured-gear"\)/);
  },
  "featured heading and shop-all link"() {
    assert.match(home, /FEATURED 4WD GEAR/);
    assert.match(home, /to="\/shop"[\s\S]{0,200}SHOP ALL/);
  },
  "product card: add to cart is independent of the product link"() {
    const linkIdx = card.indexOf("</Link>");
    const addIdx = card.indexOf("onClick={onAdd}");
    assert.ok(addIdx > linkIdx, "Add to Cart button must sit outside the product link");
    assert.match(card, /onClick=\{onSelect\}/);
    assert.match(card, /trackSelectItem/);
  },
  "announcement strip never hardcodes an unverified dealer claim"() {
    assert.match(announce, /BRAND_CLAIMS\.authorisedLightforceDealer/);
    assert.match(announce, /slug: "lighting"/);
  },
};
