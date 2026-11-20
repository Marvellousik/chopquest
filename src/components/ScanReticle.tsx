// The scanner's viewfinder: four corner brackets that breathe, a laser line sweeping down,
// and (while analysing) the photo underneath. Pure SVG + CSS motion, no emoji.
export default function ScanReticle({ preview }: { preview?: string }) {
  const analysing = Boolean(preview);
  return (
    <div
      className={`relative mx-auto aspect-square w-full overflow-hidden rounded-3xl motion-safe:animate-pop ${
        analysing ? "max-w-xs bg-ink" : "max-w-[13rem] bg-ink-soft"
      }`}
      style={{ ["--sweep-distance" as string]: analysing ? "20rem" : "13rem" }}
    >
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL preview, never uploaded
        <img src={preview} alt="Your meal" className="absolute inset-0 size-full object-cover opacity-90" />
      )}
      {!analysing && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <div className="size-16 rounded-full border-4 border-leaf/60 motion-safe:animate-glint" />
        </div>
      )}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="none">
        <g
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ stroke: "var(--color-gold)" }}
          className="motion-safe:animate-glint"
        >
          <path d="M8 24V8h16M76 8h16v16M92 76v16H76M24 92H8V76" />
        </g>
      </svg>
      <div
        aria-hidden
        className="absolute inset-x-3 top-0 h-1 rounded-full bg-leaf shadow-[0_0_16px_4px_var(--color-leaf)] motion-safe:animate-sweep motion-reduce:hidden"
      />
    </div>
  );
}
