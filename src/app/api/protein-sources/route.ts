import { connection } from "next/server";
import { proteinsWithSources } from "@/lib/server/kitchen";
import { WHERE_TO_BUY_NOTE } from "@/lib/kitchen-copy";

// GET /api/protein-sources[?foodId=7] -> { proteins: ProteinWithSources[], note }
// Every alternative protein in our database and where to buy it (campus first, then Bwari).
// Each place is "confirmed" (checked by the team) or "likely" (check first). Market info only, no cafeteria costs.
export async function GET(req: Request) {
  await connection();
  const raw = new URL(req.url).searchParams.get("foodId");
  const foodId = raw === null ? undefined : Number(raw);
  if (foodId !== undefined && (!Number.isInteger(foodId) || foodId <= 0)) return Response.json({ error: "Bad food id." }, { status: 400 });
  try {
    return Response.json({ proteins: await proteinsWithSources(foodId), note: WHERE_TO_BUY_NOTE });
  } catch (e) {
    console.error("protein sources failed", e);
    return Response.json({ error: "Couldn't load where to buy." }, { status: 500 });
  }
}
