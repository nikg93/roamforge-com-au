import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  readRecentlyViewed,
  RECENTLY_VIEWED_UPDATED_EVENT,
  type RecentlyViewedItem,
} from "@/lib/recently-viewed";

interface Props {
  excludeHandle?: string;
  title?: string;
  limit?: number;
  compact?: boolean;
}

export function RecentlyViewedRail({
  excludeHandle,
  title = "RECENTLY VIEWED",
  limit = 8,
  compact = false,
}: Props) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  useEffect(() => {
    const load = () => setItems(readRecentlyViewed());
    load();
    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, load);
    return () => window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, load);
  }, []);
  const visible = items.filter((i) => i.handle !== excludeHandle).slice(0, limit);
  if (visible.length === 0) return null;
  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className={compact ? "mt-8" : "mt-16 border-t border-border pt-8"}
    >
      <h2
        id="recently-viewed-heading"
        className={
          compact
            ? "font-display text-sm tracking-[0.2em] text-rf-dark"
            : "font-display text-xl tracking-widest text-rf-dark"
        }
      >
        {title}
      </h2>
      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {visible.map((item) => (
          <li key={item.handle} className="flex-none w-32 sm:w-40">
            <Link
              to="/product/$handle"
              params={{ handle: item.handle }}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
            >
              <div className="aspect-square overflow-hidden bg-secondary border border-border">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    width={160}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-rf-dark">{item.title}</p>
              {item.price && (
                <p className="text-xs font-semibold text-rf-dark">
                  ${parseFloat(item.price).toFixed(2)} {item.currencyCode ?? ""}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
