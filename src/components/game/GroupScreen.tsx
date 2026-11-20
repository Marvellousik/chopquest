"use client";
// One group's own leaderboard: its members ranked against each other this week, by how many
// different proteins they ate (then plant meals logged). Never by how much anyone ate.

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadUser } from "@/lib/user";
import type { MemberRow } from "@/lib/leaderboard";
import { ArrowLeftIcon } from "@/components/icons";

type Data = { group: string; weekStart: string; members: MemberRow[]; groupRank: number; groupCount: number; avgDiversity: number; meId?: number };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Data };

const PODIUM = ["#facc15", "#cbd5e1", "#d97706"]; // gold, silver, bronze
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function GroupScreen({ name }: { name: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const user = loadUser();
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ name, ...(user ? { user_id: String(user.id) } : {}) });
    fetch(`/api/leaderboard/group?${qs}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Couldn't load this group.");
        setState({ status: "ready", data: body as Data });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ status: "error", message: navigator.onLine ? e.message : "You're offline. Connect and try again." });
      });
    return () => ctrl.abort();
  }, [name, reload]);

  return (
    <section className="flex flex-col gap-5">
      <Link href="/leaderboard" className="flex min-h-12 w-fit items-center gap-1 rounded-full pr-3 font-bold text-green-800 hover:bg-white/60">
        <ArrowLeftIcon size={20} /> All groups
      </Link>

      {state.status === "loading" && (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Loading the group">
          {[0, 1, 2, 3].map((i) => <li key={i} className="h-16 animate-pulse rounded-3xl bg-stone-200" />)}
        </ul>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="font-bold">{state.message}</p>
          <button onClick={() => { setState({ status: "loading" }); setReload((n) => n + 1); }} className="min-h-12 rounded-full bg-leaf px-6 font-black text-white hover:bg-leaf-dark active:scale-95">
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && <Members data={state.data} />}
    </section>
  );
}

function Members({ data }: { data: Data }) {
  const { group, members, groupRank, groupCount, avgDiversity, meId } = data;
  const top = Math.max(1, ...members.map((m) => m.diversity));
  const me = members.find((m) => m.userId === meId);

  return (
    <div className="flex flex-col gap-5">
      <header className="rounded-[2rem_2rem_2rem_0.75rem] bg-gradient-to-br from-leaf to-leaf-dark p-5 text-white shadow-lg">
        <p className="text-sm font-bold text-white/80">Group</p>
        <h1 className="text-3xl font-black leading-tight">{group}</h1>
        <p className="mt-2 font-semibold text-white/90">
          {plural(members.length, "member", "members")} · averaging {fmt(avgDiversity)} protein {avgDiversity === 1 ? "group" : "groups"} this week
        </p>
        <p className="mt-1 text-sm text-white/85">
          {groupRank > 0 ? `Ranked #${groupRank} of ${groupCount} groups on campus.` : "Joins the campus ranking at 3 members."}
        </p>
        {me && (
          <p className="mt-3 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            You&apos;re #{me.rank} in {group} with {plural(me.diversity, "protein group", "protein groups")} this week
          </p>
        )}
      </header>

      <ol className="flex flex-col gap-2" aria-label={`${group} members, ranked`}>
        {members.map((m) => {
          const mine = m.userId === meId;
          const podium = m.rank <= 3 && m.diversity > 0 ? PODIUM[m.rank - 1] : null;
          return (
            <li
              key={m.userId}
              className={`flex min-h-16 items-center gap-3 rounded-3xl p-3 shadow-sm ${mine ? "bg-palm/30 ring-2 ring-leaf" : "bg-white"}`}
              aria-current={mine ? "true" : undefined}
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-black"
                style={{ background: podium ?? "#e7e5e4", color: podium ? "#1c1917" : "#57534e" }}
                aria-label={`Rank ${m.rank}`}
              >
                {m.rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">
                  {m.nickname}
                  {mine && <span className="ml-2 rounded-full bg-leaf px-2 py-0.5 text-xs font-black text-white">You</span>}
                </span>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-stone-200" aria-hidden>
                  <span className="block h-full rounded-full bg-leaf" style={{ width: `${(m.diversity / top) * 100}%` }} />
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">{plural(m.plantMeals, "plant meal", "plant meals")} this week</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-2xl font-black tabular-nums">{m.diversity}</span>
                <span className="block text-xs text-stone-500">protein groups</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-sm text-stone-500">Ranked by how many different proteins each member ate this week, never by how much. Resets every Monday.</p>
    </div>
  );
}
