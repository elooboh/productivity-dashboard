"use client";

import { useState } from "react";
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

  // Update a single top-level slice while leaving the rest untouched.
  function update<K extends keyof DashboardData>(
    key: K,
    value: DashboardData[K],
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Productivity Dashboard
          </h1>
          <p className="text-sm text-gray-400">
            Everything saves automatically as you type.
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
    </main>
  );
}
