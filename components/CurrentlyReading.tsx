"use client";

import { useState } from "react";
import { BookStatus, CurrentBook } from "@/lib/types";
import { TabProps } from "@/lib/tabs";
import { quarterKey } from "@/lib/date";
import Card from "@/components/Card";

const STATUSES: { id: BookStatus; label: string }[] = [
  { id: "reading", label: "📖 Reading" },
  { id: "paused", label: "⏸ Paused" },
  { id: "completed", label: "✓ Completed" },
];

export default function CurrentlyReading({ data, update }: TabProps) {
  const book = data.currentlyReading;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CurrentBook>({
    title: "",
    author: "",
    cover: "",
    status: "reading",
  });

  function save(next: CurrentBook | null) {
    update("currentlyReading", next);
  }

  function setStatus(status: BookStatus) {
    if (!book) return;
    save({ ...book, status });
    // Marking complete logs the book to the current quarter's reading list.
    if (status === "completed") logToQuarter(book);
  }

  function logToQuarter(b: CurrentBook) {
    const key = quarterKey(new Date());
    const q = data.quarters[key] ?? {
      goals: {},
      cards: [],
      savings: [],
      wins: [],
      books: [],
      ideas: [],
    };
    const already = q.books.some(
      (x) => x.title.trim().toLowerCase() === b.title.trim().toLowerCase(),
    );
    if (already || !b.title.trim()) return;
    update("quarters", {
      ...data.quarters,
      [key]: {
        ...q,
        books: [
          { id: crypto.randomUUID(), title: b.title, author: b.author },
          ...q.books,
        ],
      },
    });
  }

  const action = book ? (
    <button
      onClick={() => save(null)}
      className="rounded-lg border border-line bg-cream/50 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-terracotta hover:text-terracotta-deep"
    >
      Change
    </button>
  ) : undefined;

  return (
    <Card title="Currently Reading" action={action}>
      {!book && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-dashed border-line bg-cream/30 py-8 text-sm text-ink-faint transition hover:border-terracotta hover:text-terracotta"
        >
          + Add the book you're reading
        </button>
      )}

      {!book && adding && (
        <div className="space-y-2">
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
          />
          <input
            value={draft.author}
            onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            placeholder="Author"
            className="w-full rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
          />
          <input
            value={draft.cover}
            onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
            placeholder="Cover image URL (optional)"
            className="w-full rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!draft.title.trim()) return;
                save(draft);
                setAdding(false);
                setDraft({ title: "", author: "", cover: "", status: "reading" });
              }}
              className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {book && (
        <div>
          <div className="flex gap-4">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-cream/60 shadow-soft">
              {book.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  📖
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={book.title}
                onChange={(e) => save({ ...book, title: e.target.value })}
                className="w-full bg-transparent font-serif text-base font-semibold text-ink outline-none"
              />
              <input
                value={book.author}
                onChange={(e) => save({ ...book, author: e.target.value })}
                placeholder="Author"
                className="w-full bg-transparent text-sm text-ink-soft outline-none placeholder:text-ink-faint/70"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {STATUSES.map((s) => {
              const active = book.status === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-terracotta bg-terracotta text-white shadow-soft"
                      : "border-line bg-cream/40 text-ink-soft hover:border-terracotta hover:text-terracotta"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Marking complete logs it to your quarter. ✦
          </p>
        </div>
      )}
    </Card>
  );
}
