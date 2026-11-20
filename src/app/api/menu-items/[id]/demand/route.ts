import { connection } from "next/server";
import { query } from "@/lib/db";
import { getMenuItem } from "@/lib/server/cafeterias";
import { requireKitchen } from "@/lib/server/kitchen-auth";

// GET /api/menu-items/:id/demand -> the traffic evidence for converting this dish (kitchen only).
// { asks, asks7d, platesPerWeek, cafe: { plantMeals7d, reviews, avgRating, wouldOrderAgainPct, dishes },
//   campus: { plantMeals7d, students7d, wouldOrderAgainPct } }
export async function GET(_req: Request, ctx: RouteContext<"/api/menu-items/[id]/demand">) {
  await connection();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  try {
    const item = await getMenuItem(id);
    if (!item) return Response.json({ error: "Dish not found." }, { status: 404 });
    const auth = await requireKitchen(item.cafeteriaId);
    if (auth instanceof Response) return auth;
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const n = (v: unknown) => (v == null ? null : Number(v));
    const [asks, stats, cafe, campus] = await Promise.all([
      query<{ all: number; week: number }>(
        "SELECT COUNT(*) AS \"all\", SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM plant_requests WHERE menu_item_id = ?",
        [since, id],
      ),
      query<{ plates: number | null }>("SELECT plates_per_week AS plates FROM menu_item_stats WHERE menu_item_id = ?", [id]),
      query<{ dishes: number; reviews: number; rating: number | null; woa: number | null; meals: number }>(
        `SELECT
           (SELECT COUNT(*) FROM plant_dishes WHERE cafeteria_id = ?) AS dishes,
           (SELECT COUNT(*) FROM reviews r JOIN plant_dishes pd ON pd.id = r.plant_dish_id WHERE pd.cafeteria_id = ?) AS reviews,
           (SELECT AVG(r.stars) FROM reviews r JOIN plant_dishes pd ON pd.id = r.plant_dish_id WHERE pd.cafeteria_id = ?) AS rating,
           (SELECT AVG(r.would_order_again) FROM reviews r JOIN plant_dishes pd ON pd.id = r.plant_dish_id WHERE pd.cafeteria_id = ?) AS woa,
           (SELECT COUNT(*) FROM scans s JOIN plant_dishes pd ON pd.name = s.dish_name WHERE pd.cafeteria_id = ? AND s.created_at >= ?) AS meals`,
        [item.cafeteriaId, item.cafeteriaId, item.cafeteriaId, item.cafeteriaId, item.cafeteriaId, since],
      ),
      query<{ meals: number; students: number; woa: number | null }>(
        `SELECT (SELECT COUNT(*) FROM scans WHERE created_at >= ?) AS meals,
                (SELECT COUNT(DISTINCT user_id) FROM scans WHERE created_at >= ?) AS students,
                (SELECT AVG(would_order_again) FROM reviews) AS woa`,
        [since, since],
      ),
    ]);
    const pct = (v: unknown) => (v == null ? null : Math.round(Number(v) * 100));
    return Response.json({
      asks: n(asks[0]?.all) ?? 0,
      asks7d: n(asks[0]?.week) ?? 0,
      platesPerWeek: n(stats[0]?.plates),
      cafe: {
        dishes: n(cafe[0]?.dishes) ?? 0,
        reviews: n(cafe[0]?.reviews) ?? 0,
        avgRating: cafe[0]?.rating == null ? null : Math.round(Number(cafe[0].rating) * 10) / 10,
        wouldOrderAgainPct: pct(cafe[0]?.woa),
        plantMeals7d: n(cafe[0]?.meals) ?? 0,
      },
      campus: { plantMeals7d: n(campus[0]?.meals) ?? 0, students7d: n(campus[0]?.students) ?? 0, wouldOrderAgainPct: pct(campus[0]?.woa) },
    });
  } catch (e) {
    console.error("demand failed", e);
    return Response.json({ error: "Couldn't load demand." }, { status: 500 });
  }
}
