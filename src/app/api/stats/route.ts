import { connection } from "next/server";
import { query } from "@/lib/db";

// GET /api/stats -> { cafeterias, plantDishes, reviews, requests, sample }
// Live counts for the landing page. `sample` is true while demo rows from the team's sample
// campus are in the database (demo_records), so the page can say so instead of passing them off.
export async function GET() {
  await connection();
  const count = async (sql: string) => Number((await query<{ n: number }>(sql))[0]?.n ?? 0);
  try {
    const [cafeterias, plantDishes, reviews, requests, sample] = await Promise.all([
      count("SELECT COUNT(*) AS n FROM cafeterias"),
      count("SELECT COUNT(*) AS n FROM plant_dishes"),
      count("SELECT COUNT(*) AS n FROM reviews"),
      count("SELECT COUNT(*) AS n FROM plant_requests").catch(() => 0),
      count("SELECT COUNT(*) AS n FROM demo_records").catch(() => 0),
    ]);
    return Response.json({ cafeterias, plantDishes, reviews, requests, sample: sample > 0 });
  } catch (e) {
    console.error("stats failed", e);
    return Response.json({ error: "Couldn't load numbers." }, { status: 500 });
  }
}
