import { getSql } from "@/lib/db";

type InItem = { raw_label?: unknown; food_id?: unknown; estimated_grams?: unknown; corrected?: unknown };

// POST /api/scans { user_id, dish_name, items: [{ raw_label, food_id, estimated_grams, corrected }] }
//   -> { scan_id, total_protein_g }
// Saves the meal after the user confirmed / fixed the list. protein_g is computed server-side from foods.
export async function POST(req: Request) {
  let body: { user_id?: unknown; dish_name?: unknown; items?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const userId = Number(body.user_id);
  if (!Number.isInteger(userId) || userId <= 0) return Response.json({ error: "Missing user." }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20)
    return Response.json({ error: "Add at least one food." }, { status: 400 });

  const items = (body.items as InItem[]).map((i) => {
    const fid = Number(i.food_id);
    const g = Number(i.estimated_grams);
    return {
      raw_label: typeof i.raw_label === "string" && i.raw_label.trim() ? i.raw_label.trim().slice(0, 80) : null,
      food_id: Number.isInteger(fid) && fid > 0 ? fid : null,
      grams: Number.isFinite(g) ? Math.min(2000, Math.max(0, Math.round(g))) : 0,
      corrected: i.corrected === true,
    };
  });
  const dishName = typeof body.dish_name === "string" ? body.dish_name.trim().slice(0, 100) || null : null;

  try {
    const sql = getSql();
    const user = await sql`SELECT 1 FROM users WHERE id = ${userId}`;
    if (!user.length) return Response.json({ error: "Profile not found. Please sign up again." }, { status: 404 });

    const ids = [...new Set(items.map((i) => i.food_id).filter((x): x is number => x !== null))];
    const foods = ids.length
      ? ((await sql`SELECT id, protein_g_per_100g::float AS p FROM foods WHERE id = ANY(${ids})`) as { id: number; p: number }[])
      : [];
    const per100 = new Map(foods.map((f) => [f.id, f.p]));

    const rows = items.map((i) => {
      const p = i.food_id !== null ? per100.get(i.food_id) : undefined;
      return {
        ...i,
        food_id: p === undefined ? null : i.food_id, // drop ids that don't exist
        protein_g: p === undefined ? null : Math.round(((i.grams * p) / 100) * 10) / 10,
      };
    });
    const total = Math.round(rows.reduce((s, r) => s + (r.protein_g ?? 0), 0) * 10) / 10;

    // Neon HTTP has no interactive transactions, so insert the scan and all items in one statement.
    const result = (await sql`
      WITH s AS (
        INSERT INTO scans (user_id, dish_name, total_protein_g) VALUES (${userId}, ${dishName}, ${total})
        RETURNING id
      ), i AS (
        INSERT INTO scan_items (scan_id, food_id, raw_label, estimated_grams, protein_g, corrected)
        SELECT s.id, x.food_id, x.raw_label, x.estimated_grams, x.protein_g, x.corrected
        FROM s, jsonb_to_recordset(${JSON.stringify(rows.map((r) => ({
          food_id: r.food_id, raw_label: r.raw_label, estimated_grams: r.grams, protein_g: r.protein_g, corrected: r.corrected,
        })))}::jsonb) AS x(food_id int, raw_label text, estimated_grams numeric, protein_g numeric, corrected boolean)
        RETURNING 1
      )
      SELECT id FROM s
    `) as { id: number }[];

    return Response.json({ scan_id: result[0].id, total_protein_g: total }, { status: 201 });
  } catch (e) {
    console.error("save scan failed", e);
    return Response.json({ error: "Couldn't save your meal. Try again." }, { status: 500 });
  }
}
