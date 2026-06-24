import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

type FooterLink = { label: string; to: string };
const cols: { title: string; links: FooterLink[] }[] = [
  {
    title: "SHOP",
    links: [
      { label: "All Products", to: "/" },
      { label: "Recovery Gear", to: "/" },
      { label: "Electrical", to: "/" },
      { label: "Camping", to: "/" },
      { label: "Merch", to: "/" },
    ],
  },
  {
    title: "INFORMATION",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Shipping", to: "/shipping" },
      { label: "Returns & Refunds", to: "/returns" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
  {
    title: "CUSTOMER CARE",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Warranty", to: "/warranty" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-rf-dark text-rf-cream/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2 space-y-4">
          <img src={logo} alt="Roamforge" className="h-14 w-auto" />
          <p className="max-w-xs text-sm text-rf-cream/70">
            Premium 4WD, camping and adventure gear designed for touring, exploring and life off the beaten track.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display text-sm tracking-[0.2em] text-rf-cream mb-4">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-rf-cream/70 hover:text-rf-tan transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-rf-cream mb-4">STAY CONNECTED</h4>
          <p className="text-sm text-rf-cream/70 mb-3">Join for the latest drops, builds and adventures.</p>
          <form className="flex">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 bg-rf-dark-2 border border-white/10 px-3 py-2 text-sm text-rf-cream placeholder:text-rf-cream/40 focus:outline-none focus:border-rf-tan"
            />
            <button type="button" className="bg-rf-tan text-rf-dark px-4 font-semibold">→</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row justify-between items-center gap-3 px-4 py-5 text-xs text-rf-cream/60 lg:px-8">
          <p>© {new Date().getFullYear()} Roamforge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-rf-tan"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-rf-tan"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-rf-tan"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}