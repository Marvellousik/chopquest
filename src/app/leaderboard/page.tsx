import type { Metadata } from "next";
import LeaderboardScreen from "@/components/game/LeaderboardScreen";

export const metadata: Metadata = { title: "Leaderboard · ChopQuest" };

// Tasks 8a + 8b (Dev 3). Data comes from GET /api/leaderboard.
export default function LeaderboardPage() {
  return <LeaderboardScreen />;
}
