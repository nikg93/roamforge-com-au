// Product title normalization. Some Shopify products carry a duplicated
// leading brand token in their titles (e.g. "Ultimate9 Ultimate9 evcX
// Throttle Controller") — usually the result of a merchant prepending the
// vendor name to a title that already includes it. We collapse only the
// exact leading duplication (case-insensitive, whitespace-tolerant) and
// leave the rest of the title untouched. Never mutates Shopify data.
//
// Rules:
//  - Only removes a consecutive duplicate of the very first token(s).
//  - If `vendor` is supplied and the title starts with "Vendor Vendor …",
//    collapse to "Vendor …".
//  - Otherwise, if the first whitespace-delimited token repeats immediately
//    (e.g. "Foo Foo Bar" or "FOO foo bar"), collapse the duplicate.
//  - Preserves legitimate repeats further in the string ("Foo Bar Foo Baz").
//  - Preserves the original casing of the surviving prefix.
export function normalizeProductTitle(rawTitle: string, vendor?: string | null): string {
  const title = (rawTitle ?? "").replace(/\s+/g, " ").trim();
  if (!title) return "";

  const v = (vendor ?? "").trim();
  if (v) {
    // Match "Vendor Vendor …" (case-insensitive, one or more spaces between).
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^(${escaped})\\s+${escaped}(\\s+|$)`, "i");
    const m = title.match(re);
    if (m) {
      const rest = title.slice(m[0].length);
      return rest ? `${m[1]} ${rest}` : m[1];
    }
  }

  // Generic first-token duplicate: "Foo Foo Bar" → "Foo Bar".
  const generic = title.match(/^(\S+)\s+(\S+)(\s+|$)(.*)$/);
  if (generic && generic[1].toLowerCase() === generic[2].toLowerCase()) {
    const rest = generic[4];
    return rest ? `${generic[1]} ${rest}` : generic[1];
  }

  return title;
}