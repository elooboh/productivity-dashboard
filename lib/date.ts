// Date helpers. All period keys are stable strings so they key cleanly into
// the single JSON object and stay comparable across reloads.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-time ISO day, YYYY-MM-DD. */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: string): Date {
  return new Date(s + "T00:00:00");
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday as the first day of the week (matches the design reference). */
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0, ...
  x.setDate(x.getDate() - offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function weekKey(d: Date): string {
  return toISO(startOfWeek(d));
}

export function addWeeksToKey(key: string, n: number): string {
  return toISO(addDays(fromISO(key), n * 7));
}

/** The 7 ISO dates of the week beginning at `weekStartISO`, Mon→Sun. */
export function weekDates(weekStartISO: string): string[] {
  const start = fromISO(weekStartISO);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
}

export function formatWeekLabel(weekStartISO: string): string {
  const start = fromISO(weekStartISO);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// ---- Quarter ----
export function quarterKey(d: Date): string {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

export function parseQuarter(key: string): { year: number; q: number } {
  const [y, q] = key.split("-Q");
  return { year: Number(y), q: Number(q) };
}

export function addQuarterToKey(key: string, n: number): string {
  const { year, q } = parseQuarter(key);
  const total = (year * 4 + (q - 1)) + n;
  const ny = Math.floor(total / 4);
  const nq = (total % 4) + 1;
  return `${ny}-Q${nq}`;
}

export function formatQuarterLabel(key: string): string {
  const { year, q } = parseQuarter(key);
  return `Q${q} ${year}`;
}

// ---- Month ----
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function addMonthToKey(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Calendar grid (Mon→Sun rows) for a month key; null = padding cell. */
export function monthCalendar(key: string): (string | null)[] {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-based leading blanks
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(y, m - 1, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ---- Year ----
export function yearKey(d: Date): string {
  return String(d.getFullYear());
}

export function addYearToKey(key: string, n: number): string {
  return String(Number(key) + n);
}
