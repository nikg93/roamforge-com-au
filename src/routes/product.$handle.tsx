import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchProductByHandle, type ShopifyProduct } from "@/lib/shopify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { useState } from "react";
import { sanitizeProductHtml, textFromHtml } from "@/lib/sanitize";
import { canonicalFor, SITE_URL } from "@/lib/seo";

const productQuery = (handle: string) =>
  queryOptions({
    queryKey: ["product", handle],
    queryFn: async () => {
      const p = await fetchProductByHandle(handle);
      if (!p) throw notFound();
      return p;
    },
    staleTime: 60_000,
  });

export const Route = createFileRoute("/product/$handle")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const url = canonicalFor(`/product/${params.handle}`);
    if (!loaderData) {
      return {
        meta: [
          { title: "Product — Roamforge" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const p = (loaderData as ShopifyProduct).node;
    const title = `${p.title} | Roamforge`;
    const description =
      textFromHtml(p.description, 160) || `Shop ${p.title} at Roamforge — Australian 4WD gear.`;
    const image = p.images.edges[0]?.node?.url;
    const price = p.priceRange.minVariantPrice;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        { property: "product:price:amount", content: price.amount },
        { property: "product:price:currency", content: price.currencyCode },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description: textFromHtml(p.description, 300),
            image: p.images.edges.map((e) => e.node.url).slice(0, 5),
            brand: { "@type": "Brand", name: "Roamforge" },
            sku: p.variants.edges[0]?.node.id,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: price.currencyCode,
              price: price.amount,
              availability: "https://schema.org/InStock",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: p.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ProductPage,
  errorComponent: () => (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8 text-center">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This product couldn't load. Try refreshing, or head back to the shop.
        </p>
        <Link to="/" className="mt-6 inline-block text-rf-tan underline">
          Back to shop
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8 text-center">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">PRODUCT NOT FOUND</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This product may have been removed or renamed.
        </p>
        <Link to="/" className="mt-6 inline-block text-rf-tan underline">
          Back to shop
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ProductPage() {
  const { handle } = useParams({ from: "/product/$handle" });
  const { data } = useSuspenseQuery(productQuery(handle));
  const addItem = useCartStore((s) => s.addItem);
  const adding = useCartStore((s) => s.isLoading);
  const [variantIdx, setVariantIdx] = useState(0);
  const p = data.node;
  const descriptionHtml = sanitizeProductHtml(p.description);

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-rf-dark">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-rf-dark">{p.title}</span>
          </nav>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-square bg-secondary border border-border overflow-hidden">
              {p.images.edges[0] && (
                <img
                  src={p.images.edges[0].node.url}
                  alt={p.images.edges[0].node.altText ?? p.title}
                  width={800}
                  height={800}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="font-display text-4xl tracking-wide text-rf-dark">{p.title}</h1>
              {(() => {
                const v = p.variants.edges[variantIdx]?.node;
                const price = v?.price ?? p.priceRange.minVariantPrice;
                return (
                  <p className="mt-4 text-2xl font-semibold text-rf-dark">
                    ${parseFloat(price.amount).toFixed(2)} {price.currencyCode}
                  </p>
                );
              })()}
              <p className="mt-3 text-sm font-medium text-emerald-700">✓ In Stock</p>
              {descriptionHtml ? (
                <div
                  className="mt-6 text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none prose-p:my-2"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : null}
              {p.variants.edges.length > 1 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.variants.edges.map((v, i) => (
                    <button
                      key={v.node.id}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      aria-pressed={i === variantIdx}
                      className={`min-h-11 border px-3 py-1.5 text-sm ${
                        i === variantIdx
                          ? "border-rf-dark bg-rf-dark text-rf-cream"
                          : "border-border text-rf-dark hover:border-rf-dark"
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
                  const v = p.variants.edges[variantIdx]?.node;
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
              <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-rf-tan" aria-hidden />
                  <Link to="/warranty" className="hover:text-rf-dark">
                    Warranty info
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-rf-tan" aria-hidden />
                  <Link to="/shipping" className="hover:text-rf-dark">
                    Shipping details
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <Undo2 className="h-4 w-4 text-rf-tan" aria-hidden />
                  <Link to="/returns" className="hover:text-rf-dark">
                    Returns policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
