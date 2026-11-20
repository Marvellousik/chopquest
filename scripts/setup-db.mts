// Create all tables in Turso (or a local file: DB) from db/schema.sql.
//   npm run db:setup
// Safe to re-run: every statement is CREATE ... IF NOT EXISTS.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Put it in .env.local.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const schema = readFileSync(fileURLToPath(new URL("../db/schema.sql", import.meta.url)), "utf8");
await db.executeMultiple(schema);
const rs = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
console.log(`Schema applied. Tables: ${rs.rows.map((r) => r[0]).join(", ")}`);
