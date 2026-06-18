import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Lazily created on first query so importing this module never requires
// DATABASE_URL (e.g. during `next build` page-data collection).
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set — set it in .env.local or your Vercel project.",
      );
    }
    _sql = neon(url);
  }
  return _sql;
}
