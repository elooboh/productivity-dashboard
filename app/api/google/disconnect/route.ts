import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let accountId: string | undefined;
  try {
    accountId = (await req.json())?.accountId;
  } catch {
    /* no/invalid body */
  }
  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }
  try {
    await deleteAccount(accountId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Disconnect failed:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
