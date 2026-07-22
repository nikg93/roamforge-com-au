import { createIsomorphicFn } from "@tanstack/react-start";

// Server-only: mark the SSR response as HTTP 404 so unknown URLs return the
// correct status. The `.server()` branch is stripped from client bundles by
// the TanStack Start toolchain, so the dynamic import of the protected
// `/server` module never ships to the browser.
export const markNotFoundStatus = createIsomorphicFn()
  .client(() => Promise.resolve())
  .server(async () => {
    try {
      const mod = (await import("@tanstack/react-start/server")) as {
        setResponseStatus?: (code: number) => void;
      };
      mod.setResponseStatus?.(404);
    } catch {
      // No active response context (e.g. static prerender / client nav).
    }
  });