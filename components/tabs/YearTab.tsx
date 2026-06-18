"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import { FocusBucket, YearData, getYear } from "@/lib/types";
import { addYearToKey, yearKey } from "@/lib/date";
import { GOAL_CATEGORIES } from "@/lib/constants";
import Card from "@/components/Card";
import PeriodNav from "@/components/ui/PeriodNav";
import CategoryGoals from "@/components/CategoryGoals";

const REFLECTIONS: { key: keyof Pick<YearData, "vision" | "nonNegotiables" | "focus" | "change">; label: string; q: string }[] = [
  { key: "vision", label: "Life Vision", q: "What is my life vision?" },
  { key: "nonNegotiables", label: "Non-Negotiables", q: "What are my non-negotiables?" },
  { key: "focus", label: "Focus", q: "What do I want to focus on?" },
  { key: "change", label: "Change", q: "What do I want to change?" },
];

export default function YearTab({ data, update }: TabProps) {
  const [key, setKey] = useState(() => yearKey(new Date()));
  const year = getYear(data, key);

  function patch(partial: Partial<YearData>) {
    update("years", { ...data.years, [key]: { ...year, ...partial } });
  }

  const isThis = key === yearKey(new Date());

  return (
    <div className="space-y-5">
      <PeriodNav
        label={`${key} — Your Year`}
        sublabel={isThis ? "This year" : "Jump to this year"}
        onPrev={() => setKey(addYearToKey(key, -1))}
        onNext={() => setKey(addYearToKey(key, 1))}
        onToday={() => setKey(yearKey(new Date()))}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REFLECTIONS.map((r) => (
          <div
            key={r.key}
            className="flex flex-col rounded-2xl border border-line bg-white/55 p-4 shadow-soft backdrop-blur-md"
          >
            <p className="border-l-2 border-terracotta pl-2 text-[10px] font-semibold uppercase tracking-wide text-terracotta-deep">
              {r.label}
            </p>
            <p className="mb-2 mt-1.5 font-serif text-sm font-medium text-ink">
              {r.q}
            </p>
            <textarea
              value={year[r.key]}
              onChange={(e) => patch({ [r.key]: e.target.value } as Partial<YearData>)}
              placeholder="Write your answer…"
              rows={5}
              className="w-full flex-1 resize-none rounded-xl border border-line bg-cream/40 px-2.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-terracotta"
            />
          </div>
        ))}
      </div>

      <FocusBuckets year={year} patch={patch} />

      <CategoryGoals
        title="Yearly Goals"
        categories={GOAL_CATEGORIES}
        goals={year.goals}
        onChange={(goals) => patch({ goals })}
      />
    </div>
  );
}

function FocusBuckets({
  year,
  patch,
}: {
  year: YearData;
  patch: (p: Partial<YearData>) => void;
}) {
  const [title, setTitle] = useState("");

  function addBucket() {
    const t = title.trim();
    if (!t) return;
    patch({
      buckets: [
        ...year.buckets,
        { id: crypto.randomUUID(), title: t, items: [] },
      ],
    });
    setTitle("");
  }
  function patchBucket(id: string, fields: Partial<FocusBucket>) {
    patch({
      buckets: year.buckets.map((b) => (b.id === id ? { ...b, ...fields } : b)),
    });
  }
  function removeBucket(id: string) {
    patch({ buckets: year.buckets.filter((b) => b.id !== id) });
  }

  return (
    <Card
      title="Focus Buckets"
      action={
        <div className="flex gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBucket()}
            placeholder="New bucket…"
            className="w-32 rounded-lg border border-line bg-cream/50 px-2 py-1 text-xs text-ink outline-none focus:border-terracotta"
          />
          <button
            onClick={addBucket}
            className="rounded-lg bg-terracotta px-2.5 py-1 text-xs font-medium text-white transition hover:bg-terracotta-deep"
          >
            + Bucket
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        Group your intentions into themes — areas of life you&apos;re actively
        investing in this year.
      </p>
      {year.buckets.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">
          No buckets yet — create your first “era”. ✦
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {year.buckets.map((bucket) => (
            <BucketCard
              key={bucket.id}
              bucket={bucket}
              onChange={(b) => patchBucket(bucket.id, b)}
              onRemove={() => removeBucket(bucket.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function BucketCard({
  bucket,
  onChange,
  onRemove,
}: {
  bucket: FocusBucket;
  onChange: (b: Partial<FocusBucket>) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    onChange({
      items: [...bucket.items, { id: crypto.randomUUID(), text: t, done: false }],
    });
    setText("");
  }

  return (
    <div className="group/bucket rounded-xl border border-line bg-cream/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={bucket.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="flex-1 border-l-2 border-terracotta bg-transparent pl-2 font-serif text-sm font-semibold text-ink outline-none"
        />
        <button
          onClick={onRemove}
          className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover/bucket:opacity-100"
          aria-label="Delete bucket"
        >
          ✕
        </button>
      </div>
      <ul className="mb-2 space-y-1">
        {bucket.items.length === 0 && (
          <li className="py-1 text-center text-xs text-ink-faint">
            No items yet
          </li>
        )}
        {bucket.items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button
              onClick={() =>
                onChange({
                  items: bucket.items.map((i) =>
                    i.id === item.id ? { ...i, done: !i.done } : i,
                  ),
                })
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
              onClick={() =>
                onChange({ items: bucket.items.filter((i) => i.id !== item.id) })
              }
              className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
              aria-label="Delete item"
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
          placeholder="Add item…"
          className="flex-1 rounded-lg border border-line bg-white/60 px-2 py-1 text-xs text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-2 py-1 text-xs font-medium text-white transition hover:bg-terracotta-deep"
        >
          +
        </button>
      </div>
    </div>
  );
}
