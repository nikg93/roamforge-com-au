export interface ShippingThreshold {
  amount: number;
  currency: string;
}

export function getFreeShippingThreshold(): ShippingThreshold | null {
  const raw =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_FREE_SHIPPING_THRESHOLD_AUD
      : undefined;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return { amount: n, currency: "AUD" };
}
