"use client";

import { TabProps } from "@/lib/tabs";
import TasksWidget from "@/components/widgets/TasksWidget";
import NotesWidget from "@/components/widgets/NotesWidget";
import LinksWidget from "@/components/widgets/LinksWidget";

// Your day-to-day working area. Keeps the existing tasks, notes, and links
// fully functional while the richer weekly features get built out.
export default function WeekTab({ data, update }: TabProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <TasksWidget
        tasks={data.tasks}
        onChange={(tasks) => update("tasks", tasks)}
      />
      <NotesWidget
        notes={data.notes}
        onChange={(notes) => update("notes", notes)}
      />
      <div className="lg:col-span-2">
        <LinksWidget
          links={data.links}
          onChange={(links) => update("links", links)}
        />
      </div>
    </div>
  );
}
