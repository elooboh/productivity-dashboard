// Lightweight single-passcode gate. Enabled only when DASHBOARD_PASSCODE is
// set. The auth cookie holds a SHA-256 hash of the passcode (never the raw
// value); each request recomputes the expected hash and compares. Uses Web
// Crypto so it runs in both the Edge middleware and Node route handlers.

export const AUTH_COOKIE = "dash_auth";

export function gateEnabled(): boolean {
  return !!process.env.DASHBOARD_PASSCODE;
}

export async function computeToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`dashboard:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedToken(): Promise<string | null> {
  const pc = process.env.DASHBOARD_PASSCODE;
  if (!pc) return null;
  return computeToken(pc);
}

/** Only allow same-origin relative redirects (block //evil.com and absolute). */
export function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}
