import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { CompleteTheKit } from "@/components/CompleteTheKit";
import { trackViewCart, trackBeginCheckout, toAnalyticsItem } from "@/lib/analytics";

export function CartDrawer() {
  const {
    items,
    isLoading,
    isSyncing,
    activeVariantIds,
    isDrawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
    getCheckoutUrl,
    syncCart,
  } = useCartStore();
  // Per-line busy — so only the line the user is editing shows a spinner,
  // and unrelated lines stay usable.
  const isBusy = (variantId: string) => activeVariantIds.includes(variantId);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const currencies = Array.from(new Set(items.map((i) => i.price.currencyCode)));
  const mixedCurrency = currencies.length > 1;
  const currency = currencies[0] ?? "AUD";
  const totalPrice = mixedCurrency
    ? NaN
    : items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);

  useEffect(() => {
    if (isDrawerOpen) syncCart();
  }, [isDrawerOpen, syncCart]);

  useEffect(() => {
    if (!isDrawerOpen || items.length === 0) return;
    trackViewCart(
      items.map((i) =>
        toAnalyticsItem({
          id: i.product.node.id,
          title: i.product.node.title,
          vendor: i.product.node.vendor,
          productType: i.product.node.productType,
          variantTitle: i.variantTitle,
          price: i.price.amount,
          quantity: i.quantity,
          currency: i.price.currencyCode,
        }),
      ),
      currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (!url) {
      toast.error("Checkout is not available right now. Please refresh and try again.");
      return;
    }
    trackBeginCheckout(
      items.map((i) =>
        toAnalyticsItem({
          id: i.product.node.id,
          title: i.product.node.title,
          vendor: i.product.node.vendor,
          productType: i.product.node.productType,
          variantTitle: i.variantTitle,
          price: i.price.amount,
          quantity: i.quantity,
          currency: i.price.currencyCode,
        }),
      ),
      currency,
    );
    setDrawerOpen(false);
    // Synchronous navigation inside the click handler avoids Safari/iOS popup blockers
    // that reject window.open called from async callbacks.
    window.location.assign(url);
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open cart"
          className="relative grid h-11 w-11 place-items-center rounded-full text-rf-cream/90 hover:text-rf-tan transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-rf-tan text-rf-dark border-0">
              {totalItems}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-display tracking-wide">YOUR CART</SheetTitle>
          <SheetDescription aria-live="polite">
            {totalItems === 0
              ? "Your cart is empty"
              : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Link
                  to="/shop"
                  onClick={() => setDrawerOpen(false)}
                  className="mt-6 min-h-11 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-semibold tracking-[0.14em] text-rf-cream hover:bg-rf-dark-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2"
                >
                  SHOP ALL
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  <p role="status" aria-live="polite" className="sr-only">
                    {isLoading ? "Updating cart" : ""}
                  </p>
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-2 border-b border-border/60">
                      <div className="w-16 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.title}
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.node.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map((o) => o.value).join(" • ")}
                        </p>
                        <p className="font-semibold">
                          ${parseFloat(item.price.amount).toFixed(2)} {item.price.currencyCode}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          aria-label={`Remove ${item.product.node.title} from cart`}
                          onClick={() => removeItem(item.variantId)}
                          disabled={isBusy(item.variantId)}
                        >
                          {isBusy(item.variantId) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11"
                            aria-label={`Decrease quantity of ${item.product.node.title}`}
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={isBusy(item.variantId)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span aria-live="polite" className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11"
                            aria-label={`Increase quantity of ${item.product.node.title}`}
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={isBusy(item.variantId)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 space-y-4 pt-4 border-t bg-background">
                <FreeShippingBar subtotal={mixedCurrency ? 0 : totalPrice} currency={currency} />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold" aria-live="polite">
                    {mixedCurrency
                      ? "See total at checkout"
                      : `$${totalPrice.toFixed(2)} ${currency}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping calculated at checkout.</p>
                <Button
                  onClick={handleCheckout}
                  className="w-full min-h-11 bg-rf-dark text-rf-cream hover:bg-rf-dark-2"
                  size="lg"
                  disabled={items.length === 0 || isLoading || isSyncing}
                >
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Checkout with Shopify
                    </>
                  )}
                </Button>
                {items[0] && (
                  <CompleteTheKit source={items[items.length - 1].product.node} compact />
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
