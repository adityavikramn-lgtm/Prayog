import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Tex } from "../../components/Tex";
import { Kan } from "../../mascot/Kan";
import { sceneFont } from "../../sceneFont";
import { COLORS, SURFACE } from "../../theme";
import { Backdrop, CLAMP, Captions, ChapterTitle, Confetti, Progress, PunchIn, Sfx, SfxName, fade, popIn } from "../../video/ui";
import {
  CU_AG,
  CU_NI,
  CU_NI_COOL,
  CU_NI_EX,
  CU_NI_ATOMS,
  CU_ZN,
  EUTECTIC_SPLIT,
  FE_C,
  FE_C_LINES,
  HYPER,
  HYPO,
  PB_SN,
  PB_SN_EX,
  PB_SN_MICRO,
  PEARLITE,
  Pt,
  SUGAR,
  WATER,
  lever,
  meltC,
  sublimeAtm,
  sugarLimit,
  tAtX,
  vapourAtm,
  xAtT,
} from "./model";
import {
  Axes,
  Cell,
  CuNiDiagram,
  Curve,
  Dot,
  EutecticDiagram,
  FeCDiagram,
  FractionBar,
  Frame,
  Lamellae,
  Lattice,
  PH,
  Region,
  Scope,
  Svg,
  T,
  Tag,
  grains,
  hash,
  polyStr,
  pulseAt,
  shrink,
  sx,
  sy,
} from "./parts";
import { BEATS, BeatId, PlannedBeat, Voice, fill, planPhase, scriptValues } from "./script";

export const PhaseExplainerProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(z.string(), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type PhaseExplainerProps = z.infer<typeof PhaseExplainerProps>;

export const PHASE_FPS = 30;
export const phaseMetadata: CalculateMetadataFunction<PhaseExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planPhase(props.voice as Voice).seconds * PHASE_FPS),
});

const CAPTION_BOX = { left: 140, right: 140, bottom: 30 };

interface Ctx {
  beat: PlannedBeat;
  values: Record<string, string>;
  local: number;
}
const at = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;
const endOf = (ctx: Ctx, i: number) => at(ctx, i) + ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].seconds;
/** Pops in when line i starts. */
const show = (ctx: Ctx, i: number, delay = 0) => popIn(ctx.local, at(ctx, i) + delay, 0.5);
/** 0 → 1 over `dur` seconds from line i (+delay). Linear: used for drawing lines on. */
const ramp = (ctx: Ctx, i: number, dur = 1.2, delay = 0) => interpolate(ctx.local, [at(ctx, i) + delay, at(ctx, i) + delay + dur], [0, 1], CLAMP);
/** Visible from line `from` until line `to` starts (fades both ways). */
const stage = (ctx: Ctx, from: number, to?: number) => {
  const start = from === 0 ? 0 : at(ctx, from) - 0.2;
  const inO = fade(ctx.local, start, 0.4);
  const outO = to === undefined ? 1 : 1 - fade(ctx.local, at(ctx, to) - 0.4, 0.35);
  return Math.max(0, Math.min(inO, outO));
};
/** Piecewise-linear in time: constant rate between the given (time, value) knots. */
const track = (t: number, knots: [number, number][]) => {
  if (t <= knots[0][0]) return knots[0][1];
  for (let i = 0; i < knots.length - 1; i++) {
    const [t1, v1] = knots[i];
    const [t2, v2] = knots[i + 1];
    if (t <= t2) return v1 + ((t - t1) / (t2 - t1)) * (v2 - v1);
  }
  return knots[knots.length - 1][1];
};
const glow = (t: number, start: number) => (t < start ? 0 : 8 + 26 * Math.exp(-(t - start) * 2.5));

export const PhaseExplainer: React.FC<PhaseExplainerProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planPhase(voice as Voice), [voice]);
  const values = useMemo(() => scriptValues(), []);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      {plan.beats.map((beat) => {
        const from = Math.round(beat.from * fps);
        const to = Math.round((beat.from + beat.seconds) * fps);
        return (
          <Sequence key={beat.id} name={beat.id} from={from} durationInFrames={to - from}>
            <BeatView beat={beat} values={values} />
            {beat.lines.map((l) =>
              l.clip ? (
                <Sequence key={l.key} from={Math.round(l.at * fps)} layout="none">
                  <Audio src={staticFile(l.clip.src)} />
                </Sequence>
              ) : null,
            )}
          </Sequence>
        );
      })}
      <Progress sections={plan.beats.map((b) => ({ from: b.from, label: BEATS.find((x) => x.id === b.id)!.chapter }))} total={plan.seconds} />
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ beat: PlannedBeat; values: Record<string, string> }> = ({ beat, values }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const ctx: Ctx = { beat, values, local };
  const index = BEATS.findIndex((b) => b.id === beat.id);
  const script = BEATS[index];
  const Scene = SCENES[beat.id];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 26, color: COLORS.chalkDim }}>ASE102 · Unit III · Alloys and phase diagrams</div>
      <PunchIn local={local}>
        <Scene ctx={ctx} />
      </PunchIn>
      {sounds(beat.id, ctx).map(([t, name, volume], i) => (
        <Sfx key={i} at={t} name={name} volume={volume} />
      ))}
      <ChapterTitle local={local} index={index} label={script.chapter} />
      <Captions
        cues={script.lines.map((l, i) => ({ at: beat.lines[i].at, dur: beat.lines[i].seconds, text: fill(l.text, values) }))}
        local={local}
        box={CAPTION_BOX}
        fontSize={42}
      />
    </AbsoluteFill>
  );
};

// ---------- small HTML blocks ----------

const Panel: React.FC<{ style: React.CSSProperties; opacity: number; color?: string; children: React.ReactNode }> = ({ style, opacity, color = COLORS.boardLine, children }) =>
  opacity > 0 ? (
    <div
      style={{
        position: "absolute",
        background: SURFACE,
        border: `3px solid ${color}`,
        borderRadius: 24,
        padding: "22px 30px",
        boxShadow: `0 0 30px ${color}33, 0 12px 40px rgba(0,0,0,0.45)`,
        opacity: Math.min(1, opacity),
        scale: String(0.92 + 0.08 * Math.min(1, opacity)),
        ...style,
      }}
    >
      {children}
    </div>
  ) : null;

const Big: React.FC<{ top: number; size?: number; color?: string; opacity: number; children: React.ReactNode; left?: number; right?: number }> = ({
  top,
  size = 80,
  color = COLORS.chalk,
  opacity,
  children,
  left = 0,
  right = 0,
}) =>
  opacity > 0 ? (
    <div style={{ position: "absolute", left, right, top, textAlign: "center", fontSize: size, fontWeight: 800, color, opacity: Math.min(1, opacity), scale: String(0.9 + 0.1 * Math.min(1, opacity)) }}>
      {children}
    </div>
  ) : null;

const Chip: React.FC<{ color: string; children: React.ReactNode; size?: number }> = ({ color, children, size = 30 }) => (
  <span style={{ display: "inline-block", padding: "6px 18px", borderRadius: 14, border: `2px solid ${color}`, color, fontSize: size, fontWeight: 800, background: `${color}14` }}>{children}</span>
);

const Check: React.FC<{ ok?: boolean }> = ({ ok = true }) => <span style={{ color: ok ? COLORS.kan : COLORS.force, fontWeight: 900 }}>{ok ? "✓" : "✗"}</span>;

type SceneProps = { ctx: Ctx };

// ---------- 1. intro ----------

/** A thin sheet bent by hand: a strip of fixed length with uniform curvature k (px⁻¹). */
const Sheet: React.FC<{ cx: number; cy: number; len: number; k: number }> = ({ cx, cy, len, k }) => {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const s = -len / 2 + (i / 40) * len;
    const x = k < 1e-6 ? s : Math.sin(k * s) / k;
    const y = k < 1e-6 ? 0 : (1 - Math.cos(k * s)) / k;
    return `${(cx + x).toFixed(1)},${(cy - y).toFixed(1)}`;
  });
  return <polyline points={pts.join(" ")} fill="none" stroke="#c9d2e3" strokeWidth={16} strokeLinecap="round" />;
};

const Plane: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -230 0 Q -230 -26 -190 -30 L 170 -30 Q 240 -26 250 0 Q 240 26 170 30 L -190 30 Q -230 26 -230 0 Z" fill="#d9e1f2" />
    <path d="M -40 -20 L 60 -20 L -60 -190 L -110 -190 Z" fill="#b8c4dc" />
    <path d="M -40 20 L 60 20 L -60 190 L -110 190 Z" fill="#b8c4dc" />
    <path d="M -190 -20 L -150 -20 L -205 -110 L -232 -110 Z" fill="#b8c4dc" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle key={i} cx={-120 + i * 40} cy={-8} r={7} fill="#4a5a7c" />
    ))}
  </g>
);

const SOLUTES = [
  { i: 2, j: 1, color: "#ff9f43", name: "Cu" },
  { i: 6, j: 3, color: "#4ef0c4", name: "Mg" },
  { i: 4, j: 4, color: "#b79bff", name: "Zn" },
  { i: 8, j: 0, color: "#ff9f43", name: "Cu" },
];

const Intro: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const sA = stage(ctx, 0, 2);
  const sB = stage(ctx, 2, 4);
  const sC = stage(ctx, 4, 5);
  const sD = stage(ctx, 5);
  const k = 0.0042 * ramp(ctx, 0, 1.8, 1.2);
  const roadmap = BEATS.filter((b) => !["intro", "quiz", "recap"].includes(b.id)).map((b) => b.chapter);
  const PB: Frame = { x: 640, y: 230, w: 640, h: 500, x0: 0, x1: 100, t0: 0, t1: 350 };
  const draw = ramp(ctx, 4, 2.4);
  return (
    <>
      <Svg>
        <g opacity={sA}>
          <Sheet cx={520} cy={560} len={520} k={k} />
          <T x={520} y={700} size={40} color="#c9d2e3">
            Pure aluminium: soft
          </T>
          <g opacity={show(ctx, 1)}>
            <Plane x={1380} y={520} s={1.1} />
            <T x={1380} y={790} size={40} color={COLORS.kan}>
              Aluminium alloy: strong
            </T>
          </g>
        </g>
        <g opacity={sB}>
          <Lattice
            x={560}
            y={330}
            n={10}
            m={5}
            step={90}
            r={34}
            jiggle={6 * ramp(ctx, 3, 1)}
            time={local}
            kind={(i, j) => {
              const s = SOLUTES.findIndex((a) => a.i === i && a.j === j);
              if (s >= 0 && local >= at(ctx, 2) + 0.6 * s) return { color: SOLUTES[s].color };
              return { color: "#9aa6c0" };
            }}
          />
          {SOLUTES.map((s, n) => (
            <T key={n} x={560 + s.i * 90} y={330 + s.j * 90 + 10} size={24} color={COLORS.board} opacity={local >= at(ctx, 2) + 0.6 * n ? 1 : 0}>
              {s.name}
            </T>
          ))}
          <T x={960} y={830} size={36} color={COLORS.chalkDim} opacity={show(ctx, 2)}>
            Aluminium atoms + a few others = an alloy
          </T>
          <g opacity={show(ctx, 3)}>
            <rect x={1620} y={300} width={36} height={400} rx={18} fill="rgba(255,255,255,0.1)" />
            <rect x={1620} y={700 - 360 * ramp(ctx, 3, 2)} width={36} height={360 * ramp(ctx, 3, 2)} rx={18} fill={COLORS.force} />
            <T x={1638} y={760} size={30} color={COLORS.force}>
              heat
            </T>
          </g>
        </g>
        <g opacity={sC}>
          <EutecticDiagram f={PB} e={PB_SN} tTicks={[0, 100, 200, 300]} vis={{ axes: draw, liq: draw, solA: draw, solvA: draw, solB: draw, solvB: draw, iso: draw, L: draw, a: draw, b: draw, ab: draw, aL: draw, bL: draw, E: draw }} />
          <T x={960} y={190} size={40} color={COLORS.displacement} opacity={draw}>
            A phase diagram: a map of what forms
          </T>
        </g>
      </Svg>
      <div style={{ position: "absolute", left: 160, right: 160, top: 220, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", opacity: sD }}>
        {roadmap.map((c, i) => (
          <div key={c} style={{ opacity: popIn(local, at(ctx, 5) + 0.12 * i, 0.4), scale: String(0.8 + 0.2 * Math.min(1, popIn(local, at(ctx, 5) + 0.12 * i, 0.4))) }}>
            <Chip color={i % 2 ? COLORS.velocity : COLORS.kan} size={30}>
              {String(i + 1).padStart(2, "0")} {c}
            </Chip>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 860, top: 640, opacity: show(ctx, 6) * sD }}>
        <Kan radius={80} expression="excited" arms="up" look={{ x: 0, y: -1 }} time={local} />
      </div>
    </>
  );
};

// ---------- 2. basics ----------

const TERMS: { line: number; word: string; meaning: string; color: string }[] = [
  { line: 0, word: "Component", meaning: "a pure element or compound in the alloy", color: COLORS.kan },
  { line: 2, word: "System", meaning: "all alloys of the same components", color: COLORS.velocity },
  { line: 3, word: "Alloy", meaning: "a metal + at least one other element", color: COLORS.acceleration },
  { line: 4, word: "Solvent / solute", meaning: "the most / the less present element", color: "#b79bff" },
  { line: 5, word: "Solid solution", meaning: "solute inside, crystal unchanged", color: COLORS.force },
];

const Basics: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const s1 = stage(ctx, 0, 2);
  const s2 = stage(ctx, 2, 3);
  const s3 = stage(ctx, 3, 6);
  const s4 = stage(ctx, 6);
  const sweep = (Math.sin((local - at(ctx, 2)) * 1.2) + 1) / 2;
  return (
    <>
      <div style={{ position: "absolute", left: 80, top: 210, width: 760, display: "flex", flexDirection: "column", gap: 16 }}>
        {TERMS.map((t) => (
          <div
            key={t.word}
            style={{
              opacity: Math.min(1, show(ctx, t.line)),
              translate: `${(1 - Math.min(1, show(ctx, t.line))) * -40}px 0`,
              background: SURFACE,
              border: `2px solid ${t.color}`,
              borderRadius: 18,
              padding: "12px 22px",
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: t.color }}>{t.word}</div>
            <div style={{ fontSize: 26, color: COLORS.chalkDim }}>{t.meaning}</div>
          </div>
        ))}
      </div>
      <Svg>
        <g opacity={s1}>
          <circle cx={1060} cy={460} r={80} fill="#ff9f43" />
          <T x={1060} y={474} size={44} color={COLORS.board}>
            Cu
          </T>
          <T x={1190} y={476} size={60}>
            +
          </T>
          <circle cx={1320} cy={460} r={80} fill="#9aa6c0" opacity={show(ctx, 1)} />
          <T x={1320} y={474} size={44} color={COLORS.board} opacity={show(ctx, 1)}>
            Zn
          </T>
          <T x={1490} y={476} size={60} opacity={show(ctx, 1)}>
            =
          </T>
          <circle cx={1650} cy={460} r={90} fill="#e3b341" opacity={show(ctx, 1, 0.5)} />
          <T x={1650} y={474} size={40} color={COLORS.board} opacity={show(ctx, 1, 0.5)}>
            Brass
          </T>
        </g>
        <g opacity={s2}>
          <defs>
            <linearGradient id="sysbar" x1="0" x2="1">
              <stop offset="0" stopColor="#9aa6c0" />
              <stop offset="1" stopColor="#3a3a3a" />
            </linearGradient>
          </defs>
          <rect x={1000} y={440} width={760} height={60} rx={30} fill="url(#sysbar)" />
          <T x={1000} y={560} size={34} anchor="start">
            Fe
          </T>
          <T x={1760} y={560} size={34} anchor="end">
            more C →
          </T>
          <circle cx={1030 + sweep * 700} cy={470} r={24} fill={COLORS.displacement} />
          <T x={1380} y={400} size={34} color={COLORS.velocity}>
            Iron–carbon system: every mix
          </T>
        </g>
        <g opacity={s3}>
          <Lattice
            x={1040}
            y={300}
            n={8}
            m={6}
            step={90}
            r={34}
            kind={(i, j) => ((i + j * 3) % 7 === 2 && local >= at(ctx, 3) + 0.5 ? { color: COLORS.acceleration } : { color: "#4c7bd8" })}
          />
          <Tag x={1350} y={880} text="blue = solvent   orange = solute" size={28} opacity={show(ctx, 4)} />
          <rect x={1000} y={260} width={720} height={540} rx={20} fill="none" stroke={COLORS.force} strokeWidth={4} strokeDasharray="14 10" opacity={show(ctx, 5)} />
          <T x={1360} y={245} size={30} color={COLORS.force} opacity={show(ctx, 5)}>
            same crystal pattern
          </T>
        </g>
        <g opacity={s4}>
          <path d="M 1100 380 L 1150 760 Q 1155 790 1190 790 L 1490 790 Q 1525 790 1530 760 L 1580 380 Z" fill="rgba(200,140,80,0.45)" stroke="#e8d3b8" strokeWidth={6} />
          <path d="M 1580 460 Q 1680 470 1670 560 Q 1660 640 1560 640" fill="none" stroke="#e8d3b8" strokeWidth={14} />
          {Array.from({ length: 40 }, (_, i) => {
            const t = Math.max(0, local - at(ctx, 6));
            const spread = Math.min(1, t / 4);
            const x = 1340 + (hash(i) - 0.5) * 380 * spread;
            const y = 740 - hash(i + 40) * 330 * spread;
            return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} fill="#fff" opacity={1 - 0.85 * spread} />;
          })}
          <T x={1340} y={330} size={36} color="#e8d3b8">
            sugar disappears into tea
          </T>
        </g>
      </Svg>
    </>
  );
};

// ---------- 3. solubility ----------

const Solubility: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  // Beaker: one spoonful every 0.7 s from line 1; 6 dissolve (the limit), the rest fall and stay.
  const spoons = Math.max(0, Math.min(11, Math.floor((local - at(ctx, 1)) / 0.7) + 1));
  const LIMIT = 6;
  const dissolved = Math.min(spoons, LIMIT);
  const G = 1800; // px/s² for falling crystals
  const f: Frame = { x: 1040, y: 240, w: 720, h: 520, x0: 0, x1: 100, t0: 0, t1: 100 };
  const line: Pt[] = [
    [sugarLimit(0), 0],
    [sugarLimit(100), 100],
  ];
  return (
    <>
      <Svg>
        <g>
          <path d="M 260 300 L 280 800 L 700 800 L 720 300" fill="none" stroke="#c9d2e3" strokeWidth={8} />
          <rect x={284} y={420} width={412} height={376} fill="#5aa0ff" opacity={0.25 + 0.06 * dissolved} />
          {Array.from({ length: Math.max(0, spoons - LIMIT) }, (_, n) => {
            const t0 = at(ctx, 1) + (LIMIT + n) * 0.7;
            const t = Math.max(0, local - t0);
            const restY = 770 - Math.floor(n / 5) * 26;
            const y = Math.min(restY, 260 + 0.5 * G * t * t);
            const x = 400 + (n % 5) * 44;
            return <rect key={n} x={x} y={y} width={30} height={24} rx={4} fill="#ffffff" />;
          })}
          {spoons > 0 && spoons <= LIMIT && local > at(ctx, 1) && (
            <rect x={470} y={260 + 0.5 * G * ((local - at(ctx, 1)) % 0.7) ** 2} width={30} height={24} rx={4} fill="#fff" opacity={1 - ((local - at(ctx, 1)) % 0.7) / 0.7} />
          )}
          <T x={490} y={870} size={34} color={COLORS.chalkDim}>
            spoonfuls: {spoons} · dissolved: {dissolved}
          </T>
          <Tag x={490} y={250} text="Solubility limit reached!" color={COLORS.displacement} size={32} opacity={show(ctx, 2)} />
        </g>
        <g opacity={show(ctx, 3)}>
          <Axes f={f} p={ramp(ctx, 3, 1)} xTicks={[0, 20, 40, 60, 80, 100]} tTicks={[0, 20, 40, 60, 80, 100]} xLabel="Sugar (wt%)" size={24} />
          <Region f={f} pts={[[0, 0], ...line, [0, 100]]} fill="#5aa0ff" opacity={0.18} />
          <Region f={f} pts={[...line, [100, 100], [100, 0]]} fill="#ffffff" opacity={0.08} />
          <Curve f={f} line={line} p={ramp(ctx, 3, 1)} color={COLORS.displacement} width={6} raw />
          <Tag x={sx(f, 30)} y={sy(f, 60)} text="Syrup" color="#7fb6ff" size={28} />
          <Tag x={sx(f, 88)} y={sy(f, 50)} text="Syrup + sugar" color={COLORS.chalk} size={24} />
          <Dot x={sx(f, SUGAR.at20)} y={sy(f, 20)} pulse={pulseAt(local, at(ctx, 3))} />
          <Tag x={sx(f, SUGAR.at20) - 20} y={sy(f, 20) - 30} text="65 wt% at 20 °C" color={COLORS.displacement} size={26} anchor="end" />
          <g opacity={show(ctx, 4)}>
            <Dot x={sx(f, SUGAR.at100)} y={sy(f, 100)} />
            <Tag x={sx(f, SUGAR.at100) - 20} y={sy(f, 100) + 46} text="80 wt% at 100 °C" color={COLORS.displacement} size={26} anchor="end" />
          </g>
        </g>
      </Svg>
      <Big top={150} size={40} color={COLORS.kan} opacity={show(ctx, 5) * (1 - show(ctx, 6))} left={1000} right={80}>
        Metals too: limit changes with temperature
      </Big>
      <Big top={150} size={40} color={COLORS.force} opacity={show(ctx, 6)} left={1000} right={80}>
        Past the limit → a second phase
      </Big>
    </>
  );
};

// ---------- 4. phases ----------

const Phases: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const s = (i: number) => stage(ctx, i, i + 1 < ctx.beat.lines.length ? i + 1 : undefined);
  const settle = (i: number) => {
    const t = Math.max(0, local - at(ctx, i));
    return 160 * Math.exp(-0.9 * t) * Math.cos(3.2 * t);
  };
  const ballX = 960 + settle(7);
  const valley = (x: number) => 760 - 0.0016 * (x - 960) ** 2;
  return (
    <>
      <Big top={380} size={130} color={COLORS.kan} opacity={s(0)}>
        Phase = ?
      </Big>
      <Panel style={{ left: 360, right: 360, top: 280 }} opacity={s(1)} color={COLORS.kan}>
        <div style={{ fontSize: 46, fontWeight: 800, marginBottom: 14 }}>A phase is the same all through:</div>
        {["same structure", "same composition", "same properties"].map((w, i) => (
          <div key={w} style={{ fontSize: 44, opacity: popIn(local, at(ctx, 1) + 1 + i * 0.6, 0.4) }}>
            <Check /> {w}
          </div>
        ))}
      </Panel>
      <Svg>
        <g opacity={s(2)}>
          <path d="M 700 300 L 720 800 L 1200 800 L 1220 300" fill="none" stroke="#c9d2e3" strokeWidth={8} />
          <rect x={724} y={420} width={472} height={376} fill="#d9a85a" opacity={0.4} />
          {Array.from({ length: 14 }, (_, n) => (
            <rect key={n} x={760 + (n % 7) * 60} y={770 - Math.floor(n / 7) * 28} width={34} height={24} rx={4} fill="#fff" />
          ))}
          <Tag x={1400} y={520} text="Phase 1: syrup (liquid)" color="#e7c27d" size={32} anchor="start" />
          <Tag x={1400} y={760} text="Phase 2: solid sugar" color={COLORS.chalk} size={32} anchor="start" />
        </g>
        <g opacity={s(3)}>
          <path d="M 760 300 L 790 800 L 1130 800 L 1160 300" fill="none" stroke="#c9d2e3" strokeWidth={8} />
          <rect x={792} y={380} width={336} height={416} fill="#5aa0ff" opacity={0.3} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={830 + i * 95} y={360 + (i % 2) * 18} width={80} height={70} rx={12} fill="#dff2ff" opacity={0.9} transform={`rotate(${(i - 1) * 12} ${870 + i * 95} ${395})`} />
          ))}
          <Tag x={1240} y={420} text="ice: solid" color="#dff2ff" size={32} anchor="start" />
          <Tag x={1240} y={640} text="water: liquid" color="#7fb6ff" size={32} anchor="start" />
          <T x={960} y={880} size={34} color={COLORS.chalkDim}>
            same H₂O, two phases
          </T>
        </g>
        <g opacity={s(4)}>
          {[
            { x: 520, name: "BCC iron", fcc: false },
            { x: 1160, name: "FCC iron", fcc: true },
          ].map(({ x, name, fcc }) => (
            <g key={name}>
              <rect x={x} y={300} width={300} height={300} fill="none" stroke={COLORS.chalkDim} strokeWidth={4} />
              {[
                [0, 0],
                [300, 0],
                [0, 300],
                [300, 300],
              ].map(([dx, dy], i) => (
                <circle key={i} cx={x + dx} cy={300 + dy} r={34} fill={PH.a} />
              ))}
              {fcc ? (
                [
                  [150, 0],
                  [0, 150],
                  [300, 150],
                  [150, 300],
                  [150, 150],
                ].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={300 + dy} r={34} fill={PH.g} opacity={i === 4 ? 0.5 : 1} />)
              ) : (
                <circle cx={x + 150} cy={450} r={34} fill={PH.d} />
              )}
              <T x={x + 150} y={700} size={38}>
                {name}
              </T>
            </g>
          ))}
          <T x={960} y={800} size={34} color={COLORS.chalkDim}>
            same element, different structure → different phases
          </T>
        </g>
        <g opacity={s(5)}>
          <circle cx={640} cy={520} r={200} fill={PH.a} opacity={0.6} />
          <T x={640} y={790} size={38} color={PH.a}>
            one phase: homogeneous
          </T>
          <circle cx={1280} cy={520} r={200} fill={PH.a} opacity={0.6} />
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={1280 + (hash(i) - 0.5) * 280} cy={520 + (hash(i + 30) - 0.5) * 280} r={22 + hash(i + 60) * 14} fill={PH.b} />
          ))}
          <T x={1280} y={790} size={38} color={PH.b}>
            two phases: heterogeneous
          </T>
        </g>
        <g opacity={s(6)}>
          <Scope id="ph-scope" cx={960} cy={500} r={260} label="microstructure: phases, amounts, arrangement">
            <MicroTwoPhase />
          </Scope>
        </g>
        <g opacity={s(7)}>
          <path d={`M 560 ${valley(560)} ${Array.from({ length: 41 }, (_, i) => `L ${560 + i * 20} ${valley(560 + i * 20)}`).join(" ")}`} fill="none" stroke={COLORS.chalkDim} strokeWidth={6} />
          <circle cx={ballX} cy={valley(ballX) - 34} r={32} fill={COLORS.kan} />
          <T x={960} y={380} size={36} color={COLORS.kan}>
            lowest free energy = equilibrium
          </T>
        </g>
        <g opacity={s(8)}>
          <path d="M 420 360 Q 700 380 820 520 Q 880 590 960 560 Q 1030 535 1100 640 Q 1250 820 1500 840" fill="none" stroke={COLORS.chalkDim} strokeWidth={6} />
          <circle cx={960} cy={528} r={30} fill={COLORS.acceleration} />
          <T x={960} y={400} size={34} color={COLORS.acceleration}>
            stuck in a small dip: metastable
          </T>
          <T x={1440} y={800} size={30} color={COLORS.chalkDim}>
            true lowest point
          </T>
        </g>
      </Svg>
    </>
  );
};

const MicroTwoPhase: React.FC = () => {
  const cells = useMemo(() => grains(10, 260, 3), []);
  return (
    <g>
      {cells.map((c, i) => (
        <polygon key={i} points={polyStr(c.poly)} fill={i % 3 === 0 ? PH.b : PH.a} opacity={0.75} stroke={COLORS.board} strokeWidth={4} />
      ))}
    </g>
  );
};

// ---------- 5. why alloy ----------

const Alloying: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const cards = [
    { line: 1, title: "Strength", text: "aircraft aluminium alloys", color: COLORS.kan },
    { line: 2, title: "Corrosion resistance", text: "chromium in stainless steel", color: COLORS.velocity },
    { line: 3, title: "Lower melting point", text: "lead–tin solder", color: COLORS.acceleration },
    { line: 4, title: "Other properties", text: "electrical, magnetic, casting", color: "#b79bff" },
  ];
  const s1 = stage(ctx, 0, 5);
  const silver = 0.925;
  const pie = (frac: number) => {
    const a = frac * 2 * Math.PI;
    return `M 0 0 L 0 -150 A 150 150 0 ${frac > 0.5 ? 1 : 0} 1 ${150 * Math.sin(a)} ${-150 * Math.cos(a)} Z`;
  };
  return (
    <>
      <Big top={220} size={56} opacity={s1}>
        Why mix metals?
      </Big>
      <div style={{ position: "absolute", left: 220, right: 220, top: 340, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, opacity: s1 }}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={{ opacity: Math.min(1, show(ctx, c.line)), scale: String(0.85 + 0.15 * Math.min(1, show(ctx, c.line))), background: SURFACE, border: `3px solid ${c.color}`, borderRadius: 22, padding: "20px 28px" }}
          >
            <div style={{ fontSize: 42, fontWeight: 800, color: c.color }}>{c.title}</div>
            <div style={{ fontSize: 30, color: COLORS.chalkDim }}>{c.text}</div>
          </div>
        ))}
      </div>
      <Svg>
        <g opacity={stage(ctx, 5)}>
          <g transform="translate(700 520)">
            <circle r={156} fill="#c0c7d6" />
            <path d={pie(silver)} fill="#dfe5f0" />
            <path d={pie(1)} fill="none" />
            <g transform={`rotate(${silver * 360})`}>
              <path d={pie(1 - silver)} fill="#ff9f43" />
            </g>
          </g>
          <T x={1180} y={470} size={46} anchor="start" color="#dfe5f0">
            Sterling silver
          </T>
          <T x={1180} y={540} size={36} anchor="start" color="#dfe5f0">
            92.5% silver
          </T>
          <T x={1180} y={600} size={36} anchor="start" color="#ff9f43">
            7.5% copper
          </T>
          <T x={1180} y={670} size={32} anchor="start" color={COLORS.kan} opacity={popIn(local, at(ctx, 5) + 2, 0.4)}>
            stronger, still shiny
          </T>
        </g>
      </Svg>
    </>
  );
};

// ---------- 6. solid solutions ----------

const SolidSolutions: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const sA = stage(ctx, 0, 5);
  const sB = stage(ctx, 5, 10);
  const sC = stage(ctx, 10);
  const host = "#4c7bd8";
  const rules = [
    { line: 6, title: "1 · Size", text: "radii differ < 15%" },
    { line: 7, title: "2 · Structure", text: "same crystal structure" },
    { line: 8, title: "3 · Electronegativity", text: "similar (else a compound)" },
    { line: 9, title: "4 · Valency", text: "higher valency dissolves easier" },
  ];
  const sizePx = 1400; // px per nm, atoms to scale
  const diff = (Math.abs(CU_NI_ATOMS.cuNm - CU_NI_ATOMS.niNm) / CU_NI_ATOMS.cuNm) * 100;
  return (
    <>
      <Svg>
        <g opacity={sA}>
          <g opacity={show(ctx, 1)}>
            <Lattice x={260} y={340} n={6} m={5} step={92} r={40} kind={(i, j) => (i === 2 && j === 2 ? { color: COLORS.acceleration, r: 38 } : { color: host })} />
            <T x={490} y={270} size={40} color={COLORS.acceleration}>
              Substitutional
            </T>
            <T x={490} y={840} size={32} color={COLORS.chalkDim} opacity={show(ctx, 2)}>
              similar size: Cu in Ni
            </T>
          </g>
          <g opacity={show(ctx, 3)}>
            <Lattice x={1200} y={340} n={6} m={5} step={92} r={32} kind={() => ({ color: host })} />
            {[
              [1, 1],
              [3, 2],
              [2, 3],
            ].map(([i, j], k) => (
              <circle key={k} cx={1200 + i * 92 + 46} cy={340 + j * 92 + 46} r={13} fill={COLORS.displacement} stroke={COLORS.board} strokeWidth={2} opacity={popIn(local, at(ctx, 3) + 0.6 + 0.4 * k, 0.4)} />
            ))}
            <T x={1430} y={270} size={40} color={COLORS.displacement}>
              Interstitial
            </T>
            <T x={1430} y={840} size={32} color={COLORS.chalkDim} opacity={show(ctx, 4)}>
              tiny atom in the gaps: C in Fe
            </T>
          </g>
        </g>
        <g opacity={sC}>
          <circle cx={640} cy={480} r={(CU_NI_ATOMS.cuNm * sizePx) / 1} fill="#ff9f43" />
          <T x={640} y={490} size={40} color={COLORS.board}>
            Cu
          </T>
          <circle cx={1060} cy={480} r={CU_NI_ATOMS.niNm * sizePx} fill="#9aa6c0" />
          <T x={1060} y={490} size={40} color={COLORS.board}>
            Ni
          </T>
          <T x={850} y={720} size={30} color={COLORS.chalkDim}>
            drawn to scale: {CU_NI_ATOMS.cuNm} nm vs {CU_NI_ATOMS.niNm} nm
          </T>
        </g>
      </Svg>
      <Big top={220} size={56} color={COLORS.kan} opacity={sB}>
        Hume-Rothery rules
      </Big>
      <div style={{ position: "absolute", left: 120, right: 120, top: 380, display: "flex", gap: 24, opacity: sB }}>
        {rules.map((r) => (
          <div key={r.title} style={{ flex: 1, opacity: Math.min(1, show(ctx, r.line)), background: SURFACE, border: `3px solid ${COLORS.kan}`, borderRadius: 20, padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.kan }}>{r.title}</div>
            <div style={{ fontSize: 30, marginTop: 8 }}>{r.text}</div>
          </div>
        ))}
      </div>
      <Panel style={{ left: 1300, width: 500, top: 280 }} opacity={sC} color={COLORS.kan}>
        <div style={{ fontSize: 34, lineHeight: 1.55 }}>
          <div>
            <Check /> size: {diff.toFixed(1)}% apart
          </div>
          <div>
            <Check /> both {CU_NI_ATOMS.structure}
          </div>
          <div>
            <Check /> EN {CU_NI_ATOMS.cuEN} vs {CU_NI_ATOMS.niEN}
          </div>
          <div>
            <Check /> valency close
          </div>
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 1460, top: 700, opacity: show(ctx, 11) }}>
        <Kan radius={70} expression="proud" arms="up" look={{ x: -1, y: -0.3 }} time={local} />
      </div>
    </>
  );
};

// ---------- 7. unary (water) ----------

const Unary: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const f: Frame = { x: 420, y: 220, w: 1100, h: 560, x0: -20, x1: 120, t0: -3, t1: 3 };
  const lg = Math.log10;
  const tripleC = WATER.tripleK - 273.15;
  const vap: Pt[] = Array.from({ length: 40 }, (_, i) => {
    const c = tripleC + (i / 39) * (120 - tripleC);
    return [c, lg(vapourAtm(c + 273.15))];
  });
  const sub: Pt[] = Array.from({ length: 20 }, (_, i) => {
    const c = -20 + (i / 19) * (tripleC + 20);
    return [c, lg(sublimeAtm(c + 273.15))];
  });
  const melt: Pt[] = Array.from({ length: 30 }, (_, i) => {
    const l = lg(WATER.tripleAtm) + (i / 29) * (3 - lg(WATER.tripleAtm));
    return [meltC(10 ** l) + tripleC, l];
  });
  const top = melt[melt.length - 1];
  const regions = {
    ice: [...sub, ...melt, [-20, 3]] as Pt[],
    water: [...melt, [120, 3], ...[...vap].reverse()] as Pt[],
    steam: [[-20, -3], ...sub, ...vap.slice(1), [120, -3]] as Pt[],
  };
  const r = show(ctx, 2);
  const draw = ramp(ctx, 0, 1.5);
  return (
    <Svg>
      <Region f={f} pts={regions.ice} fill="#dff2ff" opacity={0.16 * r} />
      <Region f={f} pts={regions.water} fill="#5aa0ff" opacity={0.2 * r} />
      <Region f={f} pts={regions.steam} fill="#ffffff" opacity={0.05 * r} />
      <Axes f={f} p={draw} xTicks={[-20, 0, 20, 40, 60, 80, 100, 120]} tTicks={[-3, -2, -1, 0, 1, 2, 3]} fmtT={(t) => String(10 ** t)} xLabel="Temperature (°C)" tLabel="Pressure (atm, log scale)" />
      <Curve f={f} line={sub} p={ramp(ctx, 1, 1.4)} color={COLORS.chalk} width={show(ctx, 3) > 0.5 ? 7 : 5} raw />
      <Curve f={f} line={melt} p={ramp(ctx, 1, 1.4)} color={COLORS.chalk} width={show(ctx, 3) > 0.5 ? 7 : 5} raw />
      <Curve f={f} line={vap} p={ramp(ctx, 1, 1.4)} color={COLORS.chalk} width={show(ctx, 3) > 0.5 ? 7 : 5} raw />
      <Tag x={sx(f, -12)} y={sy(f, 1.6)} text="Ice" color="#dff2ff" size={30} opacity={r} />
      <Tag x={sx(f, 45)} y={sy(f, 1.8)} text="Water (liquid)" color="#7fb6ff" size={30} opacity={r} />
      <Tag x={sx(f, 60)} y={sy(f, -2)} text="Steam (vapour)" color={COLORS.chalk} size={30} opacity={r} />
      <Curve f={f} line={[[-20, 0], [120, 0]]} p={ramp(ctx, 4, 1)} color={COLORS.displacement} dash="14 10" width={4} raw />
      <Tag x={sx(f, 112)} y={sy(f, 0) - 16} text="1 atm" color={COLORS.displacement} size={26} opacity={show(ctx, 4)} />
      <Dot x={sx(f, meltC(1) + tripleC)} y={sy(f, 0)} opacity={show(ctx, 4, 0.8)} />
      <Tag x={sx(f, 0) + 20} y={sy(f, 0) + 50} text="melts 0 °C" color={COLORS.displacement} size={26} opacity={show(ctx, 4, 0.8)} anchor="start" />
      <Dot x={sx(f, 100)} y={sy(f, 0)} opacity={show(ctx, 5)} />
      <Tag x={sx(f, 100)} y={sy(f, 0) + 50} text="boils 100 °C" color={COLORS.displacement} size={26} opacity={show(ctx, 5)} />
      <Dot x={sx(f, tripleC)} y={sy(f, lg(WATER.tripleAtm))} color={COLORS.force} r={14} opacity={show(ctx, 6)} pulse={pulseAt(local, at(ctx, 6))} />
      <Tag x={sx(f, tripleC) + 30} y={sy(f, lg(WATER.tripleAtm)) + 8} text="triple point" color={COLORS.force} size={28} opacity={show(ctx, 6)} anchor="start" />
      <Tag x={sx(f, tripleC) + 30} y={sy(f, lg(WATER.tripleAtm)) + 58} text="0.01 °C, 0.006 atm" color={COLORS.force} size={26} opacity={show(ctx, 7)} anchor="start" />
      <T x={sx(f, top[0])} y={f.y - 16} size={24} color={COLORS.chalkDim} opacity={show(ctx, 3)}>
        leans left a little (ice floats)
      </T>
      <Tag x={1700} y={300} text="1 component" color={COLORS.kan} size={30} opacity={show(ctx, 0)} />
      <Tag x={1700} y={360} text="P and T change" color={COLORS.kan} size={28} opacity={show(ctx, 1)} />
    </Svg>
  );
};

// ---------- 8. binary axes ----------

const Binary: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const f: Frame = { x: 460, y: 220, w: 1000, h: 560, x0: 0, x1: 100, t0: 0, t1: 1000 };
  const t = Math.max(0, local - at(ctx, 3));
  const px = 50 + 35 * Math.sin(t * 0.9);
  const pt = 500 + 300 * Math.sin(t * 1.3 + 1);
  return (
    <Svg>
      <Axes f={f} p={ramp(ctx, 0, 1.4)} xTicks={[0, 20, 40, 60, 80, 100]} tTicks={[0, 200, 400, 600, 800, 1000]} xLabel="Composition (wt% B)" ends={show(ctx, 2) > 0.5 ? ["A", "B"] : undefined} />
      <path d={`M ${f.x - 150} ${f.y + f.h} L ${f.x - 150} ${f.y}`} stroke={COLORS.force} strokeWidth={6} opacity={show(ctx, 1)} />
      <T x={f.x - 150} y={f.y - 20} size={30} color={COLORS.force} opacity={show(ctx, 1)}>
        T ↑
      </T>
      <path d={`M ${f.x} ${f.y + f.h + 110} L ${f.x + f.w} ${f.y + f.h + 110}`} stroke={COLORS.velocity} strokeWidth={6} opacity={show(ctx, 2)} />
      <T x={f.x + f.w + 40} y={f.y + f.h + 120} size={30} color={COLORS.velocity} opacity={show(ctx, 2)}>
        more B →
      </T>
      <g opacity={show(ctx, 3)}>
        <line x1={sx(f, px)} x2={sx(f, px)} y1={sy(f, pt)} y2={f.y + f.h} stroke={COLORS.displacement} strokeWidth={2} strokeDasharray="8 8" />
        <line x1={f.x} x2={sx(f, px)} y1={sy(f, pt)} y2={sy(f, pt)} stroke={COLORS.displacement} strokeWidth={2} strokeDasharray="8 8" />
        <Dot x={sx(f, px)} y={sy(f, pt)} />
        <Tag x={sx(f, px) + 24} y={sy(f, pt) - 24} text={`${Math.round(px)}% B at ${Math.round(pt)} °C`} color={COLORS.displacement} size={28} anchor="start" />
      </g>
    </Svg>
  );
};

// ---------- 9. Cu–Ni ----------

const CU_NI_FRAME: Frame = { x: 330, y: 210, w: 1000, h: 580, x0: 0, x1: 100, t0: 1000, t1: 1600 };

const CuNi: React.FC<SceneProps> = ({ ctx }) => {
  const f = CU_NI_FRAME;
  return (
    <>
      <Svg>
        <CuNiDiagram
          f={f}
          vis={{
            axes: ramp(ctx, 0, 1.2),
            melt: show(ctx, 1),
            liq: ramp(ctx, 2, 1.6),
            L: show(ctx, 2, 1),
            liqTag: show(ctx, 2, 1.4),
            sol: ramp(ctx, 3, 1.6),
            a: show(ctx, 3, 1),
            solTag: show(ctx, 3, 1.4),
            aL: show(ctx, 4),
          }}
        />
        <Tag x={sx(f, 0) + 20} y={sy(f, CU_NI.cuMelt) - 22} text="Cu 1085 °C" size={26} opacity={show(ctx, 1)} anchor="start" />
        <Tag x={sx(f, 100) - 20} y={sy(f, CU_NI.niMelt) - 26} text="Ni 1455 °C" size={26} opacity={show(ctx, 1, 0.6)} anchor="end" />
        <g opacity={stage(ctx, 5, 7)}>
          <rect x={1400} y={300} width={430} height={430} rx={24} fill={SURFACE} stroke={PH.a} strokeWidth={3} />
          <Lattice x={1465} y={365} n={5} m={5} step={75} r={30} kind={(i, j) => ({ color: hash(i * 5 + j + 3) > 0.55 ? "#9aa6c0" : "#ff9f43" })} />
          <T x={1615} y={780} size={30} color={PH.a}>
            α: Cu and Ni mixed (FCC)
          </T>
        </g>
        <g opacity={show(ctx, 6) * stage(ctx, 6, 7)}>
          <path d={`M ${sx(f, 2)} ${sy(f, 1040)} L ${sx(f, 98)} ${sy(f, 1040)}`} stroke={PH.a} strokeWidth={6} />
          <T x={sx(f, 50)} y={sy(f, 1040) - 16} size={30} color={PH.a}>
            α at every composition, 0 → 100%
          </T>
        </g>
      </Svg>
      <Panel style={{ left: 1380, width: 460, top: 340, textAlign: "center" }} opacity={show(ctx, 7)} color={COLORS.kan}>
        <div style={{ fontSize: 60, fontWeight: 900, color: COLORS.kan }}>ISO + MORPH</div>
        <div style={{ fontSize: 36, marginTop: 8 }}>same + form</div>
        <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 8 }}>one solid phase, all the way across</div>
      </Panel>
    </>
  );
};

// ---------- 10. three questions ----------

const ThreeQ: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const f: Frame = { x: 760, y: 210, w: 1020, h: 580, x0: 0, x1: 100, t0: 1000, t1: 1600 };
  const ex = CU_NI_EX;
  const tie = ramp(ctx, 5, 1);
  const qs = ["Which phases?", "Compositions?", "How much of each?"];
  return (
    <>
      <div style={{ position: "absolute", left: 70, top: 230, width: 560, display: "flex", flexDirection: "column", gap: 16 }}>
        {qs.map((q, i) => (
          <div
            key={q}
            style={{
              opacity: Math.min(1, popIn(local, at(ctx, 1) + i * 1.3, 0.4)),
              background: SURFACE,
              border: `3px solid ${[COLORS.kan, COLORS.velocity, COLORS.acceleration][i]}`,
              borderRadius: 18,
              padding: "14px 22px",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            {i + 1}. {q}{" "}
            {i === 0 && local > at(ctx, 3) + 1 && (
              <span style={{ color: COLORS.kan }}>
                <Check /> α + L
              </span>
            )}
            {i === 1 && local > at(ctx, 7) + 1 && (
              <span style={{ color: COLORS.kan }}>
                <Check /> tie line
              </span>
            )}
          </div>
        ))}
      </div>
      <Panel style={{ left: 70, width: 560, top: 620 }} opacity={stage(ctx, 4, 5)} color={COLORS.chalkDim}>
        <div style={{ fontSize: 30 }}>One-phase region → the phase has the alloy's own composition.</div>
      </Panel>
      <Panel style={{ left: 70, width: 560, top: 620 }} opacity={show(ctx, 8)} color={COLORS.displacement}>
        <div style={{ fontSize: 34, fontWeight: 800, textAlign: "center" }}>
          <span style={{ color: PH.L }}>L {ex.cL}</span> &lt; <span style={{ color: COLORS.displacement }}>35</span> &lt; <span style={{ color: PH.a }}>α {ex.cAlpha}</span>
        </div>
      </Panel>
      <Svg>
        <CuNiDiagram f={f} size={22} vis={{ aL: 1 + 0.8 * Math.max(0, Math.sin((local - at(ctx, 3)) * 5)) * (local > at(ctx, 3) && local < at(ctx, 4) ? 1 : 0) }} />
        <g opacity={show(ctx, 2)}>
          <line x1={sx(f, ex.c0)} x2={sx(f, ex.c0)} y1={sy(f, ex.T)} y2={f.y + f.h} stroke={COLORS.displacement} strokeWidth={2} strokeDasharray="8 8" />
          <line x1={f.x} x2={sx(f, ex.c0)} y1={sy(f, ex.T)} y2={sy(f, ex.T)} stroke={COLORS.displacement} strokeWidth={2} strokeDasharray="8 8" />
          <Tag x={f.x + 8} y={sy(f, ex.T) - 14} text="1250 °C" color={COLORS.displacement} size={22} anchor="start" />
        </g>
        <Curve f={f} line={[[ex.cL, ex.T], [ex.cAlpha, ex.T]]} p={tie} color={COLORS.chalk} width={7} raw />
        <Dot x={sx(f, ex.cL)} y={sy(f, ex.T)} color={PH.L} opacity={show(ctx, 6)} r={10} />
        <Dot x={sx(f, ex.cAlpha)} y={sy(f, ex.T)} color={PH.a} opacity={show(ctx, 7)} r={10} />
        <g opacity={show(ctx, 6)}>
          <line x1={sx(f, ex.cL)} x2={sx(f, ex.cL)} y1={sy(f, ex.T)} y2={f.y + f.h} stroke={PH.L} strokeWidth={4} strokeDasharray="10 6" />
          <Tag x={sx(f, ex.cL) - 8} y={f.y + f.h - 20} text={`${ex.cL}`} color={PH.L} size={26} anchor="end" />
        </g>
        <g opacity={show(ctx, 7)}>
          <line x1={sx(f, ex.cAlpha)} x2={sx(f, ex.cAlpha)} y1={sy(f, ex.T)} y2={f.y + f.h} stroke={PH.a} strokeWidth={4} strokeDasharray="10 6" />
          <Tag x={sx(f, ex.cAlpha) + 8} y={f.y + f.h - 20} text={`${ex.cAlpha}`} color={PH.a} size={26} anchor="start" />
        </g>
        <Dot x={sx(f, ex.c0)} y={sy(f, ex.T)} r={13} opacity={show(ctx, 2)} pulse={local < at(ctx, 5) ? pulseAt(local, at(ctx, 2)) : 0} />
        <Tag x={sx(f, ex.c0)} y={sy(f, ex.T) - 34} text="B" color={COLORS.displacement} size={30} opacity={show(ctx, 2)} />
      </Svg>
    </>
  );
};

// ---------- 11. lever rule ----------

const Lever: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const ex = CU_NI_EX;
  const v = ctx.values;
  const X0 = 420;
  const PX = 1080 / (ex.cAlpha - ex.cL);
  const px = (c: number) => X0 + (c - ex.cL) * PX;
  const beamY = 320;
  // The beam rocks and settles once the blocks land (a damped swing, for show).
  const t = Math.max(0, local - at(ctx, 2) - 0.5);
  const tilt = local < at(ctx, 2) + 0.5 ? 0 : 7 * Math.exp(-1.3 * t) * Math.sin(4 * t);
  const side = (w: number) => 150 * Math.sqrt(w);
  const pivot = px(ex.c0);
  const formulaL = `W_L = \\dfrac{\\textcolor{${PH.a}}{C_\\alpha - C_0}}{C_\\alpha - C_L}`;
  const formulaA = `W_\\alpha = \\dfrac{\\textcolor{${PH.L}}{C_0 - C_L}}{C_\\alpha - C_L}`;
  const armL = show(ctx, 3) > 0.5;
  return (
    <>
      <Svg>
        <g opacity={show(ctx, 1)}>
          <g transform={`rotate(${tilt} ${pivot} ${beamY})`}>
            <rect x={px(ex.cL) - 20} y={beamY - 10} width={px(ex.cAlpha) - px(ex.cL) + 40} height={20} rx={10} fill="#c9d2e3" />
            <g opacity={show(ctx, 2)}>
              <rect x={px(ex.cL) - side(ex.wL) / 2} y={beamY - 10 - side(ex.wL)} width={side(ex.wL)} height={side(ex.wL)} rx={10} fill={PH.L} />
              <T x={px(ex.cL)} y={beamY - 10 - side(ex.wL) / 2 + 12} size={34} color={COLORS.board}>
                L
              </T>
              <rect x={px(ex.cAlpha) - side(ex.wAlpha) / 2} y={beamY - 10 - side(ex.wAlpha)} width={side(ex.wAlpha)} height={side(ex.wAlpha)} rx={10} fill={PH.a} />
              <T x={px(ex.cAlpha)} y={beamY - 10 - side(ex.wAlpha) / 2 + 12} size={30} color={COLORS.board}>
                α
              </T>
            </g>
          </g>
          <path d={`M ${pivot} ${beamY + 10} L ${pivot - 40} ${beamY + 80} L ${pivot + 40} ${beamY + 80} Z`} fill={COLORS.displacement} />
          <T x={pivot} y={beamY + 120} size={30} color={COLORS.displacement}>
            C<tspan baselineShift="sub" fontSize="70%">0</tspan> = {ex.c0}
          </T>
          <T x={px(ex.cL)} y={beamY + 60} size={28} color={PH.L}>
            C<tspan baselineShift="sub" fontSize="70%">L</tspan> = {ex.cL}
          </T>
          <T x={px(ex.cAlpha)} y={beamY + 60} size={28} color={PH.a}>
            C<tspan baselineShift="sub" fontSize="70%">α</tspan> = {ex.cAlpha}
          </T>
        </g>
        <g opacity={show(ctx, 3) * (1 - show(ctx, 8))}>
          <line x1={px(ex.cL)} x2={pivot} y1={beamY + 150} y2={beamY + 150} stroke={PH.L} strokeWidth={8} />
          <line x1={pivot} x2={px(ex.cAlpha)} y1={beamY + 150} y2={beamY + 150} stroke={PH.a} strokeWidth={8} opacity={armL ? 1 : 0.4} />
          <T x={(px(ex.cL) + pivot) / 2} y={beamY + 190} size={26} color={PH.L}>
            {(ex.c0 - ex.cL).toFixed(1)} → gives W<tspan baselineShift="sub" fontSize="70%">α</tspan>
          </T>
          <T x={(pivot + px(ex.cAlpha)) / 2} y={beamY + 190} size={26} color={PH.a}>
            {(ex.cAlpha - ex.c0).toFixed(1)} → gives W<tspan baselineShift="sub" fontSize="70%">L</tspan>
          </T>
        </g>
      </Svg>
      <Panel style={{ left: 140, width: 780, top: 570 }} opacity={stage(ctx, 4, 9)} color={PH.L}>
        <div style={{ fontSize: 46 }}>
          <Tex tex={formulaL} />
        </div>
        <div style={{ fontSize: 40, marginTop: 6, opacity: show(ctx, 6) }}>
          <Tex tex={`= \\dfrac{${ex.cAlpha} - ${ex.c0}}{${ex.cAlpha} - ${ex.cL}} = \\textcolor{${PH.L}}{${v.wL}}`} />
        </div>
      </Panel>
      <Panel style={{ left: 1000, width: 780, top: 570 }} opacity={Math.min(show(ctx, 5), stage(ctx, 4, 9))} color={PH.a}>
        <div style={{ fontSize: 46 }}>
          <Tex tex={formulaA} />
        </div>
        <div style={{ fontSize: 40, marginTop: 6, opacity: show(ctx, 7) }}>
          <Tex tex={`= \\dfrac{${ex.c0} - ${ex.cL}}{${v.span}} = \\textcolor{${PH.a}}{${v.wAlpha}}`} />
        </div>
      </Panel>
      <Panel style={{ left: 760, width: 400, top: 440, textAlign: "center" }} opacity={show(ctx, 8) * stage(ctx, 8, 9)} color={COLORS.kan}>
        <div style={{ fontSize: 40, fontWeight: 800, filter: `drop-shadow(0 0 ${glow(local, at(ctx, 8))}px ${COLORS.kan})` }}>
          {v.wL} + {v.wAlpha} = 1 <Check />
        </div>
      </Panel>
      <Panel style={{ left: 260, right: 260, top: 570, textAlign: "center" }} opacity={stage(ctx, 9)} color={COLORS.displacement}>
        <div style={{ fontSize: 34, color: COLORS.chalkDim }}>nickel in liquid + nickel in solid = nickel in alloy</div>
        <div style={{ fontSize: 52, marginTop: 8, opacity: show(ctx, 10) }}>
          <Tex tex={`W_L\\,C_L + W_\\alpha\\,C_\\alpha = C_0,\\quad W_L + W_\\alpha = 1`} />
        </div>
        <div style={{ fontSize: 38, marginTop: 10, color: COLORS.kan, fontWeight: 800, opacity: show(ctx, 11) }}>Opposite arm ÷ whole arm. Never the near arm.</div>
      </Panel>
    </>
  );
};

// ---------- 12. cooling Cu–Ni ----------

const Cooling: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const c = CU_NI_COOL;
  const f: Frame = { x: 230, y: 220, w: 760, h: 580, x0: 10, x1: 60, t0: 1150, t1: 1320 };
  const Tn = track(local, [
    [at(ctx, 1), c.start],
    [at(ctx, 2), c.liqT],
    [at(ctx, 5), c.solT],
    [at(ctx, 6) + 1.5, c.end],
  ]);
  const twoPhase = Tn < c.liqT && Tn > c.solT;
  const cL = twoPhase ? xAtT(CU_NI.liquidus, Tn)! : null;
  const cA = twoPhase ? xAtT(CU_NI.solidus, Tn)! : null;
  const wA = Tn >= c.liqT ? 0 : Tn <= c.solT ? 1 : lever(c.c0, cL!, cA!).wB;
  const cells = useMemo(() => grains(9, 240, 21), []);
  const sCore = stage(ctx, 7);
  const sMain = stage(ctx, 0, 7);
  return (
    <Svg>
      <g opacity={sMain}>
        <CuNiDiagram f={f} size={22} xTicks={[10, 20, 30, 40, 50, 60]} tTicks={[1150, 1200, 1250, 1300]} labels={false} />
        <Tag x={sx(f, 20)} y={sy(f, 1300)} text="L" color={PH.L} size={30} />
        <Tag x={sx(f, 52)} y={sy(f, 1180)} text="α" color={PH.a} size={30} />
        <line x1={sx(f, c.c0)} x2={sx(f, c.c0)} y1={f.y} y2={f.y + f.h} stroke={COLORS.displacement} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
        {twoPhase && (
          <g>
            <line x1={sx(f, cL!)} x2={sx(f, cA!)} y1={sy(f, Tn)} y2={sy(f, Tn)} stroke={COLORS.chalk} strokeWidth={5} />
            <Dot x={sx(f, cL!)} y={sy(f, Tn)} color={PH.L} r={9} />
            <Dot x={sx(f, cA!)} y={sy(f, Tn)} color={PH.a} r={9} />
            <Tag x={sx(f, cL!) - 14} y={sy(f, Tn) + 8} text={`L ${cL!.toFixed(0)}% Ni`} color={PH.L} size={24} anchor="end" />
            <Tag x={sx(f, cA!) + 14} y={sy(f, Tn) + 8} text={`α ${cA!.toFixed(0)}% Ni`} color={PH.a} size={24} anchor="start" />
          </g>
        )}
        <Dot x={sx(f, c.c0)} y={sy(f, Tn)} r={13} opacity={show(ctx, 1)} />
        <Tag x={sx(f, c.c0)} y={f.y - 20} text={`${Math.round(Tn)} °C`} color={COLORS.displacement} size={30} opacity={show(ctx, 1)} />
        <Scope id="cool-scope" cx={1430} cy={440} r={230} label={wA === 0 ? "all liquid" : wA === 1 ? "all α grains" : "α crystals growing in liquid"} labelColor={wA === 1 ? PH.a : PH.L} opacity={show(ctx, 1)}>
          <rect x={-260} y={-260} width={520} height={520} fill={PH.L} opacity={0.35} />
          {cells.map((cell, i) => (
            <polygon key={i} points={polyStr(shrink(cell, Math.sqrt(wA)))} fill={PH.a} opacity={0.8} stroke={wA > 0.98 ? COLORS.board : "none"} strokeWidth={4} />
          ))}
        </Scope>
        <FractionBar
          x={1190}
          y={770}
          w={480}
          opacity={show(ctx, 3) * (twoPhase ? 1 : 0.4)}
          parts={[
            { label: "L", value: 1 - wA, color: PH.L },
            { label: "α", value: wA, color: PH.a },
          ]}
        />
      </g>
      <g opacity={sCore}>
        <Scope id="core-scope" cx={960} cy={480} r={250} label="cored grain (fast cooling)">
          {Array.from({ length: 8 }, (_, i) => {
            const r = 250 - i * 30;
            return <circle key={i} cx={0} cy={0} r={r} fill={PH.a} opacity={0.15 + i * 0.1} />;
          })}
        </Scope>
        <Tag x={960} y={480} text="centre: 46% Ni" color={COLORS.chalk} size={28} />
        <Tag x={1360} y={300} text="edge: less Ni" color={PH.a} size={28} anchor="start" />
      </g>
    </Svg>
  );
};

// ---------- 13. Gibbs ----------

const Gibbs: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const f: Frame = { x: 1040, y: 240, w: 760, h: 440, x0: 0, x1: 100, t0: 1000, t1: 1600 };
  const wander = Math.max(0, local - at(ctx, 6));
  const pL: [number, number] = [30 + 15 * Math.sin(wander * 1.1), 1480 + 60 * Math.sin(wander * 1.7)];
  const tT = 1290 + 40 * Math.sin(Math.max(0, local - at(ctx, 8)) * 1.4);
  const cL = xAtT(CU_NI.liquidus, tT)!;
  const cA = xAtT(CU_NI.solidus, tT)!;
  const rows = [
    { line: 5, region: "Liquid (Cu–Ni)", C: 2, P: 1, F: 2 },
    { line: 7, region: "α + L", C: 2, P: 2, F: 1 },
    { line: 9, region: "Eutectic point", C: 2, P: 3, F: 0 },
    { line: 10, region: "Water triple point", C: 1, P: 3, F: 0, N: 2 },
  ];
  const sDiagram = stage(ctx, 5, 9);
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 200, width: 900 }}>
        <div style={{ fontSize: 86, opacity: Math.min(1, show(ctx, 1)), filter: `drop-shadow(0 0 ${glow(local, at(ctx, 1))}px ${COLORS.kan})` }}>
          <Tex tex={local < at(ctx, 4) ? `\\textcolor{${PH.b}}{P} + \\textcolor{${COLORS.kan}}{F} = \\textcolor{${PH.L}}{C} + \\textcolor{${PH.a}}{N}` : `\\textcolor{${PH.b}}{P} + \\textcolor{${COLORS.kan}}{F} = \\textcolor{${PH.L}}{C} + 1`} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, zoom: 0.85 }}>
          <div style={{ opacity: show(ctx, 2) }}>
            <Chip color={PH.b}>P = phases</Chip>
          </div>
          <div style={{ opacity: show(ctx, 2, 1) }}>
            <Chip color={PH.L}>C = components</Chip>
          </div>
          <div style={{ opacity: show(ctx, 3) }}>
            <Chip color={PH.a}>N = outside variables (T, P)</Chip>
          </div>
          <div style={{ opacity: show(ctx, 3, 1.2) }}>
            <Chip color={COLORS.kan}>F = degrees of freedom</Chip>
          </div>
        </div>
        <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 14, opacity: show(ctx, 4) }}>pressure fixed at 1 atm → N = 1</div>
        <table style={{ marginTop: 14, fontSize: 30, borderCollapse: "collapse", opacity: show(ctx, 5) }}>
          <thead>
            <tr style={{ color: COLORS.chalkDim }}>
              <td style={{ padding: "4px 18px 4px 0" }}>where</td>
              <td style={{ padding: "4px 18px" }}>C</td>
              <td style={{ padding: "4px 18px" }}>P</td>
              <td style={{ padding: "4px 18px" }}>F</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.region} style={{ opacity: show(ctx, r.line), fontWeight: 800 }}>
                <td style={{ padding: "4px 18px 4px 0" }}>{r.region}</td>
                <td style={{ padding: "4px 18px", color: PH.L }}>{r.C}</td>
                <td style={{ padding: "4px 18px", color: PH.b }}>{r.P}</td>
                <td style={{ padding: "4px 18px", color: COLORS.kan }}>
                  {r.C + (r.N ?? 1) - r.P}
                  {r.N ? " (N = 2)" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Svg>
        <g opacity={sDiagram}>
          <CuNiDiagram f={f} size={20} labels={false} />
          <g opacity={stage(ctx, 5, 7)}>
            <Dot x={sx(f, pL[0])} y={sy(f, pL[1])} r={12} />
            <Tag x={sx(f, pL[0]) + 20} y={sy(f, pL[1]) - 20} text="F = 2: move freely" color={COLORS.kan} size={24} anchor="start" />
          </g>
          <g opacity={stage(ctx, 7, 9)}>
            <line x1={sx(f, cL)} x2={sx(f, cA)} y1={sy(f, tT)} y2={sy(f, tT)} stroke={COLORS.chalk} strokeWidth={5} />
            <Dot x={sx(f, cL)} y={sy(f, tT)} color={PH.L} r={9} />
            <Dot x={sx(f, cA)} y={sy(f, tT)} color={PH.a} r={9} />
            <Tag x={sx(f, cA) + 16} y={sy(f, tT) + 40} text="F = 1: pick T → both ends fixed" color={COLORS.kan} size={22} anchor="start" />
          </g>
        </g>
        <g opacity={stage(ctx, 9)}>
          <EutecticDiagram f={{ ...f, t0: CU_AG.tMin, t1: CU_AG.tMax }} e={CU_AG} size={20} tTicks={[200, 600, 1000]} labels={false} vis={{ Epulse: pulseAt(local, at(ctx, 9)) }} />
          <Tag x={sx(f, CU_AG.eC)} y={sy({ ...f, t0: CU_AG.tMin, t1: CU_AG.tMax }, CU_AG.eT) - 40} text="L, α, β meet: F = 0" color={COLORS.displacement} size={24} />
        </g>
      </Svg>
    </>
  );
};

// ---------- 14. Cu–Ag eutectic ----------

const CuAgScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const e = CU_AG;
  const f: Frame = { x: 330, y: 210, w: 1080, h: 590, x0: 0, x1: 100, t0: e.tMin, t1: e.tMax };
  const split = ramp(ctx, 9, 1.4);
  return (
    <>
      <Svg>
        <EutecticDiagram
          f={f}
          e={e}
          tTicks={[200, 400, 600, 800, 1000, 1200]}
          vis={{
            axes: ramp(ctx, 0, 1.2),
            melt: show(ctx, 0, 1),
            solA: ramp(ctx, 3, 1.2),
            a: show(ctx, 3, 0.8),
            solB: ramp(ctx, 4, 1.2),
            b: show(ctx, 4, 0.8),
            solvA: ramp(ctx, 3, 1.4, 0.6),
            solvB: ramp(ctx, 4, 1.4, 0.6),
            solvGlow: local > at(ctx, 5) && local < at(ctx, 6) ? 1 : 0,
            ab: show(ctx, 6),
            liq: ramp(ctx, 7, 1.6),
            L: show(ctx, 7, 1),
            aL: show(ctx, 7, 1.4),
            bL: show(ctx, 7, 1.4),
            E: show(ctx, 7, 1.2),
            Epulse: local > at(ctx, 8) && local < at(ctx, 9) ? pulseAt(local, at(ctx, 8)) : 0,
            iso: ramp(ctx, 7, 1, 1.2),
            isoGlow: local > at(ctx, 10) ? 1 : 0,
          }}
        />
        <Tag x={sx(f, e.alphaMax) + 10} y={sy(f, e.eT) + 44} text="8.0" color={PH.a} size={26} opacity={show(ctx, 3, 1)} anchor="start" />
        <Tag x={sx(f, e.betaMin) - 10} y={sy(f, e.eT) + 44} text="91.2" color={PH.b} size={26} opacity={show(ctx, 4, 1)} anchor="end" />
        <Tag x={sx(f, e.eC) - 20} y={sy(f, e.eT) + 50} text="E: 71.9 wt% Ag, 779 °C" anchor="end" color={COLORS.displacement} size={26} opacity={show(ctx, 7, 1.2)} />
        <Tag x={sx(f, 50)} y={sy(f, e.eT) - 8} text="779 °C eutectic isotherm" color={COLORS.displacement} size={24} opacity={show(ctx, 10)} />
      </Svg>
      <Panel style={{ left: 1460, width: 400, top: 250, textAlign: "center" }} opacity={stage(ctx, 1, 3)} color={COLORS.chalkDim}>
        <div style={{ fontSize: 36, fontWeight: 800 }}>Two solid phases</div>
        <div style={{ fontSize: 30, color: PH.a, marginTop: 10, opacity: show(ctx, 2) }}>α: Cu-rich</div>
        <div style={{ fontSize: 30, color: PH.b, opacity: show(ctx, 2, 0.8) }}>β: Ag-rich</div>
      </Panel>
      <Panel style={{ left: 1460, width: 400, top: 250, textAlign: "center" }} opacity={stage(ctx, 5, 8)} color={PH.a}>
        <div style={{ fontSize: 32, fontWeight: 800 }}>solvus = solubility limit in a solid</div>
        <div style={{ fontSize: 28, color: COLORS.chalkDim, marginTop: 8 }}>colder → holds less</div>
      </Panel>
      <Panel style={{ left: 1460, width: 400, top: 250, textAlign: "center" }} opacity={stage(ctx, 8)} color={COLORS.displacement}>
        <div style={{ fontSize: 30, color: COLORS.chalkDim }}>eu-tectic = easily melted</div>
        <div style={{ fontSize: 54, marginTop: 10, opacity: show(ctx, 9) }}>
          <span style={{ color: PH.L }}>L</span> →{" "}
          <span style={{ color: PH.a, display: "inline-block", translate: `${-20 * (1 - split)}px 0` }}>α</span> +{" "}
          <span style={{ color: PH.b, display: "inline-block", translate: `${20 * (1 - split)}px 0` }}>β</span>
        </div>
        <div style={{ fontSize: 26, color: COLORS.chalkDim, marginTop: 6, opacity: show(ctx, 9, 0.6) }}>one liquid → two solids, at once</div>
      </Panel>
    </>
  );
};

// ---------- 15. Pb–Sn ----------

const PbSnScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const e = PB_SN;
  const ex = PB_SN_EX;
  const v = ctx.values;
  const f: Frame = { x: 260, y: 210, w: 980, h: 590, x0: 0, x1: 100, t0: e.tMin, t1: e.tMax };
  const draw = ramp(ctx, 0, 2);
  return (
    <>
      <Svg>
        <EutecticDiagram
          f={f}
          e={e}
          tTicks={[0, 100, 200, 300]}
          vis={{ axes: draw, liq: draw, solA: draw, solvA: draw, solB: draw, solvB: draw, iso: draw, L: draw, a: draw, b: draw, ab: draw, aL: draw, bL: draw, melt: show(ctx, 1), E: show(ctx, 2), Epulse: pulseAt(local, at(ctx, 2)) }}
        />
        <Tag x={sx(f, 0) + 16} y={sy(f, e.meltA) - 20} text="Pb 327 °C" size={24} opacity={show(ctx, 1)} anchor="start" />
        <Tag x={sx(f, 100) - 16} y={sy(f, e.meltB) - 24} text="Sn 232 °C" size={24} opacity={show(ctx, 1, 0.6)} anchor="end" />
        <Tag x={sx(f, e.eC)} y={sy(f, e.eT) - 30} text="183 °C, 61.9% Sn" color={COLORS.displacement} size={26} opacity={show(ctx, 2)} />
        <g opacity={stage(ctx, 3, 5)}>
          {[
            [e.alphaMax, "18.3", PH.a],
            [e.eC, "61.9", PH.L],
            [e.betaMin, "97.8", PH.b],
          ].map(([x, l, c]) => (
            <g key={l as string}>
              <Dot x={sx(f, x as number)} y={sy(f, e.eT)} color={c as string} r={10} />
              <Tag x={sx(f, x as number)} y={sy(f, e.eT) + 50} text={l as string} color={c as string} size={24} />
            </g>
          ))}
        </g>
        <g opacity={show(ctx, 5)}>
          <Dot x={sx(f, ex.c0)} y={sy(f, ex.T)} r={12} />
          <Tag x={sx(f, ex.c0)} y={sy(f, ex.T) - 30} text="40% Sn, 150 °C" color={COLORS.displacement} size={24} />
        </g>
        <Curve f={f} line={[[ex.cA, ex.T], [ex.cB, ex.T]]} p={ramp(ctx, 6, 1)} color={COLORS.chalk} width={6} raw />
        <Tag x={sx(f, ex.cA)} y={sy(f, ex.T) + 46} text={v.pbA} color={PH.a} size={24} opacity={show(ctx, 6, 0.8)} />
        <Tag x={sx(f, ex.cB) - 10} y={sy(f, ex.T) + 46} text={v.pbB} color={PH.b} size={24} opacity={show(ctx, 6, 1)} anchor="end" />
      </Svg>
      <Panel style={{ left: 1300, width: 560, top: 240 }} opacity={stage(ctx, 3, 5)} color={COLORS.displacement}>
        <div style={{ fontSize: 40, textAlign: "center" }}>
          <Tex tex={`\\textcolor{${PH.L}}{L_{(61.9)}} \\rightarrow \\textcolor{${PH.a}}{\\alpha_{(18.3)}} + \\textcolor{${PH.b}}{\\beta_{(97.8)}}`} />
        </div>
        <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 12, textAlign: "center", opacity: show(ctx, 4) }}>≈ 60% tin solder: melts low, all at once</div>
      </Panel>
      <Panel style={{ left: 1300, width: 560, top: 300 }} opacity={show(ctx, 7)} color={COLORS.kan}>
        <div style={{ fontSize: 40 }}>
          <Tex tex={`W_\\alpha = \\dfrac{98 - 40}{98 - 11} = \\textcolor{${PH.a}}{${v.pbWa}}`} />
        </div>
        <div style={{ fontSize: 40, marginTop: 26 }}>
          <Tex tex={`W_\\beta = \\dfrac{40 - 11}{98 - 11} = \\textcolor{${PH.b}}{${v.pbWb}}`} />
        </div>
      </Panel>
    </>
  );
};

// ---------- 16. eutectic microstructures ----------

const Micro: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const e = PB_SN;
  const f: Frame = { x: 190, y: 220, w: 660, h: 560, x0: 0, x1: 100, t0: e.tMin, t1: e.tMax };
  const cases = [
    { from: 1, to: 2, x: 1.5, knots: [[at(ctx, 1), 330], [at(ctx, 2) - 0.3, 40]] as [number, number][] },
    { from: 2, to: 4, x: 10, knots: [[at(ctx, 2), 330], [at(ctx, 3), tAtX(e.solvA, 10)! - 2], [at(ctx, 4) - 0.3, 40]] as [number, number][] },
    { from: 4, to: 7, x: e.eC, knots: [[at(ctx, 4), 300], [at(ctx, 4) + 2.5, e.eT], [at(ctx, 7) - 0.3, 60]] as [number, number][] },
    { from: 7, to: 99, x: 40, knots: [[at(ctx, 7), 300], [at(ctx, 8), e.eT + 0.5], [at(ctx, 8) + 1, e.eT - 1], [at(ctx, 9), 120]] as [number, number][] },
  ];
  const ci = Math.max(0, cases.findLastIndex((c) => local >= at(ctx, c.from) - 0.2));
  const cs = cases[ci];
  const Tn = track(local, cs.knots);
  const cells = useMemo(() => grains(8, 240, 41), []);
  const fine = useMemo(() => grains(14, 240, 77), []);
  const liquid = <rect x={-260} y={-260} width={520} height={520} fill={PH.L} opacity={0.35} />;
  let content: React.ReactNode = null;
  let label = "";
  if (ci === 0) {
    const solidT = tAtX(e.solA, cs.x)!;
    const g = Tn >= solidT ? 0 : 1;
    content = (
      <>
        {liquid}
        {cells.map((c, i) => (
          <polygon key={i} points={polyStr(shrink(c, g ? 1 : 0.0))} fill={PH.a} opacity={0.75} stroke={COLORS.board} strokeWidth={4} />
        ))}
      </>
    );
    label = g ? "α grains" : "liquid";
  } else if (ci === 1) {
    const solvT = tAtX(e.solvA, cs.x)!;
    const wB = Tn >= solvT ? 0 : lever(cs.x, xAtT(e.solvA, Tn)!, xAtT(e.solvB, Tn)!).wB;
    const n = 40;
    const rr = Math.sqrt((wB * 240 * 240) / n); // total particle area = wB × view area
    content = (
      <>
        {cells.map((c, i) => (
          <polygon key={i} points={polyStr(c.poly)} fill={PH.a} opacity={0.75} stroke={COLORS.board} strokeWidth={4} />
        ))}
        {wB > 0 &&
          Array.from({ length: n }, (_, i) => <circle key={i} cx={(hash(i + 300) - 0.5) * 440} cy={(hash(i + 400) - 0.5) * 440} r={rr} fill={PH.b} stroke={COLORS.board} strokeWidth={2} />)}
      </>
    );
    label = wB > 0 ? `β particles in α (β ${wB.toFixed(2)})` : "α grains";
  } else if (ci === 2) {
    const rev = Tn > e.eT ? 0 : Math.min(1, (local - (at(ctx, 4) + 2.5)) / 1.5);
    content = (
      <>
        {liquid}
        {fine.map((c, i) => (
          <Lamellae key={i} id={`eu-${i}`} poly={c.poly} angle={c.angle} spacing={16} share={EUTECTIC_SPLIT.wA} c1={PH.a} c2={PH.b} reveal={rev} />
        ))}
        {rev > 0 && fine.map((c, i) => <polygon key={`b${i}`} points={polyStr(c.poly)} fill="none" stroke={COLORS.board} strokeWidth={3} opacity={rev} />)}
      </>
    );
    label = rev > 0 ? "eutectic: α and β layers" : "liquid, 61.9% Sn";
  } else {
    const liqT = tAtX(e.liqL, cs.x)!;
    const prim =
      Tn >= liqT ? 0 : Tn > e.eT ? lever(cs.x, xAtT(e.solA, Tn)!, xAtT(e.liqL, Tn)!).wA : PB_SN_MICRO.primary;
    const rev = Tn > e.eT ? 0 : Math.min(1, (local - at(ctx, 8) - 1) / 1.5);
    content = (
      <>
        {liquid}
        {rev > 0 && fine.map((c, i) => <Lamellae key={i} id={`eu4-${i}`} poly={c.poly} angle={c.angle} spacing={12} share={EUTECTIC_SPLIT.wA} c1={PH.a} c2={PH.b} reveal={rev} />)}
        {cells.map((c, i) => (
          <polygon key={i} points={polyStr(shrink(c, Math.sqrt(prim)))} fill={PH.a} stroke={COLORS.board} strokeWidth={3} />
        ))}
      </>
    );
    label = rev > 0 ? "primary α + eutectic" : prim > 0 ? "primary α growing" : "liquid, 40% Sn";
  }
  return (
    <Svg>
      <EutecticDiagram f={f} e={e} size={20} tTicks={[0, 100, 200, 300]} labels={false} />
      {cases.map((c, i) => (
        <g key={i} opacity={local >= at(ctx, c.from) - 0.2 ? (i === ci ? 1 : 0.35) : 0}>
          <line x1={sx(f, c.x)} x2={sx(f, c.x)} y1={f.y} y2={f.y + f.h} stroke={COLORS.displacement} strokeWidth={i === ci ? 4 : 2} strokeDasharray="8 8" />
          <Tag x={sx(f, c.x)} y={f.y - 14} text={`${i + 1}`} color={COLORS.displacement} size={24} />
        </g>
      ))}
      <Dot x={sx(f, cs.x)} y={sy(f, Tn)} r={12} opacity={show(ctx, 1)} />
      <Tag x={sx(f, 50)} y={f.y + f.h - 20} text={`${Math.round(Tn)} °C`} color={COLORS.displacement} size={24} opacity={show(ctx, 1)} />
      <Scope id="micro-scope" cx={1340} cy={470} r={250} label={label} opacity={show(ctx, 1)}>
        {content}
      </Scope>
      {ci === 2 && local > at(ctx, 6) && (
        <g transform="translate(1660 760)">
          <rect x={-90} y={-60} width={180} height={120} rx={14} fill={SURFACE} stroke={COLORS.chalkDim} strokeWidth={2} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-80} y={-50 + i * 26} width={160} height={14} fill={i % 2 ? PH.b : PH.a} />
          ))}
          <T x={0} y={92} size={22} color={COLORS.chalkDim}>
            short sideways moves
          </T>
        </g>
      )}
      <FractionBar
        x={1110}
        y={800}
        w={460}
        opacity={show(ctx, 9)}
        parts={[
          { label: "primary α", value: PB_SN_MICRO.primary, color: PH.a },
          { label: "eutectic", value: PB_SN_MICRO.eutectic, color: PH.b },
        ]}
      />
    </Svg>
  );
};

// ---------- 17. invariant reactions ----------

/** Schematic of an invariant point: phases above and below a flat line. */
const Invariant: React.FC<{ kind: "eu" | "eud" | "peri" }> = ({ kind }) => {
  const above = kind === "eu" ? ["L"] : kind === "eud" ? ["γ"] : ["α", "L"];
  const below = kind === "peri" ? ["β"] : ["α", "β"];
  const col = (p: string) => (p === "L" ? PH.L : p === "α" ? PH.a : p === "β" ? PH.b : PH.g);
  return (
    <svg width={340} height={230}>
      {kind !== "peri" ? (
        <path d="M 30 30 L 170 130 L 310 30" fill="none" stroke={col(above[0])} strokeWidth={6} />
      ) : (
        <path d="M 30 40 L 120 130 M 310 30 L 170 130" fill="none" stroke={PH.L} strokeWidth={6} />
      )}
      <line x1={20} x2={320} y1={130} y2={130} stroke={COLORS.displacement} strokeWidth={6} />
      <circle cx={kind === "peri" ? 120 : 170} cy={130} r={10} fill={COLORS.displacement} />
      {above.map((p, i) => (
        <text key={p} x={above.length === 1 ? 170 : 90 + i * 160} y={80} fill={col(p)} fontSize={42} fontWeight={800} textAnchor="middle" fontFamily={sceneFont}>
          {p}
        </text>
      ))}
      {below.map((p, i) => (
        <text key={p} x={below.length === 1 ? 170 : 90 + i * 160} y={200} fill={col(p)} fontSize={42} fontWeight={800} textAnchor="middle" fontFamily={sceneFont}>
          {p}
        </text>
      ))}
    </svg>
  );
};

const InvariantScene: React.FC<SceneProps> = ({ ctx }) => {
  const cards = [
    { line: 1, name: "Eutectic", kind: "eu" as const, eq: "L \\rightarrow \\alpha + \\beta", note: "liquid splits" },
    { line: 2, name: "Eutectoid", kind: "eud" as const, eq: "\\gamma \\rightarrow \\alpha + \\beta", note: "solid splits" },
    { line: 3, name: "Peritectic", kind: "peri" as const, eq: "\\alpha + L \\rightarrow \\beta", note: "two join into one" },
  ];
  const sTop = stage(ctx, 0, 6);
  return (
    <>
      <div style={{ position: "absolute", left: 100, right: 100, top: 210, display: "flex", gap: 30, opacity: sTop }}>
        {cards.map((c) => (
          <div key={c.name} style={{ flex: 1, opacity: Math.min(1, show(ctx, c.line)), background: SURFACE, border: `3px solid ${COLORS.displacement}`, borderRadius: 22, padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: COLORS.displacement }}>{c.name}</div>
            <Invariant kind={c.kind} />
            <div style={{ fontSize: 40 }}>
              <Tex tex={c.eq} />
            </div>
            <div style={{ fontSize: 28, color: COLORS.chalkDim }}>{c.note}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 690, display: "flex", gap: 30, justifyContent: "center", opacity: sTop }}>
        <div style={{ opacity: show(ctx, 4) }}>
          <Chip color={PH.L} size={34}>
            -tectic → has liquid · -tectoid → all solid
          </Chip>
        </div>
        <div style={{ opacity: show(ctx, 5) }}>
          <Chip color={COLORS.kan} size={34}>
            eu → splits · peri → joins
          </Chip>
        </div>
      </div>
      <Panel style={{ left: 260, right: 260, top: 260, textAlign: "center" }} opacity={stage(ctx, 6, 8)} color={COLORS.acceleration}>
        <div style={{ fontSize: 40, fontWeight: 800, color: COLORS.acceleration }}>Copper–zinc (brass family)</div>
        <div style={{ fontSize: 44, marginTop: 16 }}>
          Eutectoid {CU_ZN.eutectoidT} °C: <Tex tex={`\\delta \\rightarrow \\gamma + \\varepsilon`} />
        </div>
        <div style={{ fontSize: 44, marginTop: 12, opacity: show(ctx, 7) }}>
          Peritectic {CU_ZN.peritecticT} °C: <Tex tex={`\\delta + L \\rightarrow \\varepsilon`} />
        </div>
      </Panel>
      <Panel style={{ left: 260, right: 260, top: 300, textAlign: "center" }} opacity={stage(ctx, 8)} color={COLORS.kan}>
        <div style={{ fontSize: 40, fontWeight: 800 }}>Spot it on any diagram</div>
        <div style={{ fontSize: 36, marginTop: 16 }}>Find a flat line. Look at the point on it.</div>
        <div style={{ fontSize: 36, marginTop: 10, color: COLORS.displacement }}>1 above → 2 below: eutectic / eutectoid</div>
        <div style={{ fontSize: 36, marginTop: 6, color: COLORS.kan }}>2 above → 1 below: peritectic</div>
      </Panel>
    </>
  );
};

// ---------- 18. iron–carbon ----------

const FE_FRAME: Frame = { x: 300, y: 200, w: 1260, h: 600, x0: 0, x1: FE_C.cementite, t0: FE_C.tMin, t1: FE_C.tMax };

const Iron: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const F = FE_C;
  const f = FE_FRAME;
  const sLadder = stage(ctx, 1, 4);
  const sDia = stage(ctx, 4);
  const ladder: Frame = { x: 760, y: 220, w: 160, h: 580, x0: 0, x1: 1, t0: 400, t1: 1600 };
  const bands = [
    { from: 400, to: F.alphaToGamma, name: "α ferrite · BCC", color: PH.a, line: 1 },
    { from: F.alphaToGamma, to: F.gammaToDelta, name: "γ austenite · FCC", color: PH.g, line: 2 },
    { from: F.gammaToDelta, to: F.melt, name: "δ ferrite · BCC", color: PH.d, line: 3 },
    { from: F.melt, to: 1600, name: "liquid", color: PH.L, line: 3 },
  ];
  const draw = ramp(ctx, 4, 2);
  return (
    <>
      <Svg>
        <g opacity={sLadder}>
          {bands.map((b) => (
            <g key={b.name} opacity={show(ctx, b.line, b.name === "liquid" ? 1.2 : 0)}>
              <rect x={ladder.x} y={sy(ladder, b.to)} width={ladder.w} height={sy(ladder, b.from) - sy(ladder, b.to)} fill={b.color} opacity={0.5} />
              <T x={ladder.x + ladder.w + 30} y={(sy(ladder, b.to) + sy(ladder, b.from)) / 2 + 12} size={34} color={b.color} anchor="start">
                {b.name}
              </T>
              <T x={ladder.x - 20} y={sy(ladder, b.from) + 10} size={28} color={COLORS.chalkDim} anchor="end">
                {b.from === 400 ? "room temp ↓" : `${b.from} °C`}
              </T>
            </g>
          ))}
          <T x={ladder.x + ladder.w / 2} y={ladder.y - 20} size={32} color={COLORS.chalk}>
            pure iron
          </T>
        </g>
        <g opacity={sDia}>
          <FeCDiagram
            f={f}
            vis={{
              axes: draw,
              lines: draw,
              L: draw,
              d: draw,
              gL: draw,
              g: draw,
              ag: draw,
              a: draw,
              gc: draw,
              ac: draw,
              fe3c: draw,
              aGlow: local > at(ctx, 5) && local < at(ctx, 6) ? 0.5 + 0.5 * Math.sin((local - at(ctx, 5)) * 5) : 0,
              gGlow: local > at(ctx, 6) && local < at(ctx, 7) ? 0.5 + 0.5 * Math.sin((local - at(ctx, 6)) * 5) : 0,
              eGlow: local > at(ctx, 9) ? 1 : 0,
              edGlow: local > at(ctx, 10) ? 1 : 0,
            }}
          />
          <Tag x={sx(f, 0.022) + 60} y={sy(f, F.eutectoidT) + 70} text="α: max 0.022% C" color={PH.a} size={26} opacity={show(ctx, 5)} anchor="start" />
          <Dot x={sx(f, F.alphaMax)} y={sy(f, F.eutectoidT)} color={PH.a} r={9} opacity={show(ctx, 5)} />
          <Dot x={sx(f, F.gammaMax)} y={sy(f, F.eutectT)} color={PH.g} r={10} opacity={show(ctx, 6)} />
          <Tag x={sx(f, F.gammaMax) + 10} y={sy(f, F.eutectT) - 26} text="γ: max 2.14% C" color={PH.g} size={26} opacity={show(ctx, 6)} anchor="start" />
          <Tag x={sx(f, 6.7) - 10} y={sy(f, 520)} text="cementite 6.70% C" color={PH.c} size={26} opacity={show(ctx, 7)} anchor="end" />
          <Dot x={sx(f, F.periGamma)} y={sy(f, F.peritecticT)} r={11} opacity={show(ctx, 8)} pulse={pulseAt(local, at(ctx, 8))} />
          <Tag x={sx(f, F.periGamma) + 30} y={sy(f, F.peritecticT) - 16} text="peritectic 1493 °C: δ + L → γ" color={COLORS.displacement} size={24} opacity={show(ctx, 8)} anchor="start" />
          <Dot x={sx(f, F.eutectC)} y={sy(f, F.eutectT)} r={12} opacity={show(ctx, 9)} pulse={pulseAt(local, at(ctx, 9))} />
          <Tag x={sx(f, F.eutectC)} y={sy(f, F.eutectT) + 50} text="eutectic 1147 °C, 4.30%: L → γ + Fe₃C" color={COLORS.displacement} size={24} opacity={show(ctx, 9)} />
          <Dot x={sx(f, F.eutectoidC)} y={sy(f, F.eutectoidT)} r={12} opacity={show(ctx, 10)} pulse={pulseAt(local, at(ctx, 10))} />
          <Tag x={sx(f, F.eutectoidC) + 24} y={sy(f, F.eutectoidT) - 22} text="eutectoid 727 °C, 0.76%: γ → α + Fe₃C" color={COLORS.displacement} size={24} opacity={show(ctx, 10)} anchor="start" />
          <g opacity={show(ctx, 11)}>
            <rect x={sx(f, 0)} y={f.y + f.h - 40} width={sx(f, F.gammaMax) - sx(f, 0)} height={40} fill={COLORS.velocity} opacity={0.85} />
            <rect x={sx(f, F.gammaMax)} y={f.y + f.h - 40} width={sx(f, 6.7) - sx(f, F.gammaMax)} height={40} fill={COLORS.acceleration} opacity={0.85} />
            <T x={(sx(f, 0) + sx(f, F.gammaMax)) / 2} y={f.y + f.h - 10} size={26} color={COLORS.board}>
              STEEL
            </T>
            <T x={(sx(f, F.gammaMax) + sx(f, 6.7)) / 2} y={f.y + f.h - 10} size={26} color={COLORS.board}>
              CAST IRON
            </T>
          </g>
        </g>
      </Svg>
    </>
  );
};

// ---------- 19. steels ----------

/** Ferrite inside pearlite is drawn a little greyer, so proeutectoid ferrite (white) stands out next to it. */
const PEARLITE_FERRITE = "#a9b2c8";

const Steels: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const F = FE_C;
  const L = FE_C_LINES;
  const f: Frame = { x: 220, y: 230, w: 760, h: 560, x0: 0, x1: 1.6, t0: 600, t1: 1050 };
  const cases = [
    { from: 1, x: F.eutectoidC, knots: [[at(ctx, 1), 850], [at(ctx, 2), F.eutectoidT + 0.5], [at(ctx, 2) + 1, F.eutectoidT - 1], [at(ctx, 3), 690]] as [number, number][] },
    { from: 5, x: HYPO.c0, knots: [[at(ctx, 5), 900], [at(ctx, 7), F.eutectoidT + 0.5], [at(ctx, 7) + 1, F.eutectoidT - 1], [at(ctx, 8), 690]] as [number, number][] },
    { from: 9, x: HYPER.c0, knots: [[at(ctx, 9), 1000], [at(ctx, 11) - 1, F.eutectoidT + 0.5], [at(ctx, 11), F.eutectoidT - 1], [at(ctx, 11) + 3, 690]] as [number, number][] },
  ];
  const ci = Math.max(0, cases.findLastIndex((c) => local >= at(ctx, c.from) - 0.2));
  const cs = cases[ci];
  const Tn = track(local, cs.knots);
  const below = Tn < F.eutectoidT;
  const crossAt = cs.knots[1][0];
  const reveal = below ? Math.min(1, (local - crossAt - 1) / 1.6) : 0;
  const cells = useMemo(() => grains(7, 240, 13), []);
  // Proeutectoid amount at this temperature, from the lever rule on the drawn lines.
  let pro = 0;
  if (ci === 1) {
    const a3T = tAtX(L.a3, cs.x)!;
    pro = Tn >= a3T ? 0 : below ? HYPO.proeutectoid : lever(cs.x, xAtT(L.alphaGamma, Tn)!, xAtT(L.a3, Tn)!).wA;
  } else if (ci === 2) {
    const acmT = tAtX(L.acm, cs.x)!;
    pro = Tn >= acmT ? 0 : below ? HYPER.proeutectoid : lever(cs.x, xAtT(L.acm, Tn)!, F.cementite).wB;
  }
  const proColor = ci === 2 ? PH.cementite : PH.ferrite;
  const inner = Math.sqrt(1 - pro); // inner area share = 1 − pro
  const label =
    ci === 0
      ? below
        ? "pearlite (ferrite + cementite layers)"
        : "austenite grains"
      : ci === 1
        ? below
          ? "proeutectoid ferrite + pearlite"
          : pro > 0
            ? "ferrite forming at grain boundaries"
            : "austenite grains"
        : below
          ? "proeutectoid cementite + pearlite"
          : pro > 0
            ? "cementite forming at grain boundaries"
            : "austenite grains";
  const bars =
    ci === 0
      ? { op: show(ctx, 4), parts: [{ label: "ferrite", value: PEARLITE.wA, color: PH.a }, { label: "Fe₃C", value: PEARLITE.wB, color: PH.c }] }
      : ci === 1
        ? { op: show(ctx, 8), parts: [{ label: "pearlite", value: HYPO.pearlite, color: PH.g }, { label: "pro. ferrite", value: HYPO.proeutectoid, color: PH.a }] }
        : { op: show(ctx, 11), parts: [{ label: "pearlite", value: HYPER.pearlite, color: PH.g }, { label: "pro. Fe₃C", value: HYPER.proeutectoid, color: PH.c }] };
  return (
    <Svg>
      <FeCDiagram f={f} size={22} xTicks={[0, 0.4, 0.76, 1.2, 1.6]} tTicks={[600, 700, 800, 900, 1000]} />
      {cases.map((c, i) => (
        <g key={i} opacity={local >= at(ctx, c.from) - 0.2 ? (i === ci ? 1 : 0.3) : 0}>
          <line x1={sx(f, c.x)} x2={sx(f, c.x)} y1={f.y} y2={f.y + f.h} stroke={COLORS.displacement} strokeWidth={i === ci ? 4 : 2} strokeDasharray="8 8" />
        </g>
      ))}
      <Dot x={sx(f, cs.x)} y={sy(f, Tn)} r={12} opacity={show(ctx, 1)} />
      <Tag x={sx(f, cs.x)} y={f.y - 16} text={`${cs.x.toFixed(2)}% C · ${Math.round(Tn)} °C`} color={COLORS.displacement} size={26} opacity={show(ctx, 1)} />
      <Scope id="steel-scope" cx={1400} cy={440} r={230} label={label} opacity={show(ctx, 1)}>
        {cells.map((c: Cell, i) => {
          const core = shrink(c, inner);
          return (
            <g key={i}>
              <polygon points={polyStr(c.poly)} fill={pro > 0 ? proColor : PH.g} opacity={pro > 0 ? 0.95 : 0.4} stroke={COLORS.board} strokeWidth={3} />
              {pro > 0 && <polygon points={polyStr(core)} fill={PH.g} opacity={0.45} />}
              {reveal > 0 && <Lamellae id={`pl-${ci}-${i}`} poly={core} angle={c.angle} spacing={14} share={PEARLITE.wA} c1={PEARLITE_FERRITE} c2={PH.cementite} reveal={reveal} />}
            </g>
          );
        })}
      </Scope>
      <T x={1400} y={210} size={30} color={COLORS.chalkDim} opacity={show(ctx, 3) * (ci === 0 ? 1 : 0)}>
        shines like mother-of-pearl
      </T>
      <FractionBar x={1160} y={770} w={480} parts={bars.parts} opacity={bars.op} />
    </Svg>
  );
};

// ---------- 20. summary ----------

const Summary: React.FC<SceneProps> = ({ ctx }) => {
  const cards = [
    { line: 1, title: "Cu–Ni · isomorphous", lines: ["one solid α, all compositions", "Cu 1085 °C, Ni 1455 °C"] },
    { line: 2, title: "Ag–Cu · eutectic", lines: ["779 °C at 71.9% Ag", "α ≤ 8.0%, β ≥ 91.2% Ag"] },
    { line: 3, title: "Sn–Pb · eutectic", lines: ["183 °C at 61.9% Sn", "α ≤ 18.3%, β ≥ 97.8% Sn · solder"] },
  ];
  const fr = (i: number): Frame => ({ x: 130 + i * 580, y: 270, w: 470, h: 300, x0: 0, x1: 100, t0: 0, t1: 1 });
  return (
    <>
      <Svg>
        {cards.map((c, i) => {
          const base = fr(i);
          return (
            <g key={c.title} opacity={show(ctx, c.line)}>
              {i === 0 && <CuNiDiagram f={{ ...base, t0: 1000, t1: 1600 }} size={18} labels={false} tTicks={[1000, 1200, 1400, 1600]} />}
              {i === 1 && <EutecticDiagram f={{ ...base, t0: CU_AG.tMin, t1: CU_AG.tMax }} e={CU_AG} size={18} labels={false} tTicks={[200, 600, 1000]} />}
              {i === 2 && <EutecticDiagram f={{ ...base, t0: PB_SN.tMin, t1: PB_SN.tMax }} e={PB_SN} size={18} labels={false} tTicks={[0, 100, 200, 300]} />}
            </g>
          );
        })}
      </Svg>
      {cards.map((c, i) => (
        <div key={c.title} style={{ position: "absolute", left: 100 + i * 580, width: 520, top: 690, textAlign: "center", opacity: Math.min(1, show(ctx, c.line)) }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.kan }}>{c.title}</div>
          {c.lines.map((l) => (
            <div key={l} style={{ fontSize: 28 }}>
              {l}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

// ---------- 21. quiz ----------

const Quiz: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const v = ctx.values;
  const q1End = endOf(ctx, 0);
  const q2End = endOf(ctx, 2);
  const count = (from: number, to: number) => Math.ceil(interpolate(local, [from, to], [5, 0], CLAMP));
  return (
    <>
      <Panel style={{ left: 200, right: 200, top: 220, textAlign: "center" }} opacity={stage(ctx, 0, 2)} color={COLORS.displacement}>
        <div style={{ fontSize: 34, color: COLORS.displacement, fontWeight: 800, letterSpacing: 2 }}>PAUSE AND TRY</div>
        <div style={{ fontSize: 46, marginTop: 10 }}>0.60 wt% C steel, just below 727 °C. Fraction of pearlite?</div>
      </Panel>
      {local >= q1End && local < at(ctx, 1) && <Big top={470} size={160} color={COLORS.kan} opacity={1}>{count(q1End, at(ctx, 1))}</Big>}
      <Panel style={{ left: 420, right: 420, top: 470, textAlign: "center" }} opacity={stage(ctx, 1, 2)} color={COLORS.kan}>
        <div style={{ fontSize: 52 }}>
          <Tex tex={`W_P = \\dfrac{0.60 - 0.022}{0.76 - 0.022} = \\textcolor{${COLORS.kan}}{${v.quizP}}\\ \\checkmark`} />
        </div>
      </Panel>
      <Panel style={{ left: 200, right: 200, top: 220, textAlign: "center" }} opacity={stage(ctx, 2)} color={COLORS.displacement}>
        <div style={{ fontSize: 34, color: COLORS.displacement, fontWeight: 800, letterSpacing: 2 }}>QUICK ONE</div>
        <div style={{ fontSize: 46, marginTop: 10 }}>Degrees of freedom at a binary eutectic point?</div>
      </Panel>
      {local >= q2End && local < at(ctx, 3) && <Big top={470} size={160} color={COLORS.kan} opacity={1}>{count(q2End, at(ctx, 3))}</Big>}
      <Panel style={{ left: 420, right: 420, top: 470, textAlign: "center" }} opacity={show(ctx, 3)} color={COLORS.kan}>
        <div style={{ fontSize: 56 }}>
          <Tex tex={`F = 2 + 1 - 3 = \\textcolor{${COLORS.kan}}{0}\\ \\checkmark`} />
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 1560, top: 520, opacity: show(ctx, 1) }}>
        <Kan radius={70} expression="excited" arms="up" look={{ x: -1, y: -0.3 }} time={local} />
      </div>
      <Confetti local={local} at={at(ctx, 1)} x={960} y={560} />
      <Confetti local={local} at={at(ctx, 3)} x={960} y={560} />
    </>
  );
};

// ---------- 22. recap ----------

const Recap: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const items = [
    { line: 1, text: "Solubility limit → past it, a new phase" },
    { line: 2, text: "Substitutional / interstitial · Hume-Rothery: size, structure, EN, valency" },
    { line: 3, text: "Phases → tie line → lever rule (opposite arm)" },
    { line: 4, text: "Gibbs: P + F = C + 1 (fixed pressure)" },
    { line: 5, text: "Eutectic L→α+β · eutectoid γ→α+β · peritectic α+L→β" },
    { line: 6, text: "Fe–C: 727 °C 0.76% pearlite · 1147 °C 4.30% · steel < 2.14% C" },
  ];
  return (
    <>
      <div style={{ position: "absolute", left: 160, right: 160, top: 210, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it) => (
          <div
            key={it.text}
            style={{
              opacity: Math.min(1, show(ctx, it.line)),
              translate: `${(1 - Math.min(1, show(ctx, it.line))) * -50}px 0`,
              background: SURFACE,
              border: `2px solid ${COLORS.boardLine}`,
              borderRadius: 16,
              padding: "12px 24px",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            <Check /> {it.text}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1620, top: 640, opacity: show(ctx, 7) }}>
        <Kan radius={70} expression="proud" arms="up" look={{ x: 0, y: -1 }} time={local} />
      </div>
      <Confetti local={local} at={at(ctx, 7)} x={960} y={600} />
    </>
  );
};

// ---------- sounds ----------

type Cue = [at: number, name: SfxName, volume: number];
/** Special sounds on some lines; every other line gets a soft pop, every section a whoosh. */
const SPECIAL: Record<string, [SfxName, number]> = {
  "solubility-2": ["ding", 0.35],
  "unary-6": ["sparkle", 0.35],
  "cuni-2": ["swish", 0.3],
  "cuni-3": ["swish", 0.3],
  "threeq-5": ["swish", 0.3],
  "lever-2": ["thud", 0.4],
  "lever-8": ["ding", 0.4],
  "lever-11": ["sparkle", 0.35],
  "cooling-2": ["sparkle", 0.3],
  "cooling-6": ["ding", 0.35],
  "gibbs-1": ["sparkle", 0.4],
  "gibbs-9": ["ding", 0.35],
  "eutectic-8": ["sparkle", 0.4],
  "pbsn-7": ["ding", 0.4],
  "micro-4": ["sparkle", 0.3],
  "micro-9": ["ding", 0.35],
  "iron-10": ["sparkle", 0.4],
  "steels-2": ["sparkle", 0.35],
  "steels-8": ["ding", 0.35],
  "steels-11": ["ding", 0.35],
  "quiz-1": ["success", 0.5],
  "quiz-3": ["success", 0.5],
  "recap-7": ["success", 0.45],
};

function sounds(id: BeatId, c: Ctx): Cue[] {
  const cues: Cue[] = [[0.05, "whoosh", 0.28]];
  c.beat.lines.forEach((l, i) => {
    const special = SPECIAL[`${id}-${i}`];
    if (special) cues.push([l.at, special[0], special[1]]);
    else if (i > 0) cues.push([l.at, "pop", 0.18]);
  });
  if (id === "quiz") {
    for (const [q, a] of [
      [endOf(c, 0), at(c, 1)],
      [endOf(c, 2), at(c, 3)],
    ]) {
      const step = (a - q) / 5;
      for (let k = 0; k < 5; k++) cues.push([q + k * step, "tick", 0.4]);
    }
  }
  return cues;
}

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  intro: Intro,
  basics: Basics,
  solubility: Solubility,
  phases: Phases,
  alloying: Alloying,
  solid: SolidSolutions,
  unary: Unary,
  binary: Binary,
  cuni: CuNi,
  threeq: ThreeQ,
  lever: Lever,
  cooling: Cooling,
  gibbs: Gibbs,
  eutectic: CuAgScene,
  pbsn: PbSnScene,
  micro: Micro,
  invariant: InvariantScene,
  iron: Iron,
  steels: Steels,
  summary: Summary,
  quiz: Quiz,
  recap: Recap,
};

export const PhaseCover: React.FC = () => {
  const f: Frame = { x: 1000, y: 200, w: 800, h: 560, x0: 0, x1: FE_C.cementite, t0: FE_C.tMin, t1: FE_C.tMax };
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 100, top: 200, width: 820 }}>
        <div style={{ fontSize: 34, letterSpacing: 3, color: COLORS.kan, fontWeight: 800 }}>ASE102 · UNIT III</div>
        <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.02, marginTop: 14 }}>Phase diagrams, zero to exam</div>
        <div style={{ fontSize: 40, marginTop: 24, color: COLORS.chalkDim }}>lever rule · Gibbs · eutectic · iron–carbon</div>
      </div>
      <Svg>
        <FeCDiagram f={f} size={20} />
      </Svg>
      <div style={{ position: "absolute", left: 100, top: 900, fontSize: 32, color: COLORS.chalkDim, letterSpacing: 2 }}>ADITHYA VIKRAM</div>
    </AbsoluteFill>
  );
};
