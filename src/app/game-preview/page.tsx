"use client";
// Throwaway preview of the 7c screens with fake data (no DB). Delete once the real pages are wired.

import { useState } from "react";
import DexGrid from "@/components/game/DexGrid";
import HomeScreen from "@/components/game/HomeScreen";
import RewardsBanner, { type Reward } from "@/components/game/RewardsBanner";

const FAKE_REWARDS: Reward[] = [
  { reason: "Discovery", points: 50, dexGroup: "Soy" },
  { reason: "Complete protein", points: 10 },
  { reason: "New combo", points: 15, dexGroup: "Beans + Soy" },
  { reason: "Bronze mastery", points: 20, dexGroup: "Beans" },
];

const FAKE_DEX = [
  { group: "Beans", mealCount: 12 },
  { group: "Animal", mealCount: 27 },
  { group: "Soy", mealCount: 1 },
  { group: "Groundnut", mealCount: 4 },
];

const TABS = ["Home", "Dex", "Rewards"] as const;
type Tab = (typeof TABS)[number];

export default function GamePreview() {
  const [tab, setTab] = useState<Tab>("Home");
  const [replay, setReplay] = useState(0);

  return (
    // Breaks out of the layout's phone-width column so wide screens can be previewed too.
    <div className="relative left-1/2 flex w-screen max-w-5xl -translate-x-1/2 flex-col gap-4 px-4">
      <nav className="flex gap-1 self-center rounded-full bg-paper p-1 shadow-sm" aria-label="Preview screens">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-12 rounded-full px-5 font-bold transition ${tab === t ? "bg-leaf text-white" : "text-muted hover:bg-mist"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Home" && (
        <HomeScreen
          nickname="Ola"
          groupName="Hall B"
          stage="young"
          mood="happy"
          totalPoints={265}
          weeklyDiversity={3}
          quests={
            <div className="rounded-3xl border-2 border-dashed border-line/50 p-4 text-center text-sm text-muted">
              QuestCards slot (Dev 2, task 6b)
            </div>
          }
        />
      )}
      {tab === "Dex" && <DexGrid progress={FAKE_DEX} />}
      {tab === "Rewards" && (
        <div className="flex flex-col gap-3">
          <RewardsBanner key={replay} rewards={FAKE_REWARDS} />
          <button onClick={() => setReplay((n) => n + 1)} className="min-h-12 self-center rounded-full bg-paper px-5 font-bold shadow-sm active:scale-95">
            Replay animation
          </button>
        </div>
      )}
    </div>
  );
}
