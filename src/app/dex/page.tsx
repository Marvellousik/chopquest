import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import DexMedallion from "@/components/DexMedallion";

export const metadata: Metadata = { title: "Protein Dex · ChopQuest" };

// PLACEHOLDER: owner Dev 3 (task 7c). Wire `unlocked` and the counter to dex_progress.
// Groups and traits come from CLAUDE.md. Everything shows as locked until real data lands.
const GROUPS = [
  { group: "Beans", trait: "Strength" },
  { group: "Soy", trait: "Defense" },
  { group: "Bambara", trait: "Stamina" },
  { group: "Groundnut", trait: "Energy" },
  { group: "Egusi", trait: "Recovery" },
  { group: "Mushroom", trait: "Focus" },
  { group: "Iru", trait: "Wisdom" },
  { group: "Tigernut", trait: "Speed" },
  { group: "Pigeon pea", trait: "Agility" },
  { group: "Animal", trait: "Base stats" },
];

export default function DexPage() {
  return (
    <section className="flex flex-col gap-8">
      <PageHeader
        title="Protein Dex"
        subtitle="Eat a protein for the first time to unlock it and give your pet its trait."
        aside={
          <span className="shrink-0 rounded-2xl bg-ink-soft px-3 py-2 text-center text-on-ink">
            <span className="block text-2xl font-black tabular-nums leading-none">{GROUPS.length}</span>
            <span className="text-xs font-bold text-on-ink-muted">to find</span>
          </span>
        }
      />
      <ul className="grid grid-cols-3 gap-x-3 gap-y-6">
        {GROUPS.map((g, i) => (
          <li key={g.group} className={i === GROUPS.length - 1 ? "col-start-2" : ""}>
            <DexMedallion group={g.group} trait={g.trait} delayMs={i * 60} />
          </li>
        ))}
      </ul>
    </section>
  );
}
