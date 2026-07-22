import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function useCartSync() {
  const syncCart = useCartStore((s) => s.syncCart);
  useEffect(() => {
    const safeSync = () => {
      Promise.resolve()
        .then(() => syncCart())
        .catch((err) => console.error("[cart] sync failed", err));
    };
    safeSync();
    const onVis = () => {
      if (document.visibilityState === "visible") safeSync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [syncCart]);
}
