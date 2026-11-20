"use client";
// Small honest note while demo data is on the site: the dishes, reviews and players are examples
// until the real cafeteria survey is in. Disappears by itself once the demo data is cleared.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function DemoNotice() {
  const path = usePathname();
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/demo-status")
      .then((r) => r.json())
      .then((d) => live && setDemo(Boolean(d?.demo)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!demo || path === "/") return null;
  return (
    <p role="note" className="mb-4 w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
      Sample data: some dishes, reviews and players are examples until our cafeteria survey is in.
    </p>
  );
}
