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
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-gray-500"
        />
        <button
          onClick={add}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Add
        </button>
      </div>

      {habits.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-500">
          No habits yet — track your first one above.
        </p>
      )}

      {habits.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_repeat(7,1.5rem)] items-center gap-1 pl-1 text-center text-[10px] text-gray-500">
            <span />
            {DAYS.map((d) => (
              <span key={d}>{WEEKDAY(d)}</span>
            ))}
          </div>
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="group grid grid-cols-[1fr_repeat(7,1.5rem)] items-center gap-1"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm text-gray-100" title={habit.name}>
                  {habit.name}
                </span>
                {streak(habit.history) > 0 && (
                  <span className="shrink-0 text-xs text-amber-400">
                    🔥{streak(habit.history)}
                  </span>
                )}
                <button
                  onClick={() => remove(habit.id)}
                  className="shrink-0 text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
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
                    className={`mx-auto h-6 w-6 rounded-md border text-xs transition ${
                      on
                        ? "border-emerald-500 bg-emerald-500/80 text-white"
                        : "border-border bg-surface-2 hover:border-gray-500"
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
