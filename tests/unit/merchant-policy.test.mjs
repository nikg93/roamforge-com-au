// Validates Merchant listing structured data shape and guards against
// fabricated review/rating or invented shipping rates.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  offerShippingDetails,
  merchantReturnPolicy,
  RETURN_WINDOW_DAYS,
} from "../../src/lib/merchant-policy.ts";

const productRoute = readFileSync("src/routes/product.$handle.tsx", "utf8");

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
  "returnPolicy: AU, 30-day finite window, buyer pays return shipping"() {
    const r = merchantReturnPolicy();
    assert.equal(r["@type"], "MerchantReturnPolicy");
    assert.equal(r.applicableCountry, "AU");
    assert.equal(r.returnPolicyCountry, "AU");
    assert.equal(r.returnPolicyCategory, "https://schema.org/MerchantReturnFiniteReturnWindow");
    assert.equal(r.merchantReturnDays, RETURN_WINDOW_DAYS);
    assert.equal(RETURN_WINDOW_DAYS, 30);
    assert.equal(r.returnFees, "https://schema.org/ReturnShippingFees");
    assert.equal(r.returnMethod, "https://schema.org/ReturnByMail");
    assert.equal(r.merchantReturnLink, "https://roamforge.com.au/returns");
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
};
