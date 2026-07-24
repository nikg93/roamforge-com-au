import { getFreeShippingThreshold } from "@/lib/shipping";

interface Props {
  subtotal: number;
  currency?: string;
}

export function FreeShippingBar({ subtotal, currency = "AUD" }: Props) {
  const threshold = getFreeShippingThreshold();
  if (!threshold) return null;
  const remaining = Math.max(0, threshold.amount - subtotal);
  const pct = Math.min(100, (subtotal / threshold.amount) * 100);
  const reached = subtotal >= threshold.amount;
  return (
    <div role="status" aria-live="polite" className="rounded-sm bg-secondary/50 p-3 text-xs">
      <p className="text-rf-dark">
        {reached
          ? "🎉 You've unlocked free standard shipping."
          : `Spend $${remaining.toFixed(2)} ${currency} more for free standard shipping.`}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full bg-rf-tan transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
