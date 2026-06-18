import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, publicBaseUrl, redirectUriFor, saveTokens } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = publicBaseUrl(req);
  const back = (status: string) =>
    NextResponse.redirect(`${base}/?gcal=${status}#week`);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const savedState = req.cookies.get("g_oauth_state")?.value;

  if (error) return back("denied");

  // CSRF: the state echoed back must match the cookie we set.
  if (!code || !state || !savedState || state !== savedState) {
    return back("error");
  }

  try {
    const tokens = await exchangeCode(code, redirectUriFor(req));
    await saveTokens(tokens);
    const res = back("connected");
    res.cookies.delete("g_oauth_state");
    return res;
  } catch (err) {
    console.error("Google callback failed:", err);
    return back("error");
  }
}
