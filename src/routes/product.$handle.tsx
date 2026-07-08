import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProductByHandle } from "@/lib/shopify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} | Roamforge` },
      { name: "description", content: `Shop ${params.handle} at Roamforge.` },
    ],
  }),
  component: ProductPage,
  errorComponent: () => (
    <div className="p-12 text-center">Something went wrong loading this product.</div>
  ),
  notFoundComponent: () => <div className="p-12 text-center">Product not found.</div>,
});

function ProductPage() {
  const { handle } = useParams({ from: "/product/$handle" });
  const { data, isLoading } = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });
  const addItem = useCartStore((s) => s.addItem);
  const adding = useCartStore((s) => s.isLoading);
  const [variantIdx, setVariantIdx] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-rf-dark" />
            </div>
          ) : !data ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl tracking-widest">PRODUCT NOT FOUND</p>
              <Link to="/" className="mt-4 inline-block text-rf-tan underline">
                Back to shop
              </Link>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="aspect-square bg-secondary border border-border overflow-hidden">
                {data.node.images.edges[0] && (
                  <img
                    src={data.node.images.edges[0].node.url}
                    alt={data.node.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <h1 className="font-display text-4xl tracking-wide text-rf-dark">
                  {data.node.title}
                </h1>
                {(() => {
                  const v = data.node.variants.edges[variantIdx]?.node;
                  const price = v?.price ?? data.node.priceRange.minVariantPrice;
                  return (
                    <p className="mt-4 text-2xl font-semibold text-rf-dark">
                      ${parseFloat(price.amount).toFixed(2)} {price.currencyCode}
                    </p>
                  );
                })()}
                <p className="mt-3 text-sm font-medium text-emerald-700">✓ In Stock</p>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {data.node.description}
                </p>
                {data.node.variants.edges.length > 1 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {data.node.variants.edges.map((v, i) => (
                      <button
                        key={v.node.id}
                        onClick={() => setVariantIdx(i)}
                        className={`border px-3 py-1.5 text-sm ${
                          i === variantIdx
                            ? "border-rf-dark bg-rf-dark text-rf-cream"
                            : "border-border text-rf-dark"
                        }`}
                      >
                        {v.node.title}
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  size="lg"
                  disabled={adding}
                  onClick={() => {
                    const v = data.node.variants.edges[variantIdx]?.node;
                    if (!v) return;
                    addItem({
                      product: data,
                      variantId: v.id,
                      variantTitle: v.title,
                      price: v.price,
                      quantity: 1,
                      selectedOptions: v.selectedOptions ?? [],
                    });
                  }}
                  className="mt-8 w-full bg-rf-dark text-rf-cream hover:bg-rf-dark-2 rounded-none"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADD TO CART"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}