export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export interface Habit {
  id: string;
  name: string;
  /** Map of ISO date (YYYY-MM-DD) -> completed. */
  history: Record<string, boolean>;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
}

/**
 * The single flexible JSON object persisted per dashboard.
 * Add new top-level keys here as the dashboard grows — the storage layer
 * stores whatever shape it is given, so new widgets need no schema migration.
 */
export interface DashboardData {
  /** Display name used in the "Hey [name] ✦" greeting. */
  name: string;
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  links: QuickLink[];
}

export const emptyDashboard: DashboardData = {
  name: "",
  tasks: [],
  notes: [],
  habits: [],
  links: [],
};

/** Merge stored data over defaults so older/partial blobs always have every key. */
export function normalizeDashboard(data: unknown): DashboardData {
  const d = (data ?? {}) as Partial<DashboardData>;
  return {
    name: typeof d.name === "string" ? d.name : "",
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    notes: Array.isArray(d.notes) ? d.notes : [],
    habits: Array.isArray(d.habits) ? d.habits : [],
    links: Array.isArray(d.links) ? d.links : [],
  };
}
