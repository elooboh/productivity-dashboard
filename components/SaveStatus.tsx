"use client";

import { SaveState } from "@/lib/useAutoSave";

const LABELS: Record<SaveState, { text: string; dot: string }> = {
  idle: { text: "All changes saved", dot: "bg-gray-500" },
  saving: { text: "Saving…", dot: "bg-amber-400" },
  saved: { text: "Saved", dot: "bg-emerald-400" },
  error: { text: "Save failed — retrying on next edit", dot: "bg-red-500" },
};

export default function SaveStatus({ state }: { state: SaveState }) {
  const { text, dot } = LABELS[state];
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-gray-300">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
    </div>
  );
}
