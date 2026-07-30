/**
 * Crawlable catalogue pagination helpers.
 *
 * Shop and category listings expose real `?page=N` URLs so Googlebot can
 * reach every product through plain HTML links rendered server-side.
 * These helpers are pure so they can be unit-tested without Shopify.
 */

/** Products rendered per catalogue page. */
export const PAGE_SIZE = 24;

/**
 * Hard ceiling on page numbers we will even attempt to resolve. Protects the
 * Storefront API from `?page=999999` crawl traps; anything above resolves to
 * an out-of-range page and 404s.
 */
export const MAX_PAGE = 100;

/**
 * Coerce an untrusted `?page=` value into a safe 1-based integer.
 * Never throws: garbage, negatives, floats and overflow all collapse to a
 * valid page number so a malformed URL can't break rendering.
 */
export function parsePageParam(value: unknown): number {
  if (value === undefined || value === null || value === "") return 1;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return 1;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > MAX_PAGE) return MAX_PAGE;
  return i;
}

/** Total number of pages for a product count. Always at least 1. */
export function totalPagesFor(count: number, size: number = PAGE_SIZE): number {
  if (!Number.isFinite(count) || count <= 0) return 1;
  return Math.max(1, Math.ceil(count / Math.max(1, size)));
}

/**
 * Path (no origin) for a given catalogue page. Page 1 is always the bare
 * path so the primary URL never carries a redundant `?page=1`.
 */
export function pagePath(basePath: string, page: number): string {
  const clean = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return page <= 1 ? clean : `${clean}?page=${page}`;
}

/** Human "Showing X–Y of Z" range for the current page. */
export function pageRange(
  page: number,
  size: number,
  shown: number,
  total: number,
): { from: number; to: number; total: number } {
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  return { from, to: Math.min(total, (page - 1) * size + shown), total };
}
