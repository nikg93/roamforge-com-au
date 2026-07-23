import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeProductTitle } from "../../src/lib/product-title.ts";

test("collapses duplicated vendor prefix", () => {
  assert.equal(
    normalizeProductTitle("Ultimate9 Ultimate9 evcX Throttle Controller", "Ultimate9"),
    "Ultimate9 evcX Throttle Controller",
  );
});

test("collapses duplicated vendor prefix case-insensitively", () => {
  assert.equal(
    normalizeProductTitle("ULTIMATE9 ultimate9 evcX", "Ultimate9"),
    "ULTIMATE9 evcX",
  );
});

test("collapses generic duplicated first token when vendor not provided", () => {
  assert.equal(normalizeProductTitle("Redarc Redarc Tow Pro"), "Redarc Tow Pro");
});

test("preserves legitimate non-duplicate titles", () => {
  assert.equal(
    normalizeProductTitle("Ultimate9 evcX Throttle Controller", "Ultimate9"),
    "Ultimate9 evcX Throttle Controller",
  );
  assert.equal(normalizeProductTitle("Air Compressor 12V"), "Air Compressor 12V");
});

test("does not collapse repeats that aren't at the very start", () => {
  assert.equal(normalizeProductTitle("Foo Bar Foo Baz"), "Foo Bar Foo Baz");
});

test("does not collapse partial word matches", () => {
  assert.equal(normalizeProductTitle("Ram Rammer Kit"), "Ram Rammer Kit");
});

test("collapses vendor duplication surrounded by extra whitespace", () => {
  assert.equal(
    normalizeProductTitle("  Ultimate9   Ultimate9  evcX  ", "Ultimate9"),
    "Ultimate9 evcX",
  );
});

test("handles empty/undefined inputs safely", () => {
  assert.equal(normalizeProductTitle("", "Ultimate9"), "");
  assert.equal(normalizeProductTitle("Ultimate9 evcX", null), "Ultimate9 evcX");
});

test("collapses to bare vendor when title is just duplicated vendor", () => {
  assert.equal(normalizeProductTitle("Ultimate9 Ultimate9", "Ultimate9"), "Ultimate9");
});