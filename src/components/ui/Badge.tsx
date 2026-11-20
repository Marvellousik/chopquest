import type { ReactNode } from "react";

// Small pill for labels: pairing status, food type, medals, "estimate", "price coming".
// Colours come from the theme tokens only. Icons are SVG from src/components/icons.tsx.
export type BadgeTone = "leaf" | "pepper" | "palm" | "muted" | "ink" | "bronze" | "silver" | "gold";

const tones: Record<BadgeTone, string> = {
  leaf: "bg-leaf/15 text-leaf-deep",
  pepper: "bg-pepper/15 text-pepper-ink",
  palm: "bg-palm/35 text-warn-ink",
  muted: "bg-mist text-muted",
  ink: "bg-ink-soft text-on-ink",
  bronze: "bg-bronze text-ink",
  silver: "bg-silver text-ink",
  gold: "bg-gold text-ink",
};

export default function Badge({
  tone = "muted",
  icon,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
