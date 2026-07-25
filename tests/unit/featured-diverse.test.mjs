import assert from "node:assert/strict";
import { diversifyByCategory } from "../../src/lib/shopify.ts";

const mk = (id, tags = [], productType = "") => ({
  node: {
    id,
    title: `Product ${id}`,
    handle: `p-${id}`,
    vendor: "V",
    productType,
    tags,
    availableForSale: true,
    priceRange: { minVariantPrice: { amount: "10.00", currencyCode: "AUD" } },
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
  },
});

export default {
  "picks one product per primary cat-* tag"() {
    const pool = [
      mk("1", ["cat-performance"]),
      mk("2", ["cat-performance"]),
      mk("3", ["cat-recovery"]),
      mk("4", ["cat-touring"]),
      mk("5", ["cat-recovery"]),
    ];
    const out = diversifyByCategory(pool, 4);
    assert.equal(out.length, 4);
    const cats = out.map((p) => p.node.tags.find((t) => t.startsWith("cat-")));
    assert.equal(new Set(cats).size, 3);
    // First three are unique cats; fourth is a repeat filler.
    assert.deepEqual(cats.slice(0, 3), ["cat-performance", "cat-recovery", "cat-touring"]);
  },
  "falls back to productType when cat tag missing"() {
    const pool = [
      mk("1", [], "Snorkel"),
      mk("2", [], "Snorkel"),
      mk("3", [], "LightBar"),
    ];
    const out = diversifyByCategory(pool, 2);
    assert.equal(out.length, 2);
    assert.equal(out[0].node.productType, "Snorkel");
    assert.equal(out[1].node.productType, "LightBar");
  },
  "guarantees count when pool has enough leftovers"() {
    const pool = [
      mk("1", ["cat-a"]),
      mk("2", ["cat-a"]),
      mk("3", ["cat-a"]),
      mk("4", ["cat-a"]),
    ];
    const out = diversifyByCategory(pool, 3);
    assert.equal(out.length, 3);
  },
};