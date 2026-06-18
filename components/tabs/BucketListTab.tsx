"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import { BucketItem } from "@/lib/types";
import { BUCKET_CATEGORIES } from "@/lib/constants";
import Card from "@/components/Card";
import ProgressBar from "@/components/ui/ProgressBar";

type StatusFilter = "all" | "todo" | "done";

export default function BucketListTab({ data, update }: TabProps) {
  const items = data.bucketList;
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>(BUCKET_CATEGORIES[0]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  function add() {
    const t = text.trim();
    if (!t) return;
    update("bucketList", [
      {
        id: crypto.randomUUID(),
        text: t,
        category,
        done: false,
        createdAt: Date.now(),
      },
      ...items,
    ]);
    setText("");
  }
  function toggle(id: string) {
    update(
      "bucketList",
      items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  }
  function remove(id: string) {
    update("bucketList", items.filter((i) => i.id !== id));
  }

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const filtered = items.filter((i) => {
    if (catFilter && i.category !== catFilter) return false;
    if (status === "todo" && i.done) return false;
    if (status === "done" && !i.done) return false;
    return true;
  });

  const statusTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "todo", label: "To Do", count: total - done },
    { id: "done", label: "Done", count: done },
  ];

  return (
    <div className="space-y-5">
      <Card
        title="Life Bucket List"
        action={
          <span className="font-serif text-xl font-semibold text-terracotta-deep">
            {pct}%
          </span>
        }
      >
        <p className="mb-2 text-sm text-ink-soft">
          {done} of {total} completed
        </p>
        <ProgressBar value={pct} />

        {/* Add */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Something you want to do before you die…"
            className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-line bg-cream/50 px-2 py-2 text-sm text-ink-soft outline-none focus:border-terracotta"
          >
            {BUCKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
          >
            Add
          </button>
        </div>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip
            label="All"
            active={catFilter === null}
            onClick={() => setCatFilter(null)}
          />
          {BUCKET_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              active={catFilter === c}
              onClick={() => setCatFilter(catFilter === c ? null : c)}
            />
          ))}
        </div>

        {/* Status tabs */}
        <div className="mt-3 inline-flex gap-1 rounded-full border border-line bg-cream/40 p-1">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                status === t.id
                  ? "bg-white font-medium text-ink shadow-soft"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </Card>

      <Card title={catFilter ? `${catFilter} (${filtered.length})` : "Your List"}>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">
            Nothing here yet — add a dream above. ✦
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-cream/60"
              >
                <button
                  onClick={() => toggle(item.id)}
                  role="checkbox"
                  aria-checked={item.done}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs text-white transition ${
                    item.done
                      ? "border-terracotta bg-terracotta"
                      : "border-ink-faint/50 hover:border-terracotta"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    item.done ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {item.text}
                </span>
                <span className="shrink-0 rounded-full border border-line bg-cream/50 px-2 py-0.5 text-[10px] text-ink-soft">
                  {item.category}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  className="shrink-0 text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-terracotta bg-terracotta text-white"
          : "border-line bg-cream/40 text-ink-soft hover:border-terracotta hover:text-terracotta"
      }`}
    >
      {label}
    </button>
  );
}
