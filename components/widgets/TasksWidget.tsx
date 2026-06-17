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
      action={
        <span className="text-xs text-gray-500">{remaining} left</span>
      }
    >
      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-gray-500"
        />
        <button
          onClick={add}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Add
        </button>
      </div>

      <ul className="space-y-1">
        {tasks.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-500">
            No tasks yet — add one above.
          </li>
        )}
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggle(task.id)}
              className="h-4 w-4 shrink-0 accent-emerald-500"
            />
            <span
              className={`flex-1 text-sm ${
                task.done ? "text-gray-500 line-through" : "text-gray-100"
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => remove(task.id)}
              className="text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
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
