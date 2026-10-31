import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { RichText } from "../../components/RichText";
import { Tex } from "../../components/Tex";
import { Kan } from "../../mascot/Kan";
import { sceneFont } from "../../sceneFont";
import { COLORS, SURFACE } from "../../theme";
import { Backdrop, CLAMP, Captions, ChapterTitle, Confetti, Progress, PunchIn, Sfx, SfxName, popIn } from "../../video/ui";
import { FN, Fn, MCQS, c, quotient } from "./model";
import { BEATS, Beat, Line, MCQ_THINK_S, PlannedBeat, Voice, planComplex } from "./script";

export const ComplexExplainerProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(z.string(), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type ComplexExplainerProps = z.infer<typeof ComplexExplainerProps>;

export const COMPLEX_FPS = 30;
export const complexMetadata: CalculateMetadataFunction<ComplexExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planComplex(props.voice as Voice).seconds * COMPLEX_FPS),
});

const U_COL = COLORS.velocity; // real part u: blue
const V_COL = COLORS.acceleration; // imaginary part v: orange
const KEY = COLORS.kan;
const WARN = COLORS.force;
const TONE: Record<NonNullable<Line["tone"]>, string> = { u: U_COL, v: V_COL, key: KEY, warn: WARN, ok: COLORS.displacement };
const CAPTION_BOX = { left: 140, right: 140, bottom: 30 };

interface Ctx {
  beat: PlannedBeat;
  script: Beat;
  local: number;
}
const at = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;
const endOf = (ctx: Ctx, i: number) => at(ctx, i) + ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].seconds;
const show = (ctx: Ctx, i: number, delay = 0) => popIn(ctx.local, at(ctx, i) + delay, 0.5);
const ramp = (ctx: Ctx, i: number, dur = 1.2, delay = 0) => interpolate(ctx.local, [at(ctx, i) + delay, at(ctx, i) + delay + dur], [0, 1], CLAMP);

export const ComplexExplainer: React.FC<ComplexExplainerProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planComplex(voice as Voice), [voice]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      {plan.beats.map((beat, bi) => {
        const from = Math.round(beat.from * fps);
        const to = Math.round((beat.from + beat.seconds) * fps);
        return (
          <Sequence key={beat.id} name={beat.id} from={from} durationInFrames={to - from}>
            <BeatView beat={beat} script={BEATS[bi]} index={bi} />
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
      <Progress sections={sections(plan.beats)} total={plan.seconds} />
    </AbsoluteFill>
  );
};

/** Progress bar parts: teaching sections individually, all MCQs as one part, all subjectives as one part. */
function sections(beats: PlannedBeat[]) {
  const out: { from: number; label: string }[] = [];
  beats.forEach((b, i) => {
    const s = BEATS[i];
    const label = s.kind === "mcq" ? "MCQ practice" : s.id.startsWith("sub") ? "Exam answers" : s.chapter;
    if (!out.length || out[out.length - 1].label !== label) out.push({ from: b.from, label });
  });
  return out;
}

const BeatView: React.FC<{ beat: PlannedBeat; script: Beat; index: number }> = ({ beat, script, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const ctx: Ctx = { beat, script, local };
  const Scene = SCENES[script.kind];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 26, color: COLORS.chalkDim }}>Complex analysis · Analytic functions from zero</div>
      <PunchIn local={local}>
        <Scene ctx={ctx} />
      </PunchIn>
      {sounds(script, ctx).map(([t, name, volume], i) => (
        <Sfx key={i} at={t} name={name} volume={volume} />
      ))}
      <ChapterTitle local={local} index={index} label={script.chapter} />
      <Captions cues={script.lines.map((l, i) => ({ at: beat.lines[i].at, dur: beat.lines[i].seconds, text: l.text }))} local={local} box={CAPTION_BOX} fontSize={40} />
    </AbsoluteFill>
  );
};

type SceneProps = { ctx: Ctx };

// ---------- small pieces ----------

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Txt: React.FC<{ x: number; y: number; color?: string; size?: number; anchor?: "start" | "middle" | "end"; opacity?: number; children: React.ReactNode }> = ({ x, y, color = COLORS.chalk, size = 28, anchor = "middle", opacity = 1, children }) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor={anchor} opacity={opacity} fontFamily={sceneFont}>
    {children}
  </text>
);

/** A coordinate box: maps (x, y) in maths units to pixels. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
const px = (b: Box, x: number) => b.x + ((x - b.x0) / (b.x1 - b.x0)) * b.w;
const py = (b: Box, y: number) => b.y + b.h - ((y - b.y0) / (b.y1 - b.y0)) * b.h;

const PlaneAxes: React.FC<{ b: Box; label?: [string, string]; opacity?: number; ticks?: boolean }> = ({ b, label = ["Re", "Im"], opacity = 1, ticks = true }) => (
  <g opacity={opacity}>
    <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={18} fill="rgba(255,255,255,0.03)" stroke={COLORS.boardLine} strokeWidth={2} />
    {ticks &&
      Array.from({ length: Math.floor(b.x1) - Math.ceil(b.x0) + 1 }, (_, i) => Math.ceil(b.x0) + i).map((k) => (
        <line key={`gx${k}`} x1={px(b, k)} x2={px(b, k)} y1={b.y} y2={b.y + b.h} stroke="rgba(160,180,255,0.08)" strokeWidth={1.5} />
      ))}
    {ticks &&
      Array.from({ length: Math.floor(b.y1) - Math.ceil(b.y0) + 1 }, (_, i) => Math.ceil(b.y0) + i).map((k) => (
        <line key={`gy${k}`} x1={b.x} x2={b.x + b.w} y1={py(b, k)} y2={py(b, k)} stroke="rgba(160,180,255,0.08)" strokeWidth={1.5} />
      ))}
    {b.y0 <= 0 && b.y1 >= 0 && <line x1={b.x} x2={b.x + b.w} y1={py(b, 0)} y2={py(b, 0)} stroke={COLORS.chalkDim} strokeWidth={3} />}
    {b.x0 <= 0 && b.x1 >= 0 && <line x1={px(b, 0)} x2={px(b, 0)} y1={b.y} y2={b.y + b.h} stroke={COLORS.chalkDim} strokeWidth={3} />}
    <Txt x={b.x + b.w - 14} y={(b.y0 <= 0 && b.y1 >= 0 ? py(b, 0) : b.y + b.h) - 12} size={22} color={COLORS.chalkDim} anchor="end">
      {label[0]}
    </Txt>
    <Txt x={(b.x0 <= 0 && b.x1 >= 0 ? px(b, 0) : b.x) + 12} y={b.y + 28} size={22} color={COLORS.chalkDim} anchor="start">
      {label[1]}
    </Txt>
  </g>
);

const Dot: React.FC<{ x: number; y: number; color?: string; r?: number; opacity?: number }> = ({ x, y, color = COLORS.displacement, r = 12, opacity = 1 }) => (
  <circle cx={x} cy={y} r={r} fill={color} stroke={COLORS.board} strokeWidth={3} opacity={opacity} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
);

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; w?: number; opacity?: number }> = ({ x1, y1, x2, y2, color, w = 5, opacity = 1 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 16;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" />
    </g>
  );
};

/** Board lines (maths) that appear as the narration reaches them. Shows the latest `max` lines. */
const Board: React.FC<{ ctx: Ctx; left: number; right: number; top: number; max?: number; size?: number }> = ({ ctx, left, right, top, max = 6, size = 40 }) => {
  const items = ctx.script.lines.map((l, i) => ({ l, i })).filter(({ l, i }) => l.board && ctx.local >= at(ctx, i) - 0.05);
  const visible = items.slice(-max);
  if (!visible.length)
    return (
      <div style={{ position: "absolute", left, right, top: top + 170, textAlign: "center", opacity: Math.min(1, popIn(ctx.local, 0.3, 0.6)) }}>
        <div style={{ fontSize: 30, letterSpacing: 4, color: KEY, fontWeight: 800 }}>{ctx.script.id.startsWith("sub") ? "EXAM ANSWER" : "NEXT"}</div>
        <div style={{ fontSize: 76, fontWeight: 900, marginTop: 8 }}>{ctx.script.chapter.split(": ").pop()}</div>
      </div>
    );
  return (
    <div style={{ position: "absolute", left, right, top, display: "flex", flexDirection: "column", gap: 14 }}>
      {visible.map(({ l, i }, k) => {
        const o = Math.min(1, show(ctx, i));
        const latest = k === visible.length - 1;
        const color = l.tone ? TONE[l.tone] : COLORS.boardLine;
        return (
          <div
            key={i}
            style={{
              opacity: o * (latest ? 1 : 0.8),
              translate: `${(1 - o) * -30}px 0`,
              background: SURFACE,
              border: `2px solid ${color}`,
              borderRadius: 18,
              padding: "12px 24px",
              fontSize: size,
              color: l.tone ? TONE[l.tone] : COLORS.chalk,
              boxShadow: latest ? `0 0 28px ${color}55` : "none",
              overflowX: "hidden",
            }}
          >
            <Tex tex={l.board!} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- scenes ----------

const Hook: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const b: Box = { x: 460, y: 420, w: 1000, h: 440, x0: -2.2, x1: 2.2, y0: -1.2, y1: 2.6 };
  // A polar grid near z = 1 bent by w = z²: blend from the grid to its image (illustration of the mapping).
  const s = 0.5 - 0.5 * Math.cos(Math.min(local, 12) * 0.6);
  const blend = (x: number, y: number) => {
    const wx = x * x - y * y;
    const wy = 2 * x * y;
    return [px(b, (1 - s) * x + s * wx), py(b, (1 - s) * y + s * wy)];
  };
  const lines: string[] = [];
  for (let k = 0; k <= 8; k++) {
    const x = 0.3 + k * 0.12;
    lines.push(Array.from({ length: 40 }, (_, j) => blend(x, -0.6 + (j / 39) * 1.2).join(",")).join(" "));
  }
  for (let k = 0; k <= 10; k++) {
    const y = -0.6 + k * 0.12;
    lines.push(Array.from({ length: 40 }, (_, j) => blend(0.3 + (j / 39) * 0.96, y).join(",")).join(" "));
  }
  return (
    <>
      <Svg>
        <PlaneAxes b={b} ticks={false} opacity={0.6} />
        {lines.map((p, i) => (
          <polyline key={i} points={p} fill="none" stroke={i <= 8 ? U_COL : V_COL} strokeWidth={3} opacity={0.85} />
        ))}
      </Svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", opacity: show(ctx, 0) }}>
        <div style={{ fontSize: 34, letterSpacing: 4, color: KEY, fontWeight: 800 }}>FROM ZERO</div>
        <div style={{ fontSize: 110, fontWeight: 900, textShadow: "0 6px 30px #000" }}>Analytic Functions</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 350, display: "flex", gap: 18, justifyContent: "center", opacity: show(ctx, 4) }}>
        {["analytic?", "Cauchy–Riemann", "harmonic", "conjugates", "20 MCQs", "exam answers"].map((t, i) => (
          <span key={t} style={{ opacity: popIn(local, at(ctx, 4) + 0.25 * i, 0.4), padding: "8px 18px", borderRadius: 14, border: `2px solid ${KEY}`, color: KEY, fontWeight: 800, fontSize: 30, background: SURFACE }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1600, top: 720, opacity: show(ctx, 5) }}>
        <Kan radius={70} expression="excited" arms="up" look={{ x: -1, y: -0.4 }} time={local} />
      </div>
    </>
  );
};

const PlaneScene: React.FC<SceneProps> = ({ ctx }) => {
  const b: Box = { x: 760, y: 200, w: 760, h: 650, x0: -1.5, x1: 5.5, y0: -5, y1: 5 };
  const zx = 3;
  const zy = 4;
  const r = Math.hypot(zx, zy);
  const th = Math.atan2(zy, zx);
  const arc = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 29) * th;
    return `${px(b, 1.1 * Math.cos(a))},${py(b, 1.1 * Math.sin(a))}`;
  }).join(" ");
  const cards = [
    { line: 0, tex: "i^2 = -1" },
    { line: 1, tex: "z = x + iy" },
    { line: 5, tex: "z = re^{i\\theta}" },
    { line: 6, tex: "\\bar z = x - iy" },
    { line: 7, tex: "z\\bar z = |z|^2" },
  ];
  return (
    <>
      <Svg>
        <PlaneAxes b={b} opacity={show(ctx, 2)} />
        <g opacity={show(ctx, 2)}>
          <line x1={px(b, zx)} y1={py(b, zy)} x2={px(b, zx)} y2={py(b, 0)} stroke={U_COL} strokeWidth={3} strokeDasharray="8 8" />
          <line x1={px(b, 0)} y1={py(b, zy)} x2={px(b, zx)} y2={py(b, zy)} stroke={V_COL} strokeWidth={3} strokeDasharray="8 8" />
          <Txt x={px(b, zx)} y={py(b, 0) + 34} color={U_COL}>
            x = 3
          </Txt>
          <Txt x={px(b, 0) - 14} y={py(b, zy) + 8} color={V_COL} anchor="end">
            y = 4
          </Txt>
          <Dot x={px(b, zx)} y={py(b, zy)} />
          <Txt x={px(b, zx) + 20} y={py(b, zy) - 18} color={COLORS.displacement} anchor="start" size={32}>
            z = 3 + 4i
          </Txt>
        </g>
        <g opacity={show(ctx, 3)}>
          <line x1={px(b, 0)} y1={py(b, 0)} x2={px(b, zx) * ramp(ctx, 3, 0.8) + px(b, 0) * (1 - ramp(ctx, 3, 0.8))} y2={py(b, zy) * ramp(ctx, 3, 0.8) + py(b, 0) * (1 - ramp(ctx, 3, 0.8))} stroke={KEY} strokeWidth={5} />
          <Txt x={px(b, zx / 2) - 22} y={py(b, zy / 2) - 6} color={KEY} anchor="end" size={30}>
            |z| = {r}
          </Txt>
        </g>
        <g opacity={show(ctx, 4)}>
          <polyline points={arc} fill="none" stroke={COLORS.force} strokeWidth={4} />
          <Txt x={px(b, 1.45)} y={py(b, 0.55)} color={COLORS.force} size={30}>
            θ
          </Txt>
        </g>
        <g opacity={show(ctx, 6)}>
          <line x1={px(b, zx)} y1={py(b, zy)} x2={px(b, zx)} y2={py(b, -zy)} stroke={COLORS.chalkDim} strokeWidth={2} strokeDasharray="4 8" />
          <Dot x={px(b, zx)} y={py(b, -zy)} color={COLORS.velocity} />
          <Txt x={px(b, zx) + 20} y={py(b, -zy) + 10} color={COLORS.velocity} anchor="start" size={32}>
            z̄ = 3 − 4i
          </Txt>
        </g>
      </Svg>
      <div style={{ position: "absolute", left: 90, top: 230, width: 600, display: "flex", flexDirection: "column", gap: 16 }}>
        {cards.map((cd) => (
          <div key={cd.tex} style={{ opacity: Math.min(1, show(ctx, cd.line)), background: SURFACE, border: `2px solid ${COLORS.boardLine}`, borderRadius: 18, padding: "10px 24px", fontSize: 52 }}>
            <Tex tex={cd.tex} />
          </div>
        ))}
      </div>
    </>
  );
};

/** Grid lines of the z-plane (left) and their images under f (right), drawn from f's u and v. */
const MapScene: React.FC<SceneProps> = ({ ctx }) => {
  const f = FN[ctx.script.fn ?? "z2"];
  const L: Box = { x: 110, y: 330, w: 620, h: 520, x0: -0.2, x1: 1.6, y0: -0.2, y1: 1.4 };
  const R: Box = { x: 1170, y: 330, w: 640, h: 520, x0: -1.8, x1: 2.6, y0: -0.2, y1: 3.8 };
  const draw = ramp(ctx, 3, 2.5);
  const xs = [0.3, 0.6, 0.9, 1.2, 1.5];
  const ys = [0.2, 0.5, 0.8, 1.1];
  const seg = (fx: (s: number) => [number, number]) => Array.from({ length: 50 }, (_, j) => fx(j / 49));
  const famX = xs.map((x) => seg((s) => [x, 0 + s * 1.2]));
  const famY = ys.map((y) => seg((s) => [0.1 + s * 1.5, y]));
  const img = (p: [number, number][]) => p.map(([x, y]) => [f.u(x, y), f.v(x, y)] as [number, number]);
  const poly = (b: Box, p: [number, number][], upto: number) =>
    p
      .slice(0, Math.max(2, Math.round(upto * p.length)))
      .map(([x, y]) => `${px(b, x)},${py(b, y)}`)
      .join(" ");
  const cross = [
    [0.9, 0.8],
    [1.2, 0.5],
  ] as const;
  return (
    <>
      <div style={{ position: "absolute", left: 120, right: 120, top: 190, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { line: 1, tex: "f(z) = u(x,y) + i\\,v(x,y)" },
          { line: 2, tex: "z^2 = \\underbrace{x^2 - y^2}_{u} + i\\,\\underbrace{2xy}_{v}" },
          { line: 5, tex: "e^z = e^x\\cos y + i\\,e^x\\sin y" },
          { line: 6, tex: "\\bar z = x - iy" },
        ]
          .filter((cd) => ctx.local >= at(ctx, cd.line) - 0.1)
          .slice(-2)
          .map((cd) => (
            <div key={cd.tex} style={{ opacity: Math.min(1, show(ctx, cd.line)), background: SURFACE, border: `2px solid ${KEY}`, borderRadius: 18, padding: "8px 22px", fontSize: 40 }}>
              <Tex tex={cd.tex} />
            </div>
          ))}
      </div>
      <Svg>
        <g opacity={show(ctx, 0)}>
          <PlaneAxes b={L} label={["x", "y"]} />
          <PlaneAxes b={R} label={["u", "v"]} />
          <Txt x={L.x + L.w / 2} y={L.y + L.h + 44} color={COLORS.chalkDim}>
            z-plane
          </Txt>
          <Txt x={R.x + R.w / 2} y={R.y + R.h + 44} color={COLORS.chalkDim}>
            w = {f.id === "z2" ? "z²" : f.id}
          </Txt>
          <Arrow x1={770} y1={590} x2={1130} y2={590} color={KEY} w={6} />
          <Txt x={950} y={570} color={KEY} size={30}>
            f
          </Txt>
        </g>
        <defs>
          <clipPath id="wbox">
            <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={18} />
          </clipPath>
        </defs>
        {famX.map((p, i) => (
          <g key={`x${i}`} opacity={show(ctx, 3)}>
            <polyline points={poly(L, p, draw)} fill="none" stroke={U_COL} strokeWidth={3} />
            <polyline points={poly(R, img(p), draw)} fill="none" stroke={U_COL} strokeWidth={3} clipPath="url(#wbox)" />
          </g>
        ))}
        {famY.map((p, i) => (
          <g key={`y${i}`} opacity={show(ctx, 3)}>
            <polyline points={poly(L, p, draw)} fill="none" stroke={V_COL} strokeWidth={3} />
            <polyline points={poly(R, img(p), draw)} fill="none" stroke={V_COL} strokeWidth={3} clipPath="url(#wbox)" />
          </g>
        ))}
        {cross.map(([x, y], i) => {
          const w = [f.u(x, y), f.v(x, y)];
          return (
            <g key={i} opacity={show(ctx, 4, 0.3 * i)}>
              <circle cx={px(L, x)} cy={py(L, y)} r={14} fill="none" stroke={COLORS.displacement} strokeWidth={4} />
              <circle cx={px(R, w[0])} cy={py(R, w[1])} r={14} fill="none" stroke={COLORS.displacement} strokeWidth={4} />
            </g>
          );
        })}
        <Txt x={R.x + R.w / 2} y={R.y + 40} color={COLORS.displacement} size={28} opacity={show(ctx, 4)}>
          still crossing at 90°
        </Txt>
      </Svg>
    </>
  );
};

/** Δz shrinks towards z₀ from a direction φ that turns; the right panel shows the value of Δf/Δz. */
const ApproachScene: React.FC<SceneProps> = ({ ctx }) => {
  const f: Fn = FN[ctx.script.fn ?? "z2"];
  const z0 = c(1, 0.5);
  const isConj = f.id === "conj";
  const start = at(ctx, isConj ? 2 : 1);
  const t = Math.max(0, ctx.local - start);
  // direction: horizontal, then vertical, then sweeping all the way round
  const phi = isConj ? (ctx.local < at(ctx, 3) ? 0 : ctx.local < at(ctx, 4) ? Math.PI / 2 : Math.PI / 2 + (ctx.local - at(ctx, 4)) * 0.9) : t * 0.8;
  const q = quotient(f, z0, phi);
  const L: Box = { x: 90, y: 210, w: 520, h: 440, x0: -0.2, x1: 2.2, y0: -0.6, y1: 1.6 };
  const R: Box = { x: 660, y: 210, w: 440, h: 440, x0: -2.5, x1: 2.5, y0: -2.5, y1: 2.5 };
  const shrink = 0.25 + 0.7 * (0.5 + 0.5 * Math.cos(t * 2.4));
  const from = [z0.re + shrink * Math.cos(phi), z0.im + shrink * Math.sin(phi)];
  const ring = Array.from({ length: 73 }, (_, i) => `${px(R, Math.cos((i / 72) * 2 * Math.PI))},${py(R, Math.sin((i / 72) * 2 * Math.PI))}`).join(" ");
  return (
    <>
      <Svg>
        <PlaneAxes b={L} label={["x", "y"]} opacity={show(ctx, 0)} />
        <PlaneAxes b={R} label={["Re", "Im"]} opacity={show(ctx, 0)} />
        <g opacity={show(ctx, 1)}>
          <Arrow x1={px(L, from[0])} y1={py(L, from[1])} x2={px(L, z0.re + 0.05 * Math.cos(phi))} y2={py(L, z0.im + 0.05 * Math.sin(phi))} color={COLORS.displacement} />
          <Dot x={px(L, z0.re)} y={py(L, z0.im)} color={KEY} />
          <Txt x={px(L, z0.re) + 16} y={py(L, z0.im) + 40} color={KEY} anchor="start">
            z₀
          </Txt>
          <Txt x={L.x + L.w / 2} y={L.y + L.h + 44} color={COLORS.chalkDim} size={26}>
            Δz comes in from direction {Math.round(((((phi * 180) / Math.PI) % 360) + 360) % 360)}°
          </Txt>
        </g>
        <g opacity={show(ctx, isConj ? 2 : 1)}>
          {isConj && <polyline points={ring} fill="none" stroke={COLORS.boardLine} strokeWidth={3} />}
          <line x1={px(R, 0)} y1={py(R, 0)} x2={px(R, q.re)} y2={py(R, q.im)} stroke={isConj ? WARN : KEY} strokeWidth={5} />
          <Dot x={px(R, q.re)} y={py(R, q.im)} color={isConj ? WARN : KEY} />
          <Txt x={R.x + R.w / 2} y={R.y + R.h + 44} color={isConj ? WARN : KEY} size={28}>
            Δf/Δz = {q.re.toFixed(2)} {q.im < 0 ? "−" : "+"} {Math.abs(q.im).toFixed(2)}i
          </Txt>
          <Txt x={R.x + R.w / 2} y={R.y - 14} color={COLORS.chalkDim} size={24}>
            {isConj ? "changes with direction: no derivative" : "same from every direction: derivative exists"}
          </Txt>
        </g>
      </Svg>
      <Board ctx={ctx} left={1150} right={40} top={200} max={5} size={32} />
    </>
  );
};

const BoardScene: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Board ctx={ctx} left={170} right={170} top={190} max={6} size={44} />
    <div style={{ position: "absolute", right: 60, top: 760, opacity: ctx.script.lines.some((l) => l.tone === "ok") ? show(ctx, ctx.script.lines.length - 1) : 0 }}>
      <Kan radius={56} expression="proud" arms="up" look={{ x: -1, y: -0.3 }} time={ctx.local} />
    </div>
  </>
);

/** Marching squares: line segments of {f(x, y) = level} in the box. */
function contour(fn: (x: number, y: number) => number, b: Box, level: number, n = 90): [number, number, number, number][] {
  const segs: [number, number, number, number][] = [];
  const dx = (b.x1 - b.x0) / n;
  const dy = (b.y1 - b.y0) / n;
  const val = (i: number, j: number) => fn(b.x0 + i * dx, b.y0 + j * dy) - level;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = [val(i, j), val(i + 1, j), val(i + 1, j + 1), val(i, j + 1)];
      const P = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const pts: [number, number][] = [];
      for (let k = 0; k < 4; k++) {
        const a = v[k];
        const bb = v[(k + 1) % 4];
        if ((a < 0) !== (bb < 0)) {
          const t = a / (a - bb);
          const [i1, j1] = P[k];
          const [i2, j2] = P[(k + 1) % 4];
          pts.push([b.x0 + (i1 + t * (i2 - i1)) * dx, b.y0 + (j1 + t * (j2 - j1)) * dy]);
        }
      }
      if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
    }
  return segs;
}

const CONTOUR_BOX: Box = { x: 110, y: 190, w: 700, h: 680, x0: -2, x1: 2, y0: -2, y1: 2 };
const LEVELS = [-3, -2, -1, -0.4, 0.4, 1, 2, 3];

const ContourScene: React.FC<SceneProps> = ({ ctx }) => {
  const f = FN[ctx.script.fn ?? "z2"];
  const b = CONTOUR_BOX;
  const uSegs = useMemo(() => LEVELS.map((l) => contour(f.u, CONTOUR_BOX, l)), [f]);
  const vSegs = useMemo(() => LEVELS.map((l) => contour(f.v, CONTOUR_BOX, l)), [f]);
  const isSub = ctx.script.id.startsWith("sub");
  const showU = isSub ? show(ctx, 1) : show(ctx, 3);
  const showV = isSub ? show(ctx, 1, 0.8) : show(ctx, 4);
  const grads = isSub ? show(ctx, 3) : show(ctx, 6);
  const probe = [
    [1.2, 0.6],
    [-0.8, 1.3],
    [0.7, -1.2],
  ];
  return (
    <>
      <Svg>
        <defs>
          <clipPath id="cbox">
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={18} />
          </clipPath>
        </defs>
        <PlaneAxes b={b} label={["x", "y"]} ticks={false} />
        <g clipPath="url(#cbox)">
          {uSegs.map((segs, k) => (
            <g key={`u${k}`} opacity={showU}>
              {segs.map((s, i) => (
                <line key={i} x1={px(b, s[0])} y1={py(b, s[1])} x2={px(b, s[2])} y2={py(b, s[3])} stroke={U_COL} strokeWidth={3} />
              ))}
            </g>
          ))}
          {vSegs.map((segs, k) => (
            <g key={`v${k}`} opacity={showV}>
              {segs.map((s, i) => (
                <line key={i} x1={px(b, s[0])} y1={py(b, s[1])} x2={px(b, s[2])} y2={py(b, s[3])} stroke={V_COL} strokeWidth={3} />
              ))}
            </g>
          ))}
          {probe.map(([x, y], i) => {
            // ∇u and ∇v at a point: perpendicular because of Cauchy–Riemann.
            const h = 1e-4;
            const gu = [(f.u(x + h, y) - f.u(x - h, y)) / (2 * h), (f.u(x, y + h) - f.u(x, y - h)) / (2 * h)];
            const gv = [(f.v(x + h, y) - f.v(x - h, y)) / (2 * h), (f.v(x, y + h) - f.v(x, y - h)) / (2 * h)];
            const nu = Math.hypot(gu[0], gu[1]);
            const nv = Math.hypot(gv[0], gv[1]);
            return (
              <g key={i} opacity={grads}>
                <Arrow x1={px(b, x)} y1={py(b, y)} x2={px(b, x + (0.45 * gu[0]) / nu)} y2={py(b, y + (0.45 * gu[1]) / nu)} color={U_COL} w={6} />
                <Arrow x1={px(b, x)} y1={py(b, y)} x2={px(b, x + (0.45 * gv[0]) / nv)} y2={py(b, y + (0.45 * gv[1]) / nv)} color={V_COL} w={6} />
                <Dot x={px(b, x)} y={py(b, y)} color={COLORS.displacement} r={9} />
              </g>
            );
          })}
        </g>
        <Txt x={b.x + b.w / 2} y={b.y + b.h + 44} color={COLORS.chalkDim} size={26}>
          <tspan fill={U_COL}>u = const</tspan> · <tspan fill={V_COL}>v = const</tspan> · arrows: ∇u ⟂ ∇v
        </Txt>
      </Svg>
      <Board ctx={ctx} left={870} right={60} top={190} max={6} size={36} />
    </>
  );
};

/** An option written in words ("only at z = 0") is shown as text; maths ("u_x + i v_x") goes through KaTeX. */
const isWords = (o: string) => /[a-z]{3,}/.test(o.replace(/\\[a-zA-Z]+/g, "")) && !/[\\^_]/.test(o);

const McqScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const m = MCQS[ctx.script.mcq ?? 0];
  const n = ctx.script.lines.length;
  const qLine = n - 2;
  const aLine = n - 1;
  const reveal = local >= at(ctx, aLine);
  const thinkStart = endOf(ctx, qLine);
  const count = Math.ceil(interpolate(local, [thinkStart, at(ctx, aLine)], [MCQ_THINK_S, 0], CLAMP));
  const qShow = show(ctx, qLine);
  return (
    <>
      <div style={{ position: "absolute", left: 160, right: 160, top: 190, opacity: Math.min(1, qShow), background: SURFACE, border: `3px solid ${COLORS.displacement}`, borderRadius: 26, padding: "22px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 28, color: COLORS.displacement, fontWeight: 800, letterSpacing: 3 }}>MCQ {(ctx.script.mcq ?? 0) + 1}</div>
        <div style={{ fontSize: 50, fontWeight: 700, marginTop: 6 }}>
          <RichText text={m.q} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 220, right: 220, top: 500, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {m.options.map((o, i) => {
          const right = i === m.correct;
          const o2 = popIn(local, at(ctx, qLine) + 0.6 + 0.25 * i, 0.4);
          return (
            <div
              key={i}
              style={{
                opacity: Math.min(1, o2) * (reveal && !right ? 0.35 : 1),
                scale: String(reveal && right ? 1.04 : 1),
                background: reveal && right ? `${KEY}22` : SURFACE,
                border: `3px solid ${reveal && right ? KEY : COLORS.boardLine}`,
                borderRadius: 20,
                padding: "16px 26px",
                fontSize: 44,
                display: "flex",
                alignItems: "center",
                gap: 20,
                boxShadow: reveal && right ? `0 0 40px ${KEY}66` : "none",
              }}
            >
              <span style={{ fontWeight: 900, color: reveal && right ? KEY : COLORS.chalkDim }}>{"ABCD"[i]}</span>
              {isWords(o) ? <span style={{ fontWeight: 700 }}>{o}</span> : <Tex tex={o} />}
              {reveal && right && <span style={{ marginLeft: "auto", color: KEY, fontWeight: 900 }}>✓</span>}
            </div>
          );
        })}
      </div>
      {local >= thinkStart && local < at(ctx, aLine) && (
        <div style={{ position: "absolute", right: 90, top: 520, fontSize: 130, fontWeight: 900, color: KEY, textShadow: `0 0 30px ${KEY}` }}>{count}</div>
      )}
      <div style={{ position: "absolute", left: 220, right: 220, top: 800, opacity: show(ctx, aLine, 0.4), textAlign: "center", fontSize: 38, color: COLORS.displacement }}>
        <RichText text={m.why} />
      </div>
      <Confetti local={local} at={at(ctx, aLine)} x={960} y={520} count={70} />
    </>
  );
};

const Recap: React.FC<SceneProps> = ({ ctx }) => {
  const items = [
    { line: 1, tex: "\\text{analytic} = \\text{differentiable in a neighbourhood}" },
    { line: 2, tex: "u_x = v_y,\\quad u_y = -v_x" },
    { line: 3, tex: "f' = u_x + iv_x,\\quad u_r = \\tfrac1r v_\\theta,\\ v_r = -\\tfrac1r u_\\theta" },
    { line: 4, tex: "u_{xx} + u_{yy} = 0,\\quad f'(z) = u_x(z,0) - iu_y(z,0)" },
    { line: 5, tex: "\\nabla u \\perp \\nabla v" },
  ];
  return (
    <>
      <div style={{ position: "absolute", left: 200, right: 200, top: 200, display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map((it) => (
          <div key={it.tex} style={{ opacity: Math.min(1, show(ctx, it.line)), background: SURFACE, border: `2px solid ${KEY}`, borderRadius: 18, padding: "12px 26px", fontSize: 44, display: "flex", gap: 18, alignItems: "center" }}>
            <span style={{ color: KEY, fontWeight: 900 }}>✓</span>
            <Tex tex={it.tex} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1690, top: 830, opacity: show(ctx, 5) }}>
        <Kan radius={60} expression="proud" arms="up" look={{ x: 0, y: -1 }} time={ctx.local} />
      </div>
      <Confetti local={ctx.local} at={at(ctx, 5) + 2} x={960} y={600} />
    </>
  );
};

const SCENES: Record<Beat["kind"], React.FC<SceneProps>> = {
  hook: Hook,
  plane: PlaneScene,
  map: MapScene,
  approach: ApproachScene,
  board: BoardScene,
  contour: ContourScene,
  mcq: McqScene,
  recap: Recap,
};

// ---------- sounds ----------

type Cue = [at: number, name: SfxName, volume: number];
function sounds(script: Beat, ctx: Ctx): Cue[] {
  const cues: Cue[] = [[0.05, "whoosh", 0.25]];
  if (script.kind === "mcq") {
    const n = script.lines.length;
    const q = endOf(ctx, n - 2);
    const step = (at(ctx, n - 1) - q) / MCQ_THINK_S;
    cues.push([at(ctx, n - 2), "pop", 0.35]);
    for (let k = 0; k < MCQ_THINK_S; k++) cues.push([q + k * step, "tick", 0.35]);
    cues.push([at(ctx, n - 1), "success", 0.45]);
    return cues;
  }
  script.lines.forEach((l, i) => {
    if (i === 0) return;
    const name: SfxName = l.tone === "ok" ? "ding" : l.tone === "warn" ? "thud" : l.tone === "key" ? "sparkle" : "pop";
    cues.push([at(ctx, i), name, name === "pop" ? 0.16 : 0.3]);
  });
  return cues;
}

export const ComplexCover: React.FC = () => {
  const b: Box = { x: 1080, y: 200, w: 700, h: 640, x0: -2, x1: 2, y0: -2, y1: 2 };
  const levels = [-3, -2, -1, -0.4, 0.4, 1, 2, 3];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 100, top: 200, width: 900 }}>
        <div style={{ fontSize: 34, letterSpacing: 3, color: KEY, fontWeight: 800 }}>COMPLEX ANALYSIS · FROM ZERO</div>
        <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 1.02, marginTop: 14 }}>Analytic Functions</div>
        <div style={{ fontSize: 56, marginTop: 24 }}>
          <Tex tex="u_x = v_y,\ \ u_y = -v_x" />
        </div>
        <div style={{ fontSize: 36, marginTop: 20, color: COLORS.chalkDim }}>CR equations · harmonic · 20 MCQs · exam answers</div>
      </div>
      <Svg>
        <PlaneAxes b={b} label={["x", "y"]} ticks={false} />
        {levels.map((l) =>
          contour(FN.z2.u, b, l).map((s, i) => <line key={`u${l}${i}`} x1={px(b, s[0])} y1={py(b, s[1])} x2={px(b, s[2])} y2={py(b, s[3])} stroke={U_COL} strokeWidth={3} />),
        )}
        {levels.map((l) =>
          contour(FN.z2.v, b, l).map((s, i) => <line key={`v${l}${i}`} x1={px(b, s[0])} y1={py(b, s[1])} x2={px(b, s[2])} y2={py(b, s[3])} stroke={V_COL} strokeWidth={3} />),
        )}
      </Svg>
      <div style={{ position: "absolute", left: 100, top: 900, fontSize: 32, color: COLORS.chalkDim, letterSpacing: 2 }}>ADITHYA VIKRAM</div>
    </AbsoluteFill>
  );
};

