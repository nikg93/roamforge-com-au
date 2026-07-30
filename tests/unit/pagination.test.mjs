// Crawlable catalogue pagination helpers must never throw on hostile input
// and must produce stable, self-referencing URLs.
import assert from "node:assert/strict";
import {
  PAGE_SIZE,
  MAX_PAGE,
  parsePageParam,
  totalPagesFor,
  pagePath,
  pageRange,
} from "../../src/lib/pagination.ts";
import { canonicalForPage } from "../../src/lib/seo.ts";
import { readVehicleFitment, normalizeMetafieldValue } from "../../src/lib/fitment.ts";

export default {
  "parsePageParam: garbage and out-of-range collapse to a valid page"() {
    for (const bad of [undefined, null, "", "abc", "-4", "0", NaN, {}, []]) {
      const n = parsePageParam(bad);
      assert.ok(Number.isInteger(n) && n >= 1, `bad input ${String(bad)} -> ${n}`);
    }
    assert.equal(parsePageParam("3"), 3);
    assert.equal(parsePageParam(3.9), 3);
    assert.equal(parsePageParam("999999"), MAX_PAGE);
  },
  "totalPagesFor: always at least one page"() {
    assert.equal(totalPagesFor(0), 1);
    assert.equal(totalPagesFor(24, 24), 1);
    assert.equal(totalPagesFor(25, 24), 2);
    assert.equal(totalPagesFor(-5), 1);
  },
  "pagePath: page 1 has no redundant query string"() {
    assert.equal(pagePath("/shop", 1), "/shop");
    assert.equal(pagePath("shop", 1), "/shop");
    assert.equal(pagePath("/shop", 3), "/shop?page=3");
  },
  "canonicalForPage: page 2+ self-references, never points back to page 1"() {
    const p1 = canonicalForPage("/shop", 1);
    const p2 = canonicalForPage("/shop", 2);
    assert.ok(p1.startsWith("https://"));
    assert.ok(!p1.includes("page="));
    assert.equal(p2, `${p1}?page=2`);
  },
  "pageRange: reports the true offset window"() {
    const r = pageRange(2, PAGE_SIZE, 24, 60);
    assert.deepEqual([r.from, r.to, r.total], [25, 48, 60]);
    const empty = pageRange(1, PAGE_SIZE, 0, 0);
    assert.deepEqual([empty.from, empty.to, empty.total], [0, 0, 0]);
  },
  "fitment: only real metafield values surface, never invented ones"() {
    assert.deepEqual(readVehicleFitment(undefined), []);
    assert.deepEqual(readVehicleFitment([]), []);
    assert.deepEqual(
      readVehicleFitment([null, { namespace: "custom", key: "engine", value: "" }]),
      [],
    );
    assert.deepEqual(
      readVehicleFitment([{ namespace: "other", key: "vehicle_make", value: "Toyota" }]),
      [],
      "metafields outside the custom namespace must be ignored",
    );
  },
  "fitment: rows follow the declared field order"() {
    const rows = readVehicleFitment([
      { namespace: "custom", key: "engine", value: "1GD-FTV" },
      { namespace: "custom", key: "vehicle_make", value: "Toyota" },
    ]);
    assert.deepEqual(
      rows.map((r) => r.key),
      ["vehicle_make", "engine"],
    );
    assert.equal(rows[0].label, "Make");
  },
  "fitment: list metafields render as a comma-separated string"() {
    assert.equal(normalizeMetafieldValue('["Hilux","Prado"]'), "Hilux, Prado");
    assert.equal(normalizeMetafieldValue("  N70  "), "N70");
    assert.equal(normalizeMetafieldValue("[not json"), "[not json");
    assert.equal(normalizeMetafieldValue(null), "");
  },
};
