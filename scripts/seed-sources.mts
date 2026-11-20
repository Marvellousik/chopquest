// Load data/protein_sources.csv (where to buy each alternative protein) into protein_sources.
//   npm run seed:sources            -> upserts (safe to re-run after Jason confirms places)
//   npm run seed:sources -- --dry   -> parses and prints only
// Rows match on (food, area, place_name). A row's status must be "confirmed" or "likely".
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; if (row.some((f) => f.trim())) rows.push(row); row = []; }
    else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  const [head, ...data] = rows;
  return data.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const rows = parseCsv(readFileSync(fileURLToPath(new URL("../data/protein_sources.csv", import.meta.url)), "utf8"));
const num = (s: string) => (s && Number.isFinite(Number(s.replace(/[₦,\s]/g, ""))) ? Number(s.replace(/[₦,\s]/g, "")) : null);
const bad = rows.filter((r) => !r.food || !r.area || !r.place_name || !["confirmed", "likely"].includes(r.status));
if (bad.length) {
  console.error("Fix these rows in data/protein_sources.csv (need food, area, place_name, status confirmed|likely):", bad);
  process.exit(1);
}
if (process.argv.includes("--dry")) {
  console.table(rows.map(({ food, area, place_name, status }) => ({ food, area, place_name, status })));
  process.exit(0);
}
if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set. Put it in .env.local.");
  process.exit(1);
}
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const foods = new Map((await db.execute("SELECT id, food FROM foods")).rows.map((r) => [String(r[1]), Number(r[0])]));
const unknown = rows.filter((r) => !foods.has(r.food)).map((r) => r.food);
if (unknown.length) console.warn("Skipping rows for foods not in the foods table:", [...new Set(unknown)]);

await db.batch(
  rows
    .filter((r) => foods.has(r.food))
    .map((r) => ({
      sql: `INSERT INTO protein_sources (food_id, area, place_type, place_name, landmark, what_to_ask_for, unit, price_ngn, unit_weight_g, contact, how_to_buy, status, source, last_checked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (food_id, area, place_name) DO UPDATE SET place_type = excluded.place_type, landmark = excluded.landmark,
              what_to_ask_for = excluded.what_to_ask_for, unit = excluded.unit, price_ngn = excluded.price_ngn,
              unit_weight_g = excluded.unit_weight_g, contact = excluded.contact, how_to_buy = excluded.how_to_buy,
              status = excluded.status, source = excluded.source, last_checked = excluded.last_checked`,
      args: [
        foods.get(r.food)!, r.area, r.place_type || null, r.place_name, r.landmark || null, r.what_to_ask_for || null, r.unit || null,
        num(r.price_ngn), num(r.unit_weight_g), r.contact || null, r.how_to_buy || null, r.status, r.source || null, r.last_checked || null,
      ],
    })),
  "write",
);
const confirmed = rows.filter((r) => r.status === "confirmed").length;
console.log(`Seeded ${rows.length} where-to-buy rows (${confirmed} confirmed, ${rows.length - confirmed} likely).`);
