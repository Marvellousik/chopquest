"use client";
// Students ask for a plant version of a dish on this cafeteria's menu: the kitchen sees the count.

import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { deviceId, loadAsked, naira, postJson, saveAsked, useApi } from "@/lib/cafe-client";
import { CheckIcon, LeafIcon } from "@/components/icons";

export default function AskPlantVersion({ slug, publishedItemIds }: { slug: string; publishedItemIds: number[] }) {
  const menu = useApi<{ items: MenuItem[] }>(`/api/cafeterias/${slug}/menu`);
  const req = useApi<{ counts: Record<number, number> }>(`/api/cafeterias/${slug}/requests`);
  const [asked, setAsked] = useState<number[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAsked(loadAsked()));
    return () => cancelAnimationFrame(id);
  }, []);
  const base = req.state.status === "ready" ? req.state.data.counts : {};
  const count = (id: number) => counts[id] ?? base[id] ?? 0;

  if (menu.state.status !== "ready") return null; // quiet section: no skeleton or error noise under the dishes
  const items = menu.state.data.items.filter((m) => !publishedItemIds.includes(m.id) && m.breakdown?.some((p) => p.role === "protein"));
  if (items.length === 0) return null;

  async function ask(id: number) {
    setBusy(id);
    setError(null);
    try {
      const r = await postJson<{ count: number }>(`/api/menu-items/${id}/requests`, { deviceId: deviceId() });
      setCounts((c) => ({ ...c, [id]: r.count }));
      const next = [...new Set([...asked, id])];
      setAsked(next);
      saveAsked(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="ask" className="flex flex-col gap-3">
      <div>
        <h2 id="ask" className="text-xl font-black text-green-950">Ask for a plant version</h2>
        <p className="text-sm text-stone-600">Tap the dishes you&apos;d try without meat. The kitchen sees how many students asked.</p>
      </div>
      <ul className="flex flex-col divide-y divide-green-900/10 overflow-hidden rounded-[1.75rem_0.6rem] bg-white shadow-sm">
        {items.map((m) => {
          const done = asked.includes(m.id);
          const n = count(m.id);
          return (
            <li key={m.id} className="flex min-h-16 items-center gap-3 p-3">
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-green-950">{m.name}</span>
                <span className="block text-sm text-stone-600">
                  {naira(m.priceNgn)}
                  {n > 0 && <> · <b className="text-green-800">{n}</b> {n === 1 ? "student" : "students"} asked</>}
                </span>
              </span>
              <button
                onClick={() => ask(m.id)}
                disabled={done || busy === m.id}
                aria-pressed={done}
                className={`flex min-h-12 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-black transition active:scale-95 ${done ? "bg-green-100 text-green-900" : "bg-leaf text-white hover:bg-leaf-dark"}`}
              >
                {done ? <CheckIcon size={18} /> : <LeafIcon size={18} />}
                {done ? "Asked" : busy === m.id ? "Sending..." : "I'd try a plant version"}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="font-bold text-red-800">{error}</p>}
    </section>
  );
}
