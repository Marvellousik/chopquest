// Home = pet screen (task 7c). Pure presentational: data comes from GET /api/users/[id]/game.
// Grams, calories and price never appear here as score: points and diversity only.

import Link from "next/link";
import type { ReactNode } from "react";
import Pet from "@/components/pet/Pet";
import type { PetMood, PetStage } from "@/lib/rewards";

export type HomeProps = {
  nickname: string;
  groupName: string;
  stage: PetStage;
  mood: PetMood;
  totalPoints: number;
  weeklyDiversity: number;
  petName?: string;
  /** Dev 2's QuestCards go here. */
  quests?: ReactNode;
};

// Mirrors petStage() in src/lib/rewards.ts (egg < 100, young 100–399, evolved 400+).
const NEXT_STAGE: Record<PetStage, { at: number; name: string } | null> = {
  egg: { at: 100, name: "hatch" },
  young: { at: 400, name: "evolve" },
  evolved: null,
};

const MOOD_LINE: Record<PetMood, string> = {
  happy: "is buzzing! Loads of protein variety this week.",
  content: "is doing fine. One new protein group makes it happy.",
  sleepy: "is sleepy. Scan a meal with beans, soy or egg to wake it up.",
};

const GOAL = 3; // protein groups this week for a happy pet

export default function HomeScreen({ nickname, groupName, stage, mood, totalPoints, weeklyDiversity, petName = "Ewa", quests }: HomeProps) {
  const next = NEXT_STAGE[stage];
  const from = stage === "young" ? 100 : 0;
  const stagePct = next ? Math.min(100, ((totalPoints - from) / (next.at - from)) * 100) : 100;

  return (
    <div className="@container flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted">Hi, {nickname}</p>
          <h1 className="text-2xl font-black text-leaf-dark">ChopQuest</h1>
        </div>
        <span className="rounded-full bg-paper px-3 py-1.5 text-sm font-bold shadow-sm">{groupName}</span>
      </header>

      <div className="grid gap-4 @2xl:grid-cols-2 @2xl:items-start">
      {/* Pet card */}
      <section className="relative flex flex-col items-center rounded-[2rem] bg-gradient-to-b from-[#dcfce7] to-white px-4 pt-3 pb-4 shadow-sm">
        <Pet stage={stage} mood={mood} size={200} />
        <p className="text-center text-base leading-snug">
          <span className="font-black">{petName}</span> {MOOD_LINE[mood]}
        </p>
        <div className="mt-3 w-full">
          <div className="flex justify-between text-xs font-bold text-muted">
            <span className="capitalize">{stage}</span>
            <span>{next ? `${next.at - totalPoints} pts to ${next.name}` : "Fully grown"}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist" aria-hidden>
            <div className="h-full rounded-full bg-palm" style={{ width: `${stagePct}%` }} />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-paper p-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Points</p>
          <p className="text-3xl font-black tabular-nums">{totalPoints}</p>
        </div>
        <div className="rounded-3xl bg-paper p-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">This week</p>
          <p className="text-3xl font-black tabular-nums">
            {weeklyDiversity}
            <span className="ml-1 text-sm font-bold text-muted">{weeklyDiversity === 1 ? "group" : "groups"}</span>
          </p>
          <div className="mt-1 flex gap-1" aria-label={`${weeklyDiversity} of ${GOAL} protein groups for a happy pet`}>
            {Array.from({ length: Math.max(GOAL, weeklyDiversity) }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < weeklyDiversity ? "bg-leaf" : "bg-mist"}`} />
            ))}
          </div>
        </div>
      </section>

      <Link
        href="/scan"
        className="flex min-h-16 items-center justify-center gap-2 rounded-3xl bg-pepper text-xl font-black text-white shadow-lg transition hover:bg-orange-600 active:scale-[0.97] active:bg-orange-700"
      >
        <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx={12} cy={13} r={3.5} />
        </svg>
        Scan my meal
      </Link>

      {quests && (
        <section aria-label="Quests" className="flex flex-col gap-2">
          <h2 className="text-lg font-black">This week&apos;s quests</h2>
          {quests}
        </section>
      )}
      </div>
      </div>

      <p className="text-center text-xs text-muted">Protein figures are estimates, not medical advice.</p>
    </div>
  );
}
