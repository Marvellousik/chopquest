import { connection } from "next/server";
import { clearDemo, demoStatus, seedDemo } from "@/lib/server/demo";
import { isAdmin as authorised } from "@/lib/server/admin-auth";

export const maxDuration = 120;

// Team-only. Header "x-admin-token" must equal the ADMIN_TOKEN server variable.
//   GET  /api/admin/demo                        -> { demo, counts }
//   POST /api/admin/demo { "action": "seed" }   -> seeds the demo campus (replaces earlier demo data)
//   POST /api/admin/demo { "action": "clear" }  -> deletes every demo row
const notFound = () => Response.json({ error: "Not found." }, { status: 404 });

export async function GET(req: Request) {
  await connection();
  if (!authorised(req)) return notFound();
  return Response.json(await demoStatus());
}

export async function POST(req: Request) {
  if (!authorised(req)) return notFound();
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
  try {
    if (body?.action === "seed") return Response.json({ seeded: await seedDemo(), ...(await demoStatus()) });
    if (body?.action === "clear") return Response.json({ removed: await clearDemo(), ...(await demoStatus()) });
    return Response.json({ error: 'action must be "seed" or "clear"' }, { status: 400 });
  } catch (e) {
    console.error("demo admin failed", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
