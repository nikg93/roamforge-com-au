import { Link } from "@tanstack/react-router";
import lifestyleImg from "@/assets/lifestyle-journey.jpg";

export function LifestyleSection() {
  return (
    <section className="relative overflow-hidden bg-rf-dark">
      <img
        src={lifestyleImg}
        alt="Premium Australian touring campsite at dusk"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-rf-dark/90 via-rf-dark/60 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-24 sm:py-32 text-rf-cream">
        <div className="max-w-xl">
          <p className="font-display tracking-[0.3em] text-rf-tan text-xs">ADVENTURE LIFESTYLE</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
            BUILT FOR
            <br />
            <span className="text-rf-tan">THE JOURNEY</span>
          </h2>
          <p className="mt-5 text-base text-rf-cream/85 max-w-md">
            Premium 4WD, touring and camping gear sourced from trusted Australian brands.
          </p>
          <Link
            to="/category/$slug"
            params={{ slug: "performance" }}
            className="mt-7 inline-block bg-rf-tan text-rf-dark font-semibold tracking-[0.15em] text-sm px-6 py-3 hover:bg-rf-tan-bright transition-colors"
          >
            EXPLORE PRODUCTS
          </Link>
        </div>
      </div>
    </section>
  );
}
