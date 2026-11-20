// Create all tables in Turso (or a local file: DB): db/schema.sql, then every numbered
// migration in db/ (002_..., 003_...) in order.
//   npm run db:setup
// Safe to re-run: every statement is CREATE ... IF NOT EXISTS.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Put it in .env.local.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const dir = fileURLToPath(new URL("../db/", import.meta.url));
const files = ["schema.sql", ...readdirSync(dir).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()];
for (const f of files) {
  await db.executeMultiple(readFileSync(dir + f, "utf8"));
  console.log(`applied ${f}`);
}
const rs = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
console.log(`Schema applied. Tables: ${rs.rows.map((r) => r[0]).join(", ")}`);
