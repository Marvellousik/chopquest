export type User = { id: number; nickname: string; group_name: string };

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
export const GROUP_MIN = 2;
export const GROUP_MAX = 40;

const STORAGE_KEY = "chopquest_user";

/** Collapse whitespace so "  Hall   A " and "Hall A" are the same group. */
export function clean(s: unknown): string {
  return typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "";
}

export function validate(nickname: string, group: string): string | null {
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX)
    return `Nickname must be ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`;
  if (!/^[\p{L}\p{N} _.\-]+$/u.test(nickname))
    return "Nickname can use letters, numbers, spaces, _ . -";
  if (group.length < GROUP_MIN || group.length > GROUP_MAX)
    return `Group must be ${GROUP_MIN} to ${GROUP_MAX} characters.`;
  return null;
}

// localStorage can throw (private mode, blocked storage) — never let that crash the app.
export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveUser(u: User) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {}
}

export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
