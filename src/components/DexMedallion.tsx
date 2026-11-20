import { LockIcon } from "./icons";

// One Protein Dex slot, drawn as a game medallion: a rotating dashed rim around a sealed core.
// Locked: dark core with a lock. Unlocked (Dev 3, task 7c): pass `unlocked` and it fills
// with the group's colour, its rim stops and its initial shows.
export default function DexMedallion({
  group,
  trait,
  unlocked = false,
  delayMs = 0,
}: {
  group: string;
  trait: string;
  unlocked?: boolean;
  delayMs?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center motion-safe:animate-pop" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="relative grid size-24 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="none" strokeWidth="2" style={{ stroke: "var(--color-line)" }} opacity="0.5" />
          <g className={unlocked ? "" : "motion-safe:animate-orbit"} style={{ transformOrigin: "50px 50px" }}>
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              strokeWidth="3"
              strokeDasharray="6 10"
              strokeLinecap="round"
              style={{ stroke: unlocked ? "var(--color-gold)" : "var(--color-leaf-dark)" }}
              opacity={unlocked ? 1 : 0.55}
            />
          </g>
        </svg>
        <div
          className={`grid size-[4.5rem] place-items-center rounded-full ${
            unlocked
              ? "bg-leaf-dark text-on-ink shadow-[inset_0_-6px_0_var(--color-leaf-deep)]"
              : "bg-ink-soft text-on-ink-muted shadow-[inset_0_-6px_0_var(--color-ink)]"
          }`}
        >
          {unlocked ? <span className="text-2xl font-black">{group[0]}</span> : <LockIcon size={26} />}
        </div>
      </div>
      <div>
        <p className="font-extrabold leading-tight">{group}</p>
        <p className="text-sm font-semibold text-muted">{trait}</p>
      </div>
    </div>
  );
}
