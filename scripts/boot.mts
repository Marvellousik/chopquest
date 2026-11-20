// Runs before `npm start` (as "prestart"): create/upgrade the tables and load foods + cafeterias.
// Safe on every boot (all steps are idempotent). Skips quietly when no database is configured,
// so `npm start` still works locally without one.
import { execFileSync } from "node:child_process";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* no .env.local: env comes from the host (Railway, Vercel...) */
}

if (!process.env.TURSO_DATABASE_URL) {
  console.log("boot: TURSO_DATABASE_URL not set, skipping database setup.");
  process.exit(0);
}

for (const script of ["scripts/setup-db.mts", "scripts/seed.mts", "scripts/seed-cafeterias.mts"]) {
  console.log(`boot: ${script}`);
  execFileSync(process.execPath, [script], { stdio: "inherit", env: process.env });
}
console.log("boot: database ready.");
