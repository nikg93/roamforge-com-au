import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

const CART_QUERY = `query cart($id: ID!) { cart(id: $id) { id totalQuantity } }`;
const CART_CREATE = `mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { id checkoutUrl lines(first:100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
    userErrors { field message }
  }
}`;
const CART_LINES_ADD = `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId:$cartId, lines:$lines) {
    cart { id lines(first:100){edges{node{id merchandise{... on ProductVariant{id}}}}} }
    userErrors { field message }
  }
}`;
const CART_LINES_UPDATE = `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId:$cartId, lines:$lines) { cart { id } userErrors { field message } }
}`;
const CART_LINES_REMOVE = `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId:$cartId, lineIds:$lineIds) { cart { id } userErrors { field message } }
}`;

function formatCheckoutUrl(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("channel", "online_store");
    return u.toString();
  } catch {
    return url;
  }
}

function isCartNotFound(errs: Array<{ message: string }>) {
  return errs.some((e) => {
    const m = e.message.toLowerCase();
    return m.includes("cart not found") || m.includes("does not exist");
  });
}

async function createCart(item: CartItem) {
  const data = await storefrontApiRequest(CART_CREATE, {
    input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
  });
  const errs = data?.data?.cartCreate?.userErrors ?? [];
  if (errs.length) return null;
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  return {
    cartId: cart.id as string,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId: cart.lines.edges[0]?.node?.id as string,
  };
}

async function addLine(cartId: string, item: CartItem) {
  const data = await storefrontApiRequest(CART_LINES_ADD, {
    cartId,
    lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
  });
  const errs = data?.data?.cartLinesAdd?.userErrors ?? [];
  if (isCartNotFound(errs)) return { success: false, cartNotFound: true } as const;
  if (errs.length) return { success: false } as const;
  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges ?? [];
  const line = lines.find(
    (l: { node: { merchandise: { id: string }; id: string } }) =>
      l.node.merchandise.id === item.variantId,
  );
  return { success: true as const, lineId: line?.node?.id as string | undefined };
}

async function updateLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_UPDATE, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  const errs = data?.data?.cartLinesUpdate?.userErrors ?? [];
  if (isCartNotFound(errs)) return { success: false, cartNotFound: true } as const;
  if (errs.length) return { success: false } as const;
  return { success: true as const };
}

async function removeLine(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
  const errs = data?.data?.cartLinesRemove?.userErrors ?? [];
  if (isCartNotFound(errs)) return { success: false, cartNotFound: true } as const;
  if (errs.length) return { success: false } as const;
  return { success: true as const };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const existing = items.find((i) => i.variantId === item.variantId);
        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createCart({ ...item, lineId: null });
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, lineId: result.lineId }],
              });
            }
          } else if (existing) {
            const newQty = existing.quantity + item.quantity;
            if (!existing.lineId) return;
            const result = await updateLine(cartId, existing.lineId, newQty);
            if (result.success) {
              const cur = get().items;
              set({
                items: cur.map((i) =>
                  i.variantId === item.variantId ? { ...i, quantity: newQty } : i,
                ),
              });
            } else if ("cartNotFound" in result && result.cartNotFound) clearCart();
          } else {
            const result = await addLine(cartId, { ...item, lineId: null });
            if (result.success) {
              const cur = get().items;
              set({ items: [...cur, { ...item, lineId: result.lineId ?? null }] });
            } else if ("cartNotFound" in result && result.cartNotFound) clearCart();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const r = await updateLine(cartId, item.lineId, quantity);
          if (r.success) {
            const cur = get().items;
            set({ items: cur.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)) });
          } else if ("cartNotFound" in r && r.cartNotFound) clearCart();
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const r = await removeLine(cartId, item.lineId);
          if (r.success) {
            const cur = get().items;
            const next = cur.filter((i) => i.variantId !== variantId);
            next.length === 0 ? clearCart() : set({ items: next });
          } else if ("cartNotFound" in r && r.cartNotFound) clearCart();
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing, isLoading, clearCart } = get();
        // Never sync while a mutation is in flight — the local cart may hold an
        // item that hasn't reached Shopify yet, and clearing it would drop it.
        if (!cartId || isSyncing || isLoading) return;
        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          // Re-check isLoading after the network round-trip; if the user added
          // an item mid-sync, keep the local state.
          if ((!cart || cart.totalQuantity === 0) && !get().isLoading) clearCart();
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "shopify-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, cartId: s.cartId, checkoutUrl: s.checkoutUrl }),
    },
  ),
);
