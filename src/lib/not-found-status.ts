import { createIsomorphicFn } from "@tanstack/react-start";

// Server-only: mark the SSR response as HTTP 404 so unknown URLs return the
// correct status. Import-protection blocks `@tanstack/react-start/server`
// from client-reachable files; createIsomorphicFn lets us keep the server
// implementation in a plain module and no-op on the client.
export const markNotFoundStatus = createIsomorphicFn()
  .client(() => {})
  .server(() => {
    try {
      // Dynamic require via eval avoids the client bundle picking up the
      // server-only module even though this branch never runs on the client.
      const req = new Function("m", "return import(m)") as (m: string) => Promise<{
        setResponseStatus?: (code: number) => void;
      }>;
      req("@tanstack/react-start/server").then((mod) => mod.setResponseStatus?.(404));
    } catch {
      // No response context available (e.g. static prerender).
    }
  });