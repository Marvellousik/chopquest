import type { Metadata } from "next";
import { Button, PageHeader } from "@/components/ui";
import { ScanIcon, TrophyIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Leaderboard · ChopQuest" };

// PLACEHOLDER: owner Dev 3 (tasks 8a, 8b). Replace the empty state with GET /api/leaderboard.
// No sample figures on purpose: the board shows real groups or nothing.
export default function LeaderboardPage() {
  return (
    <section className="flex flex-1 flex-col gap-8">
      <PageHeader title="Leaderboard" subtitle="Groups rank by how many different proteins their members eat each week." />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="relative grid size-40 place-items-center motion-safe:animate-pop">
          <svg viewBox="0 0 160 160" className="absolute inset-0 size-full" aria-hidden>
            <g className="motion-safe:animate-orbit" style={{ transformOrigin: "80px 80px" }}>
              <circle cx="80" cy="80" r="74" fill="none" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" style={{ stroke: "var(--color-gold-deep)" }} />
            </g>
            <circle cx="80" cy="80" r="58" style={{ fill: "var(--color-ink-soft)" }} />
          </svg>
          <TrophyIcon size={64} className="relative text-gold motion-safe:animate-float" />
          <span aria-hidden className="absolute right-6 top-5 size-2 rounded-full bg-gold motion-safe:animate-blink" />
          <span aria-hidden className="absolute bottom-8 left-5 size-1.5 rounded-full bg-gold motion-safe:animate-blink [animation-delay:600ms]" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black">No scores yet this week</h2>
          <p className="text-pretty text-muted">Scan a meal to put your group on the board. It resets every Monday.</p>
        </div>
        <Button href="/scan" size="lg" icon={<ScanIcon />}>
          Scan a meal
        </Button>
      </div>
    </section>
  );
}
