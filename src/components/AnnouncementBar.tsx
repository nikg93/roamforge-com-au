import { Link } from "@tanstack/react-router";
import { MapPin, Lightbulb } from "lucide-react";
import { BRAND_CLAIMS } from "@/lib/site";

/**
 * Compact announcement / trust strip shown above the header.
 * Copy is driven by BRAND_CLAIMS — only verifiable statements render.
 */
export function AnnouncementBar() {
  const lightforceLabel = BRAND_CLAIMS.authorisedLightforceDealer
    ? "Authorised Lightforce dealer"
    : "Genuine Lightforce lighting in stock";

  if (!BRAND_CLAIMS.australianOwned && !BRAND_CLAIMS.lightforceStockist) return null;

  return (
    <div className="bg-rf-tan text-rf-dark">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] sm:text-xs lg:px-8">
        {BRAND_CLAIMS.australianOwned && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            AUSTRALIAN OWNED
          </span>
        )}
        {BRAND_CLAIMS.lightforceStockist && (
          <span className="inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            <Link
              to="/category/$slug"
              params={{ slug: "lighting" }}
              className="underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-dark"
            >
              {lightforceLabel.toUpperCase()}
            </Link>
          </span>
        )}
      </p>
    </div>
  );
}
