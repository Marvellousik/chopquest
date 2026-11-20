import { connection } from "next/server";
import { query } from "@/lib/db";

// GET /api/demo-status -> { demo: boolean }  (true while sample data is on the site)
export async function GET() {
  await connection();
  try {
    const rows = await query<{ n: number }>("SELECT COUNT(*) AS n FROM demo_records");
    return Response.json({ demo: Number(rows[0]?.n ?? 0) > 0 });
  } catch {
    return Response.json({ demo: false });
  }
}
