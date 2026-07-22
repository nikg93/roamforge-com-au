import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/$")({
  // Signal a true HTTP 404 during SSR so crawlers see the correct status,
  // not a soft-200. `setResponseStatus` is only defined when a server
  // request context exists (SSR); harmless no-op on client navigation.
  loader: () => {
    markNotFoundStatus();
    return null;
  },
  component: NotFoundPage,
  head: () => ({
    meta: [
      { title: "Page not found — Roamforge" },
      {
        name: "description",
        content: "The page you're looking for doesn't exist or has been moved.",
      },
      {
        property: "og:title",
        content: "Page not found — Roamforge",
      },
      {
        property: "og:description",
        content: "The page you're looking for doesn't exist or has been moved.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
});

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main
        role="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center"
      >
        <p className="font-display text-7xl tracking-widest text-rf-dark">404</p>
        <h1 className="mt-4 font-display text-2xl tracking-widest text-rf-dark">PAGE NOT FOUND</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center bg-rf-dark px-5 py-3 text-sm font-medium tracking-widest text-rf-cream hover:bg-rf-dark-2"
        >
          GO HOME
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
