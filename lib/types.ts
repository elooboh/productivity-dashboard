// ---------------------------------------------------------------------------
// Single flexible JSON object persisted per user. Every tab reads/writes a
// slice of this; nested period data (weeks/quarters/years/months) is keyed by
// date string. Accessor helpers below fill defaults so partial/older blobs
// always hydrate into complete shapes — no migrations needed.
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

// Retained for backwards-compatibility (data preserved, no longer surfaced).
export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}
export interface QuickLink {
  id: string;
  label: string;
  url: string;
}

export type BookStatus = "reading" | "paused" | "completed";
export interface CurrentBook {
  title: string;
  author: string;
  cover: string; // image URL (optional)
  status: BookStatus;
}

export interface Habit {
  id: string;
  name: string;
  /** Map of ISO date (YYYY-MM-DD) -> completed. */
  history: Record<string, boolean>;
  icon: string;
  color: string;
  weeklyGoal: number;
  section: "daily" | "devotional";
  order: number;
}

export interface SimpleItem {
  id: string;
  text: string;
  done: boolean;
}

// ---- Week ----
export interface WeekEvent {
  id: string;
  title: string;
  date: string; // ISO date within the week
}
export interface WeekData {
  focus: string;
  goals: SimpleItem[];
  tasks: Task[];
  events: WeekEvent[];
  reflection: string;
}

// ---- Quarter ----
export interface CreditCard {
  id: string;
  name: string;
  balance: number;
}
export interface SavingsGoal {
  id: string;
  label: string;
  current: number;
  target: number;
}
export interface QuarterData {
  goals: Record<string, SimpleItem[]>; // category -> goals
  cards: CreditCard[];
  savings: SavingsGoal[];
  wins: { id: string; text: string; createdAt: number }[];
  books: { id: string; title: string; author: string }[];
  ideas: { id: string; text: string; createdAt: number }[];
}

// ---- Year ----
export interface FocusBucket {
  id: string;
  title: string;
  items: SimpleItem[];
}
export interface YearData {
  vision: string;
  nonNegotiables: string;
  focus: string;
  change: string;
  buckets: FocusBucket[];
  goals: Record<string, SimpleItem[]>; // category -> goals
}

// ---- Month ----
export interface MonthData {
  reflection: Record<string, string>; // question id -> answer
}

// ---- Bucket list ----
export interface BucketItem {
  id: string;
  text: string;
  category: string;
  done: boolean;
  createdAt: number;
}

export interface DashboardData {
  name: string;

  // Legacy slices (kept so existing data is never dropped).
  tasks: Task[];
  notes: Note[];
  links: QuickLink[];

  habits: Habit[];

  // Shared, cross-period.
  gymDays: string[]; // ISO dates the gym was logged
  currentlyReading: CurrentBook | null;

  // Period-keyed data.
  weeks: Record<string, WeekData>;
  quarters: Record<string, QuarterData>;
  years: Record<string, YearData>;
  months: Record<string, MonthData>;

  bucketList: BucketItem[];
}

export const emptyDashboard: DashboardData = {
  name: "",
  tasks: [],
  notes: [],
  links: [],
  habits: [],
  gymDays: [],
  currentlyReading: null,
  weeks: {},
  quarters: {},
  years: {},
  months: {},
  bucketList: [],
};

// ---- Per-period defaults ----
export function emptyWeek(): WeekData {
  return { focus: "", goals: [], tasks: [], events: [], reflection: "" };
}
export function emptyQuarter(): QuarterData {
  return { goals: {}, cards: [], savings: [], wins: [], books: [], ideas: [] };
}
export function emptyYear(): YearData {
  return {
    vision: "",
    nonNegotiables: "",
    focus: "",
    change: "",
    buckets: [],
    goals: {},
  };
}
export function emptyMonth(): MonthData {
  return { reflection: {} };
}

// ---- Accessors: merge stored partial over defaults ----
export function getWeek(data: DashboardData, key: string): WeekData {
  return { ...emptyWeek(), ...(data.weeks[key] ?? {}) };
}
export function getQuarter(data: DashboardData, key: string): QuarterData {
  return { ...emptyQuarter(), ...(data.quarters[key] ?? {}) };
}
export function getYear(data: DashboardData, key: string): YearData {
  return { ...emptyYear(), ...(data.years[key] ?? {}) };
}
export function getMonth(data: DashboardData, key: string): MonthData {
  return { ...emptyMonth(), ...(data.months[key] ?? {}) };
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asObject<T>(v: unknown): Record<string, T> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, T>)
    : {};
}

/** Normalize stored data into a complete top-level shape + habit defaults. */
export function normalizeDashboard(data: unknown): DashboardData {
  const d = (data ?? {}) as Partial<DashboardData>;
  const habits = asArray<Partial<Habit>>(d.habits).map((h, i): Habit => ({
    id: h.id ?? `${i}`,
    name: h.name ?? "",
    history: h.history && typeof h.history === "object" ? h.history : {},
    icon: h.icon ?? "✦",
    color: h.color ?? "#d68d84",
    weeklyGoal:
      typeof h.weeklyGoal === "number" && h.weeklyGoal > 0 ? h.weeklyGoal : 7,
    section: h.section === "devotional" ? "devotional" : "daily",
    order: typeof h.order === "number" ? h.order : i,
  }));

  return {
    name: typeof d.name === "string" ? d.name : "",
    tasks: asArray(d.tasks),
    notes: asArray(d.notes),
    links: asArray(d.links),
    habits,
    gymDays: asArray<string>(d.gymDays),
    currentlyReading:
      d.currentlyReading && typeof d.currentlyReading === "object"
        ? (d.currentlyReading as CurrentBook)
        : null,
    weeks: asObject<WeekData>(d.weeks),
    quarters: asObject<QuarterData>(d.quarters),
    years: asObject<YearData>(d.years),
    months: asObject<MonthData>(d.months),
    bucketList: asArray(d.bucketList),
  };
}
