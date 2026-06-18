"use client";

// Left/right navigator used by Week, Quarter, Year, and Month tabs.
export default function PeriodNav({
  label,
  sublabel,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  sublabel?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}) {
  const arrow =
    "flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white/50 text-ink-soft shadow-soft backdrop-blur-md transition hover:border-terracotta hover:text-terracotta";
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <button aria-label="Previous" onClick={onPrev} className={arrow}>
        ‹
      </button>
      <div className="text-center">
        <p className="font-serif text-lg font-semibold text-ink">{label}</p>
        {sublabel && (
          <button
            onClick={onToday}
            className="text-xs text-ink-faint transition hover:text-terracotta"
          >
            {sublabel}
          </button>
        )}
      </div>
      <button aria-label="Next" onClick={onNext} className={arrow}>
        ›
      </button>
    </div>
  );
}
