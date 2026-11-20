"use client";
import { useCallback, useEffect, useState } from "react";
import type { Companion } from "@/lib/companion";
import { loadUser, type User } from "@/lib/user";

export type CompanionState =
  | { status: "loading" }
  | { status: "no-user" }
  | { status: "error"; message: string }
  | { status: "ready"; user: User; c: Companion };

/** The signed-in user's companion, refreshed on demand and when the tab regains focus. */
export function useCompanion() {
  const [state, setState] = useState<CompanionState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const user = loadUser();
    if (!user) return setState({ status: "no-user" });
    try {
      const r = await fetch(`/api/users/${user.id}/companion`);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "Couldn't wake your companion.");
      setState({ status: "ready", user, c: body as Companion });
    } catch (e) {
      setState((s) => (s.status === "ready" ? s : { status: "error", message: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => void refresh());
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("chopquest:scan-saved", onFocus);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("chopquest:scan-saved", onFocus);
    };
  }, [refresh]);

  return { state, refresh };
}

export const PET_NAME_KEY = "chopquest_pet_name";
export function loadPetName(): string {
  try {
    return localStorage.getItem(PET_NAME_KEY) || "Ewa";
  } catch {
    return "Ewa";
  }
}
export function savePetName(n: string) {
  try {
    localStorage.setItem(PET_NAME_KEY, n);
  } catch {}
}
