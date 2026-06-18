import { NextRequest } from "next/server";
import { getSql } from "./sql";

// ---------------------------------------------------------------------------
// Google OAuth + Calendar helpers. Tokens live ONLY in the google_tokens table
// (server-side) and are never sent to the browser.
// ---------------------------------------------------------------------------

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

// Single-user dashboard → a single token row.
const TOKEN_ID = "default";

export interface TokenRecord {
  access_token: string;
  refresh_token: string | null;
  expiry: number; // epoch ms
  scope: string;
  token_type: string;
  email: string | null;
}

function clientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CLIENT_ID is not set");
  return v;
}
function clientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return v;
}

export function isConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Public origin of the current request (works on localhost and Vercel). */
export function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Stable public base URL for OAuth. The redirect URI MUST be identical across
 * deploys (or Google throws redirect_uri_mismatch), so we never use the
 * per-deployment host here. Priority:
 *   1. OAUTH_BASE_URL — explicit override (set this for a custom domain)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain,
 *      unchanged between deployments (unlike VERCEL_URL)
 *   3. the request origin — local dev fallback (localhost)
 */
export function publicBaseUrl(req: NextRequest): string {
  const override = process.env.OAUTH_BASE_URL;
  if (override) return override.replace(/\/+$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return getBaseUrl(req);
}

export function redirectUriFor(req: NextRequest): string {
  return `${publicBaseUrl(req)}/api/google/callback`;
}

export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline", // request a refresh token
    prompt: "consent", // ensure a refresh token is returned every time
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Decode the email claim from a Google id_token (no verification needed —
 *  it came straight from Google's token endpoint over TLS). */
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return (JSON.parse(json).email as string) ?? null;
  } catch {
    return null;
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<TokenRecord> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as GoogleTokenResponse;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expiry: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? GOOGLE_SCOPES,
    token_type: data.token_type ?? "Bearer",
    email: emailFromIdToken(data.id_token),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

// ---- Storage ----
let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await getSql()`
        CREATE TABLE IF NOT EXISTS google_tokens (
          id TEXT PRIMARY KEY,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expiry BIGINT NOT NULL,
          scope TEXT,
          token_type TEXT,
          email TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

export async function getTokens(): Promise<TokenRecord | null> {
  await ensureTable();
  const rows = (await getSql()`
    SELECT access_token, refresh_token, expiry, scope, token_type, email
    FROM google_tokens WHERE id = ${TOKEN_ID}
  `) as Record<string, unknown>[];
  const r = rows[0];
  if (!r) return null;
  return {
    access_token: String(r.access_token),
    refresh_token: r.refresh_token ? String(r.refresh_token) : null,
    expiry: Number(r.expiry),
    scope: r.scope ? String(r.scope) : "",
    token_type: r.token_type ? String(r.token_type) : "Bearer",
    email: r.email ? String(r.email) : null,
  };
}

export async function saveTokens(t: TokenRecord): Promise<void> {
  await ensureTable();
  await getSql()`
    INSERT INTO google_tokens
      (id, access_token, refresh_token, expiry, scope, token_type, email, updated_at)
    VALUES
      (${TOKEN_ID}, ${t.access_token}, ${t.refresh_token}, ${t.expiry},
       ${t.scope}, ${t.token_type}, ${t.email}, now())
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      -- keep the existing refresh token if a new one wasn't returned
      refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
      expiry = EXCLUDED.expiry,
      scope = EXCLUDED.scope,
      token_type = EXCLUDED.token_type,
      email = COALESCE(EXCLUDED.email, google_tokens.email),
      updated_at = now()
  `;
}

export async function deleteTokens(): Promise<void> {
  await ensureTable();
  const existing = await getTokens();
  // Best-effort revoke at Google so access is fully severed.
  if (existing?.refresh_token) {
    try {
      await fetch(`${REVOKE_URL}?token=${encodeURIComponent(existing.refresh_token)}`, {
        method: "POST",
      });
    } catch {
      /* ignore revoke failures */
    }
  }
  await getSql()`DELETE FROM google_tokens WHERE id = ${TOKEN_ID}`;
}

/**
 * Returns a usable access token, refreshing if expired. Returns null when not
 * connected or when the refresh token is no longer valid (after clearing it,
 * so the UI prompts a reconnect).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  if (Date.now() < tokens.expiry - 60_000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) return null;

  try {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    const updated: TokenRecord = {
      ...tokens,
      access_token: refreshed.access_token,
      expiry: Date.now() + refreshed.expires_in * 1000,
      scope: refreshed.scope ?? tokens.scope,
      token_type: refreshed.token_type ?? tokens.token_type,
    };
    await saveTokens(updated);
    return updated.access_token;
  } catch {
    // Refresh token revoked/expired — clear so the user can reconnect.
    await getSql()`DELETE FROM google_tokens WHERE id = ${TOKEN_ID}`;
    return null;
  }
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // RFC3339 dateTime or YYYY-MM-DD (all-day)
  end: string;
  allDay: boolean;
}

export async function fetchEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const res = await fetch(`${EVENTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Calendar fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    items?: {
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }[];
  };
  return (data.items ?? []).map((e) => {
    const allDay = !e.start?.dateTime;
    return {
      id: e.id,
      summary: e.summary ?? "(no title)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      allDay,
    };
  });
}
