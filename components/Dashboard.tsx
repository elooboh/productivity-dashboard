"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData, getWeek } from "@/lib/types";
import { weekKey } from "@/lib/date";
import { useAutoSave } from "@/lib/useAutoSave";
import { DEFAULT_TAB, isTabId, TabId } from "@/lib/tabs";
import SaveStatus from "@/components/SaveStatus";
import TabNav from "@/components/TabNav";
import WeekTab from "@/components/tabs/WeekTab";
import MonthTab from "@/components/tabs/MonthTab";
import QuarterTab from "@/components/tabs/QuarterTab";
import HabitsTab from "@/components/tabs/HabitsTab";
import YearTab from "@/components/tabs/YearTab";
import BucketListTab from "@/components/tabs/BucketListTab";

export default function Dashboard({
  initial,
  locked = false,
}: {
  initial: DashboardData;
  locked?: boolean;
}) {
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

  // Active tab lives in the URL hash so it's bookmarkable and survives reload.
  // Starts at the default on the server, then syncs to the hash after mount.
  const [tab, setTab] = useState<TabId>(DEFAULT_TAB);
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace("#", "");
      if (isTabId(hash)) setTab(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function selectTab(id: TabId) {
    setTab(id);
    if (window.location.hash !== `#${id}`) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  function update<K extends keyof DashboardData>(
    key: K,
    value: DashboardData[K],
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  // One-time migration: fold pre-existing top-level tasks into the current
  // week's task list, then clear the legacy field so it never runs again.
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    setData((d) => {
      if (d.tasks.length === 0) return d;
      const wk = weekKey(new Date());
      const week = getWeek(d, wk);
      return {
        ...d,
        tasks: [],
        weeks: {
          ...d.weeks,
          [wk]: { ...week, tasks: [...d.tasks, ...week.tasks] },
        },
      };
    });
  }, []);

  const tabProps = { data, update };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-9 flex flex-wrap items-start justify-between gap-4">
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
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-soft">{today || " "}</p>
            <SaveStatus state={saveState} />
            {locked && (
              <button
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="rounded-full border border-line bg-white/55 px-3 py-1.5 text-xs text-ink-soft shadow-soft backdrop-blur-md transition hover:border-terracotta hover:text-terracotta-deep"
              >
                🔒 Lock
              </button>
            )}
          </div>
        </div>
        <TabNav active={tab} onChange={selectTab} />
      </header>

      <div key={tab}>
        {tab === "week" && <WeekTab {...tabProps} />}
        {tab === "month" && <MonthTab {...tabProps} />}
        {tab === "quarter" && <QuarterTab {...tabProps} />}
        {tab === "habits" && <HabitsTab {...tabProps} />}
        {tab === "year" && <YearTab {...tabProps} />}
        {tab === "bucket" && <BucketListTab {...tabProps} />}
      </div>

      <footer className="mt-10 text-center text-xs tracking-wide text-ink-faint">
        Built for you ✦ 2026
      </footer>
    </main>
  );
}
