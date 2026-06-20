"use client";

import { useCallback, useEffect, useState } from "react";
import { WeekData, WeekEvent } from "@/lib/types";
import { fromISO } from "@/lib/date";
import Card from "@/components/Card";

interface GoogleEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  accountId: string;
  accountEmail: string | null;
  color: string;
}

interface ConnectedAccount {
  id: string;
  email: string | null;
  color: string;
  reauth?: boolean;
  error?: boolean;
}

type GcalStatus =
  | "loading"
  | "connected"
  | "disconnected"
  | "unconfigured"
  | "error";

export default function EventsCard({
  week,
  patch,
  dates,
}: {
  week: WeekData;
  patch: (p: Partial<WeekData>) => void;
  dates: string[];
}) {
  const [status, setStatus] = useState<GcalStatus>("loading");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [gEvents, setGEvents] = useState<GoogleEvent[]>([]);

  const timeMin = new Date(dates[0] + "T00:00:00").toISOString();
  const timeMax = new Date(dates[6] + "T23:59:59").toISOString();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/google/calendar?timeMin=${encodeURIComponent(
          timeMin,
        )}&timeMax=${encodeURIComponent(timeMax)}`,
      );
      const data = await res.json();
      if (data.configured === false) {
        setStatus("unconfigured");
        return;
      }
      if (!data.connected) {
        setAccounts([]);
        setGEvents([]);
        setStatus("disconnected");
        return;
      }
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setGEvents(Array.isArray(data.events) ? data.events : []);
      setStatus("connected");
    } catch {
      setStatus("error");
    }
  }, [timeMin, timeMax]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) await load();
    })();
    return () => {
      ignore = true;
    };
  }, [load]);

  async function disconnect(accountId: string) {
    await fetch("/api/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    await load();
  }

  return (
    <Card
      title="Events This Week"
      action={
        status === "connected" || status === "error" ? (
          <button
            onClick={load}
            className="rounded-lg border border-line bg-cream/50 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-terracotta hover:text-terracotta-deep"
          >
            ↻ Sync
          </button>
        ) : undefined
      }
    >
      {/* Google calendar status / events */}
      <div className="mb-4">
        <GoogleSection
          status={status}
          accounts={accounts}
          events={gEvents}
          onDisconnect={disconnect}
          onRetry={load}
        />
      </div>

      {/* Manual events */}
      <ManualEvents week={week} patch={patch} dates={dates} />
    </Card>
  );
}

function GoogleSection({
  status,
  accounts,
  events,
  onDisconnect,
  onRetry,
}: {
  status: GcalStatus;
  accounts: ConnectedAccount[];
  events: GoogleEvent[];
  onDisconnect: (accountId: string) => void;
  onRetry: () => void;
}) {
  if (status === "unconfigured") {
    return (
      <p className="rounded-xl border border-dashed border-line bg-cream/30 px-3 py-3 text-xs text-ink-faint">
        Google Calendar isn&apos;t configured on the server yet. ✦
      </p>
    );
  }

  if (status === "loading") {
    return (
      <p className="flex items-center gap-2 px-1 text-sm text-ink-faint">
        <span className="h-2 w-2 animate-pulse rounded-full bg-terracotta" />
        Syncing your calendars…
      </p>
    );
  }

  if (status === "disconnected") {
    return (
      <a
        href="/api/google/connect"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/60 py-3 text-sm font-medium text-ink shadow-soft transition hover:border-terracotta hover:bg-white"
      >
        <GoogleGlyph />
        Connect Google Calendar
      </a>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs text-terracotta-deep">
        <span>Couldn&apos;t reach Google Calendar.</span>
        <button onClick={onRetry} className="font-medium underline">
          Retry
        </button>
      </div>
    );
  }

  // connected — one or more accounts
  return (
    <div>
      {/* Connected accounts, each with its color swatch + disconnect */}
      <ul className="mb-3 space-y-1.5">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.color }}
              aria-hidden
            />
            <span className="flex-1 truncate text-ink-soft">
              {a.email ?? "Google account"}
            </span>
            {a.reauth && (
              <a href="/api/google/connect" className="font-medium text-terracotta-deep underline">
                Reconnect
              </a>
            )}
            {a.error && !a.reauth && (
              <span className="text-terracotta-deep">sync failed</span>
            )}
            <button
              onClick={() => onDisconnect(a.id)}
              className="text-ink-faint transition hover:text-terracotta-deep"
            >
              Disconnect
            </button>
          </li>
        ))}
      </ul>

      {/* Connect another account */}
      <a
        href="/api/google/connect"
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white/40 py-2 text-xs font-medium text-ink-soft transition hover:border-terracotta hover:text-terracotta-deep"
      >
        <GoogleGlyph />
        Connect another Google account
      </a>

      {/* Merged events from all accounts */}
      {events.length === 0 ? (
        <p className="px-1 py-2 text-sm text-ink-faint">
          No calendar events this week. ✦
        </p>
      ) : (
        <ul className="space-y-1">
          {events.map((e) => {
            const d = e.allDay ? fromISO(e.start) : new Date(e.start);
            return (
              <li
                key={`${e.accountId}:${e.id}`}
                className="flex items-center gap-3 rounded-lg border-l-2 px-2 py-2 transition-colors hover:bg-cream/60"
                style={{ borderLeftColor: e.color }}
              >
                <span className="w-10 shrink-0 text-xs font-medium text-terracotta-deep">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-ink">{e.summary}</span>
                  {e.accountEmail && (
                    <span className="flex items-center gap-1 truncate text-[10px] text-ink-faint">
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: e.color }}
                        aria-hidden
                      />
                      {e.accountEmail}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {e.allDay
                    ? "All day"
                    : d.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ManualEvents({
  week,
  patch,
  dates,
}: {
  week: WeekData;
  patch: (p: Partial<WeekData>) => void;
  dates: string[];
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dates[0]);

  function add() {
    const t = title.trim();
    if (!t) return;
    const ev: WeekEvent = { id: crypto.randomUUID(), title: t, date };
    patch({ events: [...week.events, ev] });
    setTitle("");
  }
  function remove(id: string) {
    patch({ events: week.events.filter((e) => e.id !== id) });
  }
  const sorted = [...week.events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="border-t border-line pt-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">
        Your own events
      </p>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Event…"
          className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
        />
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-line bg-cream/50 px-2 py-2 text-sm text-ink-soft outline-none focus:border-terracotta"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {fromISO(d).toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
              })}
            </option>
          ))}
        </select>
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Add
        </button>
      </div>
      {sorted.length > 0 && (
        <ul className="space-y-1">
          {sorted.map((e) => (
            <li
              key={e.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-cream/60"
            >
              <span className="w-10 shrink-0 text-xs font-medium text-sage">
                {fromISO(e.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </span>
              <span className="flex-1 text-sm text-ink">{e.title}</span>
              <button
                onClick={() => remove(e.id)}
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete event"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow-soft">
      <span style={{ color: "#4285F4" }}>G</span>
    </span>
  );
}
