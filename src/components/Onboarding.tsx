"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clean,
  validate,
  loadUser,
  saveUser,
  clearUser,
  NICKNAME_MAX,
  GROUP_MAX,
  type User,
} from "@/lib/user";

type Status = "loading" | "form" | "ready";

export default function Onboarding() {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Restore a saved user. If the server says it no longer exists (DB reset), start over.
  // Network/server errors keep the saved user so the app still works offline.
  useEffect(() => {
    // localStorage only exists in the browser, so this must run after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = loadUser();
    if (!saved) {
      setStatus("form");
      return;
    }
    setUser(saved);
    setStatus("ready");
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/users/${saved.id}`)
      .then((r) => {
        if (r.status === 404) {
          clearUser();
          setUser(null);
          setStatus("form");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "form") return;
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = clean(nickname);
    const g = clean(group);
    const invalid = validate(n, g);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: n, group: g }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      saveUser(data.user);
      setUser(data.user);
      setStatus("ready");
    } catch {
      setError("No connection. Check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchUser() {
    clearUser();
    setUser(null);
    setNickname("");
    setGroup("");
    setStatus("form");
  }

  if (status === "loading") {
    return <div className="flex flex-1 items-center justify-center text-5xl" aria-label="Loading">🥚</div>;
  }

  if (status === "ready" && user) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="text-8xl animate-bounce" aria-hidden>🥚</div>
        <div>
          <h1 className="text-3xl font-extrabold">Hi, {user.nickname}!</h1>
          <p className="mt-1 text-lg text-stone-600">
            Repping <span className="font-bold text-leaf-dark">{user.group_name}</span>
          </p>
        </div>
        <p className="text-stone-700">
          Your pet is still an egg. Scan meals with new proteins to help it hatch.
        </p>
        <Link
          href="/scan"
          className="w-full rounded-2xl bg-leaf px-6 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95 transition"
        >
          📸 Scan a meal
        </Link>
        <button onClick={switchUser} className="py-3 text-sm text-stone-500 underline">
          Not {user.nickname}? Switch player
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col justify-center gap-8">
      <header className="text-center">
        <div className="text-7xl" aria-hidden>🍛</div>
        <h1 className="mt-2 text-4xl font-extrabold text-leaf-dark">ChopQuest</h1>
        <p className="mt-2 text-lg font-semibold text-pepper">Keep your jollof, upgrade your protein.</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">Pick a nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={NICKNAME_MAX}
            autoComplete="nickname"
            placeholder="e.g. JollofKing"
            className="rounded-2xl border-2 border-stone-300 bg-white px-4 py-4 text-lg outline-none focus:border-leaf"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">Your group</span>
          <span className="-mt-1 text-sm text-stone-500">Hall, department or squad — you&apos;ll compete on the leaderboard.</span>
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            maxLength={GROUP_MAX}
            list="group-options"
            placeholder="e.g. Hall B, Microbiology"
            className="rounded-2xl border-2 border-stone-300 bg-white px-4 py-4 text-lg outline-none focus:border-leaf"
          />
          <datalist id="group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>

        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Existing groups">
            {groups.slice(0, 6).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-semibold ${
                  clean(group).toLowerCase() === g.toLowerCase()
                    ? "border-leaf bg-leaf text-white"
                    : "border-stone-300 bg-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-100 px-4 py-3 font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-leaf px-6 py-4 text-xl font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
        >
          {submitting ? "Hatching…" : "Start my quest 🥚"}
        </button>
      </form>

      <p className="text-center text-xs text-stone-500">No password needed. Nutrition figures are estimates, not medical advice.</p>
    </section>
  );
}
