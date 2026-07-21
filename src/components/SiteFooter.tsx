import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { CATEGORIES } from "@/lib/categories";

const featuredSlugs: Array<(typeof CATEGORIES)[number]["slug"]> = [
  "performance",
  "lighting",
  "recovery",
  "vehicle-protection",
  "touring",
];

export function SiteFooter() {
  const shopLinks = CATEGORIES.filter((c) => featuredSlugs.includes(c.slug));

  return (
    <footer className="bg-rf-dark text-rf-cream/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2 space-y-4">
          <img src={logo} alt="Roamforge" className="h-14 w-auto" />
          <p className="max-w-xs text-sm text-rf-cream/70">
            Premium 4WD, camping and adventure gear designed for touring, exploring and life off the
            beaten track.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-rf-cream mb-4">SHOP</h4>
          <ul className="space-y-2 text-sm">
            {shopLinks.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="text-rf-cream/70 hover:text-rf-tan transition-colors"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-rf-cream mb-4">INFORMATION</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Shipping
              </Link>
            </li>
            <li>
              <Link to="/returns" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Returns &amp; Refunds
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-rf-cream mb-4">
            CUSTOMER CARE
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/contact" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/warranty" className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                Warranty
              </Link>
            </li>
          </ul>
          <div className="mt-6">
            <p className="text-xs text-rf-cream/60 leading-relaxed">
              Based in Western Australia. For product, order or trade enquiries email{" "}
              <a href="mailto:info@roamforge.com.au" className="text-rf-tan hover:underline">
                info@roamforge.com.au
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row justify-between items-center gap-3 px-4 py-5 text-xs text-rf-cream/60 lg:px-8">
          <p>© {new Date().getFullYear()} Roamforge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/roam_forge"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Roamforge on Instagram"
              className="grid h-11 w-11 place-items-center hover:text-rf-tan"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
