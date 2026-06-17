"use client";

import { useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Debounced auto-save. Watches `data` and PUTs it to /api/dashboard a short
 * while after the last change, so rapid edits collapse into one request.
 * The very first render is skipped so loading data does not trigger a save.
 */
export function useAutoSave<T>(data: T, delay = 800): SaveState {
  const [state, setState] = useState<SaveState>("idle");
  const isFirst = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // Guards against an older request finishing after a newer one and
  // clobbering the displayed status.
  const requestId = useRef(0);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    setState("saving");
    clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      const id = ++requestId.current;
      try {
        const res = await fetch("/api/dashboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        if (id === requestId.current) setState("saved");
      } catch (err) {
        console.error(err);
        if (id === requestId.current) setState("error");
      }
    }, delay);

    return () => clearTimeout(timer.current);
  }, [data, delay]);

  return state;
}
