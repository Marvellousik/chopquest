// Throwaway preview of all 9 pet states (task 7b). Delete before merge, or keep out of the nav.
import Pet, { type PetMood, type PetStage } from "@/components/pet/Pet";

const stages: { stage: PetStage; label: string; points: string }[] = [
  { stage: "egg", label: "Egg (seed)", points: "< 100 pts" },
  { stage: "young", label: "Young (sprout)", points: "100–399 pts" },
  { stage: "evolved", label: "Evolved", points: "400+ pts" },
];
const moods: { mood: PetMood; label: string }[] = [
  { mood: "happy", label: "Happy · 3+ groups" },
  { mood: "content", label: "Content · 1–2" },
  { mood: "sleepy", label: "Sleepy · 0" },
];

export default function PetPreview() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-leaf-dark">Pet preview</h1>
        <p className="text-sm text-stone-600">3 stages × 3 moods. Mood comes from weekly diversity; stage never goes down.</p>
      </header>
      {stages.map(({ stage, label, points }) => (
        <section key={stage} className="rounded-3xl bg-white p-3 shadow-sm">
          <h2 className="px-1 font-bold">
            {label} <span className="font-normal text-stone-500">· {points}</span>
          </h2>
          <div className="grid grid-cols-3">
            {moods.map(({ mood, label: moodLabel }) => (
              <figure key={mood} className="flex flex-col items-center">
                <Pet stage={stage} mood={mood} size={110} />
                <figcaption className="text-center text-xs text-stone-600">{moodLabel}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
