"use client";

import { SaveState } from "@/lib/useAutoSave";

const LABELS: Record<SaveState, { text: string; dot: string }> = {
  idle: { text: "All changes saved", dot: "bg-sage" },
  saving: { text: "Saving…", dot: "bg-terracotta animate-pulse" },
  saved: { text: "Saved", dot: "bg-sage" },
  error: { text: "Save failed — retrying on next edit", dot: "bg-terracotta-deep" },
};

export default function SaveStatus({ state }: { state: SaveState }) {
  const { text, dot } = LABELS[state];
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-white/55 px-3.5 py-1.5 text-xs text-ink-soft shadow-soft backdrop-blur-md">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
    </div>
  );
}
