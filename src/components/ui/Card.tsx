import type { ComponentProps } from "react";

// A raised surface on the cream page: paper fill, no border-plus-shadow combo, one layer only
// (never put a Card inside a Card). Use it for real groupings, not to box every item in a grid.
export type CardTone = "default" | "highlight" | "warning";

const tones: Record<CardTone, string> = {
  default: "bg-paper ring-1 ring-line/30",
  highlight: "bg-paper ring-2 ring-leaf",
  warning: "bg-paper ring-2 ring-palm",
};

type Props = ComponentProps<"div"> & { tone?: CardTone; padded?: boolean };

export default function Card({ tone = "default", padded = true, className = "", ...rest }: Props) {
  return <div {...rest} className={`rounded-3xl ${padded ? "p-4" : ""} ${tones[tone]} ${className}`} />;
}
