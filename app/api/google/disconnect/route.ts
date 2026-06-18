import { NextResponse } from "next/server";
import { deleteTokens } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await deleteTokens();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Disconnect failed:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
