"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import { HABIT_COLORS, HABIT_ICONS } from "@/lib/constants";

export default function ManageHabits({
  habits,
  onChange,
  onClose,
}: {
  habits: Habit[];
  onChange: (habits: Habit[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  function add() {
    const t = name.trim();
    if (!t) return;
    onChange([
      ...habits,
      {
        id: crypto.randomUUID(),
        name: t,
        history: {},
        icon: HABIT_ICONS[0],
        color: HABIT_COLORS[0],
        weeklyGoal: 7,
        section: "daily",
        order: habits.length,
      },
    ]);
    setName("");
  }

  function patch(id: string, fields: Partial<Habit>) {
    onChange(habits.map((h) => (h.id === id ? { ...h, ...fields } : h)));
  }

  function remove(id: string) {
    onChange(habits.filter((h) => h.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...habits];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-line bg-cream p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Manage Habits ✦
          </h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition hover:text-terracotta-deep"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New habit name…"
            className="flex-1 rounded-lg border border-line bg-white/60 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
          />
          <button
            onClick={add}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {habits.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-faint">
              No habits yet — add your first above. ✦
            </p>
          )}
          {habits.map((h, i) => (
            <div
              key={h.id}
              className="rounded-xl border border-line bg-white/50 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-xs text-ink-faint transition hover:text-terracotta disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === habits.length - 1}
                    className="text-xs text-ink-faint transition hover:text-terracotta disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <span className="text-lg">{h.icon}</span>
                <input
                  value={h.name}
                  onChange={(e) => patch(h.id, { name: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-medium text-ink outline-none"
                />
                <button
                  onClick={() => remove(h.id)}
                  className="text-ink-faint transition hover:text-terracotta-deep"
                  aria-label="Delete habit"
                >
                  ✕
                </button>
              </div>

              {/* Icon picker */}
              <div className="mb-2 flex flex-wrap gap-1">
                {HABIT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => patch(h.id, { icon })}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition ${
                      h.icon === icon
                        ? "bg-terracotta/20 ring-1 ring-terracotta"
                        : "hover:bg-cream"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Color picker */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => patch(h.id, { color })}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded-full transition ${
                      h.color === color
                        ? "ring-2 ring-ink ring-offset-1 ring-offset-cream"
                        : ""
                    }`}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <select
                  value={h.section}
                  onChange={(e) =>
                    patch(h.id, {
                      section: e.target.value as Habit["section"],
                    })
                  }
                  className="rounded-lg border border-line bg-white/60 px-2 py-1 text-ink-soft outline-none focus:border-terracotta"
                >
                  <option value="daily">Daily</option>
                  <option value="devotional">Devotional</option>
                </select>
                <label className="flex items-center gap-1.5 text-ink-soft">
                  Goal
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={h.weeklyGoal}
                    onChange={(e) =>
                      patch(h.id, {
                        weeklyGoal: Math.max(
                          1,
                          Math.min(7, Number(e.target.value) || 1),
                        ),
                      })
                    }
                    className="w-14 rounded-lg border border-line bg-white/60 px-2 py-1 text-ink outline-none focus:border-terracotta"
                  />
                  / 7
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-terracotta py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Done
        </button>
      </div>
    </div>
  );
}
