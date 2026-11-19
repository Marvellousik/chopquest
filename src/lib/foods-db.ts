import { getSql } from "./db";
import type { Food } from "./foods";

export async function listFoods(): Promise<Food[]> {
  const rows = await getSql()`
    SELECT id, food, local_name, dex_group, type,
           protein_g_per_100g::float AS protein_g_per_100g,
           price_ngn_per_kg::float AS price_ngn_per_kg
    FROM foods ORDER BY type, dex_group, food`;
  return rows as Food[];
}
