import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, H2, P } from "@/components/PageShell";
import { SHOPIFY, SHOPIFY_STOREFRONT_URL } from "@/lib/site";
import { storefrontApiRequest } from "@/lib/shopify";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
  head: () => ({
    meta: [
      { title: "Integrations Status | Roamforge" },
      {
        name: "description",
        content: "Live status of Roamforge third-party integrations, including the connected Shopify storefront.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Integrations Status | Roamforge" },
      {
        property: "og:description",
        content: "Live status of Roamforge third-party integrations, including the connected Shopify storefront.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Status = "checking" | "connected" | "error";

function IntegrationsPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [shopName, setShopName] = useState<string | null>(null);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await storefrontApiRequest(
          `query ShopStatus { shop { name primaryDomain { url } } }`,
        );
        if (cancelled) return;
        setShopName(data?.data?.shop?.name ?? null);
        setPrimaryDomain(data?.data?.shop?.primaryDomain?.url ?? null);
        setStatus("connected");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dot =
    status === "connected"
      ? "bg-emerald-500"
      : status === "error"
        ? "bg-red-500"
        : "bg-amber-400";
  const label =
    status === "connected" ? "Connected" : status === "error" ? "Unreachable" : "Checking…";

  return (
    <PageShell eyebrow="Admin" title="Integrations">
      <H2>Shopify Storefront</H2>
      <div className="not-prose rounded-lg border border-rf-dark/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
          <span className="font-medium text-rf-dark">{label}</span>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-rf-dark/60">Store identifier</dt>
          <dd className="font-mono break-all">{SHOPIFY.storeDomain}</dd>

          <dt className="text-rf-dark/60">Shop handle</dt>
          <dd className="font-mono break-all">
            {SHOPIFY.storeDomain.replace(/\.myshopify\.com$/i, "")}
          </dd>

          <dt className="text-rf-dark/60">API version</dt>
          <dd className="font-mono">{SHOPIFY.apiVersion}</dd>

          <dt className="text-rf-dark/60">GraphQL endpoint</dt>
          <dd className="font-mono break-all">{SHOPIFY_STOREFRONT_URL}</dd>

          <dt className="text-rf-dark/60">Storefront token</dt>
          <dd className="font-mono">
            {SHOPIFY.storefrontToken
              ? `${SHOPIFY.storefrontToken.slice(0, 4)}…${SHOPIFY.storefrontToken.slice(-4)}`
              : "missing"}
          </dd>

          {shopName ? (
            <>
              <dt className="text-rf-dark/60">Shop name</dt>
              <dd>{shopName}</dd>
            </>
          ) : null}

          {primaryDomain ? (
            <>
              <dt className="text-rf-dark/60">Primary domain</dt>
              <dd className="font-mono break-all">
                <a
                  href={primaryDomain}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {primaryDomain}
                </a>
              </dd>
            </>
          ) : null}
        </dl>
        {status === "error" && error ? (
          <p className="mt-4 text-sm text-red-600 break-words">Reachability error: {error}</p>
        ) : null}
      </div>
      <P>
        This page reflects the Shopify Storefront credentials the frontend uses to load products.
        Admin/back-office connections (e.g. the Lovable ↔ Shopify integration used for bulk edits)
        are managed separately in Project Settings → Integrations.
      </P>
    </PageShell>
  );
}