import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createDirectCheckout, parseDirectCartLine } from "@/lib/direct-checkout";

export const Route = createFileRoute("/cart/$cartLine")({
  head: () => ({
    meta: [
      { title: "Preparing checkout — Roamforge" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: DirectCartPage,
});

function DirectCartPage() {
  const { cartLine } = Route.useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const line = parseDirectCartLine(cartLine);
    if (!line) {
      setError("This checkout link is invalid. Please add the item from its product page instead.");
      return;
    }

    let cancelled = false;
    void createDirectCheckout(line)
      .then((checkoutUrl) => {
        if (!cancelled) window.location.assign(checkoutUrl);
      })
      .catch((requestError) => {
        console.error("[checkout] direct cart failed", requestError);
        if (!cancelled)
          setError("We couldn't prepare checkout for this item. Please try again shortly.");
      });

    return () => {
      cancelled = true;
    };
  }, [cartLine]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center"
      >
        {error ? (
          <>
            <h1 className="font-display text-3xl tracking-widest text-rf-dark">
              CHECKOUT UNAVAILABLE
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">{error}</p>
            <Link
              to="/shop"
              className="mt-7 inline-flex min-h-11 items-center justify-center bg-rf-dark px-5 py-3 text-sm font-semibold tracking-[0.12em] text-rf-cream hover:bg-rf-dark-2"
            >
              SHOP ALL
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-rf-tan" aria-hidden />
            <h1 className="mt-5 font-display text-3xl tracking-widest text-rf-dark">
              PREPARING SECURE CHECKOUT
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">
              We&apos;re adding your item and taking you to Shopify checkout.
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
