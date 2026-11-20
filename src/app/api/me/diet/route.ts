import { connection } from "next/server";
import { query } from "@/lib/db";
import { buildDiet, type DietMeal, type FoodType } from "@/lib/diet";
import { currentUser } from "@/lib/server/user-session";

// GET /api/me/diet -> { user, meals (newest first, up to 300), diet } for the signed-in student only.
// Meal records are personal, so this reads the sign-in cookie, never a user id from the request.
export async function GET() {
  await connection();
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Sign in on the home screen first." }, { status: 401 });
    const rows = await query<{
      id: number; at: string; dish: string | null; total: number | null;
      label: string | null; grams: number | null; protein: number | null; food: string | null; local: string | null; grp: string | null; type: FoodType | null;
    }>(
      `SELECT s.id, s.created_at AS at, s.dish_name AS dish, s.total_protein_g AS total,
              i.raw_label AS label, i.estimated_grams AS grams, i.protein_g AS protein,
              f.food, f.local_name AS local, f.dex_group AS grp, f.type
       FROM (SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 300) s
       LEFT JOIN scan_items i ON i.scan_id = s.id
       LEFT JOIN foods f ON f.id = i.food_id
       ORDER BY s.created_at DESC, i.id`,
      [user.id],
    );
    const byId = new Map<number, DietMeal>();
    for (const r of rows) {
      let m = byId.get(r.id);
      if (!m) byId.set(r.id, (m = { id: r.id, at: r.at, dish: r.dish, total: Number(r.total ?? 0), items: [] }));
      if (r.label == null && r.food == null) continue;
      m.items.push({
        label: r.local ?? r.label ?? r.food ?? "Food",
        food: r.food,
        group: r.grp,
        type: r.type,
        grams: Number(r.grams ?? 0),
        protein: r.protein == null ? null : Number(r.protein),
      });
    }
    const meals = [...byId.values()];
    return Response.json({ user, meals, diet: buildDiet(meals) });
  } catch (e) {
    console.error("diet failed", e);
    return Response.json({ error: "Couldn't load your records." }, { status: 500 });
  }
}
