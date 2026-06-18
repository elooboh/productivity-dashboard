"use client";

import { Note } from "@/lib/types";
import Card from "@/components/Card";

export default function NotesWidget({
  notes,
  onChange,
}: {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}) {
  function add() {
    onChange([
      { id: crypto.randomUUID(), title: "", body: "", updatedAt: Date.now() },
      ...notes,
    ]);
  }

  function patch(id: string, fields: Partial<Note>) {
    onChange(
      notes.map((n) =>
        n.id === id ? { ...n, ...fields, updatedAt: Date.now() } : n,
      ),
    );
  }

  function remove(id: string) {
    onChange(notes.filter((n) => n.id !== id));
  }

  return (
    <Card
      title="Notes"
      action={
        <button
          onClick={add}
          className="rounded-lg border border-line bg-cream/50 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-terracotta hover:text-terracotta-deep"
        >
          + New note
        </button>
      }
    >
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">
            No notes yet — create one to start jotting. ✦
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="group rounded-xl border border-line bg-cream/40 p-3 transition-colors hover:bg-cream/60"
          >
            <div className="mb-1 flex items-center gap-2">
              <input
                value={note.title}
                onChange={(e) => patch(note.id, { title: e.target.value })}
                placeholder="Untitled"
                className="flex-1 bg-transparent font-serif text-sm font-medium text-ink outline-none placeholder:text-ink-faint/70"
              />
              <button
                onClick={() => remove(note.id)}
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete note"
              >
                ✕
              </button>
            </div>
            <textarea
              value={note.body}
              onChange={(e) => patch(note.id, { body: e.target.value })}
              placeholder="Write something…"
              rows={3}
              className="w-full resize-y bg-transparent text-sm text-ink-soft outline-none placeholder:text-ink-faint/60"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
