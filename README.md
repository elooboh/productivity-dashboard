# Productivity Dashboard

A personal productivity dashboard built with **Next.js 14 (App Router)** and
**Neon Postgres**, deployable to **Vercel**. Includes tasks, notes, a habit
tracker, and quick links — all stored as a single flexible JSON object and
auto-saved as you type.

## How it works

- All dashboard state lives in one JSON object (see `DashboardData` in
  [`lib/types.ts`](lib/types.ts)) persisted to a single row in a `dashboards`
  table (`lib/db.ts`). Adding a new widget just means adding a key — no schema
  migration.
- The page is a server component that loads the JSON on each request and hands
  it to a client `Dashboard` component.
- Edits update local state; [`lib/useAutoSave.ts`](lib/useAutoSave.ts) debounces
  and `PUT`s the whole object to `/api/dashboard` ~0.8s after you stop typing.
  The header shows live save status.
- **No authentication** — this is a single, public global dashboard. Anyone with
  the URL can view and edit it. To make it multi-user later, swap the fixed
  `DASHBOARD_ID` in `lib/db.ts` for a per-user id and add auth.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Neon database at <https://neon.tech> and copy the **pooled**
   connection string.
3. Create `.env.local` (see `.env.example`):
   ```
   DATABASE_URL="postgresql://...-pooler...neon.tech/...?sslmode=require"
   ```
4. Run it:
   ```bash
   npm run dev
   ```
   The `dashboards` table is created automatically on first request.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Easiest path: add the **Neon** integration from the Vercel Marketplace —
   it provisions a database and sets `DATABASE_URL` for you. Otherwise add
   `DATABASE_URL` manually under **Project Settings → Environment Variables**.
4. Deploy. The table is created on the first request.

## Google Calendar integration

Connects your Google Calendar so this week's events appear in the Week tab's
"Events This Week" card.

- **Tokens are stored server-side only** in a `google_tokens` table and are
  never included in the dashboard JSON sent to the browser.
- Access tokens **auto-refresh** via the stored refresh token, so you stay
  connected.
- The OAuth **redirect URI is derived from the request origin**, so the same
  build works locally and on Vercel — you just register both URLs in Google.

⚠️ **Privacy:** this dashboard has no login. Once connected, anyone with the
URL can view your events or disconnect. Add a passcode gate before exposing a
real calendar publicly.

### Environment variables
```
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

### Redirect URIs to register (must match EXACTLY)
```
http://localhost:3000/api/google/callback
https://YOUR-APP.vercel.app/api/google/callback
```

See the in-app conversation / commit notes for the full step-by-step Google
Cloud Console walkthrough.

## Project structure

```
app/
  api/dashboard/route.ts   GET + PUT the dashboard JSON
  page.tsx                 Server component: loads initial data
  layout.tsx, globals.css
components/
  Dashboard.tsx            Client: holds state + wires auto-save
  Card.tsx, SaveStatus.tsx
  widgets/                 Tasks, Notes, Habits, Links
lib/
  db.ts                    Neon access + lazy table creation
  types.ts                 DashboardData shape + normalization
  useAutoSave.ts           Debounced save hook
```
