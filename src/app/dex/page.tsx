import { redirect } from "next/navigation";

// The Protein Dex is now the Inventory. Old links still work.
export default function DexPage() {
  redirect("/inventory");
}
