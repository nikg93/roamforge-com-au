import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { fetchProducts } from "@/lib/shopify";
import { CATEGORY_MAP } from "@/lib/categories";
import { canonicalFor, routeMeta, SITE_URL } from "@/lib/seo";
import { SITE } from "@/lib/site";

const GUIDE_PATH = "/guides/how-to-choose-a-4wd-air-compressor";
const GUIDE_TITLE = "How to Choose a 4WD Air Compressor";
const GUIDE_DESCRIPTION =
  "A buyer's guide to choosing a 4WD air compressor in Australia — portable vs onboard, duty cycle, airflow, pressure, power connection, hose reach, storage and safe use.";

/** Live compressor products, surfaced from the existing catalogue query. */
const compressorProductsQuery = queryOptions({
  queryKey: ["products", "guide", "air-compressors"],
  queryFn: () => fetchProducts(4, CATEGORY_MAP["air-compressors"].query),
  staleTime: 60_000,
  retry: 1,
});

const FAQS: Array<[string, string]> = [
  [
    "Do I need a portable or an onboard air compressor?",
    "A portable compressor is easier to move between vehicles and needs no installation, so it suits occasional trips and shared use. An onboard compressor is mounted permanently in the vehicle and wired in, which keeps your load space clear and makes airing up part of the routine if you tour often.",
  ],
  [
    "What does duty cycle mean?",
    "Duty cycle describes how long a compressor can run before it needs to cool down, usually shown as a percentage over a set period at a given pressure. A higher duty cycle matters most if you air up several large tyres in a row or on hot days.",
  ],
  [
    "Is airflow or pressure more important?",
    "Both matter, but for tyre inflation airflow generally decides how quickly you finish. Pressure ratings tell you the maximum a compressor can reach; airflow tells you how fast it gets there. Check the airflow figure at the pressure you actually inflate to.",
  ],
  [
    "How long a hose do I need?",
    "Measure from where the compressor will sit to the furthest tyre, then allow extra slack. Trailers, camper trailers and long-wheelbase vehicles need noticeably more reach than a dual cab on its own.",
  ],
  [
    "What size tyres should I plan for?",
    "Larger-diameter and wider tyres hold more air, so they take longer to inflate and place more demand on a compressor. Choose based on the tyres fitted to your vehicle and the pressure drop you normally run off-road.",
  ],
];

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: GUIDE_TITLE,
  description: GUIDE_DESCRIPTION,
  inLanguage: SITE.locale,
  mainEntityOfPage: { "@type": "WebPage", "@id": canonicalFor(GUIDE_PATH) },
  author: { "@type": "Organization", name: SITE.name, url: SITE_URL },
  publisher: { "@type": "Organization", name: SITE.name, url: SITE_URL },
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
    { "@type": "ListItem", position: 3, name: GUIDE_TITLE, item: canonicalFor(GUIDE_PATH) },
  ],
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export const Route = createFileRoute("/guides/how-to-choose-a-4wd-air-compressor")({
  loader: ({ context }) => context.queryClient.ensureQueryData(compressorProductsQuery),
  head: () => {
    const base = routeMeta({
      path: GUIDE_PATH,
      title: "How to Choose a 4WD Air Compressor | Buyer's Guide | Roamforge",
      description: GUIDE_DESCRIPTION,
      type: "article",
    });
    return {
      meta: base.meta,
      links: base.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ARTICLE_JSONLD) },
        { type: "application/ld+json", children: JSON.stringify(BREADCRUMB_JSONLD) },
        { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
      ],
    };
  },
  component: GuidePage,
});

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl tracking-wide text-rf-dark mt-10 mb-3">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-rf-dark/80">{children}</p>;
}

function GuidePage() {
  const { data: products } = useSuspenseQuery(compressorProductsQuery);

  return (
    <div className="min-h-dvh flex flex-col bg-rf-cream text-rf-dark">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <section className="bg-rf-dark text-rf-cream">
          <div className="mx-auto max-w-3xl px-4 py-14 lg:px-8 lg:py-20">
            <p className="font-display text-xs tracking-[0.3em] text-rf-tan mb-3">BUYER GUIDE</p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide">
              {GUIDE_TITLE}
            </h1>
            <p className="mt-4 text-sm text-rf-cream/85">
              What actually matters when you&apos;re picking a compressor for Australian 4WD
              touring — explained in plain language, without the spec-sheet noise.
            </p>
            <nav aria-label="Breadcrumb" className="mt-5 text-xs text-rf-cream/75">
              <Link to="/" className="hover:text-rf-tan">
                Home
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link
                to="/category/$slug"
                params={{ slug: "air-compressors" }}
                className="hover:text-rf-tan"
              >
                Air Compressors
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="text-rf-cream">Buyer Guide</span>
            </nav>
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
          <article className="leading-relaxed">
            <H2>Portable vs onboard compressors</H2>
            <P>
              A portable compressor lives in a bag or case and comes out when you need it. It
              clamps or plugs into a power source, sits beside the vehicle, and can be shared
              between rigs or lent to a mate in your convoy. It&apos;s the simpler starting point
              if you tour a few times a year.
            </P>
            <P>
              An onboard compressor is mounted permanently — under the bonnet, in a canopy or in a
              drawer system — and wired into the vehicle&apos;s electrical system. Airing up
              becomes a matter of unrolling a hose, and your load space stays free. The trade-off
              is installation: mounting, wiring and a sensible air line route all need planning.
            </P>

            <H2>Duty cycle: how long it can keep running</H2>
            <P>
              Duty cycle tells you how much of a given period a compressor can run before it needs
              to cool. If you air up four large tyres back to back on a hot afternoon, a compressor
              with a short duty cycle may need to pause partway through. Compare duty cycle figures
              at the pressure and ambient temperature you actually work in, and remember that
              manufacturers state them under their own test conditions.
            </P>

            <H2>Airflow and pressure</H2>
            <P>
              Pressure (usually quoted in PSI or kPa) is the maximum a compressor can push to.
              Airflow (litres per minute or CFM) is how much air it moves. For tyres, airflow
              usually decides how long you stand there. Airflow always drops as pressure rises, so
              a flow figure quoted at zero pressure tells you little — look for figures given at a
              realistic working pressure.
            </P>

            <H2>Power connection</H2>
            <P>
              Compressors draw serious current. Accessory-socket units are limited by the
              socket&apos;s fuse rating, while higher-output units are designed for direct battery
              connection with clamps or a hard-wired circuit. Check what connection a compressor
              requires before you buy, and make sure your cabling, fusing and battery can support
              it. If you&apos;re unsure, have an auto electrician do the install.
            </P>

            <H2>Hose length and reach</H2>
            <P>
              Reach is the detail most people underestimate. Measure from the compressor&apos;s
              mounting or standing position to the furthest tyre — usually the opposite rear
              corner — and add slack so the hose isn&apos;t stretched tight. Towing a trailer or
              camper adds several more metres again. Extension hoses and quick-connect fittings
              solve this, provided the fittings match.
            </P>

            <H2>Storage and packing</H2>
            <P>
              A portable unit needs somewhere to live that keeps it clean, dry and secured. A
              padded case protects the pump and keeps hoses, clamps and fittings together, so
              nothing goes missing at the tyre bay. For onboard setups, plan where the air outlet
              sits and how the hose is stowed — the tidier that is, the more you&apos;ll use it.
            </P>

            <H2>Tyre size and how much air you actually need</H2>
            <P>
              Bigger tyres hold more air. A set of large-diameter, wide all-terrains takes
              substantially longer to inflate than smaller road tyres, and the deeper you air down
              for sand or rock, the more you have to put back. Base your choice on the tyres fitted
              to your vehicle and the pressures you normally run, not on a best-case number.
            </P>

            <H2>Using a compressor safely</H2>
            <P>
              Compressors and their fittings get hot in use — let the unit cool before packing it
              away. Keep the compressor on stable ground and clear of sand and dust, secure loose
              hoses so nobody trips, and never exceed the pressure rating of the tyre, hose or
              fitting you&apos;re using. Always follow the manufacturer&apos;s instructions supplied
              with your compressor, and check tyre pressures with a gauge you trust.
            </P>

            <H2>Frequently asked questions</H2>
            <dl className="mt-4 space-y-6">
              {FAQS.map(([q, a]) => (
                <div key={q}>
                  <dt className="font-display text-base tracking-wide text-rf-dark">{q}</dt>
                  <dd className="mt-2 text-rf-dark/80">{a}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className="mt-12 border-t border-rf-dark/10 pt-8">
            <p className="text-sm text-rf-dark/80">
              Ready to compare what&apos;s available? Browse the full Roamforge range of{" "}
              <Link
                to="/category/$slug"
                params={{ slug: "air-compressors" }}
                className="text-rf-tan underline underline-offset-4"
              >
                4WD air compressors
              </Link>
              .
            </p>
            <Link
              to="/category/$slug"
              params={{ slug: "air-compressors" }}
              className="mt-5 min-h-11 inline-flex items-center justify-center bg-rf-dark px-6 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
            >
              SHOP AIR COMPRESSORS
            </Link>
          </div>
        </div>

        {products.length > 0 && (
          <section className="bg-rf-cream pb-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <SectionHeading>AIR COMPRESSORS IN STOCK NOW</SectionHeading>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.node.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
