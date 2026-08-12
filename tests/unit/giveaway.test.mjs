// Giveaway foundation guards: word counting, launch-gating copy, and the
// non-negotiable "checklist is never gated / marketing is never required" rules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

export const tests = [
  [
    "countWords matches the 25-word server rule",
    async () => {
      const { countWords, MAX_RESPONSE_WORDS } = await import("../../src/lib/giveaway.ts");
      assert.equal(MAX_RESPONSE_WORDS, 25);
      assert.equal(countWords("   "), 0);
      assert.equal(countWords("check  my   straps"), 3);
      assert.equal(countWords(Array.from({ length: 26 }, () => "x").join(" ")), 26);
    },
  ],
  [
    "the entry endpoint enforces window, flags, consents and word limit server-side",
    () => {
      const src = read("src/lib/giveaway.functions.ts");
      assert.match(src, /config\.launch_enabled/);
      assert.match(src, /config\.supplier_confirmed/);
      assert.match(src, /reason: "not-open"/);
      assert.match(src, /words > MAX_RESPONSE_WORDS/);
      assert.match(src, /must accept the official terms/);
      assert.match(src, /rate-limited/);
    },
  ],
  [
    "giveaway pages are noindex until the promotion is open",
    () => {
      for (const p of [
        "src/routes/giveaway.recovery-kit.tsx",
        "src/routes/giveaway.recovery-kit.terms.tsx",
      ]) {
        assert.match(read(p), /noindex: !loaderData\?\.open/);
      }
    },
  ],
  [
    "marketing consent is optional, unchecked and separate from entry receipt",
    () => {
      const form = read("src/components/GiveawayEntryForm.tsx");
      assert.match(form, /useState\(false\)/);
      assert.match(form, /not required to enter or win/i);
      assert.match(form, /you have not been subscribed/i);
    },
  ],
  [
    "the recovery checklist is never gated behind an email",
    () => {
      const src = read("src/routes/recovery-checklist.tsx");
      assert.match(src, /No email address required|no email address required/i);
      assert.match(src, /Optional: get new Roamforge guides by email/);
      assert.ok(!/required to view/i.test(src));
    },
  ],
];
