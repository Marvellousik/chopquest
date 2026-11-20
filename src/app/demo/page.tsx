import type { Metadata } from "next";
import DemoScreen from "@/components/cafe/DemoScreen";

export const metadata: Metadata = { title: "Demo · ChopQuest" };

export default function DemoPage() {
  return <DemoScreen />;
}
