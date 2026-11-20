import { connection } from "next/server";
import { requireKitchen } from "@/lib/server/kitchen-auth";
import { buildReport } from "@/lib/server/kitchen";

// GET /api/kitchen/report[?switchRate=10] -> { cafeteria, switchRate, totals, recommendations (with whereToBuy), dishes, needsBreakdown, notes }
// The manager's profit report. switchRate lets the screen preview another rate without saving it.
export async function GET(req: Request) {
  await connection();
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  const raw = new URL(req.url).searchParams.get("switchRate");
  const rate = raw === null ? undefined : Number(raw);
  if (rate !== undefined && (!Number.isFinite(rate) || rate < 1 || rate > 100))
    return Response.json({ error: "Switch rate must be between 1% and 100%." }, { status: 400 });
  try {
    return Response.json({ cafeteria: s.cafeteria, ...(await buildReport(s.cafeteria.id, rate)) });
  } catch (e) {
    console.error("kitchen report failed", e);
    return Response.json({ error: "Couldn't build your report. Try again." }, { status: 500 });
  }
}
