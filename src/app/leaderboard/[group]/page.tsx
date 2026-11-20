import type { Metadata } from "next";
import { Suspense } from "react";
import GroupScreen from "@/components/game/GroupScreen";

export const metadata: Metadata = { title: "Group · ChopQuest" };

// One group's own leaderboard: members ranked against each other this week.
async function Group({ params }: { params: PageProps<"/leaderboard/[group]">["params"] }) {
  const { group } = await params;
  return <GroupScreen name={decodeURIComponent(group)} />;
}

export default function GroupPage({ params }: PageProps<"/leaderboard/[group]">) {
  return (
    <Suspense fallback={<ul className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-3xl bg-stone-200" />)}</ul>}>
      <Group params={params} />
    </Suspense>
  );
}
