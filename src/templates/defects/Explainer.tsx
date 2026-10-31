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
import { Axes, Cell, Curve, Dot, Frame, Lamellae, Scope, Svg, T, Tag, grains, hash, polyStr, sx, sy } from "../phase/parts";
import { CU_VAC, CW_EX, HALL_PETCH, HP_EX, QUIZ, amplitudeRatio, circleArea, grainGrowth, slipped, vacancyFraction, yieldMPa } from "./model";
import { BEATS, BeatId, PlannedBeat, Voice, fill, planDefects, scriptValues } from "./script";

export const DefectsExplainerProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(z.string(), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type DefectsExplainerProps = z.infer<typeof DefectsExplainerProps>;

export const DEFECTS_FPS = 30;
export const defectsMetadata: CalculateMetadataFunction<DefectsExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planDefects(props.voice as Voice).seconds * DEFECTS_FPS),
});

const CAPTION_BOX = { left: 140, right: 140, bottom: 30 };
const HOST = "#4c7bd8";
const SOLUTE = COLORS.acceleration;
const SMALL = COLORS.displacement;
const MARK = COLORS.force; // highlights the defect itself

interface Ctx {
  beat: PlannedBeat;
  values: Record<string, string>;
  local: number;
}
const at = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;
const endOf = (ctx: Ctx, i: number) => at(ctx, i) + ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].seconds;
const show = (ctx: Ctx, i: number, delay = 0) => popIn(ctx.local, at(ctx, i) + delay, 0.5);
const ramp = (ctx: Ctx, i: number, dur = 1.2, delay = 0) => interpolate(ctx.local, [at(ctx, i) + delay, at(ctx, i) + delay + dur], [0, 1], CLAMP);
const stage = (ctx: Ctx, from: number, to?: number) => {
  const start = from === 0 ? 0 : at(ctx, from) - 0.2;
  const inO = fade(ctx.local, start, 0.4);
  const outO = to === undefined ? 1 : 1 - fade(ctx.local, at(ctx, to) - 0.4, 0.35);
  return Math.max(0, Math.min(inO, outO));
};

export const DefectsExplainer: React.FC<DefectsExplainerProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planDefects(voice as Voice), [voice]);
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
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 26, color: COLORS.chalkDim }}>ASE102 · Unit II · Imperfections and strengthening</div>
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

// ---------- blocks ----------

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

const Chip: React.FC<{ color: string; children: React.ReactNode; size?: number }> = ({ color, children, size = 30 }) => (
  <span style={{ display: "inline-block", padding: "6px 18px", borderRadius: 14, border: `2px solid ${color}`, color, fontSize: size, fontWeight: 800, background: `${color}14` }}>{children}</span>
);

type P2 = [number, number];
const sup = (n: number) =>
  String(n)
    .split("")
    .map((c) => (c === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]))
    .join("");

interface CrystalProps {
  x: number;
  y: number;
  cols: number;
  rows: number;
  a: number;
  r?: number;
  /** Edge dislocation: core position (in spacings from the left), glide plane below row `glide` (rows counted from the top). */
  edge?: { xd: number; glide: number; width?: number };
  vacancy?: P2[];
  sub?: P2[];
  /** Extra atoms in gaps: position in spacings, colour, radius. */
  extra?: { at: P2; color: string; r: number }[];
  jiggle?: number;
  time?: number;
  /** Atoms near this point (spacings) are pushed away ∝ 1/r²: the strain around a squeezed-in atom. */
  push?: { at: P2; strength: number };
  highlightCore?: boolean;
  opacity?: number;
  color?: string;
}

/** A square lattice of atoms with optional defects. All positions are computed from the defect model. */
const Crystal: React.FC<CrystalProps> = ({ x, y, cols, rows, a, r = a * 0.36, edge, vacancy = [], sub = [], extra = [], jiggle = 0, time = 0, push, highlightCore, opacity = 1, color = HOST }) => {
  const atoms: { cx: number; cy: number; fill: string; key: string }[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = edge && j < edge.glide ? -1 : 0; i < cols; i++) {
      if (vacancy.some(([vi, vj]) => vi === i && vj === j)) continue;
      let px = i;
      let py = j;
      let fill = sub.some(([si, sj]) => si === i && sj === j) ? SOLUTE : color;
      if (edge && j < edge.glide) {
        const w = (edge.width ?? 0.8) + 0.45 * (edge.glide - 1 - j);
        px = i + slipped(i, edge.xd, w);
        if (px < -0.5) continue; // not yet in the crystal (the slip step appears at the surface)
        if (highlightCore && Math.abs(px - edge.xd) < 0.5) fill = MARK;
      }
      if (push) {
        const dx = px - push.at[0];
        const dy = py - push.at[1];
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01) {
          px += (push.strength * dx) / (d2 * Math.sqrt(d2));
          py += (push.strength * dy) / (d2 * Math.sqrt(d2));
        }
      }
      const k = j * cols + i;
      atoms.push({
        cx: x + px * a + jiggle * Math.sin(time * 9 + hash(k) * 6.28),
        cy: y + py * a + jiggle * Math.cos(time * 8 + hash(k + 70) * 6.28),
        fill,
        key: `${i}-${j}`,
      });
    }
  return (
    <g opacity={opacity}>
      {vacancy.map(([i, j]) => (
        <circle key={`v${i}-${j}`} cx={x + i * a} cy={y + j * a} r={r} fill="none" stroke={MARK} strokeWidth={4} strokeDasharray="8 6" />
      ))}
      {atoms.map((p) => (
        <circle key={p.key} cx={p.cx} cy={p.cy} r={r} fill={p.fill} stroke="rgba(0,0,0,0.35)" strokeWidth={2} />
      ))}
      {extra.map((e, k) => (
        <circle key={`e${k}`} cx={x + e.at[0] * a} cy={y + e.at[1] * a} r={e.r} fill={e.color} stroke={COLORS.board} strokeWidth={2} />
      ))}
    </g>
  );
};

/** The ⊥ symbol for an edge dislocation. */
const Perp: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 26, color = MARK }) => (
  <g stroke={color} strokeWidth={6} strokeLinecap="round">
    <line x1={x - s} x2={x + s} y1={y} y2={y} />
    <line x1={x} x2={x} y1={y} y2={y - s * 1.4} />
  </g>
);

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; w?: number }> = ({ x1, y1, x2, y2, color, w = 6 }) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 18;
  const p1 = [x2 - h * Math.cos(ang - 0.45), y2 - h * Math.sin(ang - 0.45)];
  const p2 = [x2 - h * Math.cos(ang + 0.45), y2 - h * Math.sin(ang + 0.45)];
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${p1[0]} ${p1[1]} L ${x2} ${y2} L ${p2[0]} ${p2[1]}`} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" />
    </g>
  );
};

type SceneProps = { ctx: Ctx };

// ---------- 1. intro ----------

const Intro: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const d = show(ctx, 1);
  const sA = stage(ctx, 0, 2);
  return (
    <>
      <Svg>
        <g opacity={sA}>
          <Crystal
            x={420}
            y={290}
            cols={14}
            rows={7}
            a={82}
            vacancy={d > 0.5 ? [[3, 5]] : []}
            sub={d > 0.5 ? [[10, 5]] : []}
            extra={d > 0.5 ? [{ at: [6.5, 5.5], color: SMALL, r: 14 }] : []}
            edge={d > 0.5 ? { xd: 9.5, glide: 3 } : undefined}
            highlightCore
          />
          <Tag x={960} y={240} text={d > 0.5 ? "real crystal: full of defects" : "perfect crystal"} color={d > 0.5 ? MARK : COLORS.kan} size={34} />
        </g>
      </Svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", gap: 30, justifyContent: "center", opacity: stage(ctx, 2) }}>
        {[
          ["Types of defects", COLORS.velocity],
          ["How metals get stronger", COLORS.kan],
          ["What heating does", COLORS.acceleration],
        ].map(([t, c], i) => (
          <div key={t} style={{ opacity: popIn(local, at(ctx, 2) + i * 0.8, 0.4) }}>
            <Chip color={c} size={40}>
              {i + 1}. {t}
            </Chip>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 880, top: 560, opacity: show(ctx, 3) }}>
        <Kan radius={80} expression="excited" arms="up" look={{ x: 0, y: -1 }} time={local} />
      </div>
    </>
  );
};

// ---------- 2. classify ----------

const Classify: React.FC<SceneProps> = ({ ctx }) => {
  const cards = [
    { line: 1, dim: "0-D", name: "Point", ex: "vacancy, interstitial, impurity", c: COLORS.velocity },
    { line: 2, dim: "1-D", name: "Line", ex: "edge, screw, mixed dislocations", c: COLORS.kan },
    { line: 3, dim: "2-D", name: "Surface", ex: "grain & twin boundaries, stacking faults", c: COLORS.acceleration },
    { line: 4, dim: "3-D", name: "Volume", ex: "voids, cracks, inclusions", c: MARK },
  ];
  const icon = (i: number, c: string) => (
    <svg width={160} height={110}>
      {i === 0 && <circle cx={80} cy={55} r={18} fill={c} />}
      {i === 1 && <line x1={20} x2={140} y1={55} y2={55} stroke={c} strokeWidth={10} strokeLinecap="round" />}
      {i === 2 && <path d="M 30 85 L 60 25 L 140 25 L 110 85 Z" fill={`${c}55`} stroke={c} strokeWidth={5} />}
      {i === 3 && <path d="M 50 30 L 110 30 L 130 50 L 130 90 L 70 90 L 50 70 Z M 110 30 L 110 70 L 130 90 M 110 70 L 50 70" fill={`${c}44`} stroke={c} strokeWidth={5} />}
    </svg>
  );
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", fontSize: 48, fontWeight: 800, opacity: show(ctx, 0) }}>Sorted by dimension</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 320, display: "flex", gap: 24 }}>
        {cards.map((c, i) => (
          <div key={c.name} style={{ flex: 1, opacity: Math.min(1, show(ctx, c.line)), scale: String(0.85 + 0.15 * Math.min(1, show(ctx, c.line))), background: SURFACE, border: `3px solid ${c.c}`, borderRadius: 22, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: c.c }}>{c.dim}</div>
            {icon(i, c.c)}
            <div style={{ fontSize: 40, fontWeight: 800 }}>{c.name}</div>
            <div style={{ fontSize: 26, color: COLORS.chalkDim, marginTop: 6 }}>{c.ex}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// ---------- 3. point defects ----------

const PointScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const v = ctx.values;
  const sA = stage(ctx, 0, 3);
  const sB = stage(ctx, 3, 7);
  const sC = stage(ctx, 7);
  // Arrhenius plot of the vacancy fraction (log scale) for copper, Qv = 0.9 eV.
  const f: Frame = { x: 1060, y: 240, w: 720, h: 480, x0: 300, x1: 1400, t0: -16, t1: -2 };
  const curve: P2[] = Array.from({ length: 60 }, (_, i) => {
    const K = 300 + (i / 59) * 1100;
    return [K, Math.log10(vacancyFraction(CU_VAC.qEv, K))];
  });
  const a = 70;
  const ion = (x: number, y: number, kind: "frenkel" | "schottky") => {
    const items: React.ReactNode[] = [];
    for (let j = 0; j < 6; j++)
      for (let i = 0; i < 7; i++) {
        const cation = (i + j) % 2 === 0;
        const missing = kind === "schottky" ? (i === 2 && j === 2) || (i === 3 && j === 2) : i === 3 && j === 3;
        const cx = x + i * a;
        const cy = y + j * a;
        if (missing) {
          items.push(<circle key={`m${i}${j}`} cx={cx} cy={cy} r={cation ? 18 : 30} fill="none" stroke={MARK} strokeWidth={4} strokeDasharray="6 5" />);
          continue;
        }
        items.push(<circle key={`${i}${j}`} cx={cx} cy={cy} r={cation ? 18 : 30} fill={cation ? COLORS.velocity : "#9b7be8"} stroke="rgba(0,0,0,0.35)" strokeWidth={2} />);
      }
    if (kind === "frenkel") {
      items.push(<circle key="fi" cx={x + 3.5 * a} cy={y + 2.5 * a} r={18} fill={COLORS.velocity} stroke={MARK} strokeWidth={4} />);
      items.push(<Arrow key="fa" x1={x + 3 * a} y1={y + 3 * a - 26} x2={x + 3.5 * a - 8} y2={y + 2.5 * a + 22} color={MARK} w={4} />);
    }
    return items;
  };
  return (
    <>
      <Svg>
        <g opacity={sA}>
          <Crystal
            x={360}
            y={300}
            cols={15}
            rows={6}
            a={86}
            vacancy={[[2, 2]]}
            sub={local >= at(ctx, 2) ? [[10, 1]] : []}
            push={local >= at(ctx, 1) ? { at: [6.5, 2.5], strength: 0.06 * ramp(ctx, 1, 0.8) } : undefined}
            extra={[
              ...(local >= at(ctx, 1) ? [{ at: [6.5, 2.5] as P2, color: HOST, r: 31 }] : []),
              ...(local >= at(ctx, 2) ? [{ at: [12.5, 3.5] as P2, color: SMALL, r: 13 }] : []),
            ]}
          />
          <Tag x={360 + 2 * 86} y={260} text="vacancy" color={MARK} size={30} />
          <Tag x={360 + 6.5 * 86} y={260} text="self-interstitial" color={HOST} size={30} opacity={show(ctx, 1)} />
          <Tag x={360 + 10 * 86} y={260} text="substitutional" color={SOLUTE} size={30} opacity={show(ctx, 2)} />
          <Tag x={360 + 12.5 * 86} y={830} text="interstitial impurity" color={SMALL} size={30} opacity={show(ctx, 2, 0.6)} />
        </g>
        <g opacity={sB}>
          <Axes f={f} p={1} xTicks={[300, 600, 900, 1200]} tTicks={[-16, -12, -8, -4]} fmtT={(t) => `10${sup(t)}`} xLabel="Temperature (K)" tLabel="Vacancy fraction Nv/N" size={22} />
          <Curve f={f} line={curve} p={ramp(ctx, 4, 1.6)} color={COLORS.kan} width={6} raw />
          <Dot x={sx(f, CU_VAC.K)} y={sy(f, Math.log10(CU_VAC.frac))} opacity={show(ctx, 5)} />
          <Tag x={sx(f, CU_VAC.K) - 10} y={sy(f, Math.log10(CU_VAC.frac)) - 30} text={`1000 °C: 1 in ${v.oneIn}`} color={COLORS.displacement} size={24} anchor="end" opacity={show(ctx, 6)} />
          <Dot x={sx(f, 300)} y={sy(f, Math.log10(CU_VAC.roomFrac))} color={COLORS.velocity} opacity={show(ctx, 6, 1)} />
          <Tag x={sx(f, 300) + 20} y={sy(f, Math.log10(CU_VAC.roomFrac)) - 24} text="room temp: ~1 in 10¹⁵" color={COLORS.velocity} size={24} anchor="start" opacity={show(ctx, 6, 1)} />
          <T x={sx(f, 850)} y={f.y - 20} size={26} color={COLORS.chalkDim}>
            copper, Qv = 0.9 eV
          </T>
        </g>
        <g opacity={sC}>
          <g>{ion(220, 330, "frenkel")}</g>
          <T x={430} y={790} size={38} color={COLORS.velocity}>
            Frenkel: cation moves into a gap
          </T>
          <g opacity={show(ctx, 8, 2)}>{ion(1080, 330, "schottky")}</g>
          <T x={1290} y={790} size={38} color="#b79bff" opacity={show(ctx, 8, 2)}>
            Schottky: cation + anion missing
          </T>
        </g>
      </Svg>
      <Panel style={{ left: 120, width: 820, top: 260 }} opacity={sB} color={COLORS.kan}>
        <div style={{ fontSize: 66, textAlign: "center" }}>
          <Tex tex={`N_v = N\\,e^{-Q_v/kT}`} />
        </div>
        <div style={{ fontSize: 28, color: COLORS.chalkDim, marginTop: 8, opacity: show(ctx, 4), lineHeight: 1.5 }}>
          N = atom sites per m³ · Qv = energy per vacancy
          <br />k = 8.62 × 10⁻⁵ eV/K · T in kelvin
        </div>
        <div style={{ fontSize: 34, marginTop: 14, opacity: show(ctx, 5), lineHeight: 1.5 }}>
          Cu, 1273 K: N = {v.N} m⁻³
          <br />
          <span style={{ color: COLORS.displacement, fontWeight: 800 }}>Nv = {v.Nv} m⁻³</span>
        </div>
      </Panel>
    </>
  );
};

// ---------- 4. dislocations ----------

const LineScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const cols = 15;
  const a = 80;
  const X0 = 360;
  const Y0 = 300;
  const glide = 3;
  // The core waits in the middle, then moves at a steady speed out through the right side.
  const t0 = at(ctx, 5) + 1;
  const t1 = endOf(ctx, 6) - 0.6;
  const moving = local >= t0;
  const xd = !moving ? 7.5 : interpolate(local, [t0, t1], [-2.5, cols + 2.5], CLAMP);
  const sMain = Math.min(stage(ctx, 0, 3), 1) + stage(ctx, 5, 7);
  const sScrew = stage(ctx, 3, 4);
  const sMixed = stage(ctx, 4, 5);
  const sRug = stage(ctx, 7);
  const coreX = X0 + xd * a;
  const coreY = Y0 + (glide - 0.5) * a;
  // Carpet ruck: the same slip profile, with the ruck moving at constant speed.
  const xb = interpolate(local, [at(ctx, 7) + 0.6, endOf(ctx, 7)], [-0.15, 1.15], CLAMP);
  const rug = Array.from({ length: 120 }, (_, i) => {
    const u = i / 119;
    const shift = 0.06 * slipped(u, xb, 0.025);
    const bump = 90 / Math.cosh((u - xb) / 0.05) ** 2;
    return [300 + (u + shift) * 1200, 640 - bump] as P2;
  });
  return (
    <>
      <Svg>
        <g opacity={Math.min(1, sMain)}>
          <Crystal x={X0} y={Y0} cols={cols} rows={6} a={a} edge={{ xd, glide }} highlightCore={show(ctx, 1) > 0.5} />
          <line x1={X0 - 60} x2={X0 + cols * a} y1={coreY} y2={coreY} stroke={COLORS.chalkDim} strokeWidth={2} strokeDasharray="10 8" />
          {xd > -1 && xd < cols && <Perp x={coreX} y={coreY + 12} />}
          <Tag x={coreX} y={Y0 - 50} text="extra half-plane" color={MARK} size={28} opacity={show(ctx, 1) * stage(ctx, 1, 3)} />
          <g opacity={show(ctx, 2) * stage(ctx, 2, 3)}>
            <Arrow x1={X0 + 3 * a} y1={Y0 + 6 * a} x2={X0 + 4 * a} y2={Y0 + 6 * a} color={COLORS.displacement} />
            <T x={X0 + 3.5 * a} y={Y0 + 6 * a + 44} size={32} color={COLORS.displacement}>
              b ⟂ line
            </T>
            <T x={X0 + 11 * a} y={Y0 + 6 * a + 44} size={28} color={MARK}>
              ⊥ = dislocation line, running into the screen
            </T>
          </g>
          <g opacity={stage(ctx, 5)}>
            <Arrow x1={X0 + 180} y1={Y0 - 70} x2={X0 + 520} y2={Y0 - 70} color={COLORS.force} />
            <Arrow x1={X0 + cols * a - 180} y1={Y0 + 6 * a + 20} x2={X0 + cols * a - 520} y2={Y0 + 6 * a + 20} color={COLORS.force} />
            <T x={X0 + 350} y={Y0 - 92} size={28} color={COLORS.force}>
              shear stress
            </T>
          </g>
          <Tag x={960} y={870} text="top slipped by one spacing: b" color={COLORS.displacement} size={32} opacity={xd >= cols + 2 ? 1 : 0} />
        </g>
        <g opacity={sScrew}>
          {Array.from({ length: 4 }, (_, k) => {
            const y = 760 - k * 120;
            return (
              <g key={k}>
                <path d={`M 560 ${y} L 960 ${y - 60} L 1360 ${y} L 960 ${y + 60} Z`} fill={`${COLORS.velocity}${k % 2 ? "33" : "22"}`} stroke={COLORS.velocity} strokeWidth={3} />
              </g>
            );
          })}
          <path d={`M 960 ${820} ${Array.from({ length: 81 }, (_, i) => {
            const th = (i / 80) * 4 * Math.PI;
            return `L ${960 + 260 * Math.cos(th)} ${820 - (i / 80) * 480 + 60 * Math.sin(th)}`;
          }).join(" ")}`} fill="none" stroke={COLORS.kan} strokeWidth={6} />
          <line x1={960} x2={960} y1={860} y2={300} stroke={MARK} strokeWidth={8} />
          <Arrow x1={1500} y1={700} x2={1500} y2={600} color={COLORS.displacement} />
          <T x={1500} y={740} size={30} color={COLORS.displacement}>
            b ∥ line
          </T>
          <T x={960} y={270} size={34} color={MARK}>
            dislocation line
          </T>
          <T x={560} y={360} size={30} color={COLORS.kan}>
            planes spiral like a ramp
          </T>
        </g>
        <g opacity={sMixed}>
          <path d="M 520 300 L 1400 300 L 1400 800 L 520 800 Z" fill="rgba(255,255,255,0.04)" stroke={COLORS.chalkDim} strokeWidth={3} />
          <path d="M 520 380 Q 1150 400 1200 800" fill="none" stroke={MARK} strokeWidth={8} />
          <Arrow x1={760} y1={330} x2={900} y2={330} color={COLORS.displacement} />
          <T x={830} y={318} size={28} color={COLORS.displacement}>
            b
          </T>
          <Tag x={600} y={450} text="screw here (b ∥ line)" color={COLORS.velocity} size={28} anchor="start" />
          <Tag x={1210} y={740} text="edge here (b ⟂ line)" color={COLORS.kan} size={28} anchor="start" />
          <T x={960} y={860} size={30} color={COLORS.chalkDim}>
            in between: mixed
          </T>
        </g>
        <g opacity={sRug}>
          <path d={`M ${rug.map(([x, y]) => `${x} ${y}`).join(" L ")}`} fill="none" stroke="#c0574b" strokeWidth={26} strokeLinecap="round" />
          <line x1={240} x2={1640} y1={668} y2={668} stroke={COLORS.chalkDim} strokeWidth={4} />
          <Arrow x1={300 + xb * 1200 - 120} y1={480} x2={300 + xb * 1200 + 40} y2={480} color={COLORS.force} />
          <T x={960} y={380} size={36} color={COLORS.chalk}>
            push a ruck → the whole carpet moves a little
          </T>
        </g>
      </Svg>
    </>
  );
};

// ---------- 5. surface defects ----------

const SurfaceScene: React.FC<SceneProps> = ({ ctx }) => {
  const s = (i: number) => stage(ctx, i, i + 1 < ctx.beat.lines.length ? i + 1 : undefined);
  const cells = useMemo(() => grains(9, 260, 5), []);
  const a = 56;
  const tilt = (cx: number, cy: number, deg: number, key: string) => {
    const r = (deg * Math.PI) / 180;
    return Array.from({ length: 64 }, (_, k) => {
      const i = (k % 8) - 3.5;
      const j = Math.floor(k / 8) - 3.5;
      return <circle key={`${key}${k}`} cx={cx + (i * Math.cos(r) - j * Math.sin(r)) * a} cy={cy + (i * Math.sin(r) + j * Math.cos(r)) * a} r={20} fill={HOST} />;
    });
  };
  const layer = ["A", "B", "C", "A", "B", "A", "B", "C"];
  const off = { A: 0, B: 1 / 3, C: 2 / 3 } as Record<string, number>;
  return (
    <Svg>
      <g opacity={s(0)}>
        {Array.from({ length: 4 }, (_, j) =>
          Array.from({ length: 12 }, (_, i) => {
            const cx = 520 + i * 80;
            const cy = 420 + j * 80;
            return (
              <g key={`${i}-${j}`}>
                {i < 11 && <line x1={cx} x2={cx + 80} y1={cy} y2={cy} stroke={COLORS.chalkDim} strokeWidth={3} />}
                {j < 3 && <line x1={cx} x2={cx} y1={cy} y2={cy + 80} stroke={COLORS.chalkDim} strokeWidth={3} />}
                <circle cx={cx} cy={cy} r={24} fill={j === 0 ? MARK : HOST} />
              </g>
            );
          }),
        )}
        <T x={960} y={360} size={34} color={MARK}>
          surface atoms: fewer bonds
        </T>
      </g>
      <g opacity={s(1)}>
        <Scope id="gb-scope" cx={960} cy={500} r={270} label="each grain: lattice pointing its own way">
          {cells.map((c: Cell, i) => (
            <Lamellae key={i} id={`gb-${i}`} poly={c.poly} angle={c.angle} spacing={16} share={0.6} c1={`${HOST}`} c2="#2a3f7a" />
          ))}
          {cells.map((c, i) => (
            <polygon key={`b${i}`} points={polyStr(c.poly)} fill="none" stroke={COLORS.displacement} strokeWidth={5} />
          ))}
        </Scope>
      </g>
      <g opacity={s(2)}>
        {tilt(700, 560, 6, "l")}
        {tilt(1220, 560, -6, "r")}
        {[-1.5, 0, 1.5].map((k) => (
          <Perp key={k} x={960} y={560 + k * 140} s={20} />
        ))}
        <T x={960} y={300} size={34} color={MARK}>
          small tilt = a wall of edge dislocations
        </T>
      </g>
      <g opacity={s(3)}>
        {Array.from({ length: 8 }, (_, j) =>
          Array.from({ length: 12 }, (_, i) => {
            const mirror = 960;
            const dy = (i - 5.5) * 50;
            const cx = mirror + dy * 1.4;
            const cy = 330 + j * 60 + Math.abs(i - 5.5) * 22;
            return <circle key={`${i}-${j}`} cx={cx} cy={cy} r={18} fill={i < 6 ? HOST : COLORS.kan} />;
          }),
        )}
        <line x1={960} x2={960} y1={290} y2={860} stroke={COLORS.displacement} strokeWidth={5} strokeDasharray="12 8" />
        <T x={960} y={270} size={34} color={COLORS.displacement}>
          twin boundary = mirror
        </T>
      </g>
      <g opacity={s(4)}>
        {layer.map((L, j) => (
          <g key={j}>
            {Array.from({ length: 10 }, (_, i) => (
              <circle key={i} cx={620 + (i + off[L]) * 72} cy={300 + j * 66} r={26} fill={j === 5 ? MARK : HOST} />
            ))}
            <T x={540} y={312 + j * 66} size={34} color={j === 5 ? MARK : COLORS.chalk}>
              {L}
            </T>
          </g>
        ))}
        <Tag x={1450} y={300 + 5 * 66 + 10} text="fault: C is missing here" color={MARK} size={28} anchor="start" />
      </g>
      <g opacity={s(5)}>
        <T x={960} y={420} size={56} color={COLORS.kan}>
          Boundaries
        </T>
        <T x={960} y={520} size={42}>
          store energy · block dislocations
        </T>
      </g>
    </Svg>
  );
};

// ---------- 6. volume ----------

const VolumeScene: React.FC<SceneProps> = ({ ctx }) => {
  const cells = useMemo(() => grains(10, 270, 9), []);
  return (
    <Svg>
      <Scope id="vol-scope" cx={960} cy={500} r={280} label="voids, cracks, inclusions" opacity={show(ctx, 0)}>
        {cells.map((c, i) => (
          <polygon key={i} points={polyStr(c.poly)} fill={HOST} opacity={0.45} stroke={COLORS.board} strokeWidth={3} />
        ))}
        <ellipse cx={-120} cy={-80} rx={46} ry={32} fill={COLORS.board} stroke={MARK} strokeWidth={3} />
        <path d="M 20 140 L 60 120 L 90 150 L 140 110 L 180 130" fill="none" stroke={COLORS.board} strokeWidth={10} />
        <path d="M 20 140 L 60 120 L 90 150 L 140 110 L 180 130" fill="none" stroke={MARK} strokeWidth={3} />
        <circle cx={110} cy={-120} r={30} fill="#6b6b6b" stroke={MARK} strokeWidth={3} />
      </Scope>
      <Tag x={700} y={360} text="void / pore" color={MARK} size={28} anchor="end" opacity={show(ctx, 0, 0.5)} />
      <Tag x={1180} y={680} text="crack" color={MARK} size={28} anchor="start" opacity={show(ctx, 0, 1)} />
      <Tag x={1150} y={330} text="inclusion" color={MARK} size={28} anchor="start" opacity={show(ctx, 0, 1.5)} />
      <Tag x={960} y={150} text="aircraft parts are scanned for these" color={COLORS.displacement} size={30} opacity={show(ctx, 2)} />
    </Svg>
  );
};

// ---------- 7. vibration ----------

const Vibration: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const meltK = 1358; // copper
  const K = interpolate(local, [at(ctx, 1), at(ctx, 2) + 1.5], [300, meltK], CLAMP);
  const melted = local > at(ctx, 2) + 1.5;
  const amp = 4 * amplitudeRatio(K);
  const drift = melted ? Math.min(1, (local - at(ctx, 2) - 1.5) / 2) : 0;
  return (
    <Svg>
      <g transform={`translate(0 0)`}>
        {Array.from({ length: 7 * 13 }, (_, k) => {
          const i = k % 13;
          const j = Math.floor(k / 13);
          const x = 420 + i * 84 + amp * Math.sin(local * 11 + hash(k) * 6.28) + drift * (hash(k + 5) - 0.5) * 120;
          const y = 300 + j * 84 + amp * Math.cos(local * 10 + hash(k + 9) * 6.28) + drift * (hash(k + 15) - 0.5) * 120;
          return <circle key={k} cx={x} cy={y} r={28} fill={melted ? COLORS.acceleration : HOST} />;
        })}
      </g>
      <rect x={1620} y={300} width={40} height={480} rx={20} fill="rgba(255,255,255,0.1)" />
      <rect x={1620} y={780 - 480 * ((K - 300) / (meltK - 300))} width={40} height={480 * ((K - 300) / (meltK - 300))} rx={20} fill={COLORS.force} />
      <T x={1640} y={830} size={30} color={COLORS.force}>
        {Math.round(K)} K
      </T>
      <Tag x={960} y={250} text="~10¹³ vibrations per second (slowed down here)" color={COLORS.kan} size={28} opacity={show(ctx, 0)} />
      <Tag x={960} y={250 + 0} text="melted: bonds broken" color={COLORS.acceleration} size={30} opacity={melted ? 1 : 0} />
    </Svg>
  );
};

// ---------- 8. grain size ----------

/** Distance from the seed to the cell edge along a direction: how far a dislocation can glide before a boundary stops it. */
function rayToEdge(c: Cell, ang: number): number {
  const d: P2 = [Math.cos(ang), Math.sin(ang)];
  let best = Infinity;
  for (let i = 0; i < c.poly.length; i++) {
    const p = c.poly[i];
    const q = c.poly[(i + 1) % c.poly.length];
    const e: P2 = [q[0] - p[0], q[1] - p[1]];
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-9) continue;
    const w: P2 = [p[0] - c.seed[0], p[1] - c.seed[1]];
    const t = (w[0] * e[1] - w[1] * e[0]) / den;
    const u = (w[0] * d[1] - w[1] * d[0]) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}

const GrainSize: React.FC<SceneProps> = ({ ctx }) => {
  const v = ctx.values;
  const coarse = useMemo(() => grains(5, 220, 31), []);
  const fine = useMemo(() => grains(30, 220, 77), []);
  const glideP = ramp(ctx, 1, 1.6, 0.4);
  const sA = stage(ctx, 0, 3);
  const sB = stage(ctx, 3, 5);
  const f: Frame = { x: 400, y: 240, w: 1100, h: 520, x0: 0, x1: 120, t0: 0, t1: 450 };
  const curve: P2[] = Array.from({ length: 80 }, (_, i) => {
    const d = 5 + (i / 79) * 115;
    return [d, yieldMPa(d)];
  });
  const view = (cells: Cell[], cx: number, label: string, id: string, n: number) => (
    <Scope id={id} cx={cx} cy={480} r={230} label={label}>
      {cells.map((c, i) => (
        <polygon key={i} points={polyStr(c.poly)} fill={HOST} opacity={0.25 + 0.3 * hash(i + n)} stroke={COLORS.displacement} strokeWidth={4} />
      ))}
      {cells.slice(0, 4).map((c, i) => {
        const ang = c.angle * (Math.PI / 180);
        const len = rayToEdge(c, ang) * glideP;
        return (
          <g key={`g${i}`}>
            <line x1={c.seed[0]} y1={c.seed[1]} x2={c.seed[0] + Math.cos(ang) * len} y2={c.seed[1] + Math.sin(ang) * len} stroke={MARK} strokeWidth={5} />
            <circle cx={c.seed[0] + Math.cos(ang) * len} cy={c.seed[1] + Math.sin(ang) * len} r={8} fill={MARK} />
          </g>
        );
      })}
    </Scope>
  );
  return (
    <>
      <Svg>
        <g opacity={sA}>
          {view(coarse, 560, "big grains: long free path", "gs-c", 1)}
          {view(fine, 1360, "small grains: stopped early", "gs-f", 2)}
          <T x={960} y={220} size={30} color={MARK} opacity={show(ctx, 1)}>
            pink = a dislocation gliding until a boundary stops it
          </T>
        </g>
        <g opacity={sB}>
          <Axes f={f} p={1} xTicks={[0, 20, 40, 60, 80, 100, 120]} tTicks={[0, 100, 200, 300, 400]} xLabel="Grain diameter d (µm)" tLabel="Yield strength (MPa)" size={22} />
          <Curve f={f} line={curve} p={ramp(ctx, 3, 1.5)} color={COLORS.kan} width={6} raw />
          <Dot x={sx(f, HP_EX.coarse)} y={sy(f, HP_EX.coarseMPa)} opacity={show(ctx, 4)} />
          <Tag x={sx(f, HP_EX.coarse)} y={sy(f, HP_EX.coarseMPa) - 30} text={`${v.coarse} µm → ${v.coarseMPa} MPa`} color={COLORS.displacement} size={26} opacity={show(ctx, 4)} />
          <Dot x={sx(f, HP_EX.fine)} y={sy(f, HP_EX.fineMPa)} opacity={show(ctx, 4, 1.5)} />
          <Tag x={sx(f, HP_EX.fine) + 20} y={sy(f, HP_EX.fineMPa) - 24} text={`${v.fine} µm → ${v.fineMPa} MPa`} color={COLORS.displacement} size={26} anchor="start" opacity={show(ctx, 4, 1.5)} />
          <T x={sx(f, 80)} y={f.y + f.h - 70} size={24} color={COLORS.chalkDim}>
            example values: σ0 = {HALL_PETCH.sigma0} MPa, ky = {HALL_PETCH.ky} MPa·m½
          </T>
        </g>
      </Svg>
      <Panel style={{ left: 1530, width: 340, top: 300, textAlign: "center", padding: "18px 16px" }} opacity={stage(ctx, 3, 5)} color={COLORS.kan}>
        <div style={{ fontSize: 40 }}>
          <Tex tex={`\\sigma_y = \\sigma_0 + \\dfrac{k_y}{\\sqrt{d}}`} />
        </div>
      </Panel>
      <Panel style={{ left: 360, right: 360, top: 330, textAlign: "center" }} opacity={stage(ctx, 5)} color={COLORS.kan}>
        <div style={{ fontSize: 50, fontWeight: 900, color: COLORS.kan }}>Smaller grains</div>
        <div style={{ fontSize: 40, marginTop: 8 }}>stronger AND tougher</div>
        <div style={{ fontSize: 32, color: COLORS.chalkDim, marginTop: 18, opacity: show(ctx, 6) }}>control it: cooling rate · deform + recrystallize</div>
      </Panel>
    </>
  );
};

// ---------- 9. strain hardening ----------

const Strain: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const v = ctx.values;
  const sWire = stage(ctx, 1, 2);
  const sScope = stage(ctx, 2, 3);
  const sForm = stage(ctx, 3);
  const bend = Math.sin(Math.max(0, local - at(ctx, 1)) * 3) * 0.004;
  const n = Math.round(12 + 160 * ramp(ctx, 2, 3));
  const PXMM = 18; // circles drawn to scale
  return (
    <>
      <Svg>
        <g opacity={sWire}>
          {(() => {
            const pts = Array.from({ length: 41 }, (_, i) => {
              const s = -300 + i * 15;
              const x = Math.abs(bend) < 1e-6 ? s : Math.sin(bend * s) / bend;
              const y = Math.abs(bend) < 1e-6 ? 0 : (1 - Math.cos(bend * s)) / bend;
              return `${960 + x},${520 - y}`;
            });
            return <polyline points={pts.join(" ")} fill="none" stroke="#d98c4a" strokeWidth={14} strokeLinecap="round" />;
          })()}
          <T x={960} y={720} size={36} color="#d98c4a">
            copper wire: bend it, and it gets stiffer
          </T>
        </g>
        <g opacity={sScope}>
          <Scope id="dis-scope" cx={960} cy={480} r={260} label="dislocations multiply and tangle">
            {Array.from({ length: n }, (_, i) => {
              const x = (hash(i + 3) - 0.5) * 520;
              const y = (hash(i + 33) - 0.5) * 520;
              const ang = hash(i + 63) * 6.28;
              const L = 30 + hash(i + 93) * 60;
              return <path key={i} d={`M ${x} ${y} q ${(L / 2) * Math.cos(ang + 0.6)} ${(L / 2) * Math.sin(ang + 0.6)} ${L * Math.cos(ang)} ${L * Math.sin(ang)}`} fill="none" stroke={MARK} strokeWidth={3} />;
            })}
          </Scope>
        </g>
        <g opacity={sForm * show(ctx, 4)}>
          <circle cx={560} cy={560} r={(CW_EX.d0 / 2) * PXMM} fill={`${COLORS.kan}33`} stroke={COLORS.kan} strokeWidth={4} />
          <circle cx={560} cy={560} r={(CW_EX.dd / 2) * PXMM} fill={`${COLORS.acceleration}33`} stroke={COLORS.acceleration} strokeWidth={4} />
          <T x={560} y={720} size={28} color={COLORS.kan}>
            A0: d = {CW_EX.d0} mm → {circleArea(CW_EX.d0).toFixed(0)} mm²
          </T>
          <T x={560} y={760} size={28} color={COLORS.acceleration}>
            Ad: d = {CW_EX.dd} mm → {circleArea(CW_EX.dd).toFixed(0)} mm²
          </T>
          <T x={560} y={360} size={26} color={COLORS.chalkDim}>
            cross-sections to scale
          </T>
        </g>
      </Svg>
      <Panel style={{ left: 960, width: 760, top: 300, textAlign: "center" }} opacity={sForm} color={COLORS.kan}>
        <div style={{ fontSize: 50 }}>
          <Tex tex={`\\%CW = \\dfrac{A_0 - A_d}{A_0} \\times 100`} />
        </div>
        <div style={{ fontSize: 44, marginTop: 12, opacity: show(ctx, 4, 0.8), color: COLORS.displacement, fontWeight: 800 }}>= {v.cw}% cold work</div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 16, opacity: show(ctx, 5) }}>
          <Chip color={COLORS.kan}>strength ≈ 340 MPa ↑</Chip>
          <Chip color={MARK}>ductility ≈ 7% EL ↓</Chip>
        </div>
        <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 14, opacity: show(ctx, 6) }}>too much cold work → it cracks</div>
      </Panel>
    </>
  );
};

// ---------- 10. annealing ----------

const Anneal: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const old = useMemo(() => grains(14, 560, 17), []);
  const fresh = useMemo(() => grains(34, 260, 101), []);
  // Grain growth d² − d0² = K t: the number of grains in view falls as 1/d².
  const tg = Math.max(0, local - at(ctx, 7));
  const d = grainGrowth(1, 1.2, tg);
  const count = Math.max(6, Math.round(34 / (d * d)));
  const grown = useMemo(() => grains(count, 260, 101 + count), [count]);
  const stageIdx = local < at(ctx, 1) ? 0 : local < at(ctx, 3) ? 1 : local < at(ctx, 7) ? 2 : 3;
  // Recrystallization: each new grain nucleates at its own moment and grows at a steady speed (nucleation + growth).
  const tr = local - at(ctx, 3);
  const speed = 70; // px per s
  const squiggles = stageIdx === 0 ? 120 : stageIdx === 1 ? Math.round(120 - 80 * ramp(ctx, 1, 2)) : 0;
  const labels = ["cold-worked", "recovery", "recrystallization", "grain growth"];
  const colors = [MARK, COLORS.velocity, COLORS.kan, COLORS.acceleration];
  // Schematic property curves (shape from the book's brass graph; no numbers).
  const f: Frame = { x: 1030, y: 300, w: 760, h: 380, x0: 0, x1: 1, t0: 0, t1: 1 };
  const strength: P2[] = Array.from({ length: 60 }, (_, i) => {
    const x = i / 59;
    return [x, 0.85 - 0.5 / (1 + Math.exp(-(x - 0.45) / 0.05)) - 0.08 * Math.max(0, x - 0.6)];
  });
  const ductility: P2[] = strength.map(([x, y]) => [x, 1.0 - y] as P2);
  const marker = [0.1, 0.3, 0.5, 0.8][stageIdx];
  return (
    <>
      <Svg>
        <Scope id="an-scope" cx={520} cy={480} r={260} label={labels[stageIdx]} labelColor={colors[stageIdx]}>
          {stageIdx <= 1 &&
            old.map((c, i) => (
              <polygon key={i} points={polyStr(c.poly.map(([x, y]) => [x * 0.95, y * 0.5]))} fill={HOST} opacity={0.3 + 0.25 * hash(i)} stroke={COLORS.board} strokeWidth={4} />
            ))}
          {stageIdx === 2 && (
            <>
              {old.map((c, i) => (
                <polygon key={i} points={polyStr(c.poly.map(([x, y]) => [x * 0.95, y * 0.5]))} fill={HOST} opacity={0.3 + 0.25 * hash(i)} stroke={COLORS.board} strokeWidth={4} />
              ))}
              {fresh.map((c, i) => {
                const born = hash(i + 500) * 2.5;
                const rad = Math.max(0, (tr - born) * speed);
                if (rad <= 0) return null;
                return (
                  <g key={`n${i}`}>
                    <clipPath id={`rx-${i}`}>
                      <circle cx={c.seed[0]} cy={c.seed[1]} r={rad} />
                    </clipPath>
                    <polygon points={polyStr(c.poly)} fill={COLORS.kan} opacity={0.55} stroke={COLORS.board} strokeWidth={3} clipPath={`url(#rx-${i})`} />
                  </g>
                );
              })}
            </>
          )}
          {stageIdx === 3 && grown.map((c, i) => <polygon key={i} points={polyStr(c.poly)} fill={COLORS.acceleration} opacity={0.3 + 0.3 * hash(i)} stroke={COLORS.board} strokeWidth={3} />)}
          {Array.from({ length: squiggles }, (_, i) => {
            const x = (hash(i + 7) - 0.5) * 500;
            const y = (hash(i + 77) - 0.5) * 500;
            const L = 40;
            const ang = stageIdx === 1 ? Math.PI / 2 : hash(i + 777) * 6.28; // recovery: lined up into low-energy walls
            return <line key={`s${i}`} x1={x} y1={y} x2={x + L * Math.cos(ang)} y2={y + L * Math.sin(ang)} stroke={MARK} strokeWidth={3} opacity={0.8} />;
          })}
        </Scope>
        <Axes f={f} p={show(ctx, 0)} xTicks={[]} tTicks={[]} xLabel="Annealing temperature →" tLabel="Property" size={22} />
        <Curve f={f} line={strength} p={ramp(ctx, 0, 1.4)} color={COLORS.kan} width={6} raw />
        <Curve f={f} line={ductility} p={ramp(ctx, 0, 1.4, 0.4)} color={COLORS.acceleration} width={6} raw />
        <T x={sx(f, 0.05)} y={sy(f, 0.92)} size={26} color={COLORS.kan} anchor="start" opacity={show(ctx, 0, 1)}>
          strength
        </T>
        <T x={sx(f, 0.05)} y={sy(f, 0.08)} size={26} color={COLORS.acceleration} anchor="start" opacity={show(ctx, 0, 1)}>
          ductility
        </T>
        <line x1={sx(f, marker)} x2={sx(f, marker)} y1={f.y} y2={f.y + f.h} stroke={colors[stageIdx]} strokeWidth={4} strokeDasharray="10 8" opacity={show(ctx, 0, 1)} />
        <T x={sx(f, 0.5)} y={f.y - 24} size={22} color={COLORS.chalkDim} opacity={show(ctx, 0, 1)}>
          shape only (book's brass graph)
        </T>
      </Svg>
      <div style={{ position: "absolute", left: 1030, top: 200, display: "flex", gap: 12 }}>
        {labels.slice(1).map((l, i) => (
          <div key={l} style={{ opacity: stageIdx === i + 1 ? 1 : 0.35 }}>
            <Chip color={colors[i + 1]} size={26}>
              {i + 1}. {l}
            </Chip>
          </div>
        ))}
      </div>
      <Panel style={{ left: 1030, width: 760, top: 760 - 30, textAlign: "center", padding: "12px 20px" }} opacity={stage(ctx, 5, 7)} color={COLORS.kan}>
        <div style={{ fontSize: 30 }}>
          T<sub>rx</sub> ≈ ⅓ to ½ of T<sub>m</sub> (kelvin) · brass ≈ 450 °C
        </div>
        <div style={{ fontSize: 26, color: COLORS.chalkDim, opacity: show(ctx, 6) }}>needs at least 2–20% cold work</div>
      </Panel>
      <Panel style={{ left: 1030, width: 760, top: 730, textAlign: "center", padding: "12px 20px" }} opacity={stage(ctx, 7, 9)} color={COLORS.acceleration}>
        <div style={{ fontSize: 30 }}>hot working: shaping above T<sub>rx</sub>, no hardening</div>
      </Panel>
      <Panel style={{ left: 1030, width: 760, top: 730, textAlign: "center", padding: "12px 20px" }} opacity={stage(ctx, 9)} color={COLORS.acceleration}>
        <div style={{ fontSize: 40 }}>
          <Tex tex={`d^n - d_0^n = Kt,\\quad n \\ge 2`} />
        </div>
      </Panel>
    </>
  );
};

// ---------- 11. quiz ----------

const Quiz: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const v = ctx.values;
  const qEnd = endOf(ctx, 0);
  const count = Math.ceil(interpolate(local, [qEnd, at(ctx, 1)], [5, 0], CLAMP));
  const PX = 22;
  return (
    <>
      <Panel style={{ left: 200, right: 200, top: 210, textAlign: "center" }} opacity={show(ctx, 0)} color={COLORS.displacement}>
        <div style={{ fontSize: 34, color: COLORS.displacement, fontWeight: 800, letterSpacing: 2 }}>PAUSE AND TRY</div>
        <div style={{ fontSize: 46, marginTop: 10 }}>Rod drawn from 10 mm to 8 mm diameter. %CW = ?</div>
      </Panel>
      <Svg>
        <circle cx={520} cy={600} r={(QUIZ.d0 / 2) * PX} fill={`${COLORS.kan}33`} stroke={COLORS.kan} strokeWidth={4} opacity={show(ctx, 0)} />
        <circle cx={520} cy={600} r={(QUIZ.dd / 2) * PX} fill={`${COLORS.acceleration}33`} stroke={COLORS.acceleration} strokeWidth={4} opacity={show(ctx, 0)} />
      </Svg>
      {local >= qEnd && local < at(ctx, 1) && <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontSize: 160, fontWeight: 800, color: COLORS.kan }}>{count}</div>}
      <Panel style={{ left: 760, width: 820, top: 470, textAlign: "center" }} opacity={show(ctx, 1)} color={COLORS.kan}>
        <div style={{ fontSize: 50 }}>
          <Tex tex={`\\dfrac{10^2 - 8^2}{10^2} \\times 100 = \\textcolor{${COLORS.kan}}{${v.quiz}\\%}\\ \\checkmark`} />
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 1620, top: 640, opacity: show(ctx, 1) }}>
        <Kan radius={70} expression="excited" arms="up" look={{ x: -1, y: -0.3 }} time={local} />
      </div>
      <Confetti local={local} at={at(ctx, 1)} x={1170} y={560} />
    </>
  );
};

// ---------- 12. recap ----------

const Recap: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const items = [
    { line: 1, text: "Point · line · surface · volume (0-D to 3-D). Nv = N e^(−Qv/kT)" },
    { line: 2, text: "Dislocations slip: edge b ⟂ line, screw b ∥ line" },
    { line: 3, text: "Stronger: small grains (Hall–Petch) + cold work (more dislocations)" },
    { line: 4, text: "Annealing: recovery → recrystallization → grain growth" },
  ];
  return (
    <>
      <div style={{ position: "absolute", left: 160, right: 160, top: 230, display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((it) => (
          <div
            key={it.text}
            style={{
              opacity: Math.min(1, show(ctx, it.line)),
              translate: `${(1 - Math.min(1, show(ctx, it.line))) * -50}px 0`,
              background: SURFACE,
              border: `2px solid ${COLORS.boardLine}`,
              borderRadius: 16,
              padding: "14px 24px",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            <span style={{ color: COLORS.kan }}>✓</span> {it.text}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1620, top: 640, opacity: show(ctx, 5) }}>
        <Kan radius={70} expression="proud" arms="up" look={{ x: 0, y: -1 }} time={local} />
      </div>
      <Confetti local={local} at={at(ctx, 5) + 2} x={960} y={600} />
    </>
  );
};

// ---------- sounds ----------

type Cue = [at: number, name: SfxName, volume: number];
const SPECIAL: Record<string, [SfxName, number]> = {
  "intro-1": ["sparkle", 0.35],
  "point-5": ["ding", 0.35],
  "line-5": ["swish", 0.3],
  "line-6": ["ding", 0.4],
  "grainsize-3": ["sparkle", 0.35],
  "grainsize-4": ["ding", 0.35],
  "strain-4": ["ding", 0.35],
  "anneal-3": ["sparkle", 0.3],
  "anneal-7": ["swish", 0.3],
  "quiz-1": ["success", 0.5],
  "recap-5": ["success", 0.45],
};

function sounds(id: BeatId, c: Ctx): Cue[] {
  const cues: Cue[] = [[0.05, "whoosh", 0.28]];
  c.beat.lines.forEach((l, i) => {
    const special = SPECIAL[`${id}-${i}`];
    if (special) cues.push([l.at, special[0], special[1]]);
    else if (i > 0) cues.push([l.at, "pop", 0.18]);
  });
  if (id === "quiz") {
    const q = endOf(c, 0);
    const step = (at(c, 1) - q) / 5;
    for (let k = 0; k < 5; k++) cues.push([q + k * step, "tick", 0.4]);
  }
  return cues;
}

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  intro: Intro,
  classify: Classify,
  point: PointScene,
  line: LineScene,
  surface: SurfaceScene,
  volume: VolumeScene,
  vibration: Vibration,
  grainsize: GrainSize,
  strain: Strain,
  anneal: Anneal,
  quiz: Quiz,
  recap: Recap,
};

export const DefectsCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
    <Backdrop />
    <div style={{ position: "absolute", left: 100, top: 200, width: 820 }}>
      <div style={{ fontSize: 34, letterSpacing: 3, color: COLORS.kan, fontWeight: 800 }}>ASE102 · UNIT II</div>
      <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1.02, marginTop: 14 }}>Defects and strength in 10 minutes</div>
      <div style={{ fontSize: 38, marginTop: 24, color: COLORS.chalkDim }}>dislocations · Hall–Petch · cold work · annealing</div>
    </div>
    <Svg>
      <Crystal x={1040} y={330} cols={10} rows={6} a={76} edge={{ xd: 4.5, glide: 3 }} highlightCore vacancy={[[8, 4]]} />
      <Perp x={1040 + 4.5 * 76} y={330 + 2.5 * 76 + 12} />
    </Svg>
    <div style={{ position: "absolute", left: 100, top: 900, fontSize: 32, color: COLORS.chalkDim, letterSpacing: 2 }}>ADITHYA VIKRAM</div>
  </AbsoluteFill>
);
