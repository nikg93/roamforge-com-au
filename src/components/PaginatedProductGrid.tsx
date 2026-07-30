import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { EmptyProducts } from "@/components/EmptyProducts";
import { CataloguePagination } from "@/components/CataloguePagination";
import type { ShopifyProduct } from "@/lib/shopify";

interface PaginatedProductGridProps {
  /** Server-rendered products for the current page. */
  products: ShopifyProduct[];
  page: number;
  totalPages: number;
  /** Route id for pagination links, e.g. "/shop" or "/category/$slug". */
  to: string;
  params?: Record<string, string>;
  label?: string;
  /** Resets appended pages when the underlying list changes (e.g. category). */
  resetKey?: string;
  /** Fetches an additional page for the Load More enhancement. */
  fetchPage: (page: number) => Promise<{ products: ShopifyProduct[] } | null>;
}

/**
 * Product grid with crawlable numbered pagination as the source of truth.
 * "Load more" is progressive enhancement only: the numbered Previous/Next
 * links are always present in the initial HTML and work without JavaScript.
 */
export function PaginatedProductGrid({
  products,
  page,
  totalPages,
  to,
  params,
  label,
  resetKey,
  fetchPage,
}: PaginatedProductGridProps) {
  const [extra, setExtra] = useState<ShopifyProduct[]>([]);
  const [loadedThrough, setLoadedThrough] = useState(page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setExtra([]);
    setLoadedThrough(page);
    setError(false);
  }, [page, resetKey]);

  const all = [...products, ...extra];
  const hasMore = loadedThrough < totalPages;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    const next = loadedThrough + 1;
    try {
      const res = await fetchPage(next);
      if (!res) {
        setLoadedThrough(totalPages);
        return;
      }
      // Guard against duplicates if a page overlaps after a catalogue change.
      setExtra((prev) => {
        const seen = new Set([...products, ...prev].map((p) => p.node.id));
        return [...prev, ...res.products.filter((p) => !seen.has(p.node.id))];
      });
      setLoadedThrough(next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {all.length === 0 ? (
          <EmptyProducts />
        ) : (
          all.map((p) => <ProductCard key={p.node.id} product={p} />)
        )}
      </div>

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-rf-dark px-6 text-xs font-semibold uppercase tracking-[0.18em] text-rf-dark transition-colors hover:bg-rf-dark hover:text-rf-cream disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {loading ? "Loading" : "Load more products"}
          </button>
          <p className="sr-only" aria-live="polite">
            {loading ? "Loading more products" : `${all.length} products shown`}
          </p>
          {error && (
            <p className="text-xs text-destructive">
              Couldn&apos;t load more products. Please try again.
            </p>
          )}
        </div>
      )}

      <CataloguePagination
        page={page}
        totalPages={totalPages}
        to={to}
        params={params}
        label={label}
      />
    </>
  );
}
