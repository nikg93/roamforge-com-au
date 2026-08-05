import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { fetchProductsByHandles } from "@/lib/shopify";
import type { PdpGuidance } from "@/lib/pdp-guidance";
import { CATEGORY_MAP } from "@/lib/categories";

/**
 * Data-driven buying guidance for high-intent product pages: supporting
 * headings, visible FAQs (the same content that feeds FAQPage schema),
 * a neutral fitment-check block and curated cross-sells resolved from the
 * live catalogue. Nothing renders unless the data exists.
 */
export function ProductGuidance({ guidance }: { guidance: PdpGuidance }) {
  const handles = guidance.crossSell?.handles ?? [];
  const cross = useQuery({
    queryKey: ["pdp-guidance-cross-sell", guidance.id, handles.join(",")],
    queryFn: () => fetchProductsByHandles(handles),
    enabled: handles.length > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const crossItems = cross.data ?? [];
  const category = guidance.category ? CATEGORY_MAP[guidance.category] : undefined;

  return (
    <section aria-labelledby="guidance-heading" className="mt-16 border-t border-border pt-10">
      <h2 id="guidance-heading" className="font-display text-xl tracking-widest text-rf-dark">
        {guidance.heading.toUpperCase()}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rf-dark/80">{guidance.intro}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {category && (
          <Link
            to="/category/$slug"
            params={{ slug: category.slug }}
            className="min-h-11 inline-flex items-center justify-center border border-rf-dark px-5 py-3 text-xs font-medium tracking-widest text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
          >
            SHOP {category.label.toUpperCase()}
          </Link>
        )}
        {guidance.guide && (
          <Link
            to="/guides/how-to-choose-a-4wd-air-compressor"
            className="min-h-11 inline-flex items-center justify-center border border-rf-tan px-5 py-3 text-xs font-medium tracking-widest text-rf-tan hover:bg-rf-tan hover:text-rf-dark"
          >
            READ: {guidance.guide.label.toUpperCase()}
          </Link>
        )}
      </div>

      <h3 className="mt-10 font-display text-lg tracking-widest text-rf-dark">
        FREQUENTLY ASKED QUESTIONS
      </h3>
      <dl className="mt-4 max-w-3xl divide-y divide-border">
        {guidance.faqs.map(([q, a]) => (
          <div key={q} className="py-4">
            <dt className="text-sm font-semibold text-rf-dark">{q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-rf-dark/80">{a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-rf-dark/80">
        Not sure it suits your build?{" "}
        <Link to="/contact" className="min-h-11 inline-flex items-center text-rf-tan underline">
          Contact us for fitment help
        </Link>
      </p>

      {crossItems.length > 0 && guidance.crossSell && (
        <div className="mt-12">
          <h3 className="font-display text-lg tracking-widest text-rf-dark">
            {guidance.crossSell.heading.toUpperCase()}
          </h3>
          <div className="mt-4 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {crossItems.map((r) => (
              <ProductCard key={r.node.id} product={r} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}