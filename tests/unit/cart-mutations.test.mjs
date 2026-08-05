import assert from "node:assert/strict";

// jsdom-free shims so the persisted zustand store can boot under bun.
const storage = new Map();
const localStorageStub = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
globalThis.window = globalThis.window ?? {};
globalThis.window.localStorage = localStorageStub;
globalThis.localStorage = localStorageStub;
globalThis.document = globalThis.document ?? { visibilityState: "visible", addEventListener() {}, removeEventListener() {} };

const { useCartStore, classifyCartErrors, __resetCartQueueForTests } = await import(
  "../../src/stores/cartStore.ts"
);

const VARIANT = "gid://shopify/ProductVariant/1";
const LINE = "gid://shopify/CartLine/abc?cart=X";
const CART = "gid://shopify/Cart/X?key=k";

function product(id = "gid://shopify/Product/1", title = "AOB 12V 200psi Portable Air Compressor") {
  return { node: { id, title, description: "", handle: "aob", priceRange: { minVariantPrice: { amount: "100.00", currencyCode: "AUD" } }, images: { edges: [] }, variants: { edges: [] }, options: [] } };
}

function item(overrides = {}) {
  return {
    lineId: LINE,
    product: product(),
    variantId: VARIANT,
    variantTitle: "Default",
    price: { amount: "100.00", currencyCode: "AUD" },
    quantity: 1,
    selectedOptions: [],
    ...overrides,
  };
}

/** Stub the Storefront endpoint. `handler(opName, variables)` returns the GraphQL `data`. */
function stubShopify(handler) {
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const op = /mutation (\w+)|query (\w+)/.exec(body.query);
    const name = op?.[1] ?? op?.[2] ?? "unknown";
    calls.push({ name, variables: body.variables });
    return { ok: true, status: 200, json: async () => ({ data: handler(name, body.variables) }) };
  };
  return calls;
}

function reset(state) {
  __resetCartQueueForTests();
  useCartStore.setState({ items: [], cartId: null, checkoutUrl: null, isLoading: false, isSyncing: false, activeVariantIds: [], isDrawerOpen: false, ...state });
}

const subtotal = () =>
  useCartStore.getState().items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
const count = () => useCartStore.getState().items.reduce((s, i) => s + i.quantity, 0);

export default {
  "classifyCartErrors separates a dead line from a dead cart"() {
    assert.equal(classifyCartErrors([]), "none");
    assert.equal(
      classifyCartErrors([{ message: "The merchandise line with id c075 does not exist." }]),
      "line_not_found",
    );
    assert.equal(classifyCartErrors([{ message: "Cart not found" }]), "cart_not_found");
    assert.equal(classifyCartErrors([{ message: "Quantity too high" }]), "other");
  },

  async "remove one item updates count and subtotal"() {
    reset({
      cartId: CART,
      items: [item(), item({ variantId: "v2", lineId: "l2", product: product("p2", "Second") })],
    });
    stubShopify((name) => (name === "cartLinesRemove" ? { cartLinesRemove: { cart: { id: CART }, userErrors: [] } } : {}));
    await useCartStore.getState().removeItem(VARIANT);
    assert.equal(useCartStore.getState().items.length, 1);
    assert.equal(count(), 1);
    assert.equal(subtotal(), 100);
  },

  async "removing the last item empties the cart"() {
    reset({ cartId: CART, items: [item()] });
    stubShopify(() => ({ cartLinesRemove: { cart: { id: CART }, userErrors: [] } }));
    await useCartStore.getState().removeItem(VARIANT);
    const s = useCartStore.getState();
    assert.deepEqual(s.items, []);
    assert.equal(s.cartId, null);
    assert.equal(s.checkoutUrl, null);
  },

  async "quantity decrease to zero removes the line"() {
    reset({ cartId: CART, items: [item()] });
    const calls = stubShopify(() => ({ cartLinesRemove: { cart: { id: CART }, userErrors: [] } }));
    await useCartStore.getState().updateQuantity(VARIANT, 0);
    assert.equal(useCartStore.getState().items.length, 0);
    assert.ok(calls.some((c) => c.name === "cartLinesRemove"));
  },

  // Root-cause regression: an item persisted without a lineId used to make
  // remove / decrease silently no-op forever.
  async "item with a missing lineId is resolved from the server and removed"() {
    reset({ cartId: CART, items: [item({ lineId: null })] });
    const calls = stubShopify((name) =>
      name === "cartLines"
        ? { cart: { id: CART, totalQuantity: 1, lines: { edges: [{ node: { id: LINE, quantity: 1, merchandise: { id: VARIANT } } }] } } }
        : { cartLinesRemove: { cart: { id: CART }, userErrors: [] } },
    );
    await useCartStore.getState().removeItem(VARIANT);
    assert.equal(useCartStore.getState().items.length, 0);
    const rm = calls.find((c) => c.name === "cartLinesRemove");
    assert.deepEqual(rm.variables.lineIds, [LINE]);
  },

  async "phantom local item with no server line is dropped without analytics"() {
    reset({ cartId: CART, items: [item({ lineId: null })] });
    const events = [];
    globalThis.window.dataLayer = { push: (e) => events.push(e) };
    stubShopify(() => ({ cart: { id: CART, totalQuantity: 0, lines: { edges: [] } } }));
    await useCartStore.getState().removeItem(VARIANT);
    assert.equal(useCartStore.getState().items.length, 0);
    assert.equal(
      events.filter((e) => e?.event === "remove_from_cart").length,
      0,
      "must not emit a false remove_from_cart",
    );
    delete globalThis.window.dataLayer;
  },

  async "stale line rejection removes the row instead of wiping the cart"() {
    reset({
      cartId: CART,
      items: [item(), item({ variantId: "v2", lineId: "l2", product: product("p2", "Second") })],
    });
    stubShopify((name, vars) =>
      name === "cartLinesRemove"
        ? {
            cartLinesRemove: {
              cart: { id: CART },
              userErrors: vars.lineIds[0] === LINE ? [{ field: ["lineIds", "0"], message: "The merchandise line with id abc does not exist." }] : [],
            },
          }
        : {},
    );
    await useCartStore.getState().removeItem(VARIANT);
    const s = useCartStore.getState();
    assert.equal(s.items.length, 1, "only the dead line goes");
    assert.equal(s.cartId, CART, "the surviving cart must not be wiped");
  },

  async "cart-not-found rejection clears the cart"() {
    reset({ cartId: CART, items: [item()] });
    stubShopify(() => ({ cartLinesRemove: { cart: null, userErrors: [{ message: "Cart not found" }] } }));
    await useCartStore.getState().removeItem(VARIANT);
    assert.equal(useCartStore.getState().cartId, null);
    assert.equal(useCartStore.getState().items.length, 0);
  },

  async "failed mutation keeps the item and leaves the cart usable"() {
    reset({ cartId: CART, items: [item()] });
    stubShopify(() => ({ cartLinesRemove: { cart: { id: CART }, userErrors: [{ message: "Something went wrong" }] } }));
    await useCartStore.getState().removeItem(VARIANT);
    const s = useCartStore.getState();
    assert.equal(s.items.length, 1, "recoverable: item stays visible");
    assert.equal(s.isLoading, false, "busy state must be released");
    assert.deepEqual(s.activeVariantIds, []);
  },

  async "network rejection is recoverable and does not drop the item"() {
    reset({ cartId: CART, items: [item()] });
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    await useCartStore.getState().removeItem(VARIANT);
    const s = useCartStore.getState();
    assert.equal(s.items.length, 1);
    assert.equal(s.isLoading, false);
  },

  async "syncCart heals stale line ids and drops server-absent rows"() {
    reset({
      cartId: CART,
      items: [item({ lineId: "stale" }), item({ variantId: "v2", lineId: "l2", product: product("p2", "Gone") })],
    });
    stubShopify(() => ({ cart: { id: CART, totalQuantity: 2, lines: { edges: [{ node: { id: LINE, quantity: 2, merchandise: { id: VARIANT } } }] } } }));
    await useCartStore.getState().syncCart();
    const s = useCartStore.getState();
    assert.equal(s.items.length, 1);
    assert.equal(s.items[0].lineId, LINE);
    assert.equal(s.items[0].quantity, 2);
    assert.equal(count(), 2);
    assert.equal(subtotal(), 200);
  },

  async "syncCart empties the cart when the server cart has no lines"() {
    reset({ cartId: CART, items: [item()] });
    stubShopify(() => ({ cart: { id: CART, totalQuantity: 0, lines: { edges: [] } } }));
    await useCartStore.getState().syncCart();
    assert.deepEqual(useCartStore.getState().items, []);
    assert.equal(useCartStore.getState().cartId, null);
  },

  async "syncCart preserves the cart on a transient network failure"() {
    reset({ cartId: CART, items: [item()] });
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    await useCartStore.getState().syncCart();
    assert.equal(useCartStore.getState().items.length, 1, "never destroy the cart on a flaky network");
  },

  async "removed items never return after a subsequent sync"() {
    reset({ cartId: CART, items: [item()] });
    stubShopify((name) =>
      name === "cartLinesRemove"
        ? { cartLinesRemove: { cart: { id: CART }, userErrors: [] } }
        : { cart: { id: CART, totalQuantity: 0, lines: { edges: [] } } },
    );
    await useCartStore.getState().removeItem(VARIANT);
    await useCartStore.getState().syncCart();
    assert.deepEqual(useCartStore.getState().items, []);
  },
};
