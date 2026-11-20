import type { Metadata } from "next";
import InventoryScreen from "@/components/game/InventoryScreen";

export const metadata: Metadata = { title: "Inventory · ChopQuest" };

export default function InventoryPage() {
  return <InventoryScreen />;
}
