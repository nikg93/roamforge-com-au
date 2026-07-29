import assert from "node:assert/strict";
import { parseAttribution, appendAttribution } from "../../src/lib/attribution.ts";

export default {
  "parses only known marketing params"() {
    const p = parseAttribution("?utm_source=meta&utm_campaign=first-sales&gclid=abc&email=a@b.com");
    assert.equal(p.utm_source, "meta");
    assert.equal(p.utm_campaign, "first-sales");
    assert.equal(p.gclid, "abc");
    assert.equal(p.email, undefined);
  },
  "appends attribution to a Shopify checkout URL"() {
    const url = appendAttribution(
      "https://xmszfz-pj.myshopify.com/cart/c/abc?channel=online_store",
      { utm_source: "meta", fbclid: "xyz" },
    );
    const u = new URL(url);
    assert.equal(u.hostname, "xmszfz-pj.myshopify.com");
    assert.equal(u.searchParams.get("channel"), "online_store");
    assert.equal(u.searchParams.get("utm_source"), "meta");
    assert.equal(u.searchParams.get("fbclid"), "xyz");
  },
  "never overwrites existing checkout params"() {
    const url = appendAttribution("https://x.myshopify.com/c?channel=online_store", {
      channel: "bad",
      utm_medium: "cpc",
    });
    const u = new URL(url);
    assert.equal(u.searchParams.get("channel"), "online_store");
    assert.equal(u.searchParams.get("utm_medium"), "cpc");
  },
  "returns the url unchanged when nothing was captured"() {
    const url = "https://x.myshopify.com/c?channel=online_store";
    assert.equal(appendAttribution(url, {}), url);
  },
};
