"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import Card from "@/components/Card";

/** ISO date (YYYY-MM-DD) in local time for an offset of `daysAgo`. */
function isoDay(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-CA"); // en-CA renders as YYYY-MM-DD
}

const WEEKDAY = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" });

// Last 7 days, oldest first.
const DAYS = Array.from({ length: 7 }, (_, i) => isoDay(6 - i));

function streak(history: Record<string, boolean>): number {
  let count = 0;
  for (let i = 0; ; i++) {
    if (history[isoDay(i)]) count++;
    else break;
  }
  return count;
}

export default function HabitsWidget({
  habits,
  onChange,
}: {
  habits: Habit[];
  onChange: (habits: Habit[]) => void;
}) {
  const [name, setName] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([
      ...habits,
      { id: crypto.randomUUID(), name: trimmed, history: {} },
    ]);
    setName("");
  }

  function toggle(id: string, day: string) {
    onChange(
      habits.map((h) =>
        h.id === id
          ? { ...h, history: { ...h.history, [day]: !h.history[day] } }
          : h,
      ),
    );
  }

  function remove(id: string) {
    onChange(habits.filter((h) => h.id !== id));
  }

  return (
    <Card title="Habits">
      <div className="mb-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a habit…"
          className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-terracotta focus:bg-white/70"
        />
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Add
        </button>
      </div>

      {habits.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-faint">
          No habits yet — track your first one above. ✦
        </p>
      )}

      {habits.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_repeat(7,1.6rem)] items-center gap-1 pl-1 text-center text-[10px] uppercase tracking-wide text-ink-faint">
            <span />
            {DAYS.map((d) => (
              <span key={d}>{WEEKDAY(d)}</span>
            ))}
          </div>
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="group grid grid-cols-[1fr_repeat(7,1.6rem)] items-center gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-cream/50"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm text-ink" title={habit.name}>
                  {habit.name}
                </span>
                {streak(habit.history) > 0 && (
                  <span className="shrink-0 text-xs text-terracotta-deep">
                    🔥{streak(habit.history)}
                  </span>
                )}
                <button
                  onClick={() => remove(habit.id)}
                  className="shrink-0 text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                  aria-label="Delete habit"
                >
                  ✕
                </button>
              </div>
              {DAYS.map((day) => {
                const on = !!habit.history[day];
                return (
                  <button
                    key={day}
                    onClick={() => toggle(habit.id, day)}
                    className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border text-xs transition ${
                      on
                        ? "border-terracotta bg-terracotta text-white shadow-soft"
                        : "border-line bg-cream/40 text-transparent hover:border-terracotta hover:bg-white/60"
                    }`}
                    aria-label={`${habit.name} on ${day}`}
                  >
                    {on ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
