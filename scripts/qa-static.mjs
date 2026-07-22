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
  "src/routes/$.tsx",
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
check("__root uses SITE base for og/canonical", /SITE\.url|roamforge\.com\.au/.test(root));

// 9. Single <main> pattern: routes should not each render their own <main> AND __root also render one.
const rootHasMain = /<main[\s>]/.test(root);
const routeFiles = walk("src/routes").filter((f) => /\.(tsx)$/.test(f) && !/__root/.test(f));
const routesWithMain = routeFiles.filter((f) => /<main[\s>]/.test(read(f)));
// Either root renders <main> (and routes don't) OR each route renders exactly one.
const dupMain = rootHasMain && routesWithMain.length > 0;
check("no duplicated <main> landmark between root and routes", !dupMain, routesWithMain.join(", "));

console.log(
  `\n[qa:checks] ${failures.length === 0 ? "PASS" : `FAIL — ${failures.length} issue(s)`}`,
);
process.exit(failures.length === 0 ? 0 : 1);
