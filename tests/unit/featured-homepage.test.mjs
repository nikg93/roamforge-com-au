import assert from "node:assert/strict";
import { prioritiseFeatured } from "../../src/lib/shopify.ts";

const mk = (id, tags = [], available = true, vendor = "V") => ({
  node: {
    id,
    title: `Product ${id}`,
    handle: `p-${id}`,
    vendor,
    productType: "",
    tags,
    availableForSale: available,
    priceRange: { minVariantPrice: { amount: "10.00", currencyCode: "AUD" } },
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
  },
});

export default {
  "lightforce stock leads the rail, capped at three"() {
    const lf = [1, 2, 3, 4, 5].map((i) => mk(`lf${i}`, ["cat-lighting"], true, "Lightforce"));
    const core = [1, 2, 3, 4, 5, 6].map((i) => mk(`c${i}`, [`cat-${i}`]));
    const out = prioritiseFeatured(lf, core, 8);
    assert.equal(out.length, 8);
    assert.deepEqual(
      out.slice(0, 3).map((p) => p.node.vendor),
      ["Lightforce", "Lightforce", "Lightforce"],
    );
    // Remainder of the rail is not a single-brand wall.
    assert.ok(out.slice(3).every((p) => p.node.vendor !== "Lightforce"));
  },
  "drops unavailable products and duplicates"() {
    const lf = [mk("a", [], false, "Lightforce"), mk("b", [], true, "Lightforce")];
    const core = [mk("b", [], true, "Lightforce"), mk("c", ["cat-x"])];
    const out = prioritiseFeatured(lf, core, 8);
    assert.deepEqual(
      out.map((p) => p.node.handle),
      ["p-b", "p-c"],
    );
  },
  "backfills from core when lightforce is empty"() {
    const core = [1, 2, 3].map((i) => mk(`c${i}`, ["cat-same"]));
    const out = prioritiseFeatured([], core, 3);
    assert.equal(out.length, 3);
  },
};
