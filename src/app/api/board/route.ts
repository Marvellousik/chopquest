import { connection } from "next/server";
import { boardRanking, listPlantDishes } from "@/lib/server/cafeterias";

// GET /api/board -> { ranked: CafeteriaRank[], gettingStarted: CafeteriaRank[], topDishes: PlantDish[] }
export async function GET() {
  await connection();
  try {
    const [board, dishes] = await Promise.all([boardRanking(), listPlantDishes()]);
    const topDishes = dishes.filter((d) => d.reviewCount > 0).slice(0, 6);
    return Response.json({ ...board, topDishes });
  } catch (e) {
    console.error("board failed", e);
    return Response.json({ error: "Couldn't load the board." }, { status: 500 });
  }
}
