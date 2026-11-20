"use client";
// The landing page's numbers, read live from the database (never typed in).

import { useEffect, useState } from "react";

type Stats = { cafeterias: number; plantDishes: number; reviews: number; requests: number; sample: boolean };

function useCount(target: number | null) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target == null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - start) / 1100);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Num({ value, label }: { value: number | null; label: string }) {
  const n = useCount(value);
  return (
    <div className="num">
      <b>{value == null ? "–" : n}</b>
      <span>{label}</span>
    </div>
  );
}

export default function LiveCounts() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Stats | null) => d && setS(d))
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="nums">
        <Num value={s?.cafeterias ?? null} label="Cafeterias" />
        <Num value={s?.plantDishes ?? null} label="Plant dishes" />
        <Num value={s?.reviews ?? null} label="Student reviews" />
        <Num value={s?.requests ?? null} label={"“I'd try it” asks"} />
      </div>
      <p className="note">Counted live from our database{s?.sample ? ", including sample data until our cafeteria survey is in" : ""}.</p>
    </>
  );
}
