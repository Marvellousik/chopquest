// Seed / refresh the `foods` table from data/protein_db.csv.
//   npm run seed            -> upserts rows into Turso (needs TURSO_DATABASE_URL in .env.local)
//   npm run seed -- --dry   -> just parses and prints the rows
// Safe to re-run: rows are matched on `food`, so scan_items keep pointing at the same ids
// and new prices from the market survey simply overwrite the old ones.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const csvPath = fileURLToPath(new URL("../data/protein_db.csv", import.meta.url));

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const [header, ...data] = parseCsv(readFileSync(csvPath, "utf8"));
const col = (name: string) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`CSV is missing column "${name}"`);
  return i;
};
const C = {
  food: col("food"), local_name: col("local_name"), dex_group: col("dex_group"), type: col("type"),
  protein: col("protein_g_per_100g"), basis: col("basis"), amino_note: col("amino_note"),
  pet_trait: col("pet_trait"), price: col("price_ngn_per_kg"), source: col("source"),
};
const blank = (s: string | undefined) => (s && s.trim() !== "" ? s.trim() : null);
const num = (s: string | undefined) => {
  const v = blank(s);
  if (v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Not a number: "${v}"`);
  return n;
};

const foods = data.map((r) => ({
  food: blank(r[C.food])!,
  local_name: blank(r[C.local_name]),
  dex_group: blank(r[C.dex_group])!,
  type: blank(r[C.type])!,
  protein_g_per_100g: num(r[C.protein])!,
  basis: blank(r[C.basis]),
  amino_note: blank(r[C.amino_note]),
  pet_trait: blank(r[C.pet_trait]),
  price_ngn_per_kg: num(r[C.price]),
  source: blank(r[C.source]),
}));
for (const f of foods) {
  if (!f.food || !f.dex_group || !f.type || f.protein_g_per_100g === null)
    throw new Error(`Incomplete row: ${JSON.stringify(f)}`);
}

if (process.argv.includes("--dry")) {
  console.table(foods.map(({ food, local_name, dex_group, type, protein_g_per_100g, price_ngn_per_kg }) =>
    ({ food, local_name, dex_group, type, protein_g_per_100g, price_ngn_per_kg })));
  console.log(`${foods.length} foods parsed (dry run, nothing written).`);
  process.exit(0);
}

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set. Put it in .env.local.");
  process.exit(1);
}
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const before = Number((await db.execute("SELECT count(*) FROM foods")).rows[0][0]);
// One round trip: upsert every row on the unique `food` column, keeping existing ids.
await db.batch(
  foods.map((f) => ({
    sql: `INSERT INTO foods (food, local_name, dex_group, type, protein_g_per_100g, basis, amino_note, pet_trait, price_ngn_per_kg, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (food) DO UPDATE SET local_name = excluded.local_name, dex_group = excluded.dex_group,
            type = excluded.type, protein_g_per_100g = excluded.protein_g_per_100g, basis = excluded.basis,
            amino_note = excluded.amino_note, pet_trait = excluded.pet_trait,
            price_ngn_per_kg = excluded.price_ngn_per_kg, source = excluded.source`,
    args: [f.food, f.local_name, f.dex_group, f.type, f.protein_g_per_100g, f.basis, f.amino_note, f.pet_trait, f.price_ngn_per_kg, f.source],
  })),
  "write",
);
const after = Number((await db.execute("SELECT count(*) FROM foods")).rows[0][0]);
console.log(`Seeded foods: ${after - before} inserted, ${foods.length - (after - before)} updated.`);
