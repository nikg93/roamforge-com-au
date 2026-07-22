// Server-only helper: mark the current SSR response as HTTP 404.
// Isolated in a *.server.ts file so import protection keeps the
// `@tanstack/react-start/server` module out of the client bundle.
import { setResponseStatus } from "@tanstack/react-start/server";

export function markNotFoundStatus() {
  try {
    setResponseStatus(404);
  } catch {
    // No active server request context (e.g. static prerender pass).
  }
}