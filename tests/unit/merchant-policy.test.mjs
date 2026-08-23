// Validates Merchant listing structured data shape and guards against
// fabricated review/rating or invented shipping rates.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { offerShippingDetails, merchantReturnPolicy } from "../../src/lib/merchant-policy.ts";

const productRoute = readFileSync("src/routes/product.$handle.tsx", "utf8");
const merchantOverrides = readFileSync("src/routes/merchant-url-overrides[.]tsv.ts", "utf8");

export default {
  "shippingDetails: AU destination, honest policy link, no invented rate"() {
    const s = offerShippingDetails();
    assert.equal(s["@type"], "OfferShippingDetails");
    assert.equal(s.shippingDestination.addressCountry, "AU");
    assert.equal(s.shippingSettingsLink, "https://roamforge.com.au/shipping");
    assert.ok(!("shippingRate" in s), "must not assert a monetary shipping rate");
    assert.ok(!("freeShippingThreshold" in s));
  },
  "shippingDetails: handling 1-3 and transit 3-14 business days"() {
    const dt = offerShippingDetails().deliveryTime;
    assert.equal(dt["@type"], "ShippingDeliveryTime");
    assert.deepEqual(
      [dt.handlingTime.minValue, dt.handlingTime.maxValue, dt.handlingTime.unitCode],
      [1, 3, "DAY"],
    );
    assert.deepEqual(
      [dt.transitTime.minValue, dt.transitTime.maxValue, dt.transitTime.unitCode],
      [3, 14, "DAY"],
    );
  },
  "returnPolicy: AU, change-of-mind returns not permitted, no finite-window fields"() {
    const r = merchantReturnPolicy();
    assert.equal(r["@type"], "MerchantReturnPolicy");
    assert.equal(r.applicableCountry, "AU");
    assert.equal(r.returnPolicyCategory, "https://schema.org/MerchantReturnNotPermitted");
    assert.equal(r.merchantReturnLink, "https://roamforge.com.au/returns");
    for (const k of [
      "merchantReturnDays",
      "returnFees",
      "returnMethod",
      "returnShippingFeesAmount",
      "returnPolicySeasonalOverride",
    ]) {
      assert.ok(!(k in r), `${k} must not be present`);
    }
  },
  "product offer wires both merchant listing properties"() {
    assert.match(productRoute, /shippingDetails:\s*offerShippingDetails\(\)/);
    assert.match(productRoute, /hasMerchantReturnPolicy:\s*merchantReturnPolicy\(\)/);
  },
  "product JSON-LD contains no fabricated review or rating data"() {
    assert.doesNotMatch(productRoute, /aggregateRating/);
    assert.doesNotMatch(productRoute, /"@type":\s*"Review"/);
    assert.doesNotMatch(productRoute, /reviewCount|ratingValue/);
  },
  "supplemental feed: each offer links to its exact Shopify variant"() {
    assert.match(merchantOverrides, /\?variant=%22\$\{variantId\}%22/);
    assert.match(merchantOverrides, /rows\.push\(`\$\{id\}\\t\$\{url\}\\t\$\{url\}/);
  },
};
