// Kitchen admin sign-in (server only). A manager enters their cafeteria's 6-digit code once;
// we set an httpOnly cookie holding a random token and store only its hash with an expiry.
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifyCode } from "./access-code";
import type { Cafeteria } from "@/lib/types";

export const KITCHEN_COOKIE = "cq_kitchen";
const SESSION_DAYS = 30;
const MAX_FAILURES = 10; // per cafeteria per 15 minutes
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type KitchenSession = { cafeteria: Cafeteria };

/** Too many wrong codes for this cafeteria recently? */
async function lockedOut(cafeteriaId: number) {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM kitchen_login_failures WHERE cafeteria_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-15 minutes')",
    [cafeteriaId],
  );
  return Number(rows[0]?.n ?? 0) >= MAX_FAILURES;
}

export type SignInResult =
  | { ok: true; cafeteria: Cafeteria }
  | { ok: false; status: 400 | 401 | 404 | 429; error: string };

/** Check the code and start a session (sets the cookie). */
export async function signIn(slug: string, code: string): Promise<SignInResult> {
  const rows = await query<Cafeteria & { access_code_hash: string | null }>(
    `SELECT c.id, c.slug, c.name, c.location, k.access_code_hash
     FROM cafeterias c LEFT JOIN kitchen_profiles k ON k.cafeteria_id = c.id WHERE c.slug = ?`,
    [slug],
  );
  const row = rows[0];
  if (!row) return { ok: false, status: 404, error: "Cafeteria not found." };
  if (!row.access_code_hash) return { ok: false, status: 401, error: "This kitchen has no access code yet. Ask the ChopQuest team for yours." };
  if (await lockedOut(row.id)) return { ok: false, status: 429, error: "Too many wrong codes. Wait 15 minutes and try again." };
  if (!verifyCode(code, row.access_code_hash)) {
    await query("INSERT INTO kitchen_login_failures (cafeteria_id) VALUES (?)", [row.id]);
    return { ok: false, status: 401, error: "That code isn't right for this cafeteria." };
  }
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO kitchen_sessions (token_hash, cafeteria_id, expires_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))",
    [sha256(token), row.id, `+${SESSION_DAYS} days`],
  );
  (await cookies()).set(KITCHEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  const cafeteria: Cafeteria = { id: row.id, slug: row.slug, name: row.name, location: row.location };
  return { ok: true, cafeteria };
}

/** The signed-in kitchen for this request, or null. */
export async function currentKitchen(): Promise<KitchenSession | null> {
  const token = (await cookies()).get(KITCHEN_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<Cafeteria>(
    `SELECT c.id, c.slug, c.name, c.location FROM kitchen_sessions s JOIN cafeterias c ON c.id = s.cafeteria_id
     WHERE s.token_hash = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    [sha256(token)],
  );
  return rows[0] ? { cafeteria: rows[0] } : null;
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(KITCHEN_COOKIE)?.value;
  if (token) await query("DELETE FROM kitchen_sessions WHERE token_hash = ?", [sha256(token)]);
  store.delete(KITCHEN_COOKIE);
}

/**
 * Guard for kitchen-only API routes. Returns the session, or a ready 401/403 Response.
 * Pass `cafeteriaId` to also require the signed-in kitchen to own that cafeteria's data.
 */
export async function requireKitchen(cafeteriaId?: number): Promise<KitchenSession | Response> {
  const session = await currentKitchen();
  if (!session) return Response.json({ error: "Kitchen sign-in needed. Enter your cafeteria's access code.", code: "kitchen_auth" }, { status: 401 });
  if (cafeteriaId !== undefined && session.cafeteria.id !== cafeteriaId)
    return Response.json({ error: "That dish belongs to another cafeteria.", code: "kitchen_forbidden" }, { status: 403 });
  return session;
}
