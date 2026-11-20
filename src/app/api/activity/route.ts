import { connection } from "next/server";
import { query } from "@/lib/db";

// GET /api/activity[?cafeteria=<slug>] -> { events, week: { meals, reviews, asks } }
// The campus pulse: the latest plant meals scanned, reviews and "make a plant version" asks.
// Only public things (nicknames already shown on reviews and the leaderboard). Asks stay anonymous.
export type PulseEvent =
  | { kind: "review"; at: string; nickname: string; stars: number; dish: string; dishId: number; cafe: string; cafeSlug: string }
  | { kind: "meal"; at: string; nickname: string; crew: string; dish: string; cafe: string | null; cafeSlug: string | null }
  | { kind: "ask"; at: string; dish: string; cafe: string; cafeSlug: string };

export async function GET(req: Request) {
  await connection();
  const slug = new URL(req.url).searchParams.get("cafeteria");
  const only = slug ? " AND c.slug = ?" : "";
  const args = slug ? [slug] : [];
  try {
    const [reviews, meals, asks, week] = await Promise.all([
      query<{ at: string; nickname: string; stars: number; dish: string; dishId: number; cafe: string; cafeSlug: string }>(
        `SELECT r.created_at AS at, r.nickname, r.stars, pd.name AS dish, pd.id AS dishId, c.name AS cafe, c.slug AS cafeSlug
         FROM reviews r JOIN plant_dishes pd ON pd.id = r.plant_dish_id JOIN cafeterias c ON c.id = pd.cafeteria_id
         WHERE r.nickname IS NOT NULL${only} ORDER BY r.created_at DESC LIMIT 25`,
        args,
      ),
      query<{ at: string; nickname: string; crew: string; dish: string; cafe: string | null; cafeSlug: string | null }>(
        `SELECT s.created_at AS at, u.nickname, u.group_name AS crew, s.dish_name AS dish, c.name AS cafe, c.slug AS cafeSlug
         FROM scans s JOIN users u ON u.id = s.user_id
         LEFT JOIN plant_dishes pd ON pd.id = (SELECT id FROM plant_dishes WHERE name = s.dish_name LIMIT 1)
         LEFT JOIN cafeterias c ON c.id = pd.cafeteria_id
         WHERE s.dish_name IS NOT NULL${slug ? " AND c.slug = ?" : ""} ORDER BY s.created_at DESC LIMIT 25`,
        args,
      ),
      query<{ at: string; dish: string; cafe: string; cafeSlug: string }>(
        `SELECT pr.created_at AS at, m.name AS dish, c.name AS cafe, c.slug AS cafeSlug
         FROM plant_requests pr JOIN menu_items m ON m.id = pr.menu_item_id JOIN cafeterias c ON c.id = m.cafeteria_id
         WHERE 1 = 1${only} ORDER BY pr.created_at DESC LIMIT 15`,
        args,
      ),
      query<{ meals: number; reviews: number; asks: number }>(
        `SELECT
           (SELECT COUNT(*) FROM scans s LEFT JOIN plant_dishes pd ON pd.id = (SELECT id FROM plant_dishes WHERE name = s.dish_name LIMIT 1)
              LEFT JOIN cafeterias c ON c.id = pd.cafeteria_id WHERE s.created_at >= ?${slug ? " AND c.slug = ?" : ""}) AS meals,
           (SELECT COUNT(*) FROM reviews r JOIN plant_dishes pd ON pd.id = r.plant_dish_id JOIN cafeterias c ON c.id = pd.cafeteria_id
              WHERE r.created_at >= ?${only}) AS reviews,
           (SELECT COUNT(*) FROM plant_requests pr JOIN menu_items m ON m.id = pr.menu_item_id JOIN cafeterias c ON c.id = m.cafeteria_id
              WHERE pr.created_at >= ?${only}) AS asks`,
        (() => {
          const since = new Date(Date.now() - 7 * 86400_000).toISOString();
          return slug ? [since, slug, since, slug, since, slug] : [since, since, since];
        })(),
      ),
    ]);
    const events: PulseEvent[] = [
      ...reviews.map((r) => ({ kind: "review" as const, ...r, stars: Number(r.stars), dishId: Number(r.dishId) })),
      ...meals.map((m) => ({ kind: "meal" as const, ...m })),
      ...asks.map((a) => ({ kind: "ask" as const, ...a })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 40);
    const w = week[0];
    return Response.json({ events, week: { meals: Number(w.meals), reviews: Number(w.reviews), asks: Number(w.asks) } });
  } catch (e) {
    console.error("activity failed", e);
    return Response.json({ error: "Couldn't load campus activity." }, { status: 500 });
  }
}
