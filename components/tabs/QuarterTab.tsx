"use client";

import { useState } from "react";
import { TabProps } from "@/lib/tabs";
import {
  CreditCard,
  QuarterData,
  SavingsGoal,
  getQuarter,
} from "@/lib/types";
import {
  addQuarterToKey,
  addWeeksToKey,
  formatQuarterLabel,
  quarterKey,
  weekDates,
  weekKey,
} from "@/lib/date";
import { GOAL_CATEGORIES } from "@/lib/constants";
import Card from "@/components/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import PeriodNav from "@/components/ui/PeriodNav";
import CategoryGoals from "@/components/CategoryGoals";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function QuarterTab({ data, update }: TabProps) {
  const [key, setKey] = useState(() => quarterKey(new Date()));
  const q = getQuarter(data, key);

  function patch(partial: Partial<QuarterData>) {
    update("quarters", { ...data.quarters, [key]: { ...q, ...partial } });
  }

  const isThis = key === quarterKey(new Date());

  return (
    <div className="space-y-5">
      <PeriodNav
        label={formatQuarterLabel(key)}
        sublabel={isThis ? "This quarter" : "Jump to this quarter"}
        onPrev={() => setKey(addQuarterToKey(key, -1))}
        onNext={() => setKey(addQuarterToKey(key, 1))}
        onToday={() => setKey(quarterKey(new Date()))}
      />

      <CategoryGoals
        title="Quarterly Goals"
        categories={GOAL_CATEGORIES}
        goals={q.goals}
        onChange={(goals) => patch({ goals })}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Finances q={q} patch={patch} />
        <GymChart gymDays={data.gymDays} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Wins q={q} patch={patch} />
        <Books q={q} patch={patch} />
        <Ideas q={q} patch={patch} />
      </div>
    </div>
  );
}

// ---- Finances ----
function Finances({
  q,
  patch,
}: {
  q: QuarterData;
  patch: (p: Partial<QuarterData>) => void;
}) {
  const [cardName, setCardName] = useState("");
  const [saveLabel, setSaveLabel] = useState("");

  const totalDebt = q.cards.reduce((s, c) => s + (c.balance || 0), 0);
  const totalSaved = q.savings.reduce((s, g) => s + (g.current || 0), 0);
  const netWorth = totalSaved - totalDebt;

  function addCard() {
    const n = cardName.trim();
    if (!n) return;
    patch({
      cards: [...q.cards, { id: crypto.randomUUID(), name: n, balance: 0 }],
    });
    setCardName("");
  }
  function patchCard(id: string, fields: Partial<CreditCard>) {
    patch({ cards: q.cards.map((c) => (c.id === id ? { ...c, ...fields } : c)) });
  }
  function addSaving() {
    const n = saveLabel.trim();
    if (!n) return;
    patch({
      savings: [
        ...q.savings,
        { id: crypto.randomUUID(), label: n, current: 0, target: 1000 },
      ],
    });
    setSaveLabel("");
  }
  function patchSaving(id: string, fields: Partial<SavingsGoal>) {
    patch({
      savings: q.savings.map((g) => (g.id === id ? { ...g, ...fields } : g)),
    });
  }

  const num =
    "w-24 rounded-lg border border-line bg-white/60 px-2 py-1 text-right text-sm text-ink outline-none focus:border-terracotta";

  return (
    <Card title="Finances">
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Debt" value={money(totalDebt)} tone="text-terracotta-deep" />
        <Stat label="Saved" value={money(totalSaved)} tone="text-sage" />
        <Stat
          label="Net Worth"
          value={money(netWorth)}
          tone={netWorth >= 0 ? "text-sage" : "text-terracotta-deep"}
        />
      </div>

      {/* Credit cards */}
      <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-faint">
        Credit Cards
      </p>
      <div className="mb-2 space-y-1.5">
        {q.cards.map((c) => (
          <div key={c.id} className="group flex items-center gap-2">
            <input
              value={c.name}
              onChange={(e) => patchCard(c.id, { name: e.target.value })}
              className="flex-1 bg-transparent text-sm text-ink outline-none"
            />
            <input
              type="number"
              value={c.balance || ""}
              onChange={(e) =>
                patchCard(c.id, { balance: Number(e.target.value) || 0 })
              }
              placeholder="0"
              className={num}
            />
            <button
              onClick={() =>
                patch({ cards: q.cards.filter((x) => x.id !== c.id) })
              }
              className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
              aria-label="Delete card"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-1.5">
        <input
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCard()}
          placeholder="Add a card / debt…"
          className="flex-1 rounded-lg border border-line bg-white/60 px-2 py-1.5 text-xs text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={addCard}
          className="rounded-lg bg-terracotta px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-terracotta-deep"
        >
          +
        </button>
      </div>

      {/* Savings */}
      <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-faint">
        Savings Goals
      </p>
      <div className="mb-2 space-y-2.5">
        {q.savings.map((g) => (
          <div key={g.id} className="group">
            <div className="flex items-center gap-2">
              <input
                value={g.label}
                onChange={(e) => patchSaving(g.id, { label: e.target.value })}
                className="flex-1 bg-transparent text-sm text-ink outline-none"
              />
              <input
                type="number"
                value={g.current || ""}
                onChange={(e) =>
                  patchSaving(g.id, { current: Number(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-20 rounded-lg border border-line bg-white/60 px-2 py-1 text-right text-xs text-ink outline-none focus:border-terracotta"
              />
              <span className="text-xs text-ink-faint">/</span>
              <input
                type="number"
                value={g.target || ""}
                onChange={(e) =>
                  patchSaving(g.id, { target: Number(e.target.value) || 0 })
                }
                placeholder="goal"
                className="w-20 rounded-lg border border-line bg-white/60 px-2 py-1 text-right text-xs text-ink outline-none focus:border-terracotta"
              />
              <button
                onClick={() =>
                  patch({ savings: q.savings.filter((x) => x.id !== g.id) })
                }
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete savings goal"
              >
                ✕
              </button>
            </div>
            <ProgressBar
              value={g.target ? (g.current / g.target) * 100 : 0}
              color="var(--sage)"
              className="mt-1"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={saveLabel}
          onChange={(e) => setSaveLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSaving()}
          placeholder="Add a savings goal…"
          className="flex-1 rounded-lg border border-line bg-white/60 px-2 py-1.5 text-xs text-ink outline-none focus:border-terracotta"
        />
        <button
          onClick={addSaving}
          className="rounded-lg bg-terracotta px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-terracotta-deep"
        >
          +
        </button>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream/40 py-2">
      <p className={`font-serif text-lg font-semibold ${tone}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </p>
    </div>
  );
}

// ---- 13-week gym consistency ----
function GymChart({ gymDays }: { gymDays: string[] }) {
  const thisWeek = weekKey(new Date());
  const weeks = Array.from({ length: 13 }, (_, i) => {
    const k = addWeeksToKey(thisWeek, -(12 - i));
    const count = weekDates(k).filter((d) => gymDays.includes(d)).length;
    return { k, count };
  });
  const totalSessions = weeks.reduce((s, w) => s + w.count, 0);

  return (
    <Card
      title="Gym Consistency"
      action={
        <span className="text-xs text-ink-faint">
          {totalSessions} sessions · 13 wks
        </span>
      }
    >
      <div className="flex h-40 items-end gap-1.5">
        {weeks.map((w, i) => (
          <div key={w.k} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-terracotta/80 transition-all duration-500"
                style={{ height: `${(w.count / 7) * 100}%`, minHeight: w.count ? "4px" : "0" }}
                title={`${w.count} sessions`}
              />
            </div>
            {(i === 0 || i === 12) && (
              <span className="text-[9px] text-ink-faint">
                {i === 0 ? "12 wks ago" : "now"}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Wins ----
function Wins({
  q,
  patch,
}: {
  q: QuarterData;
  patch: (p: Partial<QuarterData>) => void;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    patch({
      wins: [
        { id: crypto.randomUUID(), text: t, createdAt: Date.now() },
        ...q.wins,
      ],
    });
    setText("");
  }
  return (
    <Card title="Quarterly Wins">
      <AddBar value={text} setValue={setText} onAdd={add} placeholder="Log a win…" />
      {q.wins.length === 0 ? (
        <Empty text="No wins logged yet — celebrate your progress! ✦" />
      ) : (
        <ul className="space-y-1">
          {q.wins.map((w) => (
            <li
              key={w.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-cream/60"
            >
              <span className="text-terracotta">★</span>
              <span className="flex-1 text-sm text-ink">{w.text}</span>
              <button
                onClick={() => patch({ wins: q.wins.filter((x) => x.id !== w.id) })}
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete win"
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

// ---- Books ----
function Books({
  q,
  patch,
}: {
  q: QuarterData;
  patch: (p: Partial<QuarterData>) => void;
}) {
  const [title, setTitle] = useState("");
  function add() {
    const t = title.trim();
    if (!t) return;
    patch({
      books: [{ id: crypto.randomUUID(), title: t, author: "" }, ...q.books],
    });
    setTitle("");
  }
  return (
    <Card
      title="Books Read"
      action={<span className="text-xs text-ink-faint">{q.books.length}</span>}
    >
      <AddBar value={title} setValue={setTitle} onAdd={add} placeholder="Add a book…" />
      {q.books.length === 0 ? (
        <Empty text="No books finished yet. ✦" />
      ) : (
        <ul className="space-y-1">
          {q.books.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-cream/60"
            >
              <span>📖</span>
              <span className="flex-1 text-sm text-ink">{b.title}</span>
              <button
                onClick={() =>
                  patch({ books: q.books.filter((x) => x.id !== b.id) })
                }
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete book"
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

// ---- Idea parking lot ----
function Ideas({
  q,
  patch,
}: {
  q: QuarterData;
  patch: (p: Partial<QuarterData>) => void;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    patch({
      ideas: [
        { id: crypto.randomUUID(), text: t, createdAt: Date.now() },
        ...q.ideas,
      ],
    });
    setText("");
  }
  return (
    <Card title="Idea Parking Lot">
      <AddBar value={text} setValue={setText} onAdd={add} placeholder="Drop an idea…" />
      {q.ideas.length === 0 ? (
        <Empty text="Your idea parking lot is empty. ✦" />
      ) : (
        <ul className="space-y-1">
          {q.ideas.map((idea) => (
            <li
              key={idea.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-cream/60"
            >
              <span className="text-terracotta">💡</span>
              <span className="flex-1 text-sm text-ink">{idea.text}</span>
              <button
                onClick={() =>
                  patch({ ideas: q.ideas.filter((x) => x.id !== idea.id) })
                }
                className="text-ink-faint/60 opacity-0 transition hover:text-terracotta-deep group-hover:opacity-100"
                aria-label="Delete idea"
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

// ---- Small shared bits ----
function AddBar({
  value,
  setValue,
  onAdd,
  placeholder,
}: {
  value: string;
  setValue: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="mb-2 flex gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-line bg-white/60 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-terracotta"
      />
      <button
        onClick={onAdd}
        className="rounded-lg bg-terracotta px-3 py-1.5 text-sm font-medium text-white transition hover:bg-terracotta-deep"
      >
        +
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-ink-faint">{text}</p>;
}
