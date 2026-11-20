"use client";
// The landing page's numbers, read live from the database (never typed in).

import { useEffect, useRef, useState } from "react";

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

function Num({ value, label, i }: { value: number | null; label: string; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const n = useCount(seen ? value : null);
  return (
    <div className="num" ref={ref} data-reveal="up" style={{ "--d": `${i * 0.1}s` } as React.CSSProperties}>
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
        <Num i={0} value={s?.cafeterias ?? null} label="Cafeterias" />
        <Num i={1} value={s?.plantDishes ?? null} label="Plant dishes" />
        <Num i={2} value={s?.reviews ?? null} label="Student reviews" />
        <Num i={3} value={s?.requests ?? null} label={"“I'd try it” asks"} />
      </div>
      <p className="note">Counted live from our database{s?.sample ? ", including sample data until our cafeteria survey is in" : ""}.</p>
    </>
  );
}
