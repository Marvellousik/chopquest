import { createClient, type Client, type InArgs, type ResultSet } from "@libsql/client";

// Turso (libSQL). TURSO_DATABASE_URL is either a Turso Cloud URL (libsql://<db>-<org>.turso.io,
// needs TURSO_AUTH_TOKEN) or a local file for offline dev (file:local.db, no token).
let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set. Copy .env.example to .env.local.");
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  return client;
}

/** libSQL rows are array-like; turn them into plain objects keyed by column name. */
export function toObjects<T>(rs: ResultSet): T[] {
  return rs.rows.map((r) => {
    const o: Record<string, unknown> = {};
    rs.columns.forEach((c, i) => (o[c] = r[i]));
    return o as T;
  });
}

/** Run one statement and return its rows as plain objects. */
export async function query<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T[]> {
  return toObjects<T>(await getDb().execute({ sql, args }));
}

/** "?, ?, ?" for an IN (...) list. */
export const placeholders = (n: number) => Array(n).fill("?").join(", ");

/** True for a UNIQUE / PRIMARY KEY violation. */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; extendedCode?: string; message?: string };
  return (
    err?.extendedCode === "SQLITE_CONSTRAINT_UNIQUE" ||
    err?.extendedCode === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    /UNIQUE constraint failed/i.test(err?.message ?? "")
  );
}
