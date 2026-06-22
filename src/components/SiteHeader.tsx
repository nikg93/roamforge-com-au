import { Link } from "@tanstack/react-router";
import { Search, User } from "lucide-react";
import logo from "@/assets/logo.png";
import { CartDrawer } from "./CartDrawer";

const nav = [
  { label: "SHOP", to: "/" },
  { label: "RECOVERY GEAR", to: "/" },
  { label: "ELECTRICAL", to: "/" },
  { label: "CAMPING", to: "/" },
  { label: "MERCH", to: "/" },
  { label: "ABOUT", to: "/" },
  { label: "CONTACT", to: "/" },
];

export function SiteHeader() {
  return (
    <header className="bg-rf-dark text-rf-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Roamforge" className="h-12 w-auto" />
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-[12px] font-semibold tracking-[0.15em]">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="text-rf-cream/90 hover:text-rf-tan transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Search" className="grid h-9 w-9 place-items-center text-rf-cream/90 hover:text-rf-tan">
            <Search className="h-5 w-5" />
          </button>
          <button aria-label="Account" className="grid h-9 w-9 place-items-center text-rf-cream/90 hover:text-rf-tan">
            <User className="h-5 w-5" />
          </button>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}