import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CataloguePaginationProps {
  /** Current 1-based page. */
  page: number;
  totalPages: number;
  /** Route id for the Link `to` prop, e.g. "/shop" or "/category/$slug". */
  to: string;
  /** Path params for dynamic routes. */
  params?: Record<string, string>;
  /** Accessible label for the nav landmark. */
  label?: string;
}

const linkBase =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-tan focus-visible:ring-offset-2";
const active = `${linkBase} border-rf-dark text-rf-dark hover:bg-rf-dark hover:text-rf-cream`;
const current = `${linkBase} border-rf-dark bg-rf-dark text-rf-cream`;
const disabled = `${linkBase} border-border text-muted-foreground opacity-60 cursor-not-allowed`;

/**
 * Server-rendered Previous / Next / numbered pagination. These are real
 * crawlable `<a href>` links to `?page=N` URLs, so every product in the
 * catalogue is reachable from initial HTML without JavaScript.
 */
export function CataloguePagination({
  page,
  totalPages,
  to,
  params,
  label = "Pagination",
}: CataloguePaginationProps) {
  if (totalPages <= 1) return null;

  // Compact window of page numbers around the current page.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const numbers: number[] = [];
  for (let i = start; i <= end; i++) numbers.push(i);

  const search = (n: number) => (n <= 1 ? {} : { page: n });

  return (
    <nav aria-label={label} className="mt-12 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              to={to}
              params={params}
              search={search(page - 1)}
              rel="prev"
              className={active}
              aria-label={`Go to page ${page - 1}`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </span>
          )}
        </li>
        {start > 1 && (
          <li aria-hidden className="px-1 text-xs text-muted-foreground">
            …
          </li>
        )}
        {numbers.map((n) => (
          <li key={n}>
            {n === page ? (
              <span className={current} aria-current="page">
                {n}
              </span>
            ) : (
              <Link
                to={to}
                params={params}
                search={search(n)}
                className={active}
                aria-label={`Go to page ${n}`}
              >
                {n}
              </Link>
            )}
          </li>
        ))}
        {end < totalPages && (
          <li aria-hidden className="px-1 text-xs text-muted-foreground">
            …
          </li>
        )}
        <li>
          {page < totalPages ? (
            <Link
              to={to}
              params={params}
              search={search(page + 1)}
              rel="next"
              className={active}
              aria-label={`Go to page ${page + 1}`}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true">
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </li>
      </ul>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}
