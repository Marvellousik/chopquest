"use client";
// Navigation that grows like a plant, instead of a standard tab bar.
// Phone: a floating seed button; tapping it grows a "garden" of leaf tiles, in two beds.
// Laptop (md+): a vine down the left edge with a leaf per page; the current page is in bloom.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChefIcon, CloseIcon, DexIcon, HomeIcon, LeafIcon, PodiumIcon, ScanIcon, StoreIcon, SwapIcon, TrophyIcon, type IconComponent } from "@/components/icons";

type Item = { href: string; label: string; hint: string; Icon: IconComponent };
type Bed = { name: string; items: Item[] };

// Two separate apps under one roof: students (Chop Squad) and restaurant managers (Kitchen).
// "/" is the landing page and "/start" the front door (SidePicker): neither shows a menu.
const SWITCH: Item = { href: "/start", label: "Switch", hint: "Chop Squad or Kitchen", Icon: SwapIcon };

// Order follows a student's day: check in, eat somewhere, see how you're doing.
const SQUAD_BEDS: Bed[] = [
  {
    name: "Today",
    items: [
      { href: "/home", label: "Home", hint: "You and your pet", Icon: HomeIcon },
      { href: "/scan", label: "Scan", hint: "Snap a meal", Icon: ScanIcon },
    ],
  },
  {
    name: "Where to eat",
    items: [
      { href: "/board", label: "Board", hint: "Top plant dishes", Icon: PodiumIcon },
      { href: "/cafeterias", label: "Cafeterias", hint: "Every campus spot", Icon: StoreIcon },
    ],
  },
  {
    name: "Progress",
    items: [
      { href: "/inventory", label: "Inventory", hint: "Proteins, meals, diet", Icon: DexIcon },
      { href: "/leaderboard", label: "Ranks", hint: "Group league", Icon: TrophyIcon },
    ],
  },
];

const KITCHEN_BEDS: Bed[] = [
  {
    name: "Kitchen",
    items: [
      { href: "/kitchen", label: "Kitchen", hint: "Your cafeteria", Icon: ChefIcon },
      { href: "/demo", label: "Demo", hint: "Try it offline", Icon: LeafIcon },
    ],
  },
];

const KITCHEN_PATHS = ["/kitchen", "/demo"];
export const sideOf = (path: string): "front" | "kitchen" | "squad" =>
  path === "/" || path === "/start" ? "front" : KITCHEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ? "kitchen" : "squad";

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

const css = `
@keyframes vn-grow { from { opacity: 0; transform: translateY(18px) scale(.85) rotate(-4deg); } to { opacity: 1; transform: none; } }
@keyframes vn-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes vn-sprout { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.vn-grow { animation: vn-grow .42s cubic-bezier(.2,1.1,.3,1) both; }
.vn-sway { animation: vn-sway 3.6s ease-in-out infinite; transform-origin: 50% 100%; }
.vn-sprout { animation: vn-sprout .35s ease-out both; transform-origin: 50% 100%; }
@media (prefers-reduced-motion: reduce) { .vn-grow, .vn-sway, .vn-sprout { animation: none; } }
`;

export default function VineNav() {
  const path = usePathname();
  const side = sideOf(path);
  if (side === "front") return null; // the front door has no menu
  const beds = side === "kitchen" ? KITCHEN_BEDS : SQUAD_BEDS;
  const current = beds.flatMap((b) => b.items).find((i) => i.href !== "/" && isActive(i.href, path)) ?? null;
  return (
    <>
      <style>{css}</style>
      <SeedNav current={current} path={path} beds={beds} />
      <VineRail path={path} beds={beds} side={side} />
    </>
  );
}

/* ---------------- Phone: seed button + garden sheet ---------------- */

function SeedNav({ current, path, beds }: { current: Item | null; path: string; beds: Bed[] }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(path);
  const seedRef = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // Close the garden after navigating (state adjusted during render, not in an effect).
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        seedRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const CurrentIcon = current?.Icon;
  let n = 0;

  return (
    <div className="md:hidden">
      {open && (
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-green-950/30 backdrop-blur-[2px]" />
      )}

      {open && (
        <nav
          id="garden"
          aria-label="Main"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-50 overflow-hidden rounded-[2rem] bg-[#f3fbe9] p-4 shadow-2xl ring-1 ring-green-900/10"
        >
          <svg aria-hidden className="pointer-events-none absolute -right-6 -top-8 w-40 text-green-200" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10 90C10 40 45 10 95 5 90 55 60 90 10 90z" />
          </svg>
          {beds.map((bed) => (
            <section key={bed.name} className="relative mb-3 last:mb-0">
              <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-wider text-green-800/70">{bed.name}</h2>
              <ul className={`grid gap-2 ${bed.items.length === 2 ? "grid-cols-2" : bed.items.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {bed.items.map((item) => {
                  const active = isActive(item.href, path);
                  const i = n++;
                  return (
                    <li key={item.href} className="vn-grow" style={{ animationDelay: `${i * 45}ms` }}>
                      <Link
                        ref={i === 0 ? firstLink : undefined}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-[1.6rem_0.5rem] px-1 py-2 text-center text-sm font-extrabold transition active:scale-95 ${
                          active ? "bg-leaf text-white shadow-[0_8px_20px_-8px_#15803d]" : "bg-white text-green-900 shadow-sm hover:bg-green-50"
                        }`}
                      >
                        <item.Icon size={24} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <Link
            href={SWITCH.href}
            className="relative mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/70 text-sm font-extrabold text-green-900 ring-1 ring-green-900/10 hover:bg-white"
          >
            <SwapIcon size={18} /> Switch: Chop Squad or Kitchen
          </Link>
        </nav>
      )}

      {/* The seed: current page, tap to open the garden. */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none">
        <button
          ref={seedRef}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="garden"
          aria-label={open ? "Close menu" : `Menu. You're on ${current?.label ?? "ChopQuest"}`}
          className="pointer-events-auto relative flex h-16 items-center gap-2 rounded-[2rem_2rem_2rem_0.75rem] bg-leaf-dark pl-4 pr-5 text-white shadow-[0_12px_28px_-8px_#14532d] ring-4 ring-[#f3fbe9] transition active:scale-95"
        >
          <span aria-hidden className="absolute -top-3 left-6 h-4 w-0.5 bg-green-700 vn-sprout" />
          <svg aria-hidden className="absolute -top-6 left-5 w-6 text-leaf vn-sway" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C12 12 6 6 2 6c0 6 4 12 10 16zM12 22c0-8 4-14 10-14 0 6-4 12-10 14z" />
          </svg>
          <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
            {open ? <CloseIcon size={22} /> : CurrentIcon ? <CurrentIcon size={22} /> : <LeafIcon size={22} />}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-base font-black">{open ? "Close" : current?.label ?? "Menu"}</span>
            <span className="block text-xs font-bold text-white/75">{open ? "Pick a page" : "Tap to explore"}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Laptop: the vine rail ---------------- */

type Pt = { x: number; y: number };

/** A wavy vine through every leaf: cubic curves that bow left and right alternately. */
function vinePath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  let d = `M${pts[0].x} ${pts[0].y - 28}L${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const bow = i % 2 ? 12 : -12;
    const dy = (b.y - a.y) / 3;
    d += `C${a.x + bow} ${a.y + dy} ${b.x + bow} ${b.y - dy} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d}C${last.x - 10} ${last.y + 14} ${last.x + 6} ${last.y + 26} ${last.x - 2} ${last.y + 40}`;
}

// Where the glow reached last time. The rail can remount during navigation, so this lives
// outside React state: the glow always starts from the previous page and slides to the new one.
let lastReach = 0;

const VINE_CSS = `
.vn-glow { transition: stroke-dasharray .8s cubic-bezier(.65,0,.35,1), stroke-dashoffset .8s cubic-bezier(.65,0,.35,1); }
@keyframes vn-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -28; } }
.vn-flow { animation: vn-flow 1.4s linear infinite; }
@keyframes vn-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
.vn-pulse { animation: vn-pulse 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .vn-glow { transition: none; } .vn-flow, .vn-pulse { animation: none; } }
`;

function VineRail({ path, beds, side }: { path: string; beds: Bed[]; side: "kitchen" | "squad" }) {
  const listRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const [vine, setVine] = useState<{ d: string; total: number; toNode: number[]; h: number }>({ d: "", total: 0, toNode: [], h: 0 });
  const items = beds.flatMap((b) => b.items);
  const activeIdx = items.findIndex((it) => isActive(it.href, path));

  // Measure every leaf's centre, draw the vine through them, and work out how far along the
  // vine each leaf sits, so the glow can grow (and slide) to the current page.
  const measure = useCallback(() => {
    const box = listRef.current;
    const probe = measureRef.current;
    if (!box || !probe) return;
    const origin = box.getBoundingClientRect();
    const pts = [...box.querySelectorAll<HTMLElement>("[data-leaf]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - origin.left + r.width / 2, y: r.top - origin.top + box.scrollTop + r.height / 2 };
    });
    const d = vinePath(pts);
    probe.setAttribute("d", d);
    const total = probe.getTotalLength();
    const toNode = pts.map((_, i) => {
      probe.setAttribute("d", vinePath(pts.slice(0, i + 1)).replace(/C[^C]*$/, "")); // stop at leaf i, drop the tail
      return probe.getTotalLength();
    });
    probe.setAttribute("d", d);
    setVine({ d, total, toNode, h: box.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [measure, beds]);

  const reach = activeIdx >= 0 ? vine.toNode[activeIdx] ?? 0 : 0;
  const [shown, setShown] = useState(lastReach);
  useEffect(() => {
    if (!vine.total) return;
    // Paint the old position first, then move: the CSS transition slides the glow along the curve.
    const id = requestAnimationFrame(() => {
      setShown(reach);
      lastReach = reach;
    });
    return () => cancelAnimationFrame(id);
  }, [reach, vine.total]);
  let i = 0;

  return (
    <nav aria-label="Main" className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#eef8e3]/90 px-4 py-6 backdrop-blur md:flex">
      <style>{VINE_CSS}</style>
      <Link href={side === "kitchen" ? "/kitchen" : "/home"} className="mb-5 flex items-center gap-2 px-2">
        <svg aria-hidden viewBox="0 0 32 32" className="size-9">
          <ellipse cx="16" cy="19" rx="11" ry="10" fill="#fdf3dc" stroke="#3b2a1a" strokeWidth="2" />
          <path d="M16 9c0-4 2-6 5-7-1 4-2 6-5 7zM16 9c-1-3-3-4-6-4 1 3 3 4 6 4z" fill="#22c55e" />
          <circle cx="12.5" cy="18" r="1.4" fill="#3b2a1a" /><circle cx="19.5" cy="18" r="1.4" fill="#3b2a1a" />
          <path d="M13.5 22q2.5 2 5 0" stroke="#3b2a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
        <span className="leading-tight">
          <span className="block text-xl font-black text-green-900">ChopQuest</span>
          <span className="block text-xs font-bold text-green-800/70">{side === "kitchen" ? "Kitchen" : "Chop Squad"}</span>
        </span>
      </Link>

      <div ref={listRef} className="relative -mx-2 flex flex-1 flex-col gap-4 overflow-y-auto px-2 pt-2">
        {/* The vine: a faint stem through every leaf, a glowing stretch grown down to the current
            page (it slides along the curve when you move), and sap flowing inside the glow. */}
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: vine.h || "100%" }} width="100%">
          <defs>
            <filter id="vn-blur" x="-50%" y="-10%" width="200%" height="120%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          <path ref={measureRef} d={vine.d} fill="none" stroke="none" />
          <path d={vine.d} fill="none" stroke="#86b58f" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
          {vine.total > 0 && shown > 0 && (
            <>
              <path
                className="vn-glow vn-pulse"
                d={vine.d}
                fill="none"
                stroke="#4ade80"
                strokeWidth={12}
                strokeLinecap="round"
                filter="url(#vn-blur)"
                strokeDasharray={`${shown} ${vine.total + 40}`}
              />
              <path className="vn-glow" d={vine.d} fill="none" stroke="#16a34a" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${shown} ${vine.total + 40}`} />
              <path
                className="vn-flow"
                d={vine.d}
                fill="none"
                stroke="#dcfce7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="4 10"
                mask="url(#vn-reach)"
              />
              <mask id="vn-reach" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <path className="vn-glow" d={vine.d} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${shown} ${vine.total + 40}`} />
              </mask>
            </>
          )}
        </svg>

        {beds.map((bed) => (
          <section key={bed.name} className="relative">
            <h2 className="mb-1.5 pl-14 text-xs font-black uppercase tracking-wider text-green-800/60">{bed.name}</h2>
            <ul className="flex flex-col gap-1.5">
              {bed.items.map((item) => {
                const active = isActive(item.href, path);
                const flip = i++ % 2 === 1;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-h-12 items-center gap-3 rounded-2xl py-1.5 pr-3 transition ${active ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
                    >
                      <span
                        data-leaf
                        className={`relative flex size-11 shrink-0 items-center justify-center transition duration-300 group-hover:scale-105 ${
                          flip ? "rounded-[0.5rem_1.4rem]" : "rounded-[1.4rem_0.5rem]"
                        } ${active ? "scale-105 bg-leaf text-white shadow-[0_0_0_4px_#bbf7d0,0_0_22px_2px_#4ade80]" : "bg-white text-green-800 ring-1 ring-green-900/10"}`}
                      >
                        <item.Icon size={21} />
                      </span>
                      <span className="leading-tight">
                        <span className={`block font-extrabold ${active ? "text-green-900" : "text-stone-700"}`}>{item.label}</span>
                        <span className="block text-xs text-stone-500">{item.hint}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <Link
        href={SWITCH.href}
        className="relative mt-3 flex min-h-12 items-center gap-3 rounded-2xl border border-green-900/10 bg-white/60 px-3 font-extrabold text-green-900 hover:bg-white"
      >
        <SwapIcon size={20} />
        <span className="leading-tight">
          Switch
          <span className="block text-xs font-normal text-stone-500">{side === "kitchen" ? "Go to Chop Squad" : "Go to Kitchen"}</span>
        </span>
      </Link>
      <p className="relative mt-3 px-2 text-xs text-stone-500">Protein and price figures are estimates, not medical advice.</p>
    </nav>
  );
}
