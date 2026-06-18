import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, isConfigured, redirectUriFor } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Google integration is not configured on the server." },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const url = buildAuthUrl(redirectUriFor(req), state);

  const res = NextResponse.redirect(url);
  // Short-lived CSRF token, verified in the callback.
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: req.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
