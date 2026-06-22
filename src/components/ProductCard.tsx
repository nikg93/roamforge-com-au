import { Link } from "@tanstack/react-router";
import type { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const img = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
  };

  return (
    <Link
      to="/product/$handle"
      params={{ handle: product.node.handle }}
      className="group flex flex-col"
    >
      <div className="aspect-square overflow-hidden bg-secondary border border-border">
        {img && (
          <img
            src={img.url}
            alt={img.altText ?? product.node.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="pt-3 text-center">
        <h3 className="text-sm font-medium text-rf-dark line-clamp-2 min-h-[2.5em]">
          {product.node.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-rf-dark">
          ${parseFloat(price.amount).toFixed(2)} {price.currencyCode}
        </p>
        <Button
          onClick={onAdd}
          disabled={!variant || isLoading}
          variant="outline"
          className="mt-3 w-full rounded-none border-rf-dark text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADD TO CART"}
        </Button>
      </div>
    </Link>
  );
}