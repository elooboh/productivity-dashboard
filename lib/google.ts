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

// Color palette used to tell each connected account apart in the UI. Assigned
// in connection order and stored per-account so it stays stable.
export const ACCOUNT_COLORS = [
  "#d68d84", // terracotta
  "#9fae8b", // sage
  "#c98b9a", // dusty rose
  "#cda875", // sand
  "#a07d9c", // plum
  "#8aa6a3", // sage blue
  "#a98467", // clay brown
  "#c2756c", // deep terracotta
];

function pickColor(index: number): string {
  return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}

/**
 * One connected Google account. Multiple accounts can be connected at once;
 * each is one row in google_accounts, keyed by its email (account_id).
 */
export interface AccountRecord {
  account_id: string; // stable identity (email, lowercased)
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  expiry: number; // epoch ms
  scope: string;
  token_type: string;
  color: string;
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
    // "select_account" forces Google's account chooser so the user can pick a
    // DIFFERENT account each time (otherwise it silently reuses the signed-in
    // one); "consent" ensures a refresh token is returned every time.
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Decode the claims from a Google id_token (no verification needed — it came
 *  straight from Google's token endpoint over TLS). */
function claimsFromIdToken(idToken?: string): { email: string | null; sub: string | null } {
  if (!idToken) return { email: null, sub: null };
  try {
    const payload = idToken.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const claims = JSON.parse(json) as { email?: string; sub?: string };
    return { email: claims.email ?? null, sub: claims.sub ?? null };
  } catch {
    return { email: null, sub: null };
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
): Promise<AccountRecord> {
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
  const { email, sub } = claimsFromIdToken(data.id_token);
  // Identity key: prefer email (human-readable, what the user recognizes),
  // fall back to the stable Google subject id, then a random id as last resort.
  const account_id = email?.toLowerCase() ?? sub ?? crypto.randomUUID();
  return {
    account_id,
    email,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expiry: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? GOOGLE_SCOPES,
    token_type: data.token_type ?? "Bearer",
    color: pickColor(0), // real color assigned in saveAccount by connection order
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

// ---- Storage (one row per connected account) ----
let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await getSql()`
        CREATE TABLE IF NOT EXISTS google_accounts (
          account_id TEXT PRIMARY KEY,
          email TEXT,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expiry BIGINT NOT NULL,
          scope TEXT,
          token_type TEXT,
          color TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // One-time migration: carry over the previously single connected account
      // from the old google_tokens table so the user stays connected.
      try {
        await getSql()`
          INSERT INTO google_accounts
            (account_id, email, access_token, refresh_token, expiry, scope, token_type, color)
          SELECT
            COALESCE(NULLIF(lower(email), ''), id),
            email, access_token, refresh_token, expiry, scope, token_type, ${ACCOUNT_COLORS[0]}
          FROM google_tokens
          WHERE to_regclass('public.google_tokens') IS NOT NULL
          ON CONFLICT (account_id) DO NOTHING
        `;
      } catch {
        /* old table absent or already migrated — ignore */
      }
    })().catch((err) => {
      ensured = null;
      throw err;
    });
  }
  return ensured;
}

function rowToAccount(r: Record<string, unknown>): AccountRecord {
  return {
    account_id: String(r.account_id),
    email: r.email ? String(r.email) : null,
    access_token: String(r.access_token),
    refresh_token: r.refresh_token ? String(r.refresh_token) : null,
    expiry: Number(r.expiry),
    scope: r.scope ? String(r.scope) : "",
    token_type: r.token_type ? String(r.token_type) : "Bearer",
    color: r.color ? String(r.color) : ACCOUNT_COLORS[0],
  };
}

/** All connected accounts, in the order they were connected. */
export async function listAccounts(): Promise<AccountRecord[]> {
  await ensureTable();
  const rows = (await getSql()`
    SELECT account_id, email, access_token, refresh_token, expiry, scope, token_type, color
    FROM google_accounts ORDER BY created_at ASC
  `) as Record<string, unknown>[];
  return rows.map(rowToAccount);
}

export async function saveAccount(a: AccountRecord): Promise<void> {
  await ensureTable();
  // New accounts get the next color in connection order; existing accounts keep
  // the color already stored (preserved by the ON CONFLICT clause below).
  const count = (
    (await getSql()`SELECT count(*)::int AS n FROM google_accounts`) as { n: number }[]
  )[0].n;
  const color = pickColor(count);
  await getSql()`
    INSERT INTO google_accounts
      (account_id, email, access_token, refresh_token, expiry, scope, token_type, color, updated_at)
    VALUES
      (${a.account_id}, ${a.email}, ${a.access_token}, ${a.refresh_token}, ${a.expiry},
       ${a.scope}, ${a.token_type}, ${color}, now())
    ON CONFLICT (account_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      -- keep the existing refresh token if a new one wasn't returned
      refresh_token = COALESCE(EXCLUDED.refresh_token, google_accounts.refresh_token),
      expiry = EXCLUDED.expiry,
      scope = EXCLUDED.scope,
      token_type = EXCLUDED.token_type,
      email = COALESCE(EXCLUDED.email, google_accounts.email),
      -- color is assigned once, on first connect, and never reshuffled
      updated_at = now()
  `;
}

export async function deleteAccount(accountId: string): Promise<void> {
  await ensureTable();
  const rows = (await getSql()`
    SELECT refresh_token FROM google_accounts WHERE account_id = ${accountId}
  `) as { refresh_token: string | null }[];
  const refresh = rows[0]?.refresh_token;
  // Best-effort revoke at Google so access is fully severed.
  if (refresh) {
    try {
      await fetch(`${REVOKE_URL}?token=${encodeURIComponent(refresh)}`, { method: "POST" });
    } catch {
      /* ignore revoke failures */
    }
  }
  await getSql()`DELETE FROM google_accounts WHERE account_id = ${accountId}`;
}

/**
 * Returns a usable access token for one account, refreshing if expired. Returns
 * null when the refresh token is no longer valid (after deleting that account
 * row, so the UI prompts a reconnect for just that account).
 */
export async function getValidAccessTokenFor(
  account: AccountRecord,
): Promise<string | null> {
  if (Date.now() < account.expiry - 60_000) {
    return account.access_token;
  }
  if (!account.refresh_token) return null;

  try {
    const refreshed = await refreshAccessToken(account.refresh_token);
    const updated: AccountRecord = {
      ...account,
      access_token: refreshed.access_token,
      expiry: Date.now() + refreshed.expires_in * 1000,
      scope: refreshed.scope ?? account.scope,
      token_type: refreshed.token_type ?? account.token_type,
    };
    await saveAccount(updated);
    return updated.access_token;
  } catch {
    // Refresh token revoked/expired — clear so the user can reconnect this one.
    await getSql()`DELETE FROM google_accounts WHERE account_id = ${account.account_id}`;
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
