import { MEDAL_STYLE, type Medal as MedalKind } from "./dex";

/** Small round medal badge. */
export default function Medal({ medal, size = 22 }: { medal: MedalKind; size?: number }) {
  const s = MEDAL_STYLE[medal];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={`${s.label} medal`}>
      <path d="M7 1 L10 9 L14 9 L17 1 Z" fill="#16a34a" />
      <circle cx={12} cy={15} r={8} fill={s.fill} stroke={s.ring} strokeWidth={2} />
      <path d="M12 10.5 l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 17.6l-2.8 1.5.6-3.1-2.3-2.2 3.1-.4Z" fill={s.ring} opacity={0.55} />
    </svg>
  );
}
