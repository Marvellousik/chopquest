// Inventory: the 10 protein groups, locked until a scanned meal contains one.
// Unlocked cards show trait, meal count and the medal (or progress to the next one).

import { DEX, MEDAL_STYLE, medalFor, nextMedal } from "./dex";
import Medal from "./Medal";

export type DexProgress = { group: string; mealCount: number };

export default function DexGrid({ progress, foods = {} }: { progress: DexProgress[]; foods?: Record<string, string[]> }) {
  const counts = new Map(progress.map((p) => [p.group, p.mealCount]));
  const found = DEX.filter((d) => counts.has(d.group)).length;

  return (
    <section aria-label="Inventory" className="@container flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-black">Protein slots</h2>
        <p className="font-bold text-leaf-dark">
          {found} <span className="font-semibold text-stone-500">of {DEX.length} found</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200" aria-hidden>
        <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${(found / DEX.length) * 100}%` }} />
      </div>

      <ul className="grid grid-cols-2 gap-3 @md:grid-cols-3 @3xl:grid-cols-5">
        {DEX.map((d) => {
          const count = counts.get(d.group);
          if (count === undefined) {
            return (
              <li key={d.group} className="flex min-h-36 flex-col gap-2 rounded-3xl border-2 border-dashed border-stone-300 bg-stone-100 p-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-stone-300 text-xl font-black text-stone-500" aria-hidden>
                  ?
                </span>
                <span className="font-extrabold text-stone-500">{d.group}</span>
                <span className="text-sm leading-snug text-stone-500">{d.hint}</span>
              </li>
            );
          }
          const medal = medalFor(count);
          const next = nextMedal(count);
          return (
            <li key={d.group} className="flex min-h-36 flex-col gap-1.5 rounded-3xl p-3 shadow-sm motion-safe:animate-pop" style={{ background: d.tint }}>
              <div className="flex items-start justify-between">
                <span
                  className="flex size-11 items-center justify-center rounded-2xl text-base font-black text-white"
                  style={{ background: d.color }}
                  aria-hidden
                >
                  {d.group.slice(0, 2)}
                </span>
                {medal && <Medal medal={medal} size={28} />}
              </div>
              <span className="font-extrabold">{d.group}</span>
              <span className="text-sm font-bold" style={{ color: d.color }}>
                {d.trait ? `${d.trait} · ${d.blurb}` : d.blurb}
              </span>
              <span className="text-sm text-stone-600">
                {count} {count === 1 ? "meal" : "meals"}
              </span>
              {foods[d.group]?.length ? <span className="text-xs leading-snug text-stone-600">{foods[d.group].slice(0, 3).join(", ")}</span> : null}
              {next && (
                <div className="mt-auto">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/80" aria-hidden>
                    <div className="h-full rounded-full" style={{ width: `${next.progress * 100}%`, background: d.color }} />
                  </div>
                  <span className="text-xs text-stone-500">
                    {next.at - count} more for {MEDAL_STYLE[next.medal].label}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
