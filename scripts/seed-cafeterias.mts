// Load the 9 campus cafeterias and their menus (from Jason's team/market-survey/cafeteria-menus.csv).
//   npm run seed:cafeterias            -> upserts into Turso (needs TURSO_DATABASE_URL in .env.local)
//   npm run seed:cafeterias -- --dry   -> parses and prints only
// Safe to re-run: cafeterias match on slug, menu items on (cafeteria, dish name). Saved AI breakdowns are kept.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const CAFETERIAS = [
  { slug: "ase-cafe", name: "Ase Cafe" },
  { slug: "bush-cafe", name: "Bush Cafe" },
  { slug: "munchbox", name: "Munchbox" },
  { slug: "first-cafe", name: "First Cafe" },
  { slug: "second-cafe", name: "Second Cafe" },
  { slug: "third-cafe", name: "Third Cafe" },
  { slug: "ggs", name: "GG's" },
  { slug: "machana", name: "Machana Cafe" },
  { slug: "mac-d", name: "Mac D" },
];
const slugOf = (name: string) => CAFETERIAS.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())?.slug;

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
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

type Item = { slug: string; name: string; price: number; topSeller: boolean };
const items: Item[] = [];
const skipped: string[] = [];
let unpriced = 0; // dishes on a menu board with no price: kept in the CSV, not loaded (price_ngn is required)
const csvPath = fileURLToPath(new URL("../team/market-survey/cafeteria-menus.csv", import.meta.url));
if (existsSync(csvPath)) {
  const [head, ...data] = parseCsv(readFileSync(csvPath, "utf8"));
  const col = (n: string) => head.indexOf(n);
  for (const r of data) {
    const cafe = r[col("cafeteria")] ?? "";
    const name = (r[col("dish_name")] ?? "").trim();
    const priceText = (r[col("price_ngn")] ?? "").replace(/[₦,\s]/g, "");
    if (!name && !priceText) continue; // template row still empty
    const slug = slugOf(cafe);
    const price = Number(priceText);
    if (slug && name && !priceText) { unpriced++; continue; }
    if (!slug || !name || !Number.isFinite(price) || price <= 0) {
      skipped.push(`${cafe} / ${name || "(no name)"} / ${priceText || "(no price)"}`);
      continue;
    }
    const rank = Number(r[col("top_seller_rank")]);
    items.push({ slug, name: name.slice(0, 80), price, topSeller: Number.isFinite(rank) && rank > 0 && rank <= 5 });
  }
} else {
  console.warn("No team/market-survey/cafeteria-menus.csv yet: loading cafeterias only.");
}

if (process.argv.includes("--dry")) {
  console.table(items);
  console.log(`${CAFETERIAS.length} cafeterias, ${items.length} menu items parsed, ${unpriced} without a price (dry run).`);
  if (skipped.length) console.log("Skipped rows (fix in the CSV):", skipped);
  process.exit(0);
}

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set. Put it in .env.local.");
  process.exit(1);
}
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });

await db.batch(
  CAFETERIAS.map((c) => ({
    sql: "INSERT INTO cafeterias (slug, name) VALUES (?, ?) ON CONFLICT (slug) DO UPDATE SET name = excluded.name",
    args: [c.slug, c.name],
  })),
  "write",
);
if (items.length) {
  await db.batch(
    items.map((i) => ({
      sql: `INSERT INTO menu_items (cafeteria_id, name, price_ngn, is_top_seller)
            VALUES ((SELECT id FROM cafeterias WHERE slug = ?), ?, ?, ?)
            ON CONFLICT (cafeteria_id, name) DO UPDATE SET price_ngn = excluded.price_ngn, is_top_seller = excluded.is_top_seller`,
      args: [i.slug, i.name, i.price, i.topSeller ? 1 : 0],
    })),
    "write",
  );
}
console.log(`Seeded ${CAFETERIAS.length} cafeterias and ${items.length} menu items (${unpriced} listed without a price, not loaded).`);
if (skipped.length) console.log("Skipped rows (fix in the CSV):", skipped);
