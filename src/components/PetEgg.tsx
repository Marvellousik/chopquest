// The pet's first stage, drawn in SVG and animated like an idle game character:
// it floats, its shadow breathes, it wobbles now and then and a highlight glints.
// STAND-IN until Dev 3's pet art (task 7b) lands; keep the same props so it swaps cleanly.
export default function PetEgg({ size = 168, still = false }: { size?: number; still?: boolean }) {
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }} aria-hidden>
      <div className={still ? "" : "motion-safe:animate-float"}>
        <svg
          viewBox="0 0 120 150"
          width={size}
          height={size * 1.25}
          className={`origin-bottom ${still ? "" : "motion-safe:animate-wobble"}`}
        >
          <defs>
            <radialGradient id="egg-body" cx="38%" cy="30%" r="75%">
              <stop offset="0%" style={{ stopColor: "var(--color-shell-hi)" }} />
              <stop offset="55%" style={{ stopColor: "var(--color-shell)" }} />
              <stop offset="100%" style={{ stopColor: "var(--color-shell-lo)" }} />
            </radialGradient>
            <linearGradient id="egg-band" x1="0" x2="1">
              <stop offset="0%" style={{ stopColor: "var(--color-leaf)" }} />
              <stop offset="100%" style={{ stopColor: "var(--color-leaf-deep)" }} />
            </linearGradient>
            <clipPath id="egg-clip">
              <path d="M60 6C30 6 10 52 10 88c0 32 22 56 50 56s50-24 50-56C110 52 90 6 60 6Z" />
            </clipPath>
          </defs>
          <path d="M60 6C30 6 10 52 10 88c0 32 22 56 50 56s50-24 50-56C110 52 90 6 60 6Z" fill="url(#egg-body)" />
          <g clipPath="url(#egg-clip)">
            {/* zig-zag band: the shell's "crack line" */}
            <path d="M0 92 14 82l14 12 14-12 14 12 14-12 14 12 14-12 14 12 10-8v26H0Z" fill="url(#egg-band)" />
            <path d="M0 92 14 82l14 12 14-12 14 12 14-12 14 12 14-12 14 12 10-8" fill="none" style={{ stroke: "var(--color-leaf-deep)" }} strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="40" cy="52" r="5" style={{ fill: "var(--color-shell-speck)" }} opacity="0.55" />
            <circle cx="78" cy="40" r="3.5" style={{ fill: "var(--color-shell-speck)" }} opacity="0.5" />
            <circle cx="84" cy="66" r="4.5" style={{ fill: "var(--color-shell-speck)" }} opacity="0.45" />
            <circle cx="30" cy="124" r="4" style={{ fill: "var(--color-leaf-deep)" }} opacity="0.35" />
            <circle cx="88" cy="128" r="3" style={{ fill: "var(--color-leaf-deep)" }} opacity="0.35" />
          </g>
          <ellipse cx="42" cy="36" rx="10" ry="16" style={{ fill: "var(--color-paper)" }} opacity="0.55" transform="rotate(-24 42 36)" />
          <g className={still ? "" : "motion-safe:animate-glint"} style={{ transformOrigin: "88px 28px" }}>
            <path d="M88 18v20M78 28h20" style={{ stroke: "var(--color-paper)" }} strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <div
        className={`-mt-2 h-4 rounded-[50%] bg-ink opacity-20 ${still ? "" : "motion-safe:animate-shadow"}`}
        style={{ width: size * 0.62 }}
      />
    </div>
  );
}
