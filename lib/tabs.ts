import { DashboardData } from "./types";

export type TabId =
  | "week"
  | "month"
  | "quarter"
  | "habits"
  | "year"
  | "bucket";

export interface TabDef {
  id: TabId;
  label: string;
}

// Order matches the navigation bar, left to right.
export const TABS: TabDef[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "habits", label: "Habits" },
  { id: "year", label: "Year" },
  { id: "bucket", label: "Bucket List" },
];

export const DEFAULT_TAB: TabId = "week";

export function isTabId(value: string): value is TabId {
  return TABS.some((t) => t.id === value);
}

/**
 * Shared props every tab receives. Tabs read whatever slice of the single
 * flexible dashboard object they need and call `update` to persist changes —
 * all changes flow through the same auto-saved JSON, so adding a tab never
 * touches another tab's data.
 */
export interface TabProps {
  data: DashboardData;
  update: <K extends keyof DashboardData>(
    key: K,
    value: DashboardData[K],
  ) => void;
}
