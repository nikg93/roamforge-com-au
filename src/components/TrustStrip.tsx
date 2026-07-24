import { ShieldCheck, Truck, Award, MapPin } from "lucide-react";

// Only claims we can substantiate today. No order counts, no delivery
// promises, no invented review totals.
const ITEMS = [
  { Icon: MapPin, label: "Australian owned" },
  { Icon: Award, label: "Trusted 4WD brands" },
  { Icon: ShieldCheck, label: "Secure Shopify checkout" },
  { Icon: Truck, label: "Ships across Australia" },
] as const;

export function TrustStrip() {
  return (
    <aside
      aria-label="Why shop Roamforge"
      className="border-b border-border bg-rf-cream/80 text-rf-dark"
    >
      <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3 text-xs font-medium sm:justify-between lg:px-8">
        {ITEMS.map(({ Icon, label }) => (
          <li key={label} className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-rf-tan" aria-hidden />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function MiniTrustRow() {
  return (
    <ul
      aria-label="Purchase reassurance"
      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground"
    >
      {ITEMS.map(({ Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-rf-tan" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
