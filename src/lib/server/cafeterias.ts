// Database reads and writes for cafeterias, menus, plant dishes and reviews (server only).
import { getDb, query } from "@/lib/db";
import { rankCafeterias } from "@/lib/ranking";
import type { Cafeteria, CafeteriaRank, DishPart, KitchenCard, MenuItem, PlantDish, Review, SwapOption } from "@/lib/types";

type MenuRow = { id: number; cafeteria_id: number; name: string; price_ngn: number; is_top_seller: number; breakdown: string | null };

function parseJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

const toMenuItem = (r: MenuRow): MenuItem => ({
  id: r.id,
  cafeteriaId: r.cafeteria_id,
  name: r.name,
  priceNgn: r.price_ngn,
  isTopSeller: Boolean(r.is_top_seller),
  breakdown: parseJson<DishPart[]>(r.breakdown),
});

export async function listCafeterias(): Promise<Cafeteria[]> {
  return query<Cafeteria>("SELECT id, slug, name, location FROM cafeterias ORDER BY name");
}

export async function getCafeteria(slug: string): Promise<Cafeteria | null> {
  const rows = await query<Cafeteria>("SELECT id, slug, name, location FROM cafeterias WHERE slug = ?", [slug]);
  return rows[0] ?? null;
}

export async function listMenu(cafeteriaId: number): Promise<MenuItem[]> {
  const rows = await query<MenuRow>(
    "SELECT id, cafeteria_id, name, price_ngn, is_top_seller, breakdown FROM menu_items WHERE cafeteria_id = ? ORDER BY is_top_seller DESC, name",
    [cafeteriaId],
  );
  return rows.map(toMenuItem);
}

export async function getMenuItem(id: number): Promise<(MenuItem & { cafeteriaName: string }) | null> {
  const rows = await query<MenuRow & { cafeteria_name: string }>(
    `SELECT m.id, m.cafeteria_id, m.name, m.price_ngn, m.is_top_seller, m.breakdown, c.name AS cafeteria_name
     FROM menu_items m JOIN cafeterias c ON c.id = m.cafeteria_id WHERE m.id = ?`,
    [id],
  );
  return rows[0] ? { ...toMenuItem(rows[0]), cafeteriaName: rows[0].cafeteria_name } : null;
}

export async function saveBreakdown(id: number, parts: DishPart[]) {
  await query("UPDATE menu_items SET breakdown = ? WHERE id = ?", [JSON.stringify(parts), id]);
}

const PLANT_DISH_SELECT = `
  SELECT p.id, p.cafeteria_id, p.menu_item_id, p.name, p.price_ngn, p.protein_g,
         COUNT(r.id) AS review_count, AVG(r.stars) AS avg_rating, AVG(r.would_order_again) AS woa
  FROM plant_dishes p LEFT JOIN reviews r ON r.plant_dish_id = p.id`;

type PlantRow = {
  id: number; cafeteria_id: number; menu_item_id: number; name: string; price_ngn: number; protein_g: number;
  review_count: number; avg_rating: number | null; woa: number | null;
};

const toPlantDish = (r: PlantRow): PlantDish => ({
  id: r.id,
  cafeteriaId: r.cafeteria_id,
  menuItemId: r.menu_item_id,
  name: r.name,
  priceNgn: r.price_ngn,
  proteinG: r.protein_g,
  reviewCount: Number(r.review_count),
  avgRating: r.avg_rating == null ? null : Math.round(r.avg_rating * 10) / 10,
  wouldOrderAgainPct: r.woa == null ? null : Math.round(r.woa * 100),
});

export async function listPlantDishes(cafeteriaId?: number): Promise<PlantDish[]> {
  const rows = await query<PlantRow>(
    `${PLANT_DISH_SELECT} ${cafeteriaId ? "WHERE p.cafeteria_id = ?" : ""} GROUP BY p.id ORDER BY avg_rating DESC, review_count DESC, p.id DESC`,
    cafeteriaId ? [cafeteriaId] : [],
  );
  return rows.map(toPlantDish);
}

export async function getPlantDish(id: number): Promise<(PlantDish & { option: SwapOption; card: KitchenCard }) | null> {
  const rows = await query<PlantRow & { option: string; card: string }>(
    `${PLANT_DISH_SELECT.replace("p.protein_g,", "p.protein_g, p.option, p.card,")} WHERE p.id = ? GROUP BY p.id`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return { ...toPlantDish(r), option: JSON.parse(r.option) as SwapOption, card: JSON.parse(r.card) as KitchenCard };
}

export async function createPlantDish(input: {
  cafeteriaId: number; menuItemId: number; name: string; priceNgn: number; proteinG: number; option: SwapOption; card: KitchenCard;
}): Promise<number> {
  const rs = await getDb().execute({
    sql: `INSERT INTO plant_dishes (cafeteria_id, menu_item_id, name, price_ngn, protein_g, option, card)
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [input.cafeteriaId, input.menuItemId, input.name, input.priceNgn, input.proteinG, JSON.stringify(input.option), JSON.stringify(input.card)],
  });
  return Number(rs.rows[0][0]);
}

type ReviewRow = { id: number; plant_dish_id: number; nickname: string; stars: number; would_order_again: number; comment: string | null; created_at: string };

const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  plantDishId: r.plant_dish_id,
  nickname: r.nickname,
  stars: r.stars as Review["stars"],
  wouldOrderAgain: Boolean(r.would_order_again),
  comment: r.comment,
  createdAt: r.created_at,
});

export async function listReviews(plantDishId: number): Promise<Review[]> {
  const rows = await query<ReviewRow>(
    "SELECT id, plant_dish_id, nickname, stars, would_order_again, comment, created_at FROM reviews WHERE plant_dish_id = ? ORDER BY created_at DESC LIMIT 100",
    [plantDishId],
  );
  return rows.map(toReview);
}

export async function recentReviewsByDevice(deviceId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM reviews WHERE device_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')",
    [deviceId],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function createReview(plantDishId: number, r: { deviceId: string; nickname: string; stars: number; wouldOrderAgain: boolean; comment: string | null }): Promise<Review> {
  const rows = await query<ReviewRow>(
    `INSERT INTO reviews (plant_dish_id, device_id, nickname, stars, would_order_again, comment)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id, plant_dish_id, nickname, stars, would_order_again, comment, created_at`,
    [plantDishId, r.deviceId, r.nickname, r.stars, r.wouldOrderAgain ? 1 : 0, r.comment],
  );
  return toReview(rows[0]);
}

export async function boardRanking(): Promise<{ ranked: CafeteriaRank[]; gettingStarted: CafeteriaRank[] }> {
  const [cafes, stats] = await Promise.all([
    listCafeterias(),
    query<{ cafeteria_id: number; dish_count: number; review_count: number; star_sum: number }>(
      `SELECT p.cafeteria_id, COUNT(DISTINCT p.id) AS dish_count, COUNT(r.id) AS review_count, COALESCE(SUM(r.stars), 0) AS star_sum
       FROM plant_dishes p LEFT JOIN reviews r ON r.plant_dish_id = p.id GROUP BY p.cafeteria_id`,
    ),
  ]);
  const byId = new Map(stats.map((s) => [s.cafeteria_id, s]));
  const ranked = rankCafeterias(
    cafes.map((c) => {
      const s = byId.get(c.id);
      return { cafeteriaId: c.id, plantDishCount: Number(s?.dish_count ?? 0), reviewCount: Number(s?.review_count ?? 0), starSum: Number(s?.star_sum ?? 0) };
    }),
  );
  const cafeById = new Map(cafes.map((c) => [c.id, c]));
  const toRank = (r: (typeof ranked)[number]): CafeteriaRank => ({
    cafeteria: cafeById.get(r.cafeteriaId)!,
    score: r.score,
    plantDishCount: r.plantDishCount,
    reviewCount: r.reviewCount,
    avgRating: r.avgRating,
  });
  return { ranked: ranked.filter((r) => !r.gettingStarted).map(toRank), gettingStarted: ranked.filter((r) => r.gettingStarted).map(toRank) };
}
