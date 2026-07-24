import assert from "node:assert/strict";
import { rankRecommendations, scoreRecommendation } from "../../src/lib/recommendations.ts";

const mk = (id, over = {}) => ({
  node: {
    id,
    title: over.title ?? `Product ${id}`,
    handle: over.handle ?? `p-${id}`,
    vendor: over.vendor ?? "GenericBrand",
    productType: over.productType ?? "Accessory",
    tags: over.tags ?? [],
    availableForSale: true,
    priceRange: { minVariantPrice: { amount: "10.00", currencyCode: "AUD" } },
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
  },
});

export default {
  "scoreRecommendation returns -1 for self"() {
    assert.equal(scoreRecommendation(mk("1").node, mk("1").node), -1);
  },
  "shared cat- tag dominates over other tags"() {
    const src = mk("1", { tags: ["cat-recovery", "brand-x"] }).node;
    const cat = mk("2", { tags: ["cat-recovery"] }).node;
    const brand = mk("3", { tags: ["brand-x"] }).node;
    assert.ok(scoreRecommendation(src, cat) > scoreRecommendation(src, brand));
  },
  "rankRecommendations filters zero-score and limits"() {
    const src = mk("1", { tags: ["cat-lighting"], vendor: "Roamforge" });
    const out = rankRecommendations(
      src.node,
      [
        mk("2", { tags: ["cat-lighting"], vendor: "Roamforge" }),
        mk("3", { tags: ["cat-lighting"] }),
        mk("4", { tags: [], vendor: "Someone" }),
        mk("5", { tags: ["cat-lighting"] }),
        mk("6", { tags: ["cat-lighting"] }),
      ],
      3,
    );
    assert.equal(out.length, 3);
    assert.ok(out.every((p) => p.node.tags.includes("cat-lighting")));
  },
  "same productType scores positive without tag overlap"() {
    const src = mk("1", { productType: "Snorkel", vendor: "BrandA" }).node;
    assert.ok(
      scoreRecommendation(src, mk("2", { productType: "Snorkel", vendor: "BrandB" }).node) > 0,
    );
    assert.equal(
      scoreRecommendation(src, mk("3", { productType: "Shirt", vendor: "BrandB" }).node),
      0,
    );
  },
};
