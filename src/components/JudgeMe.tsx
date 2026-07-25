import { useEffect, useRef, useState } from "react";

function judgeMeConfigured(): boolean {
  const domain =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_JUDGEME_SHOP_DOMAIN || "xmszfz-pj.myshopify.com"
      : undefined;
  const token =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_JUDGEME_PUBLIC_TOKEN || "s6uhJF5-bDPNZXFlMVSuJKpsYeI"
      : undefined;
  return (
    typeof domain === "string" && !!domain.trim() && typeof token === "string" && !!token.trim()
  );
}

function judgeMeProductId(productId: string): string {
  return productId.split("/").filter(Boolean).pop() || productId;
}

export function JudgeMeBadge({ productId }: { productId: string }) {
  if (!judgeMeConfigured()) return null;
  const id = judgeMeProductId(productId);
  return <div className="jdgm-widget jdgm-preview-badge" data-id={id} data-template="badge" />;
}

export function JudgeMeReviews({ productId }: { productId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default hidden. Only reveal if Judge.me actually renders a non-empty
  // review widget so PDPs with zero reviews don't show an empty heading.
  const [hasReviews, setHasReviews] = useState(false);
  useEffect(() => {
    setHasReviews(false);
    if (!judgeMeConfigured()) return;
    const w = window as unknown as { jdgm?: { customizeBadges?: () => void } };
    try {
      w.jdgm?.customizeBadges?.();
    } catch {
      /* Judge.me not ready yet */
    }
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;
      const widget = el.querySelector<HTMLElement>(".jdgm-rev-widg");
      const count = widget?.getAttribute("data-number-of-reviews");
      if (widget && count && Number.parseInt(count, 10) > 0) {
        setHasReviews(true);
        clearInterval(iv);
      }
    };
    const iv = setInterval(check, 500);
    const stop = setTimeout(() => clearInterval(iv), 8000);
    return () => {
      cancelled = true;
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, [productId]);
  if (!judgeMeConfigured()) return null;
  const id = judgeMeProductId(productId);
  return (
    <section
      aria-labelledby="reviews-heading"
      className={`mt-16 border-t border-border pt-8 ${hasReviews ? "" : "hidden"}`}
    >
      <h2 id="reviews-heading" className="font-display text-xl tracking-widest text-rf-dark">
        CUSTOMER REVIEWS
      </h2>
      <div ref={containerRef} className="jdgm-widget jdgm-review-widget mt-4" data-id={id} />
    </section>
  );
}
