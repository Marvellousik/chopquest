"use client";
// Leaderboard screen (task 8b). Data: GET /api/leaderboard (task 8a).
// Groups rank by how many DIFFERENT proteins members eat this week, never by how much.

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadUser } from "@/lib/user";
import type { GroupRow } from "@/lib/leaderboard";

type Data = { weekStart: string; ranked: GroupRow[]; gettingStarted: GroupRow[]; me?: { group: string; diversity: number } };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Data; myGroup: string | null };

const PODIUM = ["#facc15", "#cbd5e1", "#d97706"]; // gold, silver, bronze

/** "resets in 3 days" until Monday 00:00 Lagos. */
function resetsIn(weekStart: string, now = Date.now()): string {
  const nextMonday = Date.parse(`${weekStart}T00:00:00+01:00`) + 7 * 864e5;
  const hours = Math.max(0, Math.ceil((nextMonday - now) / 36e5));
  if (hours < 24) return `resets in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.ceil(hours / 24);
  return `resets in ${days} ${days === 1 ? "day" : "days"}`;
}

const same = (a: string | null | undefined, b: string) => !!a && a.trim().toLowerCase() === b.trim().toLowerCase();
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function LeaderboardScreen() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const user = loadUser();
    const ctrl = new AbortController();
    fetch(`/api/leaderboard${user ? `?user_id=${user.id}` : ""}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Couldn't load the leaderboard.");
        setState({ status: "ready", data: body as Data, myGroup: user?.group_name ?? null });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ status: "error", message: navigator.onLine ? e.message : "You're offline. Connect and try again." });
      });
    return () => ctrl.abort();
  }, [reload]);

  return (
    <section className="@container flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-black">Leaderboard</h1>
        <p className="text-stone-600">Groups rank by how many different proteins their members eat this week.</p>
      </header>

      {state.status === "loading" && (
        <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Loading leaderboard">
          {[0, 1, 2].map((i) => <li key={i} className="h-18 animate-pulse rounded-3xl bg-stone-200" />)}
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

      {state.status === "ready" && <Board data={state.data} myGroup={state.myGroup} />}
    </section>
  );
}

function Board({ data, myGroup }: { data: Data; myGroup: string | null }) {
  const { ranked, gettingStarted, me, weekStart } = data;
  const myRow = [...ranked, ...gettingStarted].find((r) => same(myGroup, r.group));
  const top = Math.max(1, ...ranked.map((r) => r.avgDiversity), ...gettingStarted.map((r) => r.avgDiversity));
  const nobodyYet = ranked.length + gettingStarted.length === 0 || [...ranked, ...gettingStarted].every((r) => r.activeMembers === 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Your group */}
      {myRow && (
        <div className="rounded-3xl bg-gradient-to-br from-leaf to-leaf-dark p-4 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">Your group</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="text-2xl font-black leading-tight">{myRow.group}</p>
            <p className="shrink-0 text-right">
              {myRow.rank > 0 ? (
                <>
                  <span className="text-4xl font-black">#{myRow.rank}</span>
                  <span className="block text-sm text-white/80">of {ranked.length}</span>
                </>
              ) : (
                <span className="text-sm font-bold">Getting started</span>
              )}
            </p>
          </div>
          <p className="mt-2 leading-snug">
            {myRow.group} averages <b>{fmt(myRow.avgDiversity)}</b> protein {myRow.avgDiversity === 1 ? "group" : "groups"} this week.
            {me && <> You: <b>{me.diversity}</b>.</>}
          </p>
          {myRow.rank === 0 && <p className="mt-1 text-sm text-white/85">Groups join the ranking at 3 members. Invite friends from your group.</p>}
        </div>
      )}

      {nobodyYet ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-xl font-black">No scores yet this week</p>
          <p className="text-stone-600">Scan a meal to put your group on the board.</p>
          <Link href="/scan" className="flex min-h-12 items-center rounded-full bg-pepper px-6 font-black text-white hover:bg-orange-600 active:scale-95">
            Scan a meal
          </Link>
        </div>
      ) : (
        ranked.length > 0 && (
          <ol className="flex flex-col gap-2" aria-label="Ranked groups">
            {ranked.map((r) => (
              <Row key={r.group} row={r} top={top} mine={same(myGroup, r.group)} />
            ))}
          </ol>
        )
      )}

      {gettingStarted.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-black">Getting started</h2>
          <p className="-mt-1 text-sm text-stone-600">Groups with fewer than 3 members. They join the ranking at 3.</p>
          <ul className="grid gap-2 @xl:grid-cols-2">
            {gettingStarted.map((r) => (
              <Row key={r.group} row={r} top={top} mine={same(myGroup, r.group)} />
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-stone-500">
        Week of {new Date(`${weekStart}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} · {resetsIn(weekStart)} (Monday, Lagos time).
        Only variety counts, never how much you eat.
      </p>
    </div>
  );
}

function Row({ row, top, mine }: { row: GroupRow; top: number; mine: boolean }) {
  const podium = row.rank >= 1 && row.rank <= 3 ? PODIUM[row.rank - 1] : null;
  return (
    <li
      className={`flex min-h-16 items-center gap-3 rounded-3xl p-3 shadow-sm ${mine ? "bg-palm/30 ring-2 ring-leaf" : "bg-white"}`}
      aria-current={mine ? "true" : undefined}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-black"
        style={{ background: podium ?? "#e7e5e4", color: podium ? "#1c1917" : "#57534e" }}
        aria-label={row.rank ? `Rank ${row.rank}` : "Not ranked yet"}
      >
        {row.rank || "–"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold">
          {row.group}
          {mine && <span className="ml-2 rounded-full bg-leaf px-2 py-0.5 text-xs font-black text-white">You</span>}
        </span>
        <span className="mt-1 block h-2 overflow-hidden rounded-full bg-stone-200" aria-hidden>
          <span className="block h-full rounded-full bg-leaf" style={{ width: `${(row.avgDiversity / top) * 100}%` }} />
        </span>
        <span className="mt-0.5 block text-xs text-stone-500">
          {row.activeMembers} of {row.members} {row.members === 1 ? "member" : "members"} scanned this week
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-2xl font-black tabular-nums">{fmt(row.avgDiversity)}</span>
        <span className="block text-xs text-stone-500">avg groups</span>
      </span>
    </li>
  );
}
