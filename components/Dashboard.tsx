"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";
import { useAutoSave } from "@/lib/useAutoSave";
import SaveStatus from "@/components/SaveStatus";
import TasksWidget from "@/components/widgets/TasksWidget";
import NotesWidget from "@/components/widgets/NotesWidget";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import LinksWidget from "@/components/widgets/LinksWidget";

export default function Dashboard({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initial);
  const saveState = useAutoSave(data);

  // Render the date only after mount to avoid a server/client hydration gap.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  function update<K extends keyof DashboardData>(
    key: K,
    value: DashboardData[K],
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-baseline font-serif text-3xl font-semibold tracking-tight text-ink">
            Hey&nbsp;
            <input
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="there"
              size={Math.max((data.name || "there").length, 4)}
              aria-label="Your name"
              className="border-b border-transparent bg-transparent font-serif text-3xl font-semibold tracking-tight text-ink outline-none transition-colors placeholder:text-ink-faint/70 hover:border-line focus:border-terracotta"
            />
            <span className="ml-1 text-terracotta">✦</span>
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {today || " "}
          </p>
        </div>
        <SaveStatus state={saveState} />
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TasksWidget
          tasks={data.tasks}
          onChange={(tasks) => update("tasks", tasks)}
        />
        <HabitsWidget
          habits={data.habits}
          onChange={(habits) => update("habits", habits)}
        />
        <NotesWidget
          notes={data.notes}
          onChange={(notes) => update("notes", notes)}
        />
        <LinksWidget
          links={data.links}
          onChange={(links) => update("links", links)}
        />
      </div>

      <footer className="mt-10 text-center text-xs tracking-wide text-ink-faint">
        Built for you ✦ 2026
      </footer>
    </main>
  );
}
