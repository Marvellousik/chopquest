import type { ReactNode } from "react";

// Title block at the top of each tab screen: left-aligned, title then one line. `aside` sits to
// the right (a counter, a badge). No emoji or decorative icon above the title.
export default function PageHeader({ title, subtitle, aside }: { title: string; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 motion-safe:animate-rise">
      <div className="min-w-0">
        <h1 className="text-3xl font-black tracking-tight [overflow-wrap:break-word]">{title}</h1>
        {subtitle && <p className="mt-1 text-pretty text-muted">{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}
