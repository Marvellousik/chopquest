import { connection } from "next/server";
import { listCafeterias } from "@/lib/server/cafeterias";

// GET /api/cafeterias -> { cafeterias: Cafeteria[] }
export async function GET() {
  await connection();
  try {
    return Response.json({ cafeterias: await listCafeterias() });
  } catch (e) {
    console.error("list cafeterias failed", e);
    return Response.json({ error: "Couldn't load cafeterias." }, { status: 500 });
  }
}
