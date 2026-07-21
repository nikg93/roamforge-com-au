import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { CartDrawer } from "./CartDrawer";
import { CATEGORIES } from "@/lib/categories";
import { SearchDialog } from "./SearchDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="bg-rf-dark text-rf-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open navigation menu"
                className="grid h-11 w-11 place-items-center text-rf-cream/90 hover:text-rf-tan lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-sm bg-rf-dark text-rf-cream border-rf-dark-2 p-0 flex flex-col"
            >
              <SheetHeader className="border-b border-rf-cream/10 px-4 py-4 text-left">
                <SheetTitle className="font-display tracking-[0.2em] text-rf-cream text-sm">
                  MENU
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-2">
                <ul className="flex flex-col">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <SheetClose asChild>
                        <Link
                          to="/category/$slug"
                          params={{ slug: c.slug }}
                          className="flex min-h-11 items-center px-3 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream/90 hover:bg-rf-dark-2 hover:text-rf-tan focus:bg-rf-dark-2 focus:text-rf-tan focus:outline-none"
                        >
                          {c.navLabel}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  <li className="mt-2 border-t border-rf-cream/10 pt-2">
                    <SheetClose asChild>
                      <Link
                        to="/about"
                        className="flex min-h-11 items-center px-3 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream/90 hover:bg-rf-dark-2 hover:text-rf-tan focus:outline-none"
                      >
                        ABOUT
                      </Link>
                    </SheetClose>
                  </li>
                  <li>
                    <SheetClose asChild>
                      <Link
                        to="/contact"
                        className="flex min-h-11 items-center px-3 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream/90 hover:bg-rf-dark-2 hover:text-rf-tan focus:outline-none"
                      >
                        CONTACT
                      </Link>
                    </SheetClose>
                  </li>
                  <li>
                    <SheetClose asChild>
                      <Link
                        to="/faq"
                        className="flex min-h-11 items-center px-3 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream/90 hover:bg-rf-dark-2 hover:text-rf-tan focus:outline-none"
                      >
                        FAQ
                      </Link>
                    </SheetClose>
                  </li>
                </ul>
                <div className="mt-2 border-t border-rf-cream/10 px-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setSearchOpen(true);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 py-2 text-sm font-semibold tracking-[0.14em] text-rf-cream/90 hover:text-rf-tan"
                  >
                    <Search className="h-5 w-5" aria-hidden />
                    SEARCH
                  </button>
                </div>
              </nav>
              <SheetClose asChild>
                <button
                  aria-label="Close menu"
                  className="absolute right-3 top-3 grid h-11 w-11 place-items-center text-rf-cream/80 hover:text-rf-tan"
                >
                  <X className="h-5 w-5" />
                </button>
              </SheetClose>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center" aria-label="Roamforge home">
            <img src={logo} alt="" className="h-12 w-auto" />
          </Link>
        </div>

        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-4 xl:gap-5 text-[11px] font-semibold tracking-[0.12em]"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="text-rf-cream/90 hover:text-rf-tan transition-colors"
              activeProps={{ className: "text-rf-tan" }}
            >
              {c.navLabel}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={searchTriggerRef}
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
            className="grid h-11 w-11 place-items-center text-rf-cream/90 hover:text-rf-tan"
          >
            <Search className="h-5 w-5" />
          </button>
          <CartDrawer />
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} triggerRef={searchTriggerRef} />
    </header>
  );
}
