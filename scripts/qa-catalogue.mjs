#!/usr/bin/env bun
// Live catalogue integrity check. Verifies that every product handle
// returned by the initial /shop grid payload resolves through the same
// product(handle:) query the PDP loader uses, with matching title and
// availability. Also asserts JM FAB coverage since that vendor triggered
// the P0 grid/PDP divergence report.
//
// Skips gracefully when Storefront credentials are unavailable so it
// runs in CI without secrets. Set FAIL_ON_SKIP=1 to require it.

import { readFileSync } from "node:fs";

function envFromSource() {
  try {
    const src = readFileSync("src/lib/site.ts", "utf8");
    const dom = src.match(/storeDomain:.*?["']([^"']+)["']/)?.[1];
    const tok = src.match(/storefrontToken:.*?["']([^"']+)["']/)?.[1];
    const ver = src.match(/apiVersion:\s*["']([^"']+)["']/)?.[1];
    return { dom, tok, ver };
  } catch {
    return {};
  }
}

const fromSrc = envFromSource();
const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN || fromSrc.dom;
const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || fromSrc.tok;
const version = fromSrc.ver || "2025-07";

if (!domain || !token) {
  const msg = "[qa:catalogue] Shopify credentials unavailable — skipping.";
  if (process.env.FAIL_ON_SKIP === "1") {
    console.error(msg);
    process.exit(1);
  }
  console.log(msg);
  process.exit(0);
}

const URL = `https://${domain}/api/${version}/graphql.json`;
async function gql(query, variables = {}) {
  const r = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`Shopify HTTP ${r.status}`);
  const j = await r.json();
  if (j.errors) throw new Error("Shopify GraphQL: " + JSON.stringify(j.errors));
  return j.data;
}

const failures = [];
function ok(label) {
  console.log(`  ok  ${label}`);
}
function fail(label, detail = "") {
  failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
  console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

const GRID = `
  query($q: String!) {
    products(first: 100, query: $q) {
      edges { node { handle title vendor availableForSale
        priceRange { minVariantPrice { amount currencyCode } } } }
    }
  }
`;
const PDP = `
  query($h: String!) {
    product(handle: $h) { id handle title availableForSale
      priceRange { minVariantPrice { amount } } }
  }
`;

const grid = await gql(GRID, { q: "available_for_sale:true" });
const edges = grid.products.edges;
ok(`grid returned ${edges.length} products`);

// JM FAB coverage: the vendor called out in the P0 report.
const jmfab = edges.filter((e) => (e.node.vendor || "").toLowerCase() === "jm fab");
if (jmfab.length === 0) {
  fail("JM FAB coverage present in grid");
} else {
  ok(`JM FAB coverage: ${jmfab.length} product(s) in grid`);
}

// Every grid handle must resolve via product(handle:) with matching title.
let mismatched = 0;
for (const e of edges) {
  const h = e.node.handle;
  const pdp = await gql(PDP, { h });
  if (!pdp.product) {
    mismatched++;
    fail(`grid handle resolves via PDP: ${h}`);
    continue;
  }
  if (pdp.product.title !== e.node.title) {
    mismatched++;
    fail(`title matches grid↔PDP: ${h}`, `grid="${e.node.title}" pdp="${pdp.product.title}"`);
    continue;
  }
  if ((pdp.product.availableForSale ?? true) === false) {
    mismatched++;
    fail(`availability matches grid↔PDP: ${h}`, "PDP reports unavailable but grid included it");
  }
}
if (mismatched === 0) ok(`every grid handle (${edges.length}) resolves through the PDP query`);

// Known unavailable handle must return null (proves 404 contract).
const bogus = await gql(PDP, { h: "gu-patrol-airbox" });
if (bogus.product === null) {
  ok("known-missing handle 'gu-patrol-airbox' resolves to null (drives real 404)");
} else {
  fail("known-missing handle 'gu-patrol-airbox' must be null", JSON.stringify(bogus));
}

console.log(
  `\n[qa:catalogue] ${failures.length === 0 ? "PASS" : `FAIL — ${failures.length} issue(s)`}`,
);
process.exit(failures.length === 0 ? 0 : 1);
