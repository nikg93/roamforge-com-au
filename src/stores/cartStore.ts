import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storefrontApiRequest, type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
  availableForSale?: boolean;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  /** True when any cart mutation is in flight (used by the drawer). Prefer
   * `activeVariantIds` for per-card affordances so unrelated product cards
   * are not disabled while another line is updating. */
  isLoading: boolean;
  isSyncing: boolean;
  /** Set of variant IDs currently being mutated. */
  activeVariantIds: string[];
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

function summarizeUserErrors(errs: Array<{ message: string }>): string {
  const first = errs.find((e) => e.message)?.message;
  return first ?? "Shopify rejected the request.";
}

/**
 * Serialised mutation queue. Prevents rapid add/update/remove clicks (or a
 * quick tab-return sync racing against an add) from corrupting cart state
 * — every mutation runs strictly after the previous one resolves.
 */
let cartQueue: Promise<unknown> = Promise.resolve();
export function enqueueCartOp<T>(fn: () => Promise<T>): Promise<T> {
  const next = cartQueue.then(fn, fn);
  // Keep the chain alive even if a step rejects — otherwise the promise
  // returned to the next enqueue would surface an earlier error.
  cartQueue = next.catch(() => undefined);
  return next;
}
// Test hook so unit tests can reset the queue between cases.
export function __resetCartQueueForTests() {
  cartQueue = Promise.resolve();
}

async function createCart(item: CartItem) {
  const data = await storefrontApiRequest(CART_CREATE, {
    input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
  });
  const errs = data?.data?.cartCreate?.userErrors ?? [];
  if (errs.length) {
    console.error("[cart] cartCreate userErrors", errs);
    return { success: false as const, errorMessage: summarizeUserErrors(errs) };
  }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) {
    return { success: false as const, errorMessage: "Could not create cart." };
  }
  return {
    success: true as const,
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
  if (isCartNotFound(errs))
    return { success: false as const, cartNotFound: true, errorMessage: "Cart expired." };
  if (errs.length) {
    console.error("[cart] cartLinesAdd userErrors", errs);
    return { success: false as const, errorMessage: summarizeUserErrors(errs) };
  }
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
  if (isCartNotFound(errs))
    return { success: false as const, cartNotFound: true, errorMessage: "Cart expired." };
  if (errs.length) {
    console.error("[cart] cartLinesUpdate userErrors", errs);
    return { success: false as const, errorMessage: summarizeUserErrors(errs) };
  }
  return { success: true as const };
}

async function removeLine(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
  const errs = data?.data?.cartLinesRemove?.userErrors ?? [];
  if (isCartNotFound(errs))
    return { success: false as const, cartNotFound: true, errorMessage: "Cart expired." };
  if (errs.length) {
    console.error("[cart] cartLinesRemove userErrors", errs);
    return { success: false as const, errorMessage: summarizeUserErrors(errs) };
  }
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
      activeVariantIds: [],

      addItem: async (item) => {
        if (item.availableForSale === false) {
          toast.error("This item is currently sold out.");
          return;
        }
        await enqueueCartOp(async () => {
          const beginBusy = () =>
            set((s) => ({
              isLoading: true,
              activeVariantIds: s.activeVariantIds.includes(item.variantId)
                ? s.activeVariantIds
                : [...s.activeVariantIds, item.variantId],
            }));
          const endBusy = () =>
            set((s) => ({
              isLoading: false,
              activeVariantIds: s.activeVariantIds.filter((v) => v !== item.variantId),
            }));
          beginBusy();
          try {
            const { items, cartId } = get();
            const existing = items.find((i) => i.variantId === item.variantId);
            if (!cartId) {
              const r = await createCart({ ...item, lineId: null });
              if (r.success) {
                set({
                  cartId: r.cartId,
                  checkoutUrl: r.checkoutUrl,
                  items: [{ ...item, lineId: r.lineId }],
                });
              } else {
                toast.error(`Couldn't add to cart. ${r.errorMessage}`);
              }
              return;
            }
            if (existing) {
              const newQty = existing.quantity + item.quantity;
              if (!existing.lineId) return;
              const r = await updateLine(cartId, existing.lineId, newQty);
              if (r.success) {
                set({
                  items: get().items.map((i) =>
                    i.variantId === item.variantId ? { ...i, quantity: newQty } : i,
                  ),
                });
              } else if (r.cartNotFound) {
                // Safe expired-cart recovery: recreate cart with only the
                // item the user just tried to add (no duplicate quantities
                // from a stale local cart) and inform them.
                const created = await createCart({ ...item, lineId: null });
                if (created.success) {
                  set({
                    cartId: created.cartId,
                    checkoutUrl: created.checkoutUrl,
                    items: [{ ...item, lineId: created.lineId }],
                  });
                  toast.message("Your previous cart expired — item added to a fresh cart.");
                } else {
                  set({ items: [], cartId: null, checkoutUrl: null });
                  toast.error("Your cart expired. Please add the item again.");
                }
              } else {
                toast.error(`Couldn't update cart. ${r.errorMessage}`);
              }
              return;
            }
            const r = await addLine(cartId, { ...item, lineId: null });
            if (r.success) {
              set({
                items: [...get().items, { ...item, lineId: r.lineId ?? null }],
              });
            } else if (r.cartNotFound) {
              const created = await createCart({ ...item, lineId: null });
              if (created.success) {
                set({
                  cartId: created.cartId,
                  checkoutUrl: created.checkoutUrl,
                  items: [{ ...item, lineId: created.lineId }],
                });
                toast.message("Your previous cart expired — item added to a fresh cart.");
              } else {
                set({ items: [], cartId: null, checkoutUrl: null });
                toast.error("Your cart expired. Please add the item again.");
              }
            } else {
              toast.error(`Couldn't add to cart. ${r.errorMessage}`);
            }
          } catch (err) {
            console.error("[cart] addItem failed", err);
            toast.error("Couldn't add to cart. Please check your connection and try again.");
          } finally {
            endBusy();
          }
        });
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        await enqueueCartOp(async () => {
          set((s) => ({
            isLoading: true,
            activeVariantIds: s.activeVariantIds.includes(variantId)
              ? s.activeVariantIds
              : [...s.activeVariantIds, variantId],
          }));
          try {
            const { items, cartId, clearCart } = get();
            const item = items.find((i) => i.variantId === variantId);
            if (!item?.lineId || !cartId) return;
            const r = await updateLine(cartId, item.lineId, quantity);
            if (r.success) {
              set({
                items: get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
              });
            } else if (r.cartNotFound) {
              clearCart();
              toast.error("Your cart expired.");
            } else {
              toast.error(`Couldn't update quantity. ${r.errorMessage}`);
            }
          } catch (err) {
            console.error("[cart] updateQuantity failed", err);
            toast.error("Couldn't update quantity. Please try again.");
          } finally {
            set((s) => ({
              isLoading: false,
              activeVariantIds: s.activeVariantIds.filter((v) => v !== variantId),
            }));
          }
        });
      },

      removeItem: async (variantId) => {
        await enqueueCartOp(async () => {
          set((s) => ({
            isLoading: true,
            activeVariantIds: s.activeVariantIds.includes(variantId)
              ? s.activeVariantIds
              : [...s.activeVariantIds, variantId],
          }));
          try {
            const { items, cartId, clearCart } = get();
            const item = items.find((i) => i.variantId === variantId);
            if (!item?.lineId || !cartId) return;
            const r = await removeLine(cartId, item.lineId);
            if (r.success) {
              const next = get().items.filter((i) => i.variantId !== variantId);
              if (next.length === 0) clearCart();
              else set({ items: next });
            } else if (r.cartNotFound) {
              clearCart();
            } else {
              toast.error(`Couldn't remove item. ${r.errorMessage}`);
            }
          } catch (err) {
            console.error("[cart] removeItem failed", err);
            toast.error("Couldn't remove item. Please try again.");
          } finally {
            set((s) => ({
              isLoading: false,
              activeVariantIds: s.activeVariantIds.filter((v) => v !== variantId),
            }));
          }
        });
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
        } catch (err) {
          // Transient failure — keep the local cart intact so a slow/offline
          // network never destroys the user's selections.
          console.error("[cart] syncCart failed", err);
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
