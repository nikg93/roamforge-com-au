import { useQuery } from "@tanstack/react-query";
import { fetchRelatedProducts, type ShopifyProduct } from "@/lib/shopify";
import { rankRecommendations } from "@/lib/recommendations";
import { ProductCard } from "@/components/ProductCard";

interface CompleteTheKitProps {
  source: ShopifyProduct["node"];
  title?: string;
  limit?: number;
  compact?: boolean;
}

export function CompleteTheKit({
  source,
  title = "COMPLETE THE KIT",
  limit = 4,
  compact = false,
}: CompleteTheKitProps) {
  const q = useQuery({
    queryKey: ["complete-the-kit", source.handle],
    queryFn: () =>
      fetchRelatedProducts(source.handle, {
        productId: source.id,
        vendor: source.vendor,
        productType: source.productType,
        tags: source.tags,
      }),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const items = q.data ? rankRecommendations(source, q.data, limit) : [];
  if (!q.data || items.length === 0) return null;
  const grid = compact
    ? "grid gap-3 grid-cols-2"
    : "grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  return (
    <section aria-labelledby="complete-kit-heading" className={compact ? "mt-6" : "mt-16"}>
      <h2
        id="complete-kit-heading"
        className={
          compact
            ? "font-display text-sm tracking-[0.2em] text-rf-dark"
            : "font-display text-xl tracking-widest text-rf-dark"
        }
      >
        {title}
      </h2>
      <div className={`${grid} mt-4`}>
        {items.map((r) => (
          <ProductCard key={r.node.id} product={r} />
        ))}
      </div>
    </section>
  );
}
