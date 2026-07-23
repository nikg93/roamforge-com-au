import { Link } from "@tanstack/react-router";

export function EmptyProducts({
  message = "No products in this collection just yet. Browse the full range or get in touch and we'll help you track down the right gear.",
}: {
  message?: string;
}) {
  return (
    <div className="col-span-full mx-auto max-w-lg py-16 text-center">
      <p className="font-display text-xl tracking-widest text-rf-dark">NO PRODUCTS FOUND</p>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/shop"
          className="min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream hover:bg-rf-dark-2"
        >
          SHOP ALL
        </Link>
        <Link
          to="/contact"
          className="min-h-11 inline-flex items-center justify-center border border-rf-dark px-5 py-3 text-sm font-semibold tracking-[0.14em] text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
        >
          CONTACT US
        </Link>
      </div>
    </div>
  );
}
