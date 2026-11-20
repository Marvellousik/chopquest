// Small shared pieces for the cafeteria screens, in the ChopQuest plant style.
import Link from "next/link";
import type { ReactNode } from "react";
import { StarIcon } from "@/components/icons";

export const RISE_CSS = `
@keyframes cf-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes cf-pop { 0% { transform: scale(.5); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes cf-fill { from { width: 0; } }
.cf-rise { animation: cf-rise .5s cubic-bezier(.2,.9,.3,1.1) both; }
.cf-pop { animation: cf-pop .4s ease-out both; }
.cf-fill { animation: cf-fill 1s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cf-rise, .cf-pop, .cf-fill { animation: none; } }
`;

/** Read-only stars, with a partial last star. */
export function Stars({ value, size = 18, className = "" }: { value: number | null; size?: number; className?: string }) {
  const v = value ?? 0;
  return (
    <span className={`inline-flex items-center ${className}`} role="img" aria-label={value == null ? "No ratings yet" : `${v} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <StarIcon size={size} className="absolute inset-0 text-stone-300" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon size={size} filled className="text-amber-400" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const PODIUM = [
  { bg: "#facc15", ring: "#a16207", label: "Gold" },
  { bg: "#e2e8f0", ring: "#64748b", label: "Silver" },
  { bg: "#f59e0b", ring: "#92400e", label: "Bronze" },
];

export function RankBadge({ rank, size = 48 }: { rank: number | null; size?: number }) {
  const p = rank && rank <= 3 ? PODIUM[rank - 1] : null;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[45%_45%_45%_12%] font-black tabular-nums"
      style={{ width: size, height: size, fontSize: size * 0.5, background: p?.bg ?? "#ecfccb", color: p ? "#1c1917" : "#3f6212", boxShadow: p ? `inset 0 -3px 0 ${p.ring}` : undefined }}
      aria-label={rank ? `Rank ${rank}${p ? `, ${p.label}` : ""}` : "Not ranked yet"}
    >
      {rank ?? "–"}
    </span>
  );
}

export function SkeletonRows({ n = 3, h = "h-20", label = "Loading" }: { n?: number; h?: string; label?: string }) {
  return (
    <ul className="flex flex-col gap-2" aria-busy="true" aria-label={label}>
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className={`${h} animate-pulse rounded-3xl bg-green-100/70`} />
      ))}
    </ul>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-red-100">
      <p className="font-bold text-red-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="min-h-12 rounded-full bg-leaf px-6 font-black text-white hover:bg-leaf-dark active:scale-95">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyBox({ title, body, action }: { title: string; body?: string; action?: { href: string; label: string } }) {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl bg-white/90 p-6 text-center shadow-sm">
      <svg aria-hidden viewBox="0 0 64 64" className="w-16">
        <path d="M32 58V30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 36C32 22 22 14 10 14c0 12 8 22 22 22zM32 30c0-12 9-20 22-20 0 12-9 20-22 20z" fill="#86efac" stroke="#15803d" strokeWidth="2" />
        <ellipse cx="32" cy="58" rx="16" ry="4" fill="#d6d3d1" />
      </svg>
      <p className="text-xl font-black text-green-950">{title}</p>
      {body && <p className="max-w-sm text-stone-600">{body}</p>}
      {action && (
        <Link href={action.href} className="flex min-h-12 items-center rounded-full bg-leaf px-6 font-black text-white hover:bg-leaf-dark active:scale-95">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PriceComing() {
  return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">price coming</span>;
}

export function ScreenTitle({ title, sub, aside }: { title: string; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-black leading-tight text-green-950 md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-stone-600">{sub}</p>}
      </div>
      {aside}
    </header>
  );
}
