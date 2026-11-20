import { connection } from "next/server";
import { bindLegacyDevice, currentUser, endUserSession } from "@/lib/server/user-session";

// GET    /api/users/me                   -> { user } from the sign-in cookie (renews it for 90 days) | 401
// POST   /api/users/me { id, nickname }  -> { user }: attach an older device that saved its account
//                                           before sign-in cookies existed (once per account) | 401
// DELETE /api/users/me                   -> sign out on this device
export async function GET() {
  await connection();
  try {
    const user = await currentUser();
    return user ? Response.json({ user }) : Response.json({ error: "Not signed in." }, { status: 401 });
  } catch (e) {
    console.error("users/me failed", e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: unknown; nickname?: unknown } | null;
  const id = Number(body?.id);
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  if (!Number.isInteger(id) || id <= 0 || !nickname) return Response.json({ error: "Not signed in." }, { status: 401 });
  try {
    const user = await bindLegacyDevice(id, nickname);
    return user ? Response.json({ user }) : Response.json({ error: "Not signed in." }, { status: 401 });
  } catch (e) {
    console.error("users/me bind failed", e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await endUserSession();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("sign out failed", e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
