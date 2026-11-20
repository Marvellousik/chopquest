// Pet art (task 7b). A black-eyed-bean creature: the bean behind akara and moi moi.
// egg = seed, young = sprout, evolved = full plant buddy. Mood only changes the face and motion;
// the pet never loses a stage.

export type PetStage = "egg" | "young" | "evolved";
export type PetMood = "happy" | "content" | "sleepy";

type Props = { stage: PetStage; mood: PetMood; size?: number; className?: string };

const INK = "#3b2a1a";
const BEAN = "#fdf3dc";
const BEAN_SHADE = "#f1dfb6";
const LEAF = "#22c55e";
const LEAF_DARK = "#15803d";
const BLUSH = "#fb7185";

const STAGE_SCALE: Record<PetStage, number> = { egg: 0.72, young: 0.88, evolved: 1 };

const css = `
.cq-pet .cq-body { transform-box: fill-box; transform-origin: 50% 100%; }
.cq-pet.happy .cq-body { animation: cq-bounce 1.1s ease-in-out infinite; }
.cq-pet.content .cq-body { animation: cq-bob 2.6s ease-in-out infinite; }
.cq-pet.sleepy .cq-body { animation: cq-breathe 3.8s ease-in-out infinite; }
.cq-pet .cq-z { animation: cq-float 3s ease-in-out infinite; }
.cq-pet .cq-z2 { animation-delay: 1s; }
.cq-pet .cq-spark { transform-box: fill-box; transform-origin: center; animation: cq-twinkle 1.4s ease-in-out infinite; }
.cq-pet .cq-spark2 { animation-delay: .7s; }
@keyframes cq-bounce { 0%,100% { transform: translateY(0) scale(1,1); } 30% { transform: translateY(-10px) scale(.97,1.03); } 55% { transform: translateY(0) scale(1.04,.96); } }
@keyframes cq-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes cq-breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.03,.97); } }
@keyframes cq-float { 0% { opacity: 0; transform: translate(0,0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(10px,-18px); } }
@keyframes cq-twinkle { 0%,100% { opacity: .2; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .cq-pet * { animation: none !important; } }
`;

function Leaf({ x, y, angle, length = 26, flip = false }: { x: number; y: number; angle: number; length?: number; flip?: boolean }) {
  const w = length * 0.45 * (flip ? -1 : 1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={`M0 0 Q ${w} ${-length / 2} 0 ${-length} Q ${-w * 0.35} ${-length / 2} 0 0 Z`} fill={LEAF} stroke={LEAF_DARK} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M0 -3 L0 ${-length + 5}`} stroke={LEAF_DARK} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

function Face({ mood }: { mood: PetMood }) {
  const eyes = [-17, 17].map((dx) => {
    const x = 100 + dx;
    const y = 118;
    if (mood === "happy")
      return <path key={dx} d={`M${x - 7} ${y + 3} Q${x} ${y - 7} ${x + 7} ${y + 3}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    if (mood === "sleepy")
      return <path key={dx} d={`M${x - 7} ${y} Q${x} ${y + 6} ${x + 7} ${y}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
    return (
      <g key={dx}>
        <circle cx={x} cy={y} r={6.5} fill={INK} />
        <circle cx={x + 2} cy={y - 2.5} r={2.2} fill="#fff" />
      </g>
    );
  });

  const mouth =
    mood === "happy" ? (
      <g>
        <path d="M88 132 Q100 150 112 132 Z" fill="#9f1239" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M94 140 Q100 136 106 140 Q103 145 100 145 Q97 145 94 140 Z" fill={BLUSH} />
      </g>
    ) : mood === "content" ? (
      <path d="M91 133 Q100 141 109 133" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    ) : (
      <ellipse cx={100} cy={136} rx={3.5} ry={2.5} fill={INK} />
    );

  return (
    <g>
      {eyes}
      {mood !== "sleepy" && (
        <g fill={BLUSH} opacity={mood === "happy" ? 0.55 : 0.35}>
          <ellipse cx={72} cy={131} rx={8} ry={5} />
          <ellipse cx={128} cy={131} rx={8} ry={5} />
        </g>
      )}
      {mouth}
    </g>
  );
}

export default function Pet({ stage, mood, size = 160, className = "" }: Props) {
  const s = STAGE_SCALE[stage];
  const droop = mood === "sleepy" ? 1 : 0;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`ChopQuest pet, ${stage}, ${mood}`}
      className={`cq-pet ${mood} ${className}`}
    >
      <style>{css}</style>

      {/* ground shadow */}
      <ellipse cx={100} cy={180} rx={52 * s} ry={7} fill="#000" opacity={0.1} />

      {/* egg sits in a little leaf nest */}
      {stage === "egg" && (
        <g>
          <Leaf x={80} y={182} angle={-70} length={30} />
          <Leaf x={120} y={182} angle={70} length={30} flip />
        </g>
      )}

      <g className="cq-body">
        <g transform={`translate(100 178) scale(${s}) translate(-100 -178)`}>
          {/* feet (evolved) */}
          {stage === "evolved" && (
            <g fill={LEAF_DARK}>
              <ellipse cx={80} cy={176} rx={13} ry={6} />
              <ellipse cx={120} cy={176} rx={13} ry={6} />
            </g>
          )}

          {/* leaf arms (evolved) */}
          {stage === "evolved" && (
            <g>
              <Leaf x={50} y={135} angle={droop ? -120 : -60} length={30} />
              <Leaf x={150} y={135} angle={droop ? 120 : 60} length={30} flip />
            </g>
          )}

          {/* sprout / crown */}
          {stage === "young" && (
            <g transform={droop ? "rotate(18 100 78)" : undefined}>
              <path d="M100 78 Q98 64 100 50" fill="none" stroke={LEAF_DARK} strokeWidth={3.5} strokeLinecap="round" />
              <Leaf x={100} y={54} angle={droop ? -95 : -55} length={26} />
              <Leaf x={100} y={54} angle={droop ? 95 : 55} length={26} flip />
            </g>
          )}
          {stage === "evolved" && (
            <g transform={droop ? "rotate(14 100 78)" : undefined}>
              <path d="M100 78 Q99 62 100 46" fill="none" stroke={LEAF_DARK} strokeWidth={4} strokeLinecap="round" />
              <Leaf x={100} y={52} angle={droop ? -100 : -60} length={30} />
              <Leaf x={100} y={52} angle={droop ? 100 : 60} length={30} flip />
              <Leaf x={100} y={48} angle={droop ? 25 : 0} length={30} />
            </g>
          )}

          {/* bean body */}
          <path
            d="M100 74 C136 70 160 96 156 132 C152 164 126 178 100 177 C72 176 44 162 44 130 C44 102 58 86 76 80 C86 77 92 80 100 74 Z"
            fill={BEAN}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          {/* soft shading */}
          <path d="M60 150 C70 168 96 174 118 170 C100 176 70 172 58 156 Z" fill={BEAN_SHADE} />
          {/* the black "eye" of the black-eyed bean */}
          <ellipse cx={132} cy={156} rx={9} ry={5.5} transform="rotate(-30 132 156)" fill={INK} />
          <ellipse cx={132} cy={156} rx={4} ry={2} transform="rotate(-30 132 156)" fill="#6b4f35" />

          {/* egg: crack across the top */}
          {stage === "egg" && (
            <path d="M74 90 L84 98 L92 88 L101 97 L110 87 L119 96 L127 89" fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          )}

          <Face mood={mood} />
        </g>
      </g>

      {/* mood extras */}
      {mood === "sleepy" && (
        <g fill={INK} fontFamily="inherit" fontWeight={800}>
          <text className="cq-z" x={146} y={70} fontSize={18}>z</text>
          <text className="cq-z cq-z2" x={158} y={54} fontSize={13}>z</text>
        </g>
      )}
      {mood === "happy" && (
        <g fill="#facc15" stroke="#ca8a04" strokeWidth={1.5} strokeLinejoin="round">
          <path className="cq-spark" d="M40 60 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" />
          <path className="cq-spark cq-spark2" d="M160 52 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
        </g>
      )}
    </svg>
  );
}
