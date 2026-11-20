import { connection } from "next/server";
import { isCodeShape } from "@/lib/server/access-code";
import { currentKitchen, signIn, signOut } from "@/lib/server/kitchen-auth";

// GET    /api/kitchen/session                 -> { cafeteria } | 401   (who is signed in on this device)
// POST   /api/kitchen/session { slug, code }  -> { cafeteria }        (sign in with the cafeteria's 6-digit code)
// DELETE /api/kitchen/session                 -> { ok: true }         (sign out)
export async function GET() {
  await connection();
  const s = await currentKitchen();
  if (!s) return Response.json({ error: "Not signed in.", code: "kitchen_auth" }, { status: 401 });
  return Response.json({ cafeteria: s.cafeteria });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { slug?: unknown; code?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const code = typeof body?.code === "string" ? body.code.replace(/\s+/g, "") : "";
  if (!slug) return Response.json({ error: "Pick your cafeteria." }, { status: 400 });
  if (!isCodeShape(code)) return Response.json({ error: "Enter your 6-digit kitchen code." }, { status: 400 });
  try {
    const r = await signIn(slug, code);
    if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
    return Response.json({ cafeteria: r.cafeteria });
  } catch (e) {
    console.error("kitchen sign-in failed", e);
    return Response.json({ error: "Couldn't sign in. Try again." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await signOut();
  } catch (e) {
    console.error("kitchen sign-out failed", e);
  }
  return Response.json({ ok: true });
}
