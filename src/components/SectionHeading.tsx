type HeadingTag = "h1" | "h2" | "h3";

export function SectionHeading({
  children,
  dark = false,
  as = "h2",
}: {
  children: React.ReactNode;
  dark?: boolean;
  /** Semantic heading level. Keeps visual style regardless of tag. */
  as?: HeadingTag;
}) {
  const line = dark ? "bg-rf-tan/60" : "bg-rf-dark/40";
  const text = dark ? "text-rf-cream" : "text-rf-dark";
  const Tag = as;
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <span className={`h-px w-12 ${line}`} aria-hidden />
      <Tag className={`font-display text-2xl sm:text-3xl tracking-[0.25em] ${text}`}>
        {children}
      </Tag>
      <span className={`h-px w-12 ${line}`} aria-hidden />
    </div>
  );
}
