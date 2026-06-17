/**
 * Warm "coming soon" shell for tabs whose features aren't built yet.
 * `planned` hints at what will live here, drawn from the design reference.
 */
export default function EmptyTab({
  title,
  blurb,
  planned = [],
}: {
  title: string;
  blurb: string;
  planned?: string[];
}) {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-line bg-white/55 px-6 py-16 text-center shadow-soft backdrop-blur-md">
      <span className="mb-4 text-2xl text-terracotta">✦</span>
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-ink-soft">{blurb}</p>

      {planned.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {planned.map((item) => (
            <span
              key={item}
              className="rounded-full border border-line bg-cream/50 px-3 py-1 text-xs text-ink-soft"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <p className="mt-7 text-xs uppercase tracking-wide text-ink-faint">
        Coming soon ✦ we&apos;ll build this next
      </p>
    </section>
  );
}
