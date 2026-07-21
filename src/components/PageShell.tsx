import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-rf-cream text-rf-dark">
      <SiteHeader />
      <section className="bg-rf-dark text-rf-cream">
        <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8 lg:py-20">
          {eyebrow ? (
            <p className="font-display text-xs tracking-[0.3em] text-rf-tan mb-3">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-4xl lg:text-5xl tracking-wide">{title}</h1>
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-4 py-14 lg:px-8 lg:py-20">
        <article className="prose-rf space-y-6 text-rf-dark/85 leading-relaxed">{children}</article>
      </main>
      <SiteFooter />
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl tracking-wide text-rf-dark mt-10 mb-3">{children}</h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg tracking-wide text-rf-dark mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-rf-dark/80">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-1 text-rf-dark/80">{children}</ul>;
}
