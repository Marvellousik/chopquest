// Published plant dishes with their cafeteria and the protein groups each swap adds (server only).
import { query } from "@/lib/db";
import type { CampusDish } from "@/lib/companion-reply";
import type { SwapOption } from "@/lib/types";

export async function campusDishes(): Promise<CampusDish[]> {
  const [rows, foods] = await Promise.all([
    query<{ id: number; name: string; price_ngn: number; option: string; cafeteria: string; avg_rating: number | null; review_count: number }>(
      `SELECT p.id, p.name, p.price_ngn, p.option, c.name AS cafeteria, AVG(r.stars) AS avg_rating, COUNT(r.id) AS review_count
       FROM plant_dishes p JOIN cafeterias c ON c.id = p.cafeteria_id LEFT JOIN reviews r ON r.plant_dish_id = p.id
       GROUP BY p.id ORDER BY avg_rating DESC LIMIT 40`,
    ),
    query<{ id: number; dex_group: string }>("SELECT id, dex_group FROM foods"),
  ]);
  const group = new Map(foods.map((f) => [Number(f.id), f.dex_group]));
  return rows.map((r) => {
    let groups: string[] = [];
    try {
      const o = JSON.parse(r.option) as SwapOption;
      groups = [...new Set(o.adds.map((a) => group.get(a.foodId)).filter((g): g is string => !!g))];
    } catch {}
    return {
      id: Number(r.id),
      name: r.name,
      cafeteria: r.cafeteria,
      priceNgn: Number(r.price_ngn),
      avgRating: r.avg_rating == null ? null : Math.round(Number(r.avg_rating) * 10) / 10,
      reviewCount: Number(r.review_count),
      groups,
    };
  });
}
