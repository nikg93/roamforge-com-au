import { storefrontApiRequest } from "@/lib/shopify";

export interface DirectCartLine {
  variantId: string;
  quantity: number;
}

const DIRECT_CART_LINE = /^(?<variantId>\d{6,20}):(?<quantity>[1-9]\d{0,2})$/;

const DIRECT_CART_CREATE = `mutation DirectCartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { checkoutUrl }
    userErrors { message }
  }
}`;

export function parseDirectCartLine(value: string): DirectCartLine | null {
  const match = DIRECT_CART_LINE.exec(value);
  if (!match?.groups) return null;

  const quantity = Number.parseInt(match.groups.quantity, 10);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) return null;

  return { variantId: match.groups.variantId, quantity };
}

function formatCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const trustedShopifyHost =
      host.endsWith(".myshopify.com") || host.endsWith(".shopify.com") || host.includes("checkout");

    if (url.protocol !== "https:" || !trustedShopifyHost) return null;

    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return null;
  }
}

export async function createDirectCheckout(line: DirectCartLine): Promise<string> {
  const variantGid = `gid://shopify/ProductVariant/${line.variantId}`;
  const response = await storefrontApiRequest(DIRECT_CART_CREATE, {
    input: { lines: [{ merchandiseId: variantGid, quantity: line.quantity }] },
  });
  const errors = response?.data?.cartCreate?.userErrors ?? [];
  const firstError = errors.find(
    (error: { message?: unknown }) => typeof error.message === "string",
  );

  if (firstError) throw new Error(firstError.message);

  const checkoutUrl = formatCheckoutUrl(response?.data?.cartCreate?.cart?.checkoutUrl);
  if (!checkoutUrl) throw new Error("Shopify did not return a valid checkout URL.");

  return checkoutUrl;
}
