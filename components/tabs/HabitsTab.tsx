"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import { Habit } from "@/lib/types";
import { WEEKDAY_LETTERS, fromISO, weekDates, weekKey, formatWeekLabel } from "@/lib/date";
import Card from "@/components/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import ManageHabits from "@/components/habits/ManageHabits";

function weekCount(habit: Habit, dates: string[]): number {
  return dates.filter((d) => habit.history[d]).length;
}

export default function HabitsTab({ data, update }: TabProps) {
  const [managing, setManaging] = useState(false);
  const key = weekKey(new Date());
  const dates = weekDates(key);
  const habits = data.habits;

  function toggle(id: string, iso: string) {
    update(
      "habits",
      habits.map((h) =>
        h.id === id
          ? { ...h, history: { ...h.history, [iso]: !h.history[iso] } }
          : h,
      ),
    );
  }

  const totalPossible = habits.length * 7;
  const totalDone = habits.reduce((sum, h) => sum + weekCount(h, dates), 0);
  const pct = totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0;

  const daily = habits.filter((h) => h.section === "daily");
  const devotional = habits.filter((h) => h.section === "devotional");

  return (
    <div className="space-y-5">
      <Card
        title="Habit Tracker"
        action={
          <button
            onClick={() => setManaging(true)}
            className="rounded-lg border border-line bg-cream/50 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-terracotta hover:text-terracotta-deep"
          >
            Manage Habits
          </button>
        }
      >
        <div className="mb-1 flex items-end justify-between">
          <div>
            <span className="font-serif text-3xl font-semibold text-ink">
              {pct}%
            </span>
            <span className="ml-2 text-sm text-ink-soft">weekly score</span>
          </div>
          <span className="text-xs text-ink-faint">
            {totalDone}/{totalPossible} this week · {formatWeekLabel(key)}
          </span>
        </div>
        <ProgressBar value={pct} className="mt-2" />
      </Card>

      {habits.length === 0 ? (
        <Card title="Daily Habits">
          <p className="py-8 text-center text-sm text-ink-faint">
            No habits yet — tap “Manage Habits” to add your first. ✦
          </p>
        </Card>
      ) : (
        <>
          {daily.length > 0 && (
            <HabitGrid
              title="Daily"
              habits={daily}
              dates={dates}
              onToggle={toggle}
            />
          )}
          {devotional.length > 0 && (
            <HabitGrid
              title="Devotional"
              habits={devotional}
              dates={dates}
              onToggle={toggle}
            />
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {habits.map((h) => {
              const count = weekCount(h, dates);
              const reached = count >= h.weeklyGoal;
              return (
                <div
                  key={h.id}
                  className="rounded-xl border p-3 shadow-soft"
                  style={{
                    backgroundColor: `${h.color}1f`,
                    borderColor: `${h.color}55`,
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-lg">{h.icon}</span>
                    {reached && (
                      <span className="text-xs" style={{ color: h.color }}>
                        ✓ goal
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-ink" title={h.name}>
                    {h.name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {count}/{h.weeklyGoal} this week
                  </p>
                  <ProgressBar
                    value={(count / h.weeklyGoal) * 100}
                    color={h.color}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {managing && (
        <ManageHabits
          habits={habits}
          onChange={(h) => update("habits", h)}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}

function HabitGrid({
  title,
  habits,
  dates,
  onToggle,
}: {
  title: string;
  habits: Habit[];
  dates: string[];
  onToggle: (id: string, iso: string) => void;
}) {
  return (
    <Card title={title}>
      <div className="space-y-1">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_repeat(7,2rem)] items-center gap-1 pl-1 text-center text-[10px] uppercase tracking-wide text-ink-faint">
          <span />
          {dates.map((d, i) => (
            <span key={d}>
              <span className="block">{WEEKDAY_LETTERS[i]}</span>
              <span className="block text-ink-faint/70">
                {fromISO(d).getDate()}
              </span>
            </span>
          ))}
        </div>
        {habits.map((h) => {
          const count = dates.filter((d) => h.history[d]).length;
          return (
            <div
              key={h.id}
              className="grid grid-cols-[1fr_repeat(7,2rem)] items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-cream/50"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-base">{h.icon}</span>
                <span className="truncate text-sm text-ink" title={h.name}>
                  {h.name}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {count}/{h.weeklyGoal}
                </span>
              </div>
              {dates.map((d) => {
                const on = !!h.history[d];
                return (
                  <button
                    key={d}
                    onClick={() => onToggle(h.id, d)}
                    className="mx-auto flex h-6 w-6 items-center justify-center rounded-md border text-xs transition"
                    style={
                      on
                        ? {
                            backgroundColor: h.color,
                            borderColor: h.color,
                            color: "white",
                          }
                        : { borderColor: "var(--line, rgba(120,91,78,0.14))" }
                    }
                    aria-label={`${h.name} on ${d}`}
                  >
                    {on ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
