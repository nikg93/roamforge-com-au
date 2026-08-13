import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Your cart — Roamforge" }, { name: "robots", content: "noindex, follow" }],
  }),
  component: CartPage,
});

function CartPage() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const openDrawer = useCartStore((state) => state.openDrawer);

  useEffect(() => {
    openDrawer();
  }, [openDrawer]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center"
      >
        <p className="font-display text-xs tracking-[0.3em] text-rf-tan">YOUR CART</p>
        <h1 className="mt-3 font-display text-3xl tracking-widest text-rf-dark">
          {itemCount > 0
            ? `${itemCount} ${itemCount === 1 ? "ITEM" : "ITEMS"} READY`
            : "YOUR CART IS EMPTY"}
        </h1>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground">
          Your cart is open above. Review your items, adjust quantities, then continue to Shopify
          checkout.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            onClick={openDrawer}
            className="min-h-11 rounded-none bg-rf-dark px-5 tracking-[0.12em] text-rf-cream hover:bg-rf-dark-2"
          >
            OPEN CART
          </Button>
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center border border-rf-dark px-5 py-3 text-sm font-semibold tracking-[0.12em] text-rf-dark hover:bg-rf-dark hover:text-rf-cream"
          >
            KEEP SHOPPING
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
