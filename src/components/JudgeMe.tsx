import { useEffect } from "react";

function judgeMeConfigured(): boolean {
  const domain =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_JUDGEME_SHOP_DOMAIN : undefined;
  const token =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_JUDGEME_PUBLIC_TOKEN : undefined;
  return (
    typeof domain === "string" && !!domain.trim() && typeof token === "string" && !!token.trim()
  );
}

export function JudgeMeBadge({ productId }: { productId: string }) {
  if (!judgeMeConfigured()) return null;
  return (
    <div className="jdgm-widget jdgm-preview-badge" data-id={productId} data-template="badge" />
  );
}

export function JudgeMeReviews({ productId }: { productId: string }) {
  useEffect(() => {
    if (!judgeMeConfigured()) return;
    const w = window as unknown as { jdgm?: { customizeBadges?: () => void } };
    try {
      w.jdgm?.customizeBadges?.();
    } catch {
      /* Judge.me not ready yet */
    }
  }, [productId]);
  if (!judgeMeConfigured()) return null;
  return (
    <section aria-labelledby="reviews-heading" className="mt-16 border-t border-border pt-8">
      <h2 id="reviews-heading" className="font-display text-xl tracking-widest text-rf-dark">
        CUSTOMER REVIEWS
      </h2>
      <div className="jdgm-widget jdgm-review-widget mt-4" data-id={productId} />
    </section>
  );
}
