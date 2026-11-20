"use client";
// 9. Top 3 swaps. Option 1 is large; 2 and 3 sit below. Numbers count up; the score ring fills.

import { useState } from "react";
import type { SwapOption } from "@/lib/types";
import { naira } from "@/lib/cafe-client";
import { CheckIcon, SwapIcon } from "@/components/icons";
import { PriceComing } from "../bits";
import { CountUp, ScoreRing } from "./anim";
import WhyUpgrade from "./WhyUpgrade";

const outIn = (o: SwapOption) => ({
  out: o.replaces.map((p) => `${p.label} ${p.grams} g`).join(" + "),
  in: o.adds.map((a) => `${a.label} ${a.grams} g`).join(" + "),
});

function Compare({ label, before, after, fmt, better, delay }: { label: string; before: number | null; after: number | null; fmt: (n: number) => string; better: "up" | "down"; delay: number }) {
  const delta = before != null && after != null ? after - before : null;
  const good = delta == null || delta === 0 ? null : better === "up" ? delta > 0 : delta < 0;
  return (
    <div className="rounded-2xl bg-stone-50 p-2.5">
      <p className="text-xs font-bold text-stone-500">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-sm text-stone-400 line-through decoration-1">{before == null ? "–" : fmt(before)}</span>
        <span className="text-xl font-black text-green-950">{after == null ? <PriceComing /> : <CountUp value={after} format={fmt} delay={delay} />}</span>
      </p>
      {good != null && delta != null && (
        <p className={`text-xs font-black ${good ? "text-green-700" : "text-orange-700"}`}>
          {delta > 0 ? "+" : "−"}
          {fmt(Math.abs(delta))}
        </p>
      )}
    </div>
  );
}

function Option({ o, priceNgn, big, onCard, busy, dishName, itemId }: { o: SwapOption; priceNgn: number; big: boolean; onCard: () => void; busy: boolean; dishName: string; itemId?: number }) {
  const [why, setWhy] = useState(big);
  const t = outIn(o);
  const margin = (c: number | null) => (c == null ? null : priceNgn - c);
  const d = big ? 200 : 400;
  return (
    <article
      className={`cf-rise flex flex-col gap-3 rounded-[2rem_2rem_2rem_0.75rem] p-4 shadow-sm ${big ? "bg-white ring-2 ring-leaf md:p-6" : "bg-white/90"}`}
      style={{ animationDelay: `${(o.rank - 1) * 120}ms` }}
      aria-label={`Swap option ${o.rank}`}
    >
      <header className="flex items-start gap-3">
        <span className={`flex shrink-0 items-center justify-center rounded-full font-black ${big ? "size-10 bg-leaf text-lg text-white" : "size-8 bg-green-100 text-green-900"}`}>{o.rank}</span>
        <div className="min-w-0 flex-1">
          {big && <p className="text-xs font-black uppercase tracking-wide text-leaf-dark">Best swap</p>}
          <p className={`${big ? "text-lg" : "text-base"} font-extrabold leading-snug text-green-950`}>
            <span className="text-rose-800">{t.out} out.</span> <span className="text-green-800">{t.in} in.</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {o.completeProtein && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-900">
                <CheckIcon size={14} /> Complete protein
              </span>
            )}
            {o.extraPrepMin > 0 && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">+{o.extraPrepMin} min prep</span>}
            {o.priceMissing.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 text-xs text-stone-600">
                {f}: <PriceComing />
              </span>
            ))}
          </div>
        </div>
        <ScoreRing score={o.score} size={big ? 72 : 56} />
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Compare label="Protein (est.)" before={o.before.proteinG} after={o.after.proteinG} fmt={(n) => `${Math.round(n)} g`} better="up" delay={d} />
        <Compare label="Cost / plate (est.)" before={o.before.costNgn} after={o.after.costNgn} fmt={naira} better="down" delay={d + 100} />
        <Compare label="Margin / plate (est.)" before={margin(o.before.costNgn)} after={margin(o.after.costNgn)} fmt={naira} better="up" delay={d + 200} />
      </div>

      {why ? (
        <WhyUpgrade o={o} priceNgn={priceNgn} dishName={dishName} itemId={itemId} />
      ) : (
        <button type="button" onClick={() => setWhy(true)} className="min-h-12 rounded-2xl bg-[#f3fbe9] px-3 text-left font-extrabold text-green-950 hover:bg-green-100">
          Why put this on your menu?
        </button>
      )}
      <button
        type="button"
        onClick={onCard}
        disabled={busy}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-full font-black transition active:scale-[0.98] disabled:opacity-60 ${big ? "bg-leaf text-white hover:bg-leaf-dark" : "bg-green-100 text-green-900 hover:bg-green-200"}`}
      >
        <SwapIcon size={20} /> {busy ? "Writing the card..." : "Make kitchen card"}
      </button>
    </article>
  );
}

export default function SwapResults({ options, priceNgn, onCard, busyRank, dishName, itemId }: { options: SwapOption[]; priceNgn: number; onCard: (o: SwapOption) => void; busyRank: number | null; dishName?: string; itemId?: number }) {
  const [first, ...rest] = options;
  return (
    <section aria-label="Swap options" className="flex flex-col gap-3">
      <h2 className="text-2xl font-black text-green-950">Top {options.length} swaps</h2>
      <Option o={first} priceNgn={priceNgn} big onCard={() => onCard(first)} busy={busyRank === first.rank} dishName={dishName ?? "this dish"} itemId={itemId} />
      {rest.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {rest.map((o) => (
            <Option key={o.rank} o={o} priceNgn={priceNgn} big={false} onCard={() => onCard(o)} busy={busyRank === o.rank} dishName={dishName ?? "this dish"} itemId={itemId} />
          ))}
        </div>
      )}
      <p className="text-xs text-stone-500">Protein and cost figures are estimates from our food list, not lab values or medical advice.</p>
    </section>
  );
}
