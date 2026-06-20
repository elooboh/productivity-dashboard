import { NextRequest, NextResponse } from "next/server";
import {
  fetchEvents,
  getValidAccessTokenFor,
  isConfigured,
  listAccounts,
} from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ connected: false, configured: false, accounts: [], events: [] });
  }

  let accounts;
  try {
    accounts = await listAccounts();
  } catch (err) {
    console.error("Account list failed:", err);
    return NextResponse.json({ connected: false, configured: true, accounts: [], events: [] });
  }

  if (accounts.length === 0) {
    return NextResponse.json({ connected: false, configured: true, accounts: [], events: [] });
  }

  const timeMin = req.nextUrl.searchParams.get("timeMin");
  const timeMax = req.nextUrl.searchParams.get("timeMax");

  interface MergedEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    allDay: boolean;
    accountId: string;
    accountEmail: string | null;
    color: string;
  }
  interface AccountResult {
    id: string;
    email: string | null;
    color: string;
    reauth?: boolean;
    error?: boolean;
    events: MergedEvent[];
  }

  // Fetch every account's events in parallel. A failure in one account never
  // blocks the others — it's surfaced per-account so the UI can flag just that.
  const results: AccountResult[] = await Promise.all(
    accounts.map(async (a): Promise<AccountResult> => {
      const meta = { id: a.account_id, email: a.email, color: a.color };
      if (!timeMin || !timeMax) return { ...meta, events: [] };
      try {
        const token = await getValidAccessTokenFor(a);
        if (!token) return { ...meta, reauth: true, events: [] };
        const events = await fetchEvents(token, timeMin, timeMax);
        return {
          ...meta,
          events: events.map((e) => ({
            ...e,
            accountId: a.account_id,
            accountEmail: a.email,
            color: a.color,
          })),
        };
      } catch (err) {
        console.error(`Calendar fetch failed for ${a.email}:`, err);
        return { ...meta, error: true, events: [] };
      }
    }),
  );

  const events = results
    .flatMap((r) => r.events)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const accountStatuses = results.map(({ id, email, color, reauth, error }) => ({
    id,
    email,
    color,
    ...(reauth ? { reauth: true } : {}),
    ...(error ? { error: true } : {}),
  }));

  return NextResponse.json({
    connected: true,
    configured: true,
    accounts: accountStatuses,
    events,
  });
}
