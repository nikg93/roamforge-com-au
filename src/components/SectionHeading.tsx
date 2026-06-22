export function SectionHeading({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const line = dark ? "bg-rf-tan/60" : "bg-rf-dark/40";
  const text = dark ? "text-rf-cream" : "text-rf-dark";
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <span className={`h-px w-12 ${line}`} />
      <h2 className={`font-display text-2xl sm:text-3xl tracking-[0.25em] ${text}`}>{children}</h2>
      <span className={`h-px w-12 ${line}`} />
    </div>
  );
}