import { NextResponse } from "next/server";
import { getDashboard, saveDashboard } from "@/lib/db";
import { normalizeDashboard } from "@/lib/types";

// Always hit the database; never serve a cached snapshot of the dashboard.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboard();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/dashboard failed:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = normalizeDashboard(body);
    await saveDashboard(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/dashboard failed:", err);
    return NextResponse.json(
      { error: "Failed to save dashboard" },
      { status: 500 },
    );
  }
}
