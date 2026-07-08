import { Link } from "@tanstack/react-router";
import { SectionHeading } from "./SectionHeading";
import ultimate9 from "@/assets/brands/ultimate9.png";
import airOnBoard from "@/assets/brands/air-on-board.png";
import jmFab from "@/assets/brands/jm-fab.png";

const BRANDS = [
  { name: "Ultimate9", logo: ultimate9, slug: "throttle-controllers" },
  { name: "Air On Board", logo: airOnBoard, slug: "air-compressors" },
  { name: "JM Fab", logo: jmFab, slug: "vehicle-protection" },
];

export function TrustedBrands() {
  return (
    <section className="bg-rf-cream py-14 border-t border-rf-dark/10">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading>TRUSTED BRANDS</SectionHeading>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {BRANDS.map((b) => (
            <Link
              key={b.name}
              to="/category/$slug"
              params={{ slug: b.slug }}
              className="group grid place-items-center bg-white border border-rf-dark/10 py-10 px-6 transition-all hover:border-rf-dark hover:shadow-md"
            >
              <img
                src={b.logo}
                alt={b.name}
                loading="lazy"
                className="h-16 w-auto object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
