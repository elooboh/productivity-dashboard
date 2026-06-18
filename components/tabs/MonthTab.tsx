"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import { MonthData, getMonth } from "@/lib/types";
import {
  WEEKDAY_LETTERS,
  addMonthToKey,
  formatMonthLabel,
  fromISO,
  monthCalendar,
  monthKey,
} from "@/lib/date";
import { MONTH_QUESTIONS } from "@/lib/constants";
import Card from "@/components/Card";
import PeriodNav from "@/components/ui/PeriodNav";
import CurrentlyReading from "@/components/CurrentlyReading";

export default function MonthTab({ data, update }: TabProps) {
  const [key, setKey] = useState(() => monthKey(new Date()));
  const month = getMonth(data, key);
  const cells = monthCalendar(key);

  function toggleGym(iso: string) {
    const set = new Set(data.gymDays);
    set.has(iso) ? set.delete(iso) : set.add(iso);
    update("gymDays", Array.from(set));
  }

  function patchReflection(id: string, value: string) {
    update("months", {
      ...data.months,
      [key]: { ...month, reflection: { ...month.reflection, [id]: value } },
    });
  }

  const sessions = cells.filter((c) => c && data.gymDays.includes(c)).length;
  const isThis = key === monthKey(new Date());

  return (
    <div className="space-y-5">
      <PeriodNav
        label={formatMonthLabel(key)}
        sublabel={isThis ? "This month" : "Jump to this month"}
        onPrev={() => setKey(addMonthToKey(key, -1))}
        onNext={() => setKey(addMonthToKey(key, 1))}
        onToday={() => setKey(monthKey(new Date()))}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Gym Calendar"
          action={
            <span className="text-xs text-ink-faint">{sessions} sessions</span>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-ink-faint">
            {WEEKDAY_LETTERS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const on = data.gymDays.includes(iso);
              return (
                <button
                  key={iso}
                  onClick={() => toggleGym(iso)}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs transition ${
                    on
                      ? "border-terracotta bg-terracotta font-medium text-white shadow-soft"
                      : "border-line bg-cream/40 text-ink-soft hover:border-terracotta hover:bg-white/60"
                  }`}
                  aria-label={`Toggle gym ${iso}`}
                >
                  {fromISO(iso).getDate()}
                </button>
              );
            })}
          </div>
        </Card>

        <CurrentlyReading data={data} update={update} />
      </div>

      <MonthlyReflection month={month} onChange={patchReflection} />
    </div>
  );
}

function MonthlyReflection({
  month,
  onChange,
}: {
  month: MonthData;
  onChange: (id: string, value: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(MONTH_QUESTIONS[0].id);
  const answered = MONTH_QUESTIONS.filter((q) =>
    (month.reflection[q.id] ?? "").trim(),
  ).length;

  return (
    <Card
      title="Monthly Reflection"
      action={
        <span className="text-xs text-ink-faint">
          {answered}/{MONTH_QUESTIONS.length} answered
        </span>
      }
    >
      <div className="space-y-2">
        {MONTH_QUESTIONS.map((q) => {
          const isOpen = open === q.id;
          const filled = (month.reflection[q.id] ?? "").trim().length > 0;
          return (
            <div
              key={q.id}
              className="rounded-xl border border-line bg-cream/30"
            >
              <button
                onClick={() => setOpen(isOpen ? null : q.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] text-white ${
                    filled
                      ? "border-terracotta bg-terracotta"
                      : "border-ink-faint/50"
                  }`}
                >
                  {filled ? "✓" : ""}
                </span>
                <span className="flex-1 text-sm text-ink">{q.q}</span>
                <span className="text-ink-faint transition-transform">
                  {isOpen ? "▴" : "▾"}
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3">
                  <textarea
                    value={month.reflection[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder="Write your thoughts…"
                    rows={3}
                    className="w-full resize-y rounded-lg border border-line bg-white/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-terracotta"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
