"use client";
// Campus pulse: what students are doing with plant dishes right now. A live HUD card with counters that
// count up and a feed where the next event slides in on top every few seconds. No emoji: initials,
// SVG icons and motion. Pauses on hover/focus and for people who ask for less motion.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PulseEvent } from "@/app/api/activity/route";
import { timeAgo, useApi } from "@/lib/cafe-client";
import { LeafIcon, ScanIcon, StarIcon, StoreIcon } from "@/components/icons";

type Pulse = { events: PulseEvent[]; week: { meals: number; reviews: number; asks: number } };

const VISIBLE = 4;
const STEP_MS = 2800;

const PULSE_CSS = `
@keyframes cp-in { 0% { opacity: 0; transform: translateY(-18px) scale(.96); } 60% { opacity: 1; transform: translateY(2px) scale(1.01); } 100% { opacity: 1; transform: none; } }
@keyframes cp-flash { 0% { opacity: .55; } 100% { opacity: 0; } }
@keyframes cp-ring { 0% { transform: scale(.6); opacity: .7; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes cp-slide { from { transform: translateY(-6px); } to { transform: none; } }
.cp-in { animation: cp-in .55s cubic-bezier(.2,.9,.3,1.15) both; }
.cp-flash { animation: cp-flash 1.4s ease-out both; }
.cp-ring { animation: cp-ring 1.6s ease-out infinite; }
.cp-slide { animation: cp-slide .45s ease-out both; }
@media (prefers-reduced-motion: reduce) { .cp-in, .cp-flash, .cp-ring, .cp-slide { animation: none; } }
`;

export default function CampusPulse({ cafeteria, title = "Live on campus" }: { cafeteria?: string; title?: string }) {
  const { state } = useApi<Pulse>(cafeteria ? `/api/activity?cafeteria=${encodeURIComponent(cafeteria)}` : "/api/activity");
  if (state.status !== "ready" || state.data.events.length === 0) return null;
  return <PulseCard data={state.data} title={title} />;
}

function PulseCard({ data, title }: { data: Pulse; title: string }) {
  const { events, week } = data;
  // Feed: newest first. Every STEP the next event in the loop drops in on top.
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || events.length <= VISIBLE) return;
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [paused, events.length]);

  // Replay the recent events oldest to newest, so each arrival is newer than the last, then loop.
  const rows = useMemo(() => {
    const n = events.length;
    const start = (((Math.max(0, n - VISIBLE) - tick) % n) + n) % n;
    return Array.from({ length: Math.min(VISIBLE, n) }, (_, i) => events[(start + i) % n]);
  }, [events, tick]);

  return (
    <section
      aria-label={title}
      className="relative overflow-hidden rounded-[2rem_2rem_2rem_0.75rem] bg-ink-soft p-4 text-on-ink shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{PULSE_CSS}</style>
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <span className="relative flex size-3" aria-hidden>
            <span className="cp-ring absolute inset-0 rounded-full bg-leaf" />
            <span className="relative size-3 rounded-full bg-leaf" />
          </span>
          {title}
        </h2>
        <span className="text-xs font-bold text-on-ink-muted">last 7 days</span>
      </header>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Counter label="plant meals" value={week.meals} />
        <Counter label="reviews" value={week.reviews} />
        <Counter label="asked for plant" value={week.asks} />
      </dl>

      {/* Keyed by tick: the new event drops in on top and the rest slide down a step. */}
      <ol key={tick} className="mt-3 flex min-h-[18.5rem] flex-col gap-2" aria-live="off">
        {rows.map((e, i) => (
          <li key={i} className={i === 0 ? "cp-in" : "cp-slide"} style={{ opacity: 1 - i * 0.14 }}>
            <Row e={e} fresh={i === 0 && tick > 0} />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Counts up from 0 the first time it shows. */
function Counter({ label, value }: { label: string; value: number }) {
  const [shown, setShown] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      raf.current = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf.current);
    }
    const start = performance.now();
    const run = (t: number) => {
      const k = Math.min(1, (t - start) / 1100);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-2">
      <dd className="text-2xl font-black tabular-nums text-palm">{shown.toLocaleString("en-NG")}</dd>
      <dt className="text-xs font-semibold text-on-ink-muted">{label}</dt>
    </div>
  );
}

const HUES = [142, 28, 48, 200, 330, 265, 12, 175];
function Avatar({ name }: { name: string }) {
  const h = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
  const initials = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "CQ";
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-ink"
      style={{ background: `hsl(${h} 75% 72%)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Row({ e, fresh }: { e: PulseEvent; fresh: boolean }) {
  const body =
    e.kind === "review" ? (
      <>
        <b className="font-extrabold">{e.nickname}</b> rated <b className="font-extrabold text-palm">{e.dish}</b>
        <span className="ml-1 inline-flex translate-y-0.5 items-center gap-px" aria-label={`${e.stars} stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} size={12} filled={i < e.stars} className={i < e.stars ? "text-gold" : "text-on-ink-muted"} />
          ))}
        </span>
      </>
    ) : e.kind === "meal" ? (
      <>
        <b className="font-extrabold">{e.nickname}</b> ate <b className="font-extrabold text-palm">{e.dish}</b>
        <span className="text-on-ink-muted"> for {e.crew}</span>
      </>
    ) : (
      <>
        A student asked <b className="font-extrabold">{e.cafe}</b> for a plant version of <b className="font-extrabold text-palm">{e.dish}</b>
      </>
    );
  const href = e.kind === "review" ? `/dishes/${e.dishId}` : e.cafeSlug ? `/cafeterias/${e.cafeSlug}` : null;
  const Icon = e.kind === "review" ? StarIcon : e.kind === "meal" ? ScanIcon : StoreIcon;
  const inner = (
    <span className="relative flex min-h-14 items-center gap-3 overflow-hidden rounded-2xl bg-white/[0.06] p-2 pr-3">
      {fresh && <span className="cp-flash pointer-events-none absolute inset-0 bg-leaf/40" aria-hidden />}
      {e.kind === "ask" ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pepper text-white" aria-hidden>
          <LeafIcon size={20} />
        </span>
      ) : (
        <Avatar name={e.nickname} />
      )}
      <span className="min-w-0 flex-1 text-sm leading-snug">
        {body}
        <span className="mt-0.5 flex items-center gap-1 text-xs text-on-ink-muted">
          <Icon size={12} />
          {e.kind !== "ask" && e.cafe ? `${e.cafe} · ` : ""}
          {timeAgo(e.at)}
        </span>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl transition hover:bg-white/5 active:scale-[0.99]">
      {inner}
    </Link>
  ) : (
    inner
  );
}
