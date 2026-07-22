import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { predictiveSearchProducts, type ShopifyProduct } from "@/lib/shopify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function SearchDialog({ open, onOpenChange, triggerRef }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<ShopifyProduct[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [retryTick, setRetryTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const q = debounced.replace(/"/g, "").trim();
    const timeoutId = setTimeout(() => {
      if (!cancelled) setStatus("error");
    }, 12_000);
    predictiveSearchProducts(q, 12)
      .then((rows) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setResults(rows);
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        console.error("[search] predictive search failed", err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [debounced, open, retryTick]);

  const liveMessage =
    status === "loading"
      ? "Searching…"
      : status === "error"
        ? "Search failed."
        : status === "done"
          ? results.length === 0
            ? `No results for ${debounced}`
            : `${results.length} result${results.length === 1 ? "" : "s"} for ${debounced}`
          : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => {
          // Focus the input instead of the close button.
          e.preventDefault();
          inputRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          // Return focus to the search trigger so keyboard users land back on it.
          if (triggerRef?.current) {
            e.preventDefault();
            triggerRef.current.focus();
          }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search products</DialogTitle>
          <DialogDescription>
            Search Roamforge by product name, brand or category tag.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-rf-dark/10 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-rf-dark/60" aria-hidden />
          <input
            ref={inputRef}
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
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <div aria-live="polite" role="status" className="sr-only">
            {liveMessage}
          </div>
          {status === "idle" && (
            <p className="px-4 py-8 text-center text-sm text-rf-dark/60">
              Search by product, brand or category tag.
            </p>
          )}
          {status === "error" && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-red-700">Search couldn't load right now.</p>
              <button
                type="button"
                onClick={() => setRetryTick((t) => t + 1)}
                className="mt-3 min-h-11 inline-flex items-center justify-center border border-rf-dark px-4 py-2 text-sm font-medium tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
              >
                RETRY
              </button>
            </div>
          )}
          {status === "done" && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-rf-dark/60">
              No products match &ldquo;{debounced}&rdquo;.
            </p>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-rf-dark/10" aria-label="Search results">
              {results.map((p) => {
                const img = p.node.images.edges[0]?.node ?? p.node.featuredImage;
                const price = p.node.priceRange.minVariantPrice;
                return (
                  <li key={p.node.id}>
                    <Link
                      to="/product/$handle"
                      params={{ handle: p.node.handle }}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-rf-dark/5 focus-visible:bg-rf-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rf-tan"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden bg-secondary">
                        {img && (
                          <img
                            src={img.url}
                            alt=""
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
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
      </DialogContent>
    </Dialog>
  );
}
