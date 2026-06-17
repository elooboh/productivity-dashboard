export default function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white/55 p-5 shadow-soft backdrop-blur-md transition-shadow duration-300 hover:shadow-soft-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 border-l-2 border-terracotta pl-2.5 font-serif text-[0.95rem] font-semibold tracking-tight text-ink">
          {title}
          <span className="text-xs text-terracotta/70">✦</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
