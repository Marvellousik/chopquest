import type { Metadata } from "next";
import SidePicker from "@/components/SidePicker";

export const metadata: Metadata = { title: "Pick your side · ChopQuest" };

// The front door of the app: students pick Chop Squad, restaurant managers pick Kitchen.
export default function Start() {
  return <SidePicker />;
}
