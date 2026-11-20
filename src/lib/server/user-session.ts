// Student sign-in (server only): a 90-day httpOnly cookie, renewed on every visit, so a student
// stays signed in for months even if the browser clears localStorage (Safari does after 7 days).
// Only a hash of the token is stored.
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import type { User } from "@/lib/user";

export const USER_COOKIE = "cq_user";
export const SESSION_DAYS = 90;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const expiry = `+${SESSION_DAYS} days`;

async function setCookie(token: string) {
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Start a session for this user on this device (sets the cookie). */
export async function startUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await query("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))", [
    sha256(token),
    userId,
    expiry,
  ]);
  await query("INSERT OR IGNORE INTO user_bound (user_id) VALUES (?)", [userId]);
  await setCookie(token);
}

/** The signed-in student, or null. Each call pushes the expiry back to 90 days (cookie too). */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const hash = sha256(token);
  const rows = await query<User>(
    `SELECT u.id, u.nickname, u.group_name FROM user_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    [hash],
  );
  if (!rows[0]) return null;
  await query("UPDATE user_sessions SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?) WHERE token_hash = ?", [expiry, hash]);
  await setCookie(token);
  return rows[0];
}

/**
 * A device that signed up before sessions existed still has { id, nickname } in localStorage.
 * Let it attach once, only while the account has never had a session.
 */
export async function bindLegacyDevice(id: number, nickname: string): Promise<User | null> {
  const rows = await query<User>(
    `SELECT u.id, u.nickname, u.group_name FROM users u
     WHERE u.id = ? AND u.nickname = ? COLLATE NOCASE AND NOT EXISTS (SELECT 1 FROM user_bound b WHERE b.user_id = u.id)`,
    [id, nickname],
  );
  if (!rows[0]) return null;
  await startUserSession(rows[0].id);
  return rows[0];
}

export async function endUserSession() {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  if (token) await query("DELETE FROM user_sessions WHERE token_hash = ?", [sha256(token)]);
  store.delete(USER_COOKIE);
}
