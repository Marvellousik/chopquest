// Set each cafeteria's manager access code from the KITCHEN_CODES variable (team only, never in git):
//   KITCHEN_CODES="ase-cafe:123456,bush-cafe:654321,munchbox:...,first-cafe:...,second-cafe:..."
// Only a scrypt hash is stored. Runs on every boot; a cafeteria not listed keeps its current code.
//   npm run kitchen:codes                 -> apply KITCHEN_CODES
//   npm run kitchen:codes -- --generate   -> print 5 fresh random codes to paste into KITCHEN_CODES
// Hash format (must match src/lib/server/access-code.ts): "scrypt$<saltHex>$<hashHex>", N=16384, r=8, p=1, 32 bytes.
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { createClient } from "@libsql/client";

const SLUGS = ["ase-cafe", "bush-cafe", "munchbox", "first-cafe", "second-cafe"];

if (process.argv.includes("--generate")) {
  const codes = SLUGS.map((s) => `${s}:${String(randomInt(0, 1_000_000)).padStart(6, "0")}`).join(",");
  console.log(`KITCHEN_CODES="${codes}"`);
  console.log("Put this in .env.local / Railway variables. Give each manager only their own code.");
  process.exit(0);
}

const raw = process.env.KITCHEN_CODES?.trim();
if (!raw) {
  console.log("kitchen codes: KITCHEN_CODES not set, nothing to do.");
  process.exit(0);
}
if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const pairs = raw.split(",").map((p) => p.trim()).filter(Boolean).map((p) => p.split(":").map((s) => s.trim()));
const bad = pairs.filter(([slug, code]) => !SLUGS.includes(slug) || !/^\d{6}$/.test(code ?? ""));
if (bad.length) {
  console.error(`kitchen codes: ignoring ${bad.length} bad entr${bad.length === 1 ? "y" : "ies"} (need "<slug>:<6 digits>", slugs: ${SLUGS.join(", ")}).`);
}
const good = pairs.filter((p) => !bad.includes(p));

const hash = (code: string) => {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(code, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex")}`;
};

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
await db.batch(
  good.map(([slug, code]) => ({
    sql: `INSERT INTO kitchen_profiles (cafeteria_id, access_code_hash)
          SELECT id, ? FROM cafeterias WHERE slug = ?
          ON CONFLICT (cafeteria_id) DO UPDATE SET access_code_hash = excluded.access_code_hash`,
    args: [hash(code), slug],
  })),
  "write",
);
console.log(`kitchen codes: set for ${good.map(([s]) => s).join(", ") || "none"}.`);
