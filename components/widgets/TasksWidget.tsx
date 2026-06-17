"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import Card from "@/components/Card";

export default function TasksWidget({
  tasks,
  onChange,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}) {
  const [text, setText] = useState("");

  function add() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([
      { id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() },
      ...tasks,
    ]);
    setText("");
  }

  function toggle(id: string) {
    onChange(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: string) {
    onChange(tasks.filter((t) => t.id !== id));
  }

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <Card
      title="Tasks"
      action={<span className="text-xs text-ink-faint">{remaining} left</span>}
    >
      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-terracotta focus:bg-white/70"
        />
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Add
        </button>
      </div>

      <ul className="space-y-1">
        {tasks.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-faint">
            No tasks yet — add one above. ✦
          </li>
        )}
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-cream/60"
          >
            <button
              onClick={() => toggle(task.id)}
              role="checkbox"
              aria-checked={task.done}
              aria-label={task.done ? "Mark incomplete" : "Mark complete"}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs text-white transition ${
                task.done
                  ? "border-terracotta bg-terracotta"
                  : "border-ink-faint/50 bg-transparent hover:border-terracotta"
              }`}
            >
              {task.done ? "✓" : ""}
            </button>
            <span
              className={`flex-1 text-sm transition-colors ${
                task.done ? "text-ink-faint line-through" : "text-ink"
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => remove(task.id)}
              className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
              aria-label="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
