#!/usr/bin/env bun
// Deterministic static QA gate. Fails the build if any release-critical
// invariant regresses. Cheap grep-based checks — no runtime deps.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const failures = [];
function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}
function read(p) {
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// 1. Required routes exist.
const requiredRoutes = [
  "src/routes/__root.tsx",
  "src/routes/index.tsx",
  "src/routes/shop.tsx",
  "src/routes/category.$slug.tsx",
  "src/routes/product.$handle.tsx",
  "src/routes/contact.tsx",
  "src/routes/privacy.tsx",
  "src/routes/faq.tsx",
  "src/routes/sitemap[.]xml.ts",
];
for (const r of requiredRoutes) check(`route present: ${r}`, existsSync(r));

// 2. Sitemap includes /shop.
const sitemap = read("src/routes/sitemap[.]xml.ts");
check("sitemap includes /shop", /["'`]\/shop["'`]/.test(sitemap));

// 3. No remote Google Fonts anywhere in source or public html.
const srcFiles = walk("src").concat(existsSync("index.html") ? ["index.html"] : []);
const gFonts = srcFiles.filter(
  (f) => /\.(tsx?|jsx?|css|html)$/.test(f) && /fonts\.(googleapis|gstatic)\.com/.test(read(f)),
);
check("no remote Google Fonts", gFonts.length === 0, gFonts.join(", "));

// 4. No stale TROLL3N campaign references.
const troll = srcFiles.filter((f) => /\.(tsx?|jsx?|md|html)$/.test(f) && /TROLL3N/i.test(read(f)));
check("no TROLL3N campaign references", troll.length === 0, troll.join(", "));

// 5. Consent gating markers present.
const integrations = read("src/components/Integrations.tsx");
check("Integrations gates on consent", /readConsent|CONSENT_UPDATED_EVENT/.test(integrations));
const consentLib = read("src/lib/consent.ts");
check(
  "consent lib exports readConsent + CONSENT_UPDATED_EVENT",
  /readConsent/.test(consentLib) && /CONSENT_UPDATED_EVENT/.test(consentLib),
);

// 6. Absolute SEO origin is https://roamforge.com.au.
const site = read("src/lib/site.ts");
check(
  "SITE.url === https://roamforge.com.au",
  /url:\s*["']https:\/\/roamforge\.com\.au["']/.test(site),
);

// 7. No unsupported static shipping/payment claims outside dedicated legal pages.
const bannedPhrases = [
  /free shipping australia[- ]wide/i,
  /free shipping on all orders/i,
  /same[- ]day dispatch/i,
];
const claimHits = [];
for (const f of srcFiles) {
  if (!/\.(tsx?|jsx?|md)$/.test(f)) continue;
  if (/routes\/(shipping|returns|warranty|terms|privacy|faq)\.tsx$/.test(f)) continue;
  const body = read(f);
  for (const rx of bannedPhrases) if (rx.test(body)) claimHits.push(`${f} (${rx})`);
}
check(
  "no unsupported shipping/payment claims outside legal pages",
  claimHits.length === 0,
  claimHits.join("; "),
);

// 8. Root route sets base SEO with absolute origin.
const root = read("src/routes/__root.tsx");
check("__root uses SITE base for og/canonical", /SITE\.url|SITE_URL|roamforge\.com\.au/.test(root));

// 9. Every rendered page produces a <main> — either directly, via PageShell,
// or via a route-local layout. Cheap static heuristic: every content route
// either contains "<main" or imports "PageShell".
const routeFiles = walk("src/routes").filter((f) => /\.tsx$/.test(f) && !/__root/.test(f));
const missingMain = [];
for (const f of routeFiles) {
  const body = read(f);
  const hasMain = /<main[\s>]/.test(body) || /PageShell/.test(body);
  if (!hasMain) missingMain.push(f);
}
check(
  "every content route provides a <main> landmark",
  missingMain.length === 0,
  missingMain.join(", "),
);

// 10. Storefront query availability contract — grid, search and sitemap
// must all filter on available_for_sale:true so anything they surface
// resolves through the PDP loader. Regressing this splits the catalogue.
const shopifyLib = read("src/lib/shopify.ts");
check(
  "fetchProducts enforces available_for_sale:true",
  /fetchProducts[\s\S]{0,400}available_for_sale:true/.test(shopifyLib),
);
check(
  "fetchProductsPage enforces available_for_sale:true",
  /fetchProductsPage[\s\S]{0,600}available_for_sale:true/.test(shopifyLib),
);
check(
  "sitemap handle query enforces available_for_sale:true",
  /PRODUCT_HANDLES_QUERY[\s\S]{0,800}available_for_sale:true/.test(shopifyLib) ||
    /fetchAllProductHandles[\s\S]{0,600}available_for_sale:true/.test(shopifyLib),
);
check(
  "predictive search filters unavailable products",
  /predictiveSearch[\s\S]{0,1200}availableForSale\s*!==\s*false/.test(shopifyLib),
);

// 12. Homepage uses the diversified featured helper so the rail spans
// multiple categories instead of surfacing four near-identical products.
const indexRoute = read("src/routes/index.tsx");
check(
  "homepage featured uses the merchandised homepage rail",
  /fetchHomepageFeatured\s*\(/.test(indexRoute),
);

// 13. Shop All merchandising: core catalogue is served before merch.
const shopRoute = read("src/routes/shop.tsx");
check("shop all filters merch out of the first page", /-tag:cat-merch/.test(shopRoute));
check(
  "shop all still paginates merch at the end",
  /tag:cat-merch/.test(shopRoute) && /fetchTwoPhaseNumberedPage/.test(shopRoute),
);

// 13b. Catalogue pagination must be crawlable: real ?page=N URLs with
// self-referencing canonicals and rel prev/next on both listing routes.
const categoryRoute = read("src/routes/category.$slug.tsx");
for (const [name, src] of [
  ["shop", shopRoute],
  ["category", categoryRoute],
]) {
  check(
    `${name} exposes numbered ?page= URLs`,
    /validateSearch/.test(src) && /parsePageParam/.test(src),
  );
  check(`${name} emits a self-referencing paginated canonical`, /canonicalForPage/.test(src));
  check(`${name} emits rel=prev/next`, /"prev"/.test(src) && /"next"/.test(src));
  check(`${name} 404s on out-of-range pages`, /notFound\(\)/.test(src));
  check(`${name} renders crawlable pagination links`, /CataloguePagination/.test(src));
}

// 13c. Fitment data must come from real Shopify metafields, never invented.
const pdpRoute = read("src/routes/product.$handle.tsx");
check("PDP reads vehicle fitment from Shopify metafields", /readVehicleFitment/.test(pdpRoute));
check(
  "product query requests custom fitment metafields",
  /metafields\(identifiers:/.test(read("src/lib/shopify.ts")),
);

// 14. Global OG/Twitter fallback wired at the root shell.
const rootRoute = read("src/routes/__root.tsx");
check(
  "root exposes DEFAULT_OG_IMAGE fallback",
  /DEFAULT_OG_IMAGE/.test(rootRoute) && /og:image[\s\S]{0,120}DEFAULT_OG_IMAGE/.test(rootRoute),
);

// 15. Judge.me reviews hide when the widget renders empty.
const judgeMe = read("src/components/JudgeMe.tsx");
check(
  "Judge.me reviews hide when empty",
  /hasReviews/.test(judgeMe) && /data-number-of-reviews/.test(judgeMe),
);

// 11. Product PDP not-found must emit noindex and no canonical.
const pdp = read("src/routes/product.$handle.tsx");
check(
  "PDP notFound head emits noindex",
  /!loaderData[\s\S]{0,400}robots[\s\S]{0,120}noindex/.test(pdp),
);
check(
  "PDP notFound head omits canonical link",
  (() => {
    const m = pdp.match(/!loaderData[\s\S]{0,600}?return\s*\{[\s\S]*?\};/);
    return m ? !/rel:\s*["']canonical["']/.test(m[0]) : false;
  })(),
);

// 16. Homepage first-sales conversion block.
const home = read("src/routes/index.tsx");
check("homepage renders a featured product rail anchor", /id="featured-gear"/.test(home));
check("homepage featured heading copy", /FEATURED 4WD GEAR/.test(home));
check("homepage hero primary CTA targets featured gear", /href="#featured-gear"/.test(home));
check("homepage featured rail loads 8 products", /fetchHomepageFeatured\(8\)/.test(home));

// 17. Announcement strip claims are config-gated (no unverified claims).
const announce = read("src/components/AnnouncementBar.tsx");
check("announcement strip is gated on BRAND_CLAIMS", /BRAND_CLAIMS/.test(announce));
check(
  "authorised Lightforce dealer claim is an explicit boolean flag",
  /authorisedLightforceDealer:\s*(true|false)/.test(read("src/lib/site.ts")),
);

// 18. Analytics single-fire guard present.
const analytics = read("src/lib/analytics.ts");
check("analytics dedupes duplicate events", /shouldEmit\(/.test(analytics));
check(
  "begin_checkout guards against empty carts",
  /trackBeginCheckout[\s\S]{0,200}items\.length === 0/.test(analytics),
);

console.log(
  `\n[qa:checks] ${failures.length === 0 ? "PASS" : `FAIL — ${failures.length} issue(s)`}`,
);
process.exit(failures.length === 0 ? 0 : 1);
