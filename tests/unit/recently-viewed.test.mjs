import assert from "node:assert/strict";
import { addRecentlyViewedTo, RECENTLY_VIEWED_MAX } from "../../src/lib/recently-viewed.ts";

const mk = (handle) => ({ handle, title: `P ${handle}`, viewedAt: Date.now() });

export default {
  "puts new item first"() {
    const out = addRecentlyViewedTo([mk("a"), mk("b")], mk("c"));
    assert.equal(out[0].handle, "c");
  },
  "dedupes existing handle to the top"() {
    const out = addRecentlyViewedTo([mk("a"), mk("b"), mk("c")], mk("b"));
    assert.deepEqual(
      out.map((x) => x.handle),
      ["b", "a", "c"],
    );
  },
  "caps at MAX"() {
    const prior = Array.from({ length: RECENTLY_VIEWED_MAX }, (_, i) => mk(`x${i}`));
    const out = addRecentlyViewedTo(prior, mk("new"));
    assert.equal(out.length, RECENTLY_VIEWED_MAX);
    assert.equal(out[0].handle, "new");
  },
};
