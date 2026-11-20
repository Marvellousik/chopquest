import type { Metadata } from "next";
import BoardScreen from "@/components/cafe/BoardScreen";

export const metadata: Metadata = { title: "Campus Plant Board · ChopQuest" };

export default function BoardPage() {
  return <BoardScreen />;
}
