// Deterministic SEO invariants. Keeps canonical/OG/JSON-LD output honest
// without a full browser render.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const SITE_URL = "https://roamforge.com.au";

function read(p) {
  return readFileSync(p, "utf8");
}

export default {
  "sitemap: valid XML skeleton + roamforge origin"() {
    const src = read("src/routes/sitemap[.]xml.ts");
    assert.match(src, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(src, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.match(src, /SITE\.url/);
    assert.doesNotMatch(src, /lovable\.app/);
    assert.doesNotMatch(src, /r2\.dev/);
  },
  "robots.txt: allows crawlers and advertises sitemap on custom domain"() {
    const robots = read("public/robots.txt");
    assert.match(robots, /User-agent: \*/);
    assert.match(robots, /Allow: \//);
    assert.match(robots, new RegExp(`Sitemap:\\s*${SITE_URL}/sitemap\\.xml`));
    assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
    assert.doesNotMatch(robots, /lovable\.app/);
  },
  "root: 404 body carries noindex + branded title in SSR markup"() {
    const root = read("src/routes/__root.tsx");
    assert.match(root, /<title>Page not found — Roamforge<\/title>/);
    assert.match(root, /content="noindex, follow"/);
    // Root JSON-LD graph is present and valid.
    const m = root.match(
      /JSON\.stringify\(\{\s*"@context":\s*"https:\/\/schema\.org"[\s\S]*?"@graph"[\s\S]*?\}\)/,
    );
    assert.ok(m, "root JSON-LD @graph block missing");
  },
  "seo helper: routeMeta emits canonical, og and twitter tags on custom domain"() {
    const src = read("src/lib/seo.ts");
    assert.match(src, /rel:\s*"canonical"/);
    assert.match(src, /property:\s*"og:url"/);
    assert.match(src, /property:\s*"og:image"/);
    assert.match(src, /name:\s*"twitter:image"/);
    assert.match(src, /DEFAULT_OG_IMAGE/);
    // Never emits canonical on noindex routes.
    assert.match(src, /input\.noindex\s*\?\s*\[\]/);
  },
  "product route: emits Product + BreadcrumbList JSON-LD"() {
    const src = read("src/routes/product.$handle.tsx");
    assert.match(src, /"@type":\s*"Product"/);
    assert.match(src, /"@type":\s*"BreadcrumbList"/);
    assert.match(src, /availability/);
    assert.match(src, /priceCurrency/);
    assert.match(src, /rel:\s*"canonical"/);
  },
  "every content route registers head metadata"() {
    const dir = "src/routes";
    const missing = [];
    for (const entry of readdirSync(dir)) {
      if (!/\.tsx$/.test(entry)) continue;
      if (/__root|sitemap/.test(entry)) continue;
      const body = read(join(dir, entry));
      if (!/head:\s*\(/.test(body)) missing.push(entry);
    }
    assert.deepEqual(missing, [], `routes missing head(): ${missing.join(", ")}`);
  },
  "no preview-domain leakage in source"() {
    // Scanning a handful of critical files is enough; qa-static covers broader
    // filesystem scans. Here we lock the SEO surface specifically.
    for (const p of [
      "src/lib/seo.ts",
      "src/lib/site.ts",
      "src/routes/__root.tsx",
      "src/routes/sitemap[.]xml.ts",
      "public/robots.txt",
    ]) {
      const body = read(p);
      assert.doesNotMatch(body, /id-preview--/, `${p} references preview domain`);
      assert.doesNotMatch(body, /r2\.dev/, `${p} references r2.dev bucket`);
    }
  },
};
