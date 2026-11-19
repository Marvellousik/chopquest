import { connection } from "next/server";
import { listFoods } from "@/lib/foods-db";

// GET /api/foods -> { foods } — powers the one-tap correction dropdown.
export async function GET() {
  await connection();
  try {
    return Response.json({ foods: await listFoods() });
  } catch (e) {
    console.error("list foods failed", e);
    return Response.json({ error: "Couldn't load foods." }, { status: 500 });
  }
}
