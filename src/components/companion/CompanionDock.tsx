"use client";
// The companion lives on every screen: a small bean in the corner that grows with what you eat.
// Tap it to open the companion panel (status, what you're missing, and the chat).

import { useEffect, useState } from "react";
import Pet from "@/components/pet/Pet";
import CompanionPanel from "./CompanionPanel";
import { loadPetName, useCompanion } from "./useCompanion";

export default function CompanionDock() {
  const { state, refresh } = useCompanion();
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [name, setName] = useState("Ewa");

  useEffect(() => {
    const id = requestAnimationFrame(() => setName(loadPetName()));
    return () => cancelAnimationFrame(id);
  }, []);

  // One gentle nudge per session: what the companion is hungry for.
  useEffect(() => {
    if (state.status !== "ready") return;
    try {
      if (sessionStorage.getItem("cq_tip")) return;
      sessionStorage.setItem("cq_tip", "1");
    } catch {}
    const want = state.c.missingThisWeek[0];
    const line = state.c.scans === 0 ? "Scan a meal and I'll start growing!" : want ? `I'm craving ${want.toLowerCase()} this week!` : "We're eating so well this week!";
    const show = setTimeout(() => setTip(line), 1500);
    const hide = setTimeout(() => setTip(null), 7500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [state]);

  const stage = state.status === "ready" ? state.c.stage : "egg";
  const mood = state.status === "ready" ? state.c.mood : "content";
  const strength = state.status === "ready" ? state.c.strength : 0;

  return (
    <>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
        {tip && !open && (
          <button onClick={() => { setTip(null); setOpen(true); }} className="cq-bubble max-w-48 rounded-2xl rounded-br-sm bg-white px-3 py-2 text-left text-sm font-bold text-green-950 shadow-lg ring-1 ring-green-900/10">
            {tip}
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open ${name}, your companion`}
          className="relative flex size-16 items-center justify-center rounded-full bg-[#f3fbe9] shadow-[0_10px_24px_-8px_#14532d] ring-4 ring-white transition active:scale-90 md:size-20"
        >
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="16.5" fill="none" stroke="#dcfce7" strokeWidth="2" />
            <circle cx="18" cy="18" r="16.5" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeDasharray={103.7} strokeDashoffset={103.7 * (1 - strength / 100)} />
          </svg>
          <Pet stage={stage} mood={mood} size={56} className="relative md:scale-110" />
        </button>
      </div>
      <style>{`@keyframes cq-bubble { from { opacity: 0; transform: translateY(8px) scale(.9); } to { opacity: 1; transform: none; } } .cq-bubble { animation: cq-bubble .35s ease-out both; transform-origin: bottom right; } @media (prefers-reduced-motion: reduce) { .cq-bubble { animation: none; } }`}</style>
      {open && <CompanionPanel state={state} name={name} onRename={setName} onClose={() => setOpen(false)} onRefresh={refresh} />}
    </>
  );
}
