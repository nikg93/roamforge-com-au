import assert from "node:assert/strict";
import { parseDirectCartLine } from "../../src/lib/direct-checkout.ts";

export default {
  "parses a Shopify cart permalink line"() {
    assert.deepEqual(parseDirectCartLine("53523361956205:1"), {
      variantId: "53523361956205",
      quantity: 1,
    });
  },

  "rejects malformed or unsafe direct cart lines"() {
    for (const value of ["", "53523361956205", "abc:1", "53523361956205:0", "53523361956205:1000"])
      assert.equal(parseDirectCartLine(value), null, value);
  },
};
