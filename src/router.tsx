import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Shopify reads are read-mostly; a small stale window avoids refetch
        // storms on navigation without holding stale product data too long.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      // Cart writes must never be treated as stale — mutations manage their
      // own invalidations via cartStore.
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Give hover-preloaded data a small fresh window so we don't refetch on
    // click. Query still owns freshness beyond this.
    defaultPreloadStaleTime: 30_000,
    defaultPreload: "intent",
  });

  return router;
};
