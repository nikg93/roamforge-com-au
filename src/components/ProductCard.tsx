import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { shopifySrcSet, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const [busy, setBusy] = useState(false);

  // Prefer Shopify's own resolution of which variant to surface — survives
  // beyond the `variants(first:)` grid limit and matches Shopify storefronts.
  const chosen = product.node.selectedOrFirstAvailableVariant;
  const fallback =
    product.node.variants?.edges?.find((e) => e.node.availableForSale)?.node ??
    product.node.variants?.edges?.[0]?.node ??
    null;
  const variant = chosen ?? fallback;
  const productAvailable = product.node.availableForSale;
  const inStock =
    typeof productAvailable === "boolean"
      ? productAvailable && !!variant?.availableForSale
      : !!variant?.availableForSale;

  const img =
    variant?.image ?? product.node.featuredImage ?? product.node.images.edges[0]?.node ?? null;
  const price = variant?.price ?? product.node.priceRange.minVariantPrice;
  const compareAt =
    variant?.compareAtPrice ?? product.node.compareAtPriceRange?.minVariantPrice ?? null;
  const priceNum = parseFloat(price.amount);
  const compareNum = compareAt ? parseFloat(compareAt.amount) : NaN;
  const hasSavings = Number.isFinite(compareNum) && compareNum > priceNum;
  const savingsPct = hasSavings ? Math.round(((compareNum - priceNum) / compareNum) * 100) : 0;
  const savingsAmount = hasSavings ? (compareNum - priceNum).toFixed(2) : "0";

  // Avoid duplicated brand prefixes like "Ultimate9 Ultimate9 EVCX ..." — if the
  // product title already begins with the vendor name, suppress the eyebrow.
  const vendor = product.node.vendor?.trim() ?? "";
  const titleStartsWithVendor =
    vendor.length > 0 &&
    product.node.title.trim().toLowerCase().startsWith(vendor.toLowerCase());
  const showVendorEyebrow = vendor.length > 0 && !titleStartsWithVendor;

  const onAdd = async () => {
    if (!variant || !inStock || busy) return;
    setBusy(true);
    try {
      await addItem({
        product,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions ?? [],
        availableForSale: variant.availableForSale,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group flex flex-col">
      <Link
        to="/product/$handle"
        params={{ handle: product.node.handle }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
      >
        <div className="aspect-square overflow-hidden bg-secondary border border-border">
          {img && (
            <img
              src={img.url}
              srcSet={shopifySrcSet(img.url, [300, 450, 600, 900])}
              alt={img.altText ?? product.node.title}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <div className="pt-3 text-center">
          {showVendorEyebrow && (
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {product.node.vendor}
            </p>
          )}
          <h3 className="mt-1 text-sm font-medium text-rf-dark line-clamp-2 min-h-[2.5em]">
            {product.node.title}
          </h3>
          <p className="mt-2 text-sm font-semibold text-rf-dark">
            <span>
              ${priceNum.toFixed(2)} {price.currencyCode}
            </span>
            {hasSavings && (
              <>
                {" "}
                <span className="text-muted-foreground line-through font-normal">
                  ${compareNum.toFixed(2)}
                </span>
              </>
            )}
          </p>
          {hasSavings && (
            <p className="mt-1 text-xs font-semibold text-rf-tan">
              Save ${savingsAmount} ({savingsPct}% off)
            </p>
          )}
          <p
            className={`mt-1 text-xs font-medium ${
              inStock ? "text-emerald-700" : "text-destructive"
            }`}
          >
            {inStock ? "✓ In Stock" : "Sold Out"}
          </p>
        </div>
      </Link>
      <Button
        onClick={onAdd}
        disabled={!inStock || busy}
        variant="outline"
        aria-label={
          inStock ? `Add ${product.node.title} to cart` : `${product.node.title} is sold out`
        }
        className="mt-3 w-full rounded-none border-rf-dark text-rf-dark hover:bg-rf-dark hover:text-rf-cream disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : inStock ? (
          "ADD TO CART"
        ) : (
          "SOLD OUT"
        )}
      </Button>
    </div>
  );
}
