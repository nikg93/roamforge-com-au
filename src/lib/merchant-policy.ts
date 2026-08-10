// Merchant listing structured data for Product offers.
//
// Google Search Console flags offers that lack `shippingDetails` and
// `hasMerchantReturnPolicy`. Both objects below encode ONLY what the
// published Roamforge policies at /shipping and /returns actually state:
//
//  - Shipping cost is calculated at checkout from size/weight/destination, so
//    no monetary rate is asserted. schema.org allows a policy-level
//    `shippingSettingsLink` in place of a fabricated `shippingRate`.
//  - Delivery windows are estimates, not guarantees: handling 1-3 business
//    days, transit 3-14 business days (metro 3-7 through remote 7-14).
//  - Returns: Roamforge does not accept change-of-mind returns, so the
//    structured data declares MerchantReturnNotPermitted with no finite
//    window or fee fields. Faulty, damaged or incorrect goods remain covered
//    by Australian Consumer Law remedies (handled outside this schema).
import { SITE } from "./site";

export const SHIPPING_POLICY_URL = `${SITE.url}/shipping`;
export const RETURNS_POLICY_URL = `${SITE.url}/returns`;

/** Handling time before dispatch, in business days (published policy). */
export const HANDLING_DAYS = { min: 1, max: 3 } as const;
/** Conservative AU transit window in business days: metro 3 through remote 14. */
export const TRANSIT_DAYS = { min: 3, max: 14 } as const;
export function offerShippingDetails(): Record<string, unknown> {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "AU",
    },
    // No shippingRate: rates are quoted at checkout and must not be invented.
    shippingSettingsLink: SHIPPING_POLICY_URL,
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: HANDLING_DAYS.min,
        maxValue: HANDLING_DAYS.max,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: TRANSIT_DAYS.min,
        maxValue: TRANSIT_DAYS.max,
        unitCode: "DAY",
      },
    },
  };
}

export function merchantReturnPolicy(): Record<string, unknown> {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "AU",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: RETURNS_POLICY_URL,
  };
}
