"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DexIcon, HomeIcon, ScanIcon, TrophyIcon } from "./icons";

// Game-HUD bottom navigation: a floating dark bar with a glowing selector that slides
// to the current tab. Tabs are 56px tall. --nav-h (globals.css) covers its height + gap.
const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/scan", label: "Scan", Icon: ScanIcon },
  { href: "/inventory", label: "Inventory", Icon: DexIcon },
  { href: "/leaderboard", label: "Ranks", Icon: TrophyIcon },
] as const;

function activeIndex(pathname: string) {
  const i = TABS.findIndex((t) =>
    t.href === "/" ? pathname === "/" : pathname === t.href || pathname.startsWith(`${t.href}/`),
  );
  return i;
}

export default function BottomNav() {
  const pathname = usePathname();
  const current = activeIndex(pathname);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
    >
      <div className="relative mx-auto max-w-md rounded-3xl bg-ink-soft p-1.5 shadow-[0_10px_30px_-10px_var(--color-ink)] ring-1 ring-ink-line">
        {/* Sliding selector: moves with transform only. */}
        {current >= 0 && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/4)] rounded-2xl bg-leaf-dark shadow-[0_0_18px_-2px_var(--color-leaf)] transition-transform duration-300 ease-[cubic-bezier(0.22,1.2,0.36,1)]"
            style={{ transform: `translateX(${current * 100}%)` }}
          />
        )}
        <ul className="relative grid grid-cols-4">
          {TABS.map(({ href, label, Icon }, i) => {
            const active = i === current;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-extrabold focus-visible:outline-gold transition-[color,transform] duration-200 motion-safe:active:scale-90 ${
                    active ? "text-on-ink" : "text-on-ink-muted hover:text-on-ink"
                  }`}
                >
                  <Icon size={22} className={active ? "motion-safe:animate-pop" : ""} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
