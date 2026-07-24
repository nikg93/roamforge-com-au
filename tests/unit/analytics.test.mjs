import assert from "node:assert/strict";
import {
  trackGa4,
  trackAddToCart,
  trackViewItem,
  trackSearch,
  toAnalyticsItem,
} from "../../src/lib/analytics.ts";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "../../src/lib/consent.ts";

function installFakeWindow(consent) {
  const store = new Map();
  store.set(
    CONSENT_STORAGE_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      necessary: true,
      analytics: consent.analytics === true,
      marketing: consent.marketing === true,
      decided: true,
    }),
  );
  const gtagCalls = [];
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
    gtag: (...args) => gtagCalls.push(args),
  };
  return { gtagCalls };
}

function cleanup() {
  delete globalThis.window;
}

export default {
  "trackGa4 no-ops when analytics consent denied"() {
    const { gtagCalls } = installFakeWindow({ analytics: false });
    try {
      assert.equal(trackGa4("view_item", { foo: 1 }), false);
      assert.equal(gtagCalls.length, 0);
    } finally {
      cleanup();
    }
  },
  "trackAddToCart payload shape"() {
    const { gtagCalls } = installFakeWindow({ analytics: true });
    try {
      trackAddToCart({ item_id: "gid://x/1", item_name: "Test", price: 25, quantity: 2 });
      assert.equal(gtagCalls.length, 1);
      const [event, name, payload] = gtagCalls[0];
      assert.equal(event, "event");
      assert.equal(name, "add_to_cart");
      assert.equal(payload.value, 50);
      assert.equal(payload.currency, "AUD");
      assert.equal(payload.items[0].item_id, "gid://x/1");
    } finally {
      cleanup();
    }
  },
  "trackViewItem includes value"() {
    const { gtagCalls } = installFakeWindow({ analytics: true });
    try {
      trackViewItem({ item_id: "id1", item_name: "N", price: 12.5 });
      assert.equal(gtagCalls[0][2].value, 12.5);
    } finally {
      cleanup();
    }
  },
  "trackSearch ignores empty terms"() {
    const { gtagCalls } = installFakeWindow({ analytics: true });
    try {
      trackSearch("   ");
      assert.equal(gtagCalls.length, 0);
      trackSearch("lights");
      assert.equal(gtagCalls[0][2].search_term, "lights");
    } finally {
      cleanup();
    }
  },
  "toAnalyticsItem drops Default Title variant"() {
    const item = toAnalyticsItem({
      id: "1",
      title: "T",
      variantTitle: "Default Title",
      price: "9.99",
    });
    assert.equal(item.item_variant, undefined);
    assert.equal(item.price, 9.99);
  },
};
