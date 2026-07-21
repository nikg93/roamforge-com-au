import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    // Shopify search: title or vendor match
    const q = debounced.replace(/"/g, "").trim();
    const shopifyQuery = `title:*${q}* OR vendor:*${q}* OR tag:*${q}*`;
    fetchProducts(12, shopifyQuery)
      .then((rows) => {
        if (cancelled) return;
        setResults(rows);
        setStatus("done");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-rf-dark/80 px-4 pt-16 sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-2xl bg-rf-cream text-rf-dark shadow-2xl">
        <div className="flex items-center gap-3 border-b border-rf-dark/10 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-rf-dark/60" aria-hidden />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="flex-1 bg-transparent py-2 text-base outline-none placeholder:text-rf-dark/40"
          />
          {status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin text-rf-dark/60" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close search"
            className="grid h-11 w-11 place-items-center text-rf-dark/70 hover:text-rf-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {status === "idle" && (
            <p className="px-4 py-8 text-center text-sm text-rf-dark/60">
              Search by product, brand or category tag.
            </p>
          )}
          {status === "error" && (
            <p className="px-4 py-8 text-center text-sm text-red-700">
              Search couldn't load right now. Try again in a moment.
            </p>
          )}
          {status === "done" && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-rf-dark/60">
              No products match "{debounced}".
            </p>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-rf-dark/10">
              {results.map((p) => {
                const img = p.node.images.edges[0]?.node;
                const price = p.node.priceRange.minVariantPrice;
                return (
                  <li key={p.node.id}>
                    <Link
                      to="/product/$handle"
                      params={{ handle: p.node.handle }}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-rf-dark/5 focus:bg-rf-dark/5 focus:outline-none"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden bg-secondary">
                        {img && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-rf-dark">{p.node.title}</p>
                        <p className="mt-0.5 text-xs text-rf-dark/60">
                          ${parseFloat(price.amount).toFixed(2)} {price.currencyCode}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
