import { DashboardData, normalizeDashboard } from "./types";
import { getSql } from "./sql";

/**
 * With no auth this is a single global dashboard, so all data lives in one row.
 * The schema is still "one flexible JSON object per user" — there is just one
 * user. Add real ids here if auth is introduced later.
 */
const DASHBOARD_ID = "default";

let ensured: Promise<void> | null = null;

/** Create the table on first use (idempotent, runs once per server instance). */
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await getSql()`
        CREATE TABLE IF NOT EXISTS dashboards (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      // Reset so a transient failure doesn't permanently poison the cache.
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

export async function getDashboard(): Promise<DashboardData> {
  await ensureTable();
  const rows = (await getSql()`
    SELECT data FROM dashboards WHERE id = ${DASHBOARD_ID}
  `) as { data: unknown }[];
  return normalizeDashboard(rows[0]?.data);
}

export async function saveDashboard(data: DashboardData): Promise<void> {
  await ensureTable();
  await getSql()`
    INSERT INTO dashboards (id, data, updated_at)
    VALUES (${DASHBOARD_ID}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
  `;
}
