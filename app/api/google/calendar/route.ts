import { NextRequest, NextResponse } from "next/server";
import { fetchEvents, getTokens, getValidAccessToken, isConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ connected: false, configured: false });
  }

  let token: string | null = null;
  try {
    token = await getValidAccessToken();
  } catch (err) {
    console.error("Token retrieval failed:", err);
    return NextResponse.json({ connected: false, configured: true });
  }
  if (!token) {
    return NextResponse.json({ connected: false, configured: true });
  }

  const timeMin = req.nextUrl.searchParams.get("timeMin");
  const timeMax = req.nextUrl.searchParams.get("timeMax");
  const email = (await getTokens())?.email ?? null;

  if (!timeMin || !timeMax) {
    return NextResponse.json({ connected: true, email, events: [] });
  }

  try {
    const events = await fetchEvents(token, timeMin, timeMax);
    return NextResponse.json({ connected: true, email, events });
  } catch (err) {
    console.error("Calendar fetch failed:", err);
    return NextResponse.json(
      { connected: true, email, events: [], error: "fetch_failed" },
      { status: 502 },
    );
  }
}
