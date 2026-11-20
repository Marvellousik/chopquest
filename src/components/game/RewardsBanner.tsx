"use client";
// RewardsBanner (task 7c) for Dev 1's /meal/[id] slot.
// Shows what this meal earned: a counted-up total, then one row per reward.
// Points never come from grams, calories or price: rewards arrive from 7a already decided.

import { useEffect, useState } from "react";
import { dexEntry, type Medal as MedalKind } from "./dex";
import Medal from "./Medal";

import type { Reward } from "@/lib/rewards";
export type { Reward };

const css = `
@keyframes cq-rise { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes cq-pop { 0% { transform: scale(.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
.cq-rise { animation: cq-rise .45s cubic-bezier(.2,.9,.3,1.2) both; }
.cq-pop { animation: cq-pop .5s ease-out both; }
@media (prefers-reduced-motion: reduce) { .cq-rise, .cq-pop { animation: none; } }
`;

function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Jump straight to the total; deferred so it isn't a synchronous setState in the effect.
      const id = requestAnimationFrame(() => setN(target));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

/** "Discovery" + Soy -> "Soy unlocked · Defense". Other reasons are shown as given by 7a. */
function describe(r: Reward): { title: string; sub: string | null } {
  const entry = r.dexGroup ? dexEntry(r.dexGroup) : undefined;
  if (/discover/i.test(r.reason) && r.dexGroup) {
    return {
      title: `${r.dexGroup} unlocked`,
      sub: entry?.trait ? `New trait: ${entry.trait}` : "Base stats",
    };
  }
  return { title: r.reason, sub: r.dexGroup ?? null };
}

/** Badge per reward kind: group initials for discovery, a medal for mastery, symbols for the rest. */
function Badge({ r }: { r: Reward }) {
  const mastery = /(bronze|silver|gold)/i.exec(r.reason)?.[1]?.toLowerCase() as MedalKind | undefined;
  if (mastery) return <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90"><Medal medal={mastery} size={26} /></span>;
  const entry = r.dexGroup ? dexEntry(r.dexGroup) : undefined;
  const symbol = /discover/i.test(r.reason) && entry ? entry.group.slice(0, 2)
    : /complete/i.test(r.reason) ? "✓"
    : /combo/i.test(r.reason) ? "+"
    : /quest/i.test(r.reason) ? "★"
    : "•";
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: entry?.color ?? "#15803d" }} aria-hidden>
      {symbol}
    </span>
  );
}

export default function RewardsBanner({ rewards }: { rewards: Reward[] }) {
  const total = rewards.reduce((s, r) => s + r.points, 0);
  const shown = useCountUp(total);
  if (rewards.length === 0) return null;

  return (
    <section aria-label="Rewards for this meal" className="@container overflow-hidden rounded-3xl bg-gradient-to-br from-leaf to-leaf-dark p-4 text-white shadow-lg">
      <style>{css}</style>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold uppercase tracking-wide text-white/80">You earned</p>
        <p className="cq-pop text-4xl font-black tabular-nums" aria-live="polite">
          +{shown}
          <span className="ml-1 text-lg font-bold">pts</span>
        </p>
      </div>

      <ul className="mt-3 grid gap-2 @xl:grid-cols-2">
        {rewards.map((r, i) => {
          const { title, sub } = describe(r);
          const discovery = /discover/i.test(r.reason);
          return (
            <li
              key={`${r.reason}-${r.dexGroup ?? ""}-${i}`}
              className={`cq-rise flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 ${discovery ? "bg-palm text-ink" : "bg-white/15"}`}
              style={{ animationDelay: `${250 + i * 140}ms` }}
            >
              <Badge r={r} />
              <span className="flex-1 leading-tight">
                <span className="block font-bold">{title}</span>
                {sub && <span className={`block text-sm ${discovery ? "text-ink/70" : "text-white/80"}`}>{sub}</span>}
              </span>
              <span className="text-lg font-black tabular-nums">+{r.points}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
