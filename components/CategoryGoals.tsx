"use client";

import { useState } from "react";
import { SimpleItem } from "@/lib/types";
import Card from "@/components/Card";

export default function CategoryGoals({
  title,
  categories,
  goals,
  onChange,
}: {
  title: string;
  categories: readonly string[];
  goals: Record<string, SimpleItem[]>;
  onChange: (goals: Record<string, SimpleItem[]>) => void;
}) {
  return (
    <Card title={title}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <CategoryBox
            key={cat}
            category={cat}
            items={goals[cat] ?? []}
            onChange={(items) => onChange({ ...goals, [cat]: items })}
          />
        ))}
      </div>
    </Card>
  );
}

function CategoryBox({
  category,
  items,
  onChange,
}: {
  category: string;
  items: SimpleItem[];
  onChange: (items: SimpleItem[]) => void;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    onChange([...items, { id: crypto.randomUUID(), text: t, done: false }]);
    setText("");
  }
  const done = items.filter((i) => i.done).length;

  return (
    <div className="rounded-xl border border-line bg-cream/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="border-l-2 border-terracotta pl-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {category}
        </h3>
        {items.length > 0 && (
          <span className="text-[10px] text-ink-faint">
            {done}/{items.length}
          </span>
        )}
      </div>

      <ul className="mb-2 space-y-1">
        {items.length === 0 && (
          <li className="py-2 text-center text-xs text-ink-faint">
            No goals yet
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button
              onClick={() =>
                onChange(
                  items.map((i) =>
                    i.id === item.id ? { ...i, done: !i.done } : i,
                  ),
                )
              }
              role="checkbox"
              aria-checked={item.done}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] text-white transition ${
                item.done
                  ? "border-terracotta bg-terracotta"
                  : "border-ink-faint/50 hover:border-terracotta"
              }`}
            >
              {item.done ? "✓" : ""}
            </button>
            <span
              className={`flex-1 text-xs ${
                item.done ? "text-ink-faint line-through" : "text-ink"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
              aria-label="Delete goal"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`Add ${category} goal…`}
          className="flex-1 rounded-lg border border-line bg-white/60 px-2 py-1.5 text-xs text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-terracotta-deep"
          aria-label="Add goal"
        >
          +
        </button>
      </div>
    </div>
  );
}
