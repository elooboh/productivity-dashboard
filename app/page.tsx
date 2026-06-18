import Dashboard from "@/components/Dashboard";
import { getDashboard } from "@/lib/db";
import { emptyDashboard } from "@/lib/types";
import { gateEnabled } from "@/lib/auth";

// Load fresh data on every request so the dashboard always reflects the DB.
export const dynamic = "force-dynamic";

export default async function Page() {
  let initial = emptyDashboard;
  try {
    initial = await getDashboard();
  } catch (err) {
    // Render an empty dashboard if the DB is unreachable; the client will
    // surface save errors on the first edit.
    console.error("Failed to load initial dashboard:", err);
  }

  return <Dashboard initial={initial} locked={gateEnabled()} />;
}
