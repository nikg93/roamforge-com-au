import { createFileRoute, Link, useParams, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import {
  fetchProductByHandle,
  fetchRelatedProducts,
  shopifySrcSet,
  type ShopifyProduct,
} from "@/lib/shopify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Truck, Undo2, Mail, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
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
    retry: 1,
    retryDelay: 500,
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
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: price.currencyCode,
        price: price.amount,
        availability: anyAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
    // Only advertise a brand when Shopify has a real vendor. Defaulting to
    // Roamforge on unknown vendors would be misleading structured data.
    if (p.vendor && p.vendor.trim()) {
      productSchema.brand = { "@type": "Brand", name: p.vendor.trim() };
    }
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
  errorComponent: ({ reset }) => <ProductErrorFallback reset={reset} />,
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
  return <ProductPageInner />;
}

function ProductErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-20 lg:px-8 text-center">
        <h1 className="font-display text-3xl tracking-widest text-rf-dark">SOMETHING WENT WRONG</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This product couldn&apos;t load. Please check your connection and try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
          >
            RETRY
          </button>
          <Link
            to="/"
            className="min-h-11 inline-flex items-center justify-center border border-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
          >
            BACK TO SHOP
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductPageInner() {
  const { handle } = useParams({ from: "/product/$handle" });
  const { data } = useSuspenseQuery(productQuery(handle));
  const addItem = useCartStore((s) => s.addItem);
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
  const compareAt =
    selectedVariant?.compareAtPrice ?? p.compareAtPriceRange?.minVariantPrice ?? null;
  const priceNum = parseFloat(displayPrice.amount);
  const compareNum = compareAt ? parseFloat(compareAt.amount) : NaN;
  const hasSavings = Number.isFinite(compareNum) && compareNum > priceNum;
  const savingsAmount = hasSavings ? (compareNum - priceNum).toFixed(2) : "0";
  const savingsPct = hasSavings ? Math.round(((compareNum - priceNum) / compareNum) * 100) : 0;

  // Gallery — build a unique image list, seeding the variant image first so
  // it's the hero when a customer lands with a variant preselected.
  const galleryImages = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ url: string; altText: string | null }> = [];
    const push = (img?: { url: string; altText: string | null } | null) => {
      if (!img?.url || seen.has(img.url)) return;
      seen.add(img.url);
      out.push(img);
    };
    push(p.featuredImage ?? null);
    p.images.edges.forEach((e) => push(e.node));
    p.variants.edges.forEach((v) => push(v.node.image ?? null));
    return out;
  }, [p]);
  const [imageIdx, setImageIdx] = useState(0);

  // When the customer picks a variant that has its own image, switch the
  // gallery to that image. Preserves manual thumbnail selection otherwise.
  useEffect(() => {
    const variantImg = selectedVariant?.image?.url;
    if (!variantImg) return;
    const idx = galleryImages.findIndex((g) => g.url === variantImg);
    if (idx >= 0) setImageIdx(idx);
  }, [selectedVariant?.image?.url, galleryImages]);

  const activeImage = galleryImages[imageIdx] ?? galleryImages[0];

  // Fitment / compatibility block. Derived, never fabricated — we only
  // surface a section when the product's own tags or copy mention specific
  // vehicle makes. If nothing is found, the block stays hidden.
  const fitment = useMemo(() => extractFitment(p), [p]);

  // Related products — client-side; keeps the loader fast and this section
  // stays optional (empty list is fine, we just don't render it).
  const related = useQuery({
    queryKey: ["related-products", handle],
    queryFn: () =>
      fetchRelatedProducts(handle, {
        productId: p.id,
        vendor: p.vendor,
        productType: p.productType,
        tags: p.tags,
      }),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const doAdd = () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    addItem({
      product: data,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions ?? [],
      availableForSale: selectedVariant.availableForSale,
    });
  };
  const adding = useCartStore((s) =>
    selectedVariant ? s.activeVariantIds.includes(selectedVariant.id) : false,
  );

  // Gallery keyboard navigation — ArrowLeft / ArrowRight walk the images.
  useEffect(() => {
    if (galleryImages.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (t?.isContentEditable) return;
      if (e.key === "ArrowLeft") {
        setImageIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === "ArrowRight") {
        setImageIdx((i) => (i + 1) % galleryImages.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryImages.length]);

  return (
    <div className="min-h-dvh flex flex-col pb-24 lg:pb-0">
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
            <div>
              <div className="relative aspect-square bg-secondary border border-border overflow-hidden">
                {activeImage && (
                  <img
                    key={activeImage.url}
                    src={activeImage.url}
                    srcSet={shopifySrcSet(activeImage.url)}
                    sizes="(max-width: 1024px) 100vw, 600px"
                    alt={activeImage.altText ?? p.title}
                    width={800}
                    height={800}
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                )}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImageIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length)
                      }
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-rf-cream/90 text-rf-dark shadow-sm hover:bg-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                    >
                      <span aria-hidden>‹</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageIdx((i) => (i + 1) % galleryImages.length)}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-rf-cream/90 text-rf-dark shadow-sm hover:bg-rf-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
                    >
                      <span aria-hidden>›</span>
                    </button>
                    <div
                      aria-live="polite"
                      className="absolute bottom-2 right-2 rounded-full bg-rf-dark/80 px-2 py-0.5 text-[11px] font-semibold tracking-widest text-rf-cream"
                    >
                      {imageIdx + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>
              {galleryImages.length > 1 && (
                <ul
                  role="list"
                  aria-label="Product image thumbnails"
                  className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible"
                >
                  {galleryImages.map((img, i) => (
                    <li key={img.url} className="flex-none w-20 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setImageIdx(i)}
                        aria-label={`Show image ${i + 1} of ${galleryImages.length}`}
                        aria-current={i === imageIdx ? "true" : undefined}
                        className={`aspect-square w-full overflow-hidden border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2 ${
                          i === imageIdx
                            ? "border-rf-dark ring-1 ring-rf-dark"
                            : "border-border hover:border-rf-dark"
                        }`}
                      >
                        <img
                          src={img.url}
                          srcSet={shopifySrcSet(img.url, [120, 180, 240])}
                          sizes="120px"
                          alt=""
                          width={120}
                          height={120}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h1 className="font-display text-4xl tracking-wide text-rf-dark">{p.title}</h1>
              {p.vendor ? (
                <p className="mt-1 text-xs font-semibold tracking-widest text-rf-tan uppercase">
                  {p.vendor}
                </p>
              ) : null}
              {selectedVariant && p.variants.edges.length > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Variant:{" "}
                  <span className="text-rf-dark">
                    {selectedVariant.selectedOptions?.length
                      ? selectedVariant.selectedOptions
                          .map((o) => `${o.name}: ${o.value}`)
                          .join(" · ")
                      : selectedVariant.title}
                  </span>
                </p>
              )}
              {selectedVariant?.sku && selectedVariant.sku.trim() && (
                <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                  SKU: {selectedVariant.sku.trim()}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <p className="text-2xl font-semibold text-rf-dark">
                  ${priceNum.toFixed(2)} {displayPrice.currencyCode}
                </p>
                {hasSavings && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      ${compareNum.toFixed(2)}
                    </span>
                    <span className="rounded-sm bg-rf-tan/20 px-2 py-0.5 text-xs font-semibold text-rf-tan">
                      SAVE ${savingsAmount} ({savingsPct}%)
                    </span>
                  </>
                )}
              </div>
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
                onClick={doAdd}
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
              {fitment && (
                <section
                  aria-labelledby="fitment-heading"
                  className="mt-8 border-t border-border pt-6"
                >
                  <h2
                    id="fitment-heading"
                    className="font-display text-sm tracking-[0.2em] text-rf-dark"
                  >
                    FITMENT
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Compatible with: <span className="text-rf-dark">{fitment.join(", ")}</span>.
                    Confirm compatibility before ordering —{" "}
                    <Link to="/contact" className="underline hover:text-rf-dark">
                      contact us
                    </Link>{" "}
                    if you&apos;re unsure about your vehicle.
                  </p>
                </section>
              )}
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
          {related.data && related.data.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-16">
              <h2
                id="related-heading"
                className="font-display text-xl tracking-widest text-rf-dark"
              >
                YOU MIGHT ALSO LIKE
              </h2>
              <div className="mt-6 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {related.data.map((r) => (
                  <ProductCard key={r.node.id} product={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
      {/* Sticky mobile add-to-cart bar. Hidden on lg+ (desktop ATC is inline). */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur lg:hidden"
        role="region"
        aria-label="Add to cart"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{p.title}</p>
            <p className="text-sm font-semibold text-rf-dark">
              ${priceNum.toFixed(2)} {displayPrice.currencyCode}
            </p>
            <p className={`text-[11px] ${canAdd ? "text-emerald-700" : "text-destructive"}`}>
              {canAdd ? "In stock" : "Sold out"}
            </p>
          </div>
          <Button
            onClick={doAdd}
            disabled={adding || !canAdd}
            className="min-h-11 bg-rf-dark px-5 text-rf-cream hover:bg-rf-dark-2 rounded-none"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : canAdd ? (
              "ADD TO CART"
            ) : (
              "SOLD OUT"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fitment / compatibility extractor. Scans the product's tags and copy for
 * known Australian 4WD makes/models and returns the matches. Returns null
 * when nothing is found so the PDP can hide the block cleanly — we never
 * invent fitment data. Kept intentionally conservative; adjust the KNOWN
 * list only when we can verify the mapping.
 *
 * Matching rules:
 *  - Uses word-boundary regex, not substring — "Ram" won't match "frame",
 *    "Ford" won't match "affordable", "Y61" won't match "Y612".
 *  - Description is stripped of HTML first via textFromHtml so we don't
 *    match tokens sitting inside class names, hrefs, or inline styles.
 *  - Model matches take priority over make matches: if a specific model
 *    is mentioned we suppress the generic make label to avoid the
 *    misleading "Ford, Ranger" pairing (should just read "Ranger").
 *  - "LandCruiser" and "Land Cruiser" collapse to a single canonical
 *    label so we never duplicate the same vehicle.
 */
const KNOWN_MAKES = [
  "Toyota",
  "Nissan",
  "Ford",
  "Isuzu",
  "Mitsubishi",
  "Holden",
  "Mazda",
  "Volkswagen",
  "Jeep",
  "Land Rover",
  "Ram",
  "LDV",
  "GWM",
] as const;
// Each model entry lists its canonical label first, then any aliases we
// want to catch in copy. Aliases collapse into the canonical label so the
// UI never shows "LandCruiser, Land Cruiser" side by side. Also tracks
// which make each model belongs to so we can suppress the generic make.
const KNOWN_MODELS: Array<{ label: string; make: string; aliases: string[] }> = [
  { label: "LandCruiser", make: "Toyota", aliases: ["LandCruiser", "Land Cruiser"] },
  { label: "Prado", make: "Toyota", aliases: ["Prado"] },
  { label: "Hilux", make: "Toyota", aliases: ["Hilux"] },
  { label: "Fortuner", make: "Toyota", aliases: ["Fortuner"] },
  { label: "Patrol", make: "Nissan", aliases: ["Patrol", "Y62", "Y61", "GU Patrol", "GQ Patrol"] },
  { label: "Navara", make: "Nissan", aliases: ["Navara"] },
  { label: "Ranger", make: "Ford", aliases: ["Ranger", "PX Ranger"] },
  { label: "Everest", make: "Ford", aliases: ["Everest"] },
  { label: "D-Max", make: "Isuzu", aliases: ["D-Max", "DMax"] },
  { label: "MU-X", make: "Isuzu", aliases: ["MU-X", "MUX"] },
  { label: "Triton", make: "Mitsubishi", aliases: ["Triton"] },
  { label: "Pajero", make: "Mitsubishi", aliases: ["Pajero"] },
  { label: "BT-50", make: "Mazda", aliases: ["BT-50", "BT50"] },
  { label: "Amarok", make: "Volkswagen", aliases: ["Amarok"] },
  { label: "Wrangler", make: "Jeep", aliases: ["Wrangler"] },
  { label: "Defender", make: "Land Rover", aliases: ["Defender"] },
  { label: "Discovery", make: "Land Rover", aliases: ["Discovery"] },
];

// Escape regex metacharacters in aliases like "D-Max" or "MU-X" so they
// match literally, not as regex ranges.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractFitment(p: ShopifyProduct["node"]): string[] | null {
  // Strip HTML from description so tokens can't hide inside markup.
  const plainDescription = textFromHtml(p.descriptionHtml || p.description || "", 4000);
  const haystack = [p.title, p.productType ?? "", plainDescription, ...(p.tags ?? [])]
    .filter(Boolean)
    .join(" \u00b7 ");

  const matchesWord = (needle: string) => {
    // Word boundaries so "Ram" won't fire on "frame" and "Y61" won't fire
    // on "Y612". Kept case-insensitive; alphanumeric-safe on both sides.
    const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRe(needle)}(?:$|[^\\p{L}\\p{N}])`, "iu");
    return re.test(haystack);
  };

  const modelHits = new Set<string>();
  const modelMakes = new Set<string>();
  for (const model of KNOWN_MODELS) {
    if (model.aliases.some(matchesWord)) {
      modelHits.add(model.label);
      modelMakes.add(model.make);
    }
  }

  const makeHits = new Set<string>();
  for (const make of KNOWN_MAKES) {
    // Skip the generic make label if a model from that make already
    // matched — "Ranger" is enough; adding "Ford" is noise.
    if (modelMakes.has(make)) continue;
    if (matchesWord(make)) makeHits.add(make);
  }

  const out = [...makeHits, ...modelHits];
  return out.length > 0 ? out : null;
}
