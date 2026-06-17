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
          className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-gray-200 transition hover:bg-border"
        >
          + New note
        </button>
      }
    >
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            No notes yet — create one to start jotting.
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="group rounded-lg border border-border bg-surface-2 p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <input
                value={note.title}
                onChange={(e) => patch(note.id, { title: e.target.value })}
                placeholder="Untitled"
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-500"
              />
              <button
                onClick={() => remove(note.id)}
                className="text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
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
              className="w-full resize-y bg-transparent text-sm text-gray-300 outline-none placeholder:text-gray-600"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
