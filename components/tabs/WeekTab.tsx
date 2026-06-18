"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import {
  SimpleItem,
  Task,
  WeekData,
  WeekEvent,
  getWeek,
} from "@/lib/types";
import {
  WEEKDAY_LETTERS,
  addWeeksToKey,
  fromISO,
  weekDates,
  weekKey,
  formatWeekLabel,
} from "@/lib/date";
import { AFFIRMATIONS } from "@/lib/constants";
import Card from "@/components/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import PeriodNav from "@/components/ui/PeriodNav";
import CurrentlyReading from "@/components/CurrentlyReading";

export default function WeekTab({ data, update }: TabProps) {
  const [key, setKey] = useState(() => weekKey(new Date()));
  const week = getWeek(data, key);
  const dates = weekDates(key);

  function patch(partial: Partial<WeekData>) {
    update("weeks", { ...data.weeks, [key]: { ...week, ...partial } });
  }

  function toggleGym(iso: string) {
    const set = new Set(data.gymDays);
    set.has(iso) ? set.delete(iso) : set.add(iso);
    update("gymDays", Array.from(set));
  }

  const isThisWeek = key === weekKey(new Date());

  return (
    <div className="space-y-5">
      <Affirmation />

      <PeriodNav
        label={formatWeekLabel(key)}
        sublabel={isThisWeek ? "This week" : "Jump to this week"}
        onPrev={() => setKey(addWeeksToKey(key, -1))}
        onNext={() => setKey(addWeeksToKey(key, 1))}
        onToday={() => setKey(weekKey(new Date()))}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WeeklyFocus week={week} patch={patch} />
        <GymThisWeek dates={dates} gymDays={data.gymDays} onToggle={toggleGym} />
        <WeekTasks week={week} patch={patch} />
        <CurrentlyReading data={data} update={update} />
        <WeekEvents week={week} patch={patch} dates={dates} />
        <Reflection week={week} patch={patch} />
      </div>
    </div>
  );
}

// ---- Rotating affirmation (swipeable) ----
function Affirmation() {
  const [i, setI] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const go = (dir: number) =>
    setI((p) => (p + dir + AFFIRMATIONS.length) % AFFIRMATIONS.length);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-terracotta/15 via-white/50 to-sage/15 px-6 py-8 text-center shadow-soft backdrop-blur-md"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <button
        aria-label="Previous affirmation"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint transition hover:text-terracotta"
      >
        ‹
      </button>
      <p className="mx-8 font-serif text-lg italic text-ink">
        {AFFIRMATIONS[i]}
      </p>
      <button
        aria-label="Next affirmation"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-ink-faint transition hover:text-terracotta"
      >
        ›
      </button>
      <div className="mt-4 flex justify-center gap-1.5">
        {AFFIRMATIONS.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 w-1.5 rounded-full transition ${
              idx === i ? "bg-terracotta" : "bg-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Weekly focus + goals ----
function WeeklyFocus({
  week,
  patch,
}: {
  week: WeekData;
  patch: (p: Partial<WeekData>) => void;
}) {
  const [text, setText] = useState("");
  function addGoal() {
    const t = text.trim();
    if (!t) return;
    patch({
      goals: [
        ...week.goals,
        { id: crypto.randomUUID(), text: t, done: false },
      ],
    });
    setText("");
  }
  function toggle(id: string) {
    patch({
      goals: week.goals.map((g) =>
        g.id === id ? { ...g, done: !g.done } : g,
      ),
    });
  }
  function remove(id: string) {
    patch({ goals: week.goals.filter((g) => g.id !== id) });
  }

  return (
    <Card title="Weekly Focus">
      <textarea
        value={week.focus}
        onChange={(e) => patch({ focus: e.target.value })}
        placeholder="What's your focus this week?"
        rows={2}
        className="mb-4 w-full resize-none rounded-xl border border-line bg-cream/40 px-3 py-2 font-serif text-base text-ink outline-none placeholder:font-sans placeholder:text-sm placeholder:text-ink-faint/70 focus:border-terracotta"
      />
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">
        Goals
      </p>
      <div className="mb-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a goal…"
          className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={addGoal}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Add
        </button>
      </div>
      <ItemList items={week.goals} onToggle={toggle} onRemove={remove} />
    </Card>
  );
}

// ---- Gym this week ----
function GymThisWeek({
  dates,
  gymDays,
  onToggle,
}: {
  dates: string[];
  gymDays: string[];
  onToggle: (iso: string) => void;
}) {
  const logged = dates.filter((d) => gymDays.includes(d)).length;
  return (
    <Card
      title="Gym This Week"
      action={
        <span className="text-xs text-ink-faint">{logged}/7 days</span>
      }
    >
      <div className="grid grid-cols-7 gap-2">
        {dates.map((iso, i) => {
          const on = gymDays.includes(iso);
          const dayNum = fromISO(iso).getDate();
          return (
            <button
              key={iso}
              onClick={() => onToggle(iso)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs transition ${
                on
                  ? "border-terracotta bg-terracotta text-white shadow-soft"
                  : "border-line bg-cream/40 text-ink-soft hover:border-terracotta hover:bg-white/60"
              }`}
              aria-label={`Toggle gym ${iso}`}
            >
              <span className="opacity-70">{WEEKDAY_LETTERS[i]}</span>
              <span className="font-medium">{dayNum}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ---- This week's tasks ----
function WeekTasks({
  week,
  patch,
}: {
  week: WeekData;
  patch: (p: Partial<WeekData>) => void;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: t,
      done: false,
      createdAt: Date.now(),
    };
    patch({ tasks: [task, ...week.tasks] });
    setText("");
  }
  function toggle(id: string) {
    patch({
      tasks: week.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    });
  }
  function remove(id: string) {
    patch({ tasks: week.tasks.filter((t) => t.id !== id) });
  }

  const done = week.tasks.filter((t) => t.done).length;
  const total = week.tasks.length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <Card
      title="This Week's Tasks"
      action={
        <span className="text-xs text-ink-faint">
          {done}/{total} done
        </span>
      }
    >
      <ProgressBar value={pct} className="mb-3" />
      <div className="mb-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-line bg-cream/50 px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={add}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          Add
        </button>
      </div>
      <ItemList
        items={week.tasks.map((t) => ({ id: t.id, text: t.text, done: t.done }))}
        onToggle={toggle}
        onRemove={remove}
        emptyText="No tasks yet — add one above. ✦"
      />
    </Card>
  );
}

// ---- Events this week ----
function WeekEvents({
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
    <Card title="Events This Week">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
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
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-faint">
          Nothing scheduled this week. ✦
        </p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((e) => (
            <li
              key={e.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-cream/60"
            >
              <span className="w-12 shrink-0 text-xs font-medium text-terracotta-deep">
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
    </Card>
  );
}

// ---- Daily reflection ----
function Reflection({
  week,
  patch,
}: {
  week: WeekData;
  patch: (p: Partial<WeekData>) => void;
}) {
  return (
    <div className="lg:col-span-2">
      <Card title="Reflection">
        <textarea
          value={week.reflection}
          onChange={(e) => patch({ reflection: e.target.value })}
          placeholder="How did this week feel? What are you noticing?"
          rows={4}
          className="w-full resize-y rounded-xl border border-line bg-cream/40 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-terracotta"
        />
      </Card>
    </div>
  );
}

// ---- Shared checklist ----
function ItemList({
  items,
  onToggle,
  onRemove,
  emptyText = "Nothing here yet. ✦",
}: {
  items: SimpleItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0)
    return (
      <p className="py-3 text-center text-sm text-ink-faint">{emptyText}</p>
    );
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-cream/60"
        >
          <button
            onClick={() => onToggle(item.id)}
            role="checkbox"
            aria-checked={item.done}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs text-white transition ${
              item.done
                ? "border-terracotta bg-terracotta"
                : "border-ink-faint/50 hover:border-terracotta"
            }`}
          >
            {item.done ? "✓" : ""}
          </button>
          <span
            className={`flex-1 text-sm ${
              item.done ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            {item.text}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
            aria-label="Delete"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
