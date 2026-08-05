import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/CartDrawer.tsx", "utf8");
const scrollStart = src.indexOf("overflow-y-auto");
const footerStart = src.indexOf("flex-shrink-0 space-y-3 pt-4 border-t");

export default {
  // Live defect: the upsell grid sat in the pinned footer, which made the
  // footer taller than the drawer on a 390px viewport with 5 lines. The line
  // rows were rendered underneath it, so every Remove / Decrease tap landed
  // on the footer and the cart looked frozen.
  "the upsell renders inside the scroll region, never the pinned footer"() {
    assert.ok(scrollStart > -1, "scrollable line region must exist");
    assert.ok(footerStart > -1, "pinned footer must exist");
    const upsell = src.indexOf("<CompleteTheKit");
    assert.ok(upsell > -1, "upsell must still render");
    assert.ok(upsell > scrollStart, "upsell must sit after the scroll container opens");
    assert.ok(upsell < footerStart, "upsell must not be inside the pinned footer");
  },
  "the pinned footer keeps only the totals and checkout affordances"() {
    const footer = src.slice(footerStart);
    assert.ok(footer.includes("Checkout with Shopify"));
    assert.ok(!footer.includes("<CompleteTheKit"));
  },
  "cart line controls keep 44px touch targets"() {
    for (const label of ["Remove ", "Decrease quantity", "Increase quantity"]) {
      const i = src.indexOf(label);
      assert.ok(i > -1, `${label} control must exist`);
      assert.ok(
        src.slice(Math.max(0, i - 400), i).includes("h-11 w-11"),
        `${label} control must be 44px`,
      );
    }
  },
};
