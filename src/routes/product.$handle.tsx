import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchProductByHandle, type ShopifyProduct } from "@/lib/shopify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Truck, Undo2, Mail, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { sanitizeProductHtml, textFromHtml } from "@/lib/sanitize";
import { canonicalFor } from "@/lib/seo";
import { SITE } from "@/lib/site";

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

function firstAvailableVariant(p: ShopifyProduct["node"]) {
  return p.variants.edges.find((v) => v.node.availableForSale)?.node ?? null;
}

export const Route = createFileRoute("/product/$handle")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ params, loaderData }) => {
    const url = canonicalFor(`/product/${params.handle}`);
    if (!loaderData) {
      return {
        meta: [
          { title: "Product not found — Roamforge" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const p = (loaderData as ShopifyProduct).node;

    const rawTitle = p.seo?.title || p.title;
    const title = /roamforge/i.test(rawTitle) ? rawTitle : `${rawTitle} | Roamforge`;
    const rawDescription =
      p.seo?.description ||
      textFromHtml(p.descriptionHtml || p.description, 160) ||
      `${p.title} — available at Roamforge.`;
    const description = rawDescription.slice(0, 300);
    const image = p.featuredImage?.url ?? p.images.edges[0]?.node?.url;

    const available = firstAvailableVariant(p);
    const anyAvailable = p.variants.edges.some((v) => v.node.availableForSale);
    const price = available?.price ?? p.priceRange.minVariantPrice;

    const sku = available?.sku && available.sku.trim() ? available.sku.trim() : undefined;

    const productSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      description: textFromHtml(p.descriptionHtml || p.description, 300) || p.title,
      image: p.images.edges.map((e) => e.node.url).slice(0, 5),
      url,
      brand: p.vendor
        ? { "@type": "Brand", name: p.vendor }
        : { "@type": "Brand", name: "Roamforge" },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: price.currencyCode,
        price: price.amount,
        availability: anyAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
    if (sku) productSchema.sku = sku;

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
        {
          property: "product:availability",
          content: anyAvailable ? "in stock" : "out of stock",
        },
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
        { type: "application/ld+json", children: JSON.stringify(productSchema) },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
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
          This product couldn&apos;t load. Try refreshing, or head back to the shop.
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
  const p = data.node;

  const descriptionHtml = sanitizeProductHtml(p.descriptionHtml || p.description);

  const initialIdx = useMemo(() => {
    const idx = p.variants.edges.findIndex((v) => v.node.availableForSale);
    return idx >= 0 ? idx : 0;
  }, [p.variants.edges]);
  const [variantIdx, setVariantIdx] = useState(initialIdx);

  const selectedVariant = p.variants.edges[variantIdx]?.node;
  const canAdd = !!selectedVariant?.availableForSale;
  const displayPrice = selectedVariant?.price ?? p.priceRange.minVariantPrice;
  const image = p.featuredImage ?? p.images.edges[0]?.node;

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-rf-dark">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-rf-dark">{p.title}</span>
          </nav>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-square bg-secondary border border-border overflow-hidden">
              {image && (
                <img
                  src={image.url}
                  alt={image.altText ?? p.title}
                  width={800}
                  height={800}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="font-display text-4xl tracking-wide text-rf-dark">{p.title}</h1>
              {p.vendor ? (
                <p className="mt-1 text-xs font-semibold tracking-widest text-rf-tan uppercase">
                  {p.vendor}
                </p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold text-rf-dark">
                ${parseFloat(displayPrice.amount).toFixed(2)} {displayPrice.currencyCode}
              </p>
              <p
                className={`mt-3 text-sm font-medium ${
                  canAdd ? "text-emerald-700" : "text-muted-foreground"
                }`}
                aria-live="polite"
              >
                {canAdd ? "✓ In Stock" : "Sold out"}
              </p>
              {descriptionHtml ? (
                <div
                  className="mt-6 text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none prose-p:my-2"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : null}
              {p.variants.edges.length > 1 && (
                <fieldset className="mt-6">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-rf-dark">
                    Options
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {p.variants.edges.map((v, i) => {
                      const disabled = !v.node.availableForSale;
                      const selected = i === variantIdx;
                      return (
                        <button
                          key={v.node.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setVariantIdx(i)}
                          aria-pressed={selected}
                          className={`min-h-11 border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2 ${
                            selected
                              ? "border-rf-dark bg-rf-dark text-rf-cream"
                              : disabled
                                ? "border-border text-muted-foreground line-through cursor-not-allowed opacity-60"
                                : "border-border text-rf-dark hover:border-rf-dark"
                          }`}
                        >
                          {v.node.title}
                          {disabled ? <span className="sr-only"> (sold out)</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              <Button
                size="lg"
                disabled={adding || !canAdd}
                onClick={() => {
                  if (!selectedVariant || !selectedVariant.availableForSale) return;
                  addItem({
                    product: data,
                    variantId: selectedVariant.id,
                    variantTitle: selectedVariant.title,
                    price: selectedVariant.price,
                    quantity: 1,
                    selectedOptions: selectedVariant.selectedOptions ?? [],
                  });
                }}
                className="mt-8 w-full bg-rf-dark text-rf-cream hover:bg-rf-dark-2 rounded-none"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : canAdd ? (
                  "ADD TO CART"
                ) : (
                  "SOLD OUT"
                )}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-rf-tan" aria-hidden />
                Secure checkout powered by Shopify
              </p>
              <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
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
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-rf-tan" aria-hidden />
                  <Link to="/contact" className="hover:text-rf-dark">
                    Contact us
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
