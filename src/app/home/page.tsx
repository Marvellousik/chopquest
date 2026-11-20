import type { Metadata } from "next";
import Onboarding from "@/components/Onboarding";

export const metadata: Metadata = { title: "Home · Chop Squad · ChopQuest" };

// Chop Squad home: sign up (nickname + group), then your pet and quests.
export default function SquadHome() {
  return <Onboarding />;
}
