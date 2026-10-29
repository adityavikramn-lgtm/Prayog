import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { RichText } from "../../components/RichText";
import { Tex } from "../../components/Tex";
import { Kan, KanArms, KanExpression } from "../../mascot/Kan";
import { E_JEE, K_JEE, coulombForce, releaseSpeeds } from "../../physics/coulomb";
import { sig3 } from "../../physics/format";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { CLAMP, Captions, Card, fade } from "../../video/ui";
import { SETUPS, lawForce, nullPointFromQ1, probeForce, thirdLawForce, triangleCharges } from "./model";
import { PlannedBeat, Voice, planCoulomb } from "./plan";
import { BEATS, BeatId, CARDS, LAW_R_CLOSE, Lang, fill, scriptValues } from "./script";
import { ReleaseSample, sampleRelease, simulateRelease } from "./simulate";

const BEAT_IDS = [
  "hook",
  "charges",
  "law",
  "third",
  "release",
  "superposition",
  "predict",
  "reveal",
  "cta",
] as const satisfies readonly BeatId[];

export const CoulombExplainerProps = z.object({
  lang: z.enum(["en", "hi"]),
  voice: z.partialRecord(z.enum(BEAT_IDS), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type CoulombExplainerProps = z.infer<typeof CoulombExplainerProps>;

export const COULOMB_FPS = 30;
export const coulombMetadata: CalculateMetadataFunction<CoulombExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planCoulomb(props.voice as Voice).seconds * COULOMB_FPS),
});

const W = 1920;
const AXIS_Y = 560;
const KAN_R = 44;
const CAPTION_BOX = { left: 160, right: 160, bottom: 36 };
const EASE = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };

interface Ctx {
  lang: Lang;
  values: Record<string, string>;
  beat: PlannedBeat;
}

/** Coulomb's law explainer, 16:9. Every arrow length and number comes from the physics. */
export const CoulombExplainer: React.FC<CoulombExplainerProps> = ({ lang, voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planCoulomb(voice as Voice), [voice]);
  const values = useMemo(() => scriptValues(), []);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      {plan.beats.map((beat) => {
        const from = Math.round(beat.from * fps);
        const to = Math.round((beat.from + beat.seconds) * fps);
        const clip = voice[beat.id];
        return (
          <Sequence key={beat.id} name={beat.id} from={from} durationInFrames={to - from}>
            <BeatView ctx={{ lang, values, beat }} />
            {clip && <Audio src={staticFile(clip.src)} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const lines = BEATS.find((b) => b.id === ctx.beat.id)!.lines;
  const Scene = SCENES[ctx.beat.id];
  return (
    <AbsoluteFill>
      <Scene ctx={ctx} local={local} />
      <div style={{ position: "absolute", left: 60, top: 40, fontSize: 28, color: COLORS.chalkDim }}>
        {CARDS.topic[ctx.lang]} · Coulomb&apos;s law
      </div>
      <Captions
        cues={lines.map((l) => ({ at: l.at, text: fill(l[ctx.lang], ctx.values) }))}
        local={local}
        box={CAPTION_BOX}
        fontSize={46}
      />
    </AbsoluteFill>
  );
};

// ---------- small helpers ----------

/** A charged Kan centred on (x, y). */
const Charge: React.FC<{
  x: number;
  y: number;
  sign?: "+" | "−";
  expression?: KanExpression;
  look?: { x: number; y: number };
  arms?: KanArms;
  time: number;
  radius?: number;
  opacity?: number;
}> = ({ x, y, sign = "+", expression = "calm", look = { x: 0, y: 0.2 }, arms = "none", time, radius = KAN_R, opacity = 1 }) => {
  const size = (radius / 60) * 200;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity }}>
      <Kan radius={radius} expression={expression} look={look} arms={arms} time={time} badge={sign} />
    </div>
  );
};

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={1080} viewBox={`0 0 ${W} 1080`} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const SvgText: React.FC<{
  x: number;
  y: number;
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  children: React.ReactNode;
}> = ({ x, y, color = COLORS.chalk, size = 30, anchor = "middle", opacity = 1, children }) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    fontWeight={700}
    textAnchor={anchor}
    dominantBaseline="middle"
    stroke={COLORS.board}
    strokeWidth={size / 4}
    paintOrder="stroke"
    opacity={opacity}
  >
    {children}
  </text>
);

/** Force arrow: pink with an open triangle head (theme.ts). */
const Force: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  sub?: string;
  opacity?: number;
  width?: number;
}> = ({ x1, y1, x2, y2, label, sub, opacity = 1, width = 6 }) => (
  <g opacity={opacity}>
    <Arrow
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      color={COLORS.force}
      head="open-triangle"
      width={width}
      label={label ? { text: label, sub } : undefined}
      fontSize={34}
    />
  </g>
);

/** A distance shown as a dimension line with bar ends (displacement colour). */
const Distance: React.FC<{ x1: number; x2: number; y: number; label: string; opacity?: number }> = ({
  x1,
  x2,
  y,
  label,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    <Arrow x1={x1} y1={y} x2={x2} y2={y} color={COLORS.displacement} head="bars" width={4} />
    <SvgText x={(x1 + x2) / 2} y={y + 36} color={COLORS.displacement}>
      {label}
    </SvgText>
  </g>
);

const Axis: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => (
  <line x1={120} y1={AXIS_Y} x2={W - 120} y2={AXIS_Y} stroke={COLORS.chalkDim} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={opacity} />
);

const cmText = (m: number) => `${sig3(m * 100)} cm`;

/** 9.6e-19 → "9.6 \times 10^{-19}" */
function sciTex(x: number, digits = 2): string {
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const mant = x / 10 ** exp;
  return `${Number(mant.toPrecision(digits))} \\times 10^{${exp}}`;
}

// ---------- released-from-rest motion (shared by hook and release beats) ----------

const RELEASE_END_T = simulateRelease(SETUPS.release, SETUPS.releaseEnd).t;
const RELEASE_SAMPLES: ReleaseSample[] = sampleRelease(SETUPS.release, RELEASE_END_T, 900);
const RELEASE_SCALE = 4000; // px per metre

function releaseState(tPhys: number): ReleaseSample {
  const u = Math.min(1, Math.max(0, tPhys / RELEASE_END_T)) * (RELEASE_SAMPLES.length - 1);
  const i = Math.min(RELEASE_SAMPLES.length - 2, Math.floor(u));
  const f = u - i;
  const a = RELEASE_SAMPLES[i];
  const b = RELEASE_SAMPLES[i + 1];
  const lerp = (p: number, q: number) => p + (q - p) * f;
  return { t: tPhys, x1: lerp(a.x1, b.x1), x2: lerp(a.x2, b.x2), v1: lerp(a.v1, b.v1), v2: lerp(a.v2, b.v2) };
}

const releaseX = (x: number) => W / 2 + (x - SETUPS.release.r0 / 2) * RELEASE_SCALE;

const ReleasePair: React.FC<{ local: number; startAt: number; flightS: number; showArrows: boolean; expression: KanExpression }> = ({
  local,
  startAt,
  flightS,
  showArrows,
  expression,
}) => {
  const rate = RELEASE_END_T / flightS;
  const tPhys = Math.min(RELEASE_END_T, Math.max(0, (local - startAt) * rate));
  const st = releaseState(tPhys);
  const r = st.x2 - st.x1;
  const s = SETUPS.release;
  const f = coulombForce(s.k, s.q1, s.q2, r);
  const len = (f / coulombForce(s.k, s.q1, s.q2, s.r0)) * 200;
  const x1 = releaseX(st.x1);
  const x2 = releaseX(st.x2);
  const moving = local >= startAt;
  return (
    <>
      <Svg>
        <Axis />
        {showArrows && (
          <>
            <Force x1={x1 - KAN_R - 6} y1={AXIS_Y} x2={x1 - KAN_R - 6 - len} y2={AXIS_Y} label="F" />
            <Force x1={x2 + KAN_R + 6} y1={AXIS_Y} x2={x2 + KAN_R + 6 + len} y2={AXIS_Y} label="F" />
          </>
        )}
        <Distance x1={x1} x2={x2} y={AXIS_Y + 110} label={`r = ${cmText(r)}`} />
      </Svg>
      <Charge x={x1} y={AXIS_Y} time={local} expression={moving ? expression : "calm"} look={{ x: moving ? -1 : 1, y: 0 }} />
      <Charge x={x2} y={AXIS_Y} time={local + 0.6} expression={moving ? expression : "calm"} look={{ x: moving ? 1 : -1, y: 0 }} />
      {moving && (
        <div style={{ position: "absolute", left: 60, top: 84, fontSize: 26, color: COLORS.chalkDim }}>
          Slow motion: {sig3(rate)}× speed
        </div>
      )}
    </>
  );
};

// ---------- beats ----------

type SceneProps = { ctx: Ctx; local: number };

const Hook: React.FC<SceneProps> = ({ local }) => (
  <ReleasePair local={local} startAt={3.5} flightS={8.5} showArrows={local >= 3.5} expression="excited" />
);

const Charges: React.FC<SceneProps> = ({ ctx, local }) => {
  const repel = fade(local, 5.5, 0.5);
  const attract = fade(local, 11.5, 0.5);
  const packets = fade(local, 18.5, 0.5);
  const n = Math.min(6, Math.max(0, Math.floor(local - 20) + 1));
  return (
    <>
      <Svg>
        <g opacity={repel}>
          <Force x1={260 - KAN_R - 6} y1={360} x2={260 - KAN_R - 140} y2={360} />
          <Force x1={560 + KAN_R + 6} y1={360} x2={560 + KAN_R + 140} y2={360} />
          <SvgText x={410} y={460} color={COLORS.chalkDim}>
            {ctx.lang === "en" ? "same signs: push apart" : "same sign: door"}
          </SvgText>
        </g>
        <g opacity={attract}>
          <Force x1={260 + KAN_R + 6} y1={640} x2={260 + KAN_R + 80} y2={640} />
          <Force x1={560 - KAN_R - 6} y1={640} x2={560 - KAN_R - 80} y2={640} />
          <SvgText x={410} y={740} color={COLORS.chalkDim}>
            {ctx.lang === "en" ? "opposite signs: pull in" : "opposite sign: paas"}
          </SvgText>
        </g>
        <g opacity={packets}>
          {Array.from({ length: n }, (_, i) => (
            <g key={i}>
              <circle cx={1100 + i * 110} cy={380} r={34} fill={COLORS.boardRaised} stroke={COLORS.kan} strokeWidth={4} />
              <text x={1100 + i * 110} y={382} fill={COLORS.kan} fontSize={34} fontWeight={700} textAnchor="middle" dominantBaseline="middle">
                e
              </text>
            </g>
          ))}
        </g>
      </Svg>
      <Charge x={260} y={360} time={local} opacity={repel} expression="excited" look={{ x: -1, y: 0 }} />
      <Charge x={560} y={360} time={local + 0.3} opacity={repel} expression="excited" look={{ x: 1, y: 0 }} />
      <Charge x={260} y={640} time={local + 0.6} opacity={attract} expression="calm" look={{ x: 1, y: 0 }} />
      <Charge x={560} y={640} sign="−" time={local + 0.9} opacity={attract} expression="calm" look={{ x: -1, y: 0 }} />
      {n > 0 && (
        <div style={{ position: "absolute", left: 1060, top: 460, fontSize: 42, lineHeight: 1.8, opacity: packets }}>
          <div>
            <Tex tex={`q = ne = ${n} \\times (1.6 \\times 10^{-19}\\ \\text{C})`} />
          </div>
          <div>
            <Tex tex={`\\phantom{q} = ${sciTex(n * E_JEE)}\\ \\text{C}`} />
          </div>
        </div>
      )}
    </>
  );
};

/** r(t) in the law beat: held, dragged to 2r, held, then pushed in close. */
function lawR(local: number): number {
  const r0 = SETUPS.law.r;
  if (local < 22) return r0;
  if (local < 50) return interpolate(local, [22.5, 29], [r0, 2 * r0], EASE);
  return interpolate(local, [50, 55], [2 * r0, LAW_R_CLOSE], EASE);
}

const LAW_SCALE = 16000; // px per metre
const LAW_ARROW = 2.2; // px per newton

const Law: React.FC<SceneProps> = ({ local }) => {
  const r = lawR(local);
  const F = lawForce(r);
  const x1 = W / 2 - (r * LAW_SCALE) / 2;
  const x2 = W / 2 + (r * LAW_SCALE) / 2;
  const grab = local >= 21.5 ? fade(local, 21.5, 0.5) : 0;
  const { q1, q2 } = SETUPS.law;
  const show = fade(local, 13.5, 0.5);
  return (
    <>
      <Svg>
        <Axis />
        <g opacity={show}>
          <Force x1={x1 - KAN_R - 6} y1={AXIS_Y} x2={x1 - KAN_R - 6 - F * LAW_ARROW} y2={AXIS_Y} label="F" />
          <Force x1={x2 + KAN_R + 6} y1={AXIS_Y} x2={x2 + KAN_R + 6 + F * LAW_ARROW} y2={AXIS_Y} label="F" />
          <Distance x1={x1} x2={x2} y={AXIS_Y + 110} label={`r = ${cmText(r)}`} />
        </g>
        <ForceGraph r={r} opacity={fade(local, 22, 0.6)} />
      </Svg>
      <Charge x={x1} y={AXIS_Y} time={local} opacity={show} expression={F > 100 ? "scared" : "calm"} look={{ x: -1, y: 0 }} />
      <Charge x={x2} y={AXIS_Y} time={local + 0.5} opacity={show} expression={F > 100 ? "scared" : "calm"} look={{ x: 1, y: 0 }} />
      <div style={{ position: "absolute", left: 60, top: 110, opacity: fade(local, 5.5, 0.5) }}>
        <Card opacity={1} fontSize={44} style={{ position: "relative", textAlign: "left" }}>
          <Tex
            tex={`F = \\dfrac{k\\,q_1 q_2}{${"\\textcolor{" + COLORS.displacement + "}{r}"}^2} = \\dfrac{(9\\times10^{9})(${q1 * 1e6}\\times10^{-6})(${q2 * 1e6}\\times10^{-6})}{(${"\\textcolor{" + COLORS.displacement + "}{" + sig3(r) + "}"})^2} = \\textcolor{${COLORS.force}}{${sig3(F)}}\\ \\text{N}`}
          />
        </Card>
      </div>
      {grab > 0 && (
        <div style={{ position: "absolute", left: 980 + (r - SETUPS.law.r) * 6000, top: 300, opacity: grab, scale: String(0.7 + 0.3 * grab) }}>
          <div style={{ position: "relative", width: 150 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: COLORS.displacement,
                border: `3px solid ${COLORS.displacement}`,
                borderRadius: 12,
                padding: "2px 12px",
                background: COLORS.board,
                textAlign: "center",
              }}
            >
              r
            </div>
            <div style={{ position: "absolute", left: "50%", top: "100%", translate: "-50% -10px" }}>
              <Kan radius={28} expression={local < 50 ? "excited" : "proud"} arms="up" look={{ x: 1, y: -0.3 }} time={local} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** Live F–r graph: the inverse-square curve with a dot at the current r. */
const ForceGraph: React.FC<{ r: number; opacity: number }> = ({ r, opacity }) => {
  const box = { x: 1440, y: 130, w: 400, h: 260 };
  const rMin = 0.015;
  const rMax = 0.07;
  const fMax = lawForce(rMin);
  const px = (rr: number) => box.x + ((rr - rMin) / (rMax - rMin)) * box.w;
  const py = (f: number) => box.y + box.h - (f / fMax) * box.h;
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const rr = rMin + ((rMax - rMin) * i) / 80;
    d += `${i ? "L" : "M"} ${px(rr).toFixed(1)} ${py(lawForce(rr)).toFixed(1)} `;
  }
  return (
    <g opacity={opacity}>
      <rect x={box.x - 30} y={box.y - 30} width={box.w + 60} height={box.h + 90} rx={16} fill={COLORS.boardRaised} stroke={COLORS.boardLine} strokeWidth={2} />
      <line x1={box.x} y1={box.y + box.h} x2={box.x + box.w} y2={box.y + box.h} stroke={COLORS.chalkDim} strokeWidth={2} />
      <line x1={box.x} y1={box.y} x2={box.x} y2={box.y + box.h} stroke={COLORS.chalkDim} strokeWidth={2} />
      <path d={d} fill="none" stroke={COLORS.force} strokeWidth={4} />
      <circle cx={px(r)} cy={py(lawForce(r))} r={10} fill={COLORS.displacement} />
      <text x={box.x + box.w} y={box.y + box.h + 34} fill={COLORS.chalkDim} fontSize={24} textAnchor="end">
        r →
      </text>
      <text x={box.x + 10} y={box.y + 6} fill={COLORS.chalkDim} fontSize={24}>
        F
      </text>
    </g>
  );
};

const THIRD_SCALE = 2400;

const Third: React.FC<SceneProps> = ({ local }) => {
  const { r } = SETUPS.third;
  const x1 = W / 2 - (r * THIRD_SCALE) / 2;
  const x2 = W / 2 + (r * THIRD_SCALE) / 2;
  const F = thirdLawForce();
  const arrows = fade(local, 8.7, 0.5);
  const len = F * 400;
  return (
    <>
      <Svg>
        <Axis />
        <g opacity={arrows}>
          <Force x1={x1 - KAN_R - 6} y1={AXIS_Y} x2={x1 - KAN_R - 6 - len} y2={AXIS_Y} label="F" />
          <Force x1={x2 + KAN_R + 6} y1={AXIS_Y} x2={x2 + KAN_R + 6 + len} y2={AXIS_Y} label="F" />
          <SvgText x={x1 - KAN_R - len / 2} y={AXIS_Y - 70} color={COLORS.force}>
            {sig3(F)} N
          </SvgText>
          <SvgText x={x2 + KAN_R + len / 2} y={AXIS_Y - 70} color={COLORS.force}>
            {sig3(F)} N
          </SvgText>
        </g>
        <Distance x1={x1} x2={x2} y={AXIS_Y + 110} label={`r = ${cmText(r)}`} />
        <SvgText x={x1} y={AXIS_Y + 190} color={COLORS.kan} size={34}>
          1 µC
        </SvgText>
        <SvgText x={x2} y={AXIS_Y + 190} color={COLORS.kan} size={34}>
          4 µC
        </SvgText>
      </Svg>
      <Charge x={x1} y={AXIS_Y} time={local} expression={local < 9 ? "scared" : "calm"} look={{ x: 1, y: 0 }} />
      <Charge x={x2} y={AXIS_Y} time={local + 0.4} expression={local < 9 ? "proud" : "calm"} look={{ x: -1, y: 0 }} radius={54} />
    </>
  );
};

const Release: React.FC<SceneProps> = ({ local }) => {
  const startAt = 3;
  const flightS = 22;
  const rate = RELEASE_END_T / flightS;
  const tPhys = Math.min(RELEASE_END_T, Math.max(0, (local - startAt) * rate));
  const st = releaseState(tPhys);
  const r = st.x2 - st.x1;
  const s = SETUPS.release;
  const formula = releaseSpeeds({ ...s, r });
  const ke = 0.5 * s.m1 * st.v1 ** 2 + 0.5 * s.m2 * st.v2 ** 2;
  const pe = (s.k * s.q1 * s.q2) / r;
  const e0 = (s.k * s.q1 * s.q2) / s.r0;
  return (
    <>
      <ReleasePair local={local} startAt={startAt} flightS={flightS} showArrows expression="excited" />
      <div style={{ position: "absolute", right: 60, top: 40, width: 560, opacity: fade(local, 1, 0.5) }}>
        <Card opacity={1} fontSize={30} style={{ position: "relative", textAlign: "left", fontWeight: 400 }}>
          <div style={{ lineHeight: 1.7 }}>
            <div>
              RK4 simulation: <b style={{ color: COLORS.velocity }}>{sig3(Math.abs(st.v1))} m/s</b>
            </div>
            <div>
              Energy formula: <b style={{ color: COLORS.velocity }}>{sig3(formula.v1)} m/s</b>
            </div>
          </div>
          <EnergyBar label="KE" value={ke} total={e0} color={COLORS.velocity} />
          <EnergyBar label="U" value={pe} total={e0} color={COLORS.kan} />
          <div style={{ fontSize: 24, color: COLORS.chalkDim, marginTop: 8 }}>
            KE + U = {sig3(ke + pe)} J (start: {sig3(e0)} J) · no gravity, point charges
          </div>
        </Card>
      </div>
    </>
  );
};

const EnergyBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
    <div style={{ width: 44, fontWeight: 700 }}>{label}</div>
    <div style={{ flex: 1, height: 22, background: COLORS.board, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / total) * 100)}%`, height: "100%", background: color }} />
    </div>
  </div>
);

const TRI_SCALE = 3600;
const TRI_CENTER = { x: W / 2 - 200, y: 790 };
const TRI_ARROW = 150; // px per newton

const Superposition: React.FC<SceneProps> = ({ local }) => {
  const { A, B, C } = triangleCharges();
  const P = (c: { x: number; y: number }) => ({ x: TRI_CENTER.x + c.x * TRI_SCALE, y: TRI_CENTER.y - c.y * TRI_SCALE });
  const pa = P(A);
  const pb = P(B);
  const pc = P(C);
  const fromB = forceVec(A, B);
  const fromC = forceVec(A, C);
  const shift = interpolate(local, [15.5, 19.5], [0, 1], EASE); // slide the second arrow to the tip of the first
  const tip1 = { x: pa.x + fromB.x, y: pa.y + fromB.y };
  const start2 = { x: pa.x + shift * fromB.x, y: pa.y + shift * fromB.y };
  const net = fade(local, 24, 0.8);
  const arrows = fade(local, 6.7, 0.5);
  return (
    <>
      <Svg>
        <polygon points={`${pa.x},${pa.y} ${pb.x},${pb.y} ${pc.x},${pc.y}`} fill="none" stroke={COLORS.chalkDim} strokeWidth={3} strokeDasharray="6 10" />
        <SvgText x={(pb.x + pc.x) / 2} y={pb.y + 70} color={COLORS.displacement}>
          a = {cmText(SETUPS.triangle.a)}
        </SvgText>
        <g opacity={arrows}>
          <Force x1={pa.x} y1={pa.y} x2={tip1.x} y2={tip1.y} label="F" sub="B" />
          <Force x1={start2.x} y1={start2.y} x2={start2.x + fromC.x} y2={start2.y + fromC.y} label="F" sub="C" />
        </g>
        {net > 0 && (
          <Force x1={pa.x} y1={pa.y} x2={pa.x + fromB.x + fromC.x} y2={pa.y + fromB.y + fromC.y} width={10} label="F" sub="net" opacity={net} />
        )}
      </Svg>
      {[pa, pb, pc].map((p, i) => (
        <Charge key={i} x={p.x} y={p.y} time={local + i * 0.5} expression={i === 0 && local > 7 ? "excited" : "calm"} look={i === 0 ? { x: 0, y: -1 } : { x: 0, y: -0.6 }} />
      ))}
      <div style={{ position: "absolute", right: 80, top: 260, width: 520, fontSize: 36, opacity: fade(local, 31.7, 0.5) }}>
        <Card opacity={1} fontSize={36} style={{ position: "relative", fontWeight: 400 }}>
          <div style={{ lineHeight: 2 }}>
            <Tex tex={String.raw`F_\text{net} = 2F\cos 30^\circ`} />
            <br />
            <Tex tex={String.raw`= 2(0.9)\tfrac{\sqrt3}{2} = 0.9\sqrt{3}`} />
            <br />
            <Tex tex={`\\approx \\textcolor{${COLORS.force}}{${sig3(Math.hypot(...triNet()))}}\\ \\text{N}`} />
          </div>
        </Card>
      </div>
    </>
  );
};

function forceVec(target: { q: number; x: number; y: number }, source: { q: number; x: number; y: number }) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const r = Math.hypot(dx, dy);
  const f = coulombForce(K_JEE, target.q, source.q, r);
  return { x: (f * dx * TRI_ARROW) / r, y: (-f * dy * TRI_ARROW) / r }; // screen y points down
}

function triNet(): [number, number] {
  const { A, B, C } = triangleCharges();
  const fb = forceVec(A, B);
  const fc = forceVec(A, C);
  return [(fb.x + fc.x) / TRI_ARROW, (fb.y + fc.y) / TRI_ARROW];
}

const LINE_SCALE = 4000;
const lineX = (x: number) => W / 2 + (x - SETUPS.nullPoint.d / 2) * LINE_SCALE;

const Predict: React.FC<SceneProps> = ({ ctx, local }) => {
  const end = ctx.beat.seconds;
  const countFrom = end - 3.5;
  const count = local >= countFrom && local < countFrom + 3 ? 3 - Math.floor(local - countFrom) : null;
  return (
    <>
      <NullLine probe={null} local={local} />
      <div style={{ position: "absolute", left: 300, right: 300, top: 110 }}>
        <Card opacity={fade(local, 0.1, 0.4)} fontSize={48} style={{ position: "relative" }}>
          <RichText text={CARDS.predict[ctx.lang]} />
          <div style={{ height: 80, fontSize: 70, color: COLORS.kan }}>{count}</div>
        </Card>
      </div>
    </>
  );
};

/** Where the test charge is: placed by hand, so it moves with UI easing; its force is computed exactly. */
function probeX(local: number): number {
  const xn = nullPointFromQ1();
  return interpolate(local, [0, 2, 8, 13, 16.5], [0.04, 0.04, 0.04, 0.26, xn], EASE);
}

const Reveal: React.FC<SceneProps> = ({ local }) => {
  const x = probeX(local);
  const settled = local >= 16.6;
  return (
    <>
      <NullLine probe={x} local={local} settled={settled} />
      {local >= 24.5 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center" }}>
          <Card opacity={fade(local, 24.5, 0.5)} fontSize={42} style={{ position: "relative", fontWeight: 400 }}>
            <Tex tex={`\\dfrac{k(2\\,\\mu\\text{C})}{x^2} = \\dfrac{k(8\\,\\mu\\text{C})}{(30-x)^2} \\;\\Rightarrow\\; x = \\textcolor{${COLORS.displacement}}{${sig3(nullPointFromQ1() * 100)}}\\ \\text{cm}`} />
          </Card>
        </div>
      )}
    </>
  );
};

const NullLine: React.FC<{ probe: number | null; local: number; settled?: boolean }> = ({ probe, local, settled = false }) => {
  const { q1, q2, d } = SETUPS.nullPoint;
  const xa = lineX(0);
  const xb = lineX(d);
  const F = probe === null ? 0 : probeForce(probe);
  // Arrow length grows with √F so both tiny and large forces stay visible (direction is exact).
  const len = Math.sign(F) * Math.min(300, 75 * Math.sqrt(Math.abs(F)));
  const px = probe === null ? lineX(d / 2) : lineX(probe);
  return (
    <>
      <Svg>
        <Axis opacity={0.7} />
        <Distance x1={xa} x2={xb} y={AXIS_Y + 120} label={cmText(d)} />
        <SvgText x={xa} y={AXIS_Y - 90} color={COLORS.kan} size={36}>
          +{q1 * 1e6} µC
        </SvgText>
        <SvgText x={xb} y={AXIS_Y - 90} color={COLORS.kan} size={36}>
          +{q2 * 1e6} µC
        </SvgText>
        {probe !== null && Math.abs(len) > 4 && !settled && (
          <Force x1={px} y1={AXIS_Y - 62} x2={px + len} y2={AXIS_Y - 62} label="F" />
        )}
        {probe !== null && (
          <SvgText x={px} y={AXIS_Y + 64} color={COLORS.force} size={28}>
            {settled ? "F = 0" : `${sig3(Math.abs(F))} N`}
          </SvgText>
        )}
        {settled && <Distance x1={xa} x2={px} y={AXIS_Y + 200} label={cmText(probe!)} opacity={fade(local, 16.6, 0.4)} />}
        {probe !== null && (
          <text x={1880} y={1000 - 120} fill={COLORS.chalkDim} fontSize={22} textAnchor="end">
            arrow length ∝ √F so small forces stay visible
          </text>
        )}
      </Svg>
      <Charge x={xa} y={AXIS_Y} time={local} />
      <Charge x={xb} y={AXIS_Y} time={local + 0.5} radius={54} />
      <Charge
        x={px}
        y={AXIS_Y}
        time={local + 1}
        radius={26}
        expression={probe === null ? "calm" : settled ? "proud" : "scared"}
        look={{ x: Math.sign(F) || 1, y: 0 }}
      />
    </>
  );
};

const Cta: React.FC<SceneProps> = ({ ctx, local }) => (
  <>
    <Svg>
      <Axis />
    </Svg>
    <Charge x={W / 2 - 220} y={AXIS_Y} time={local} expression="proud" look={{ x: 1, y: -0.3 }} />
    <Charge x={W / 2 + 220} y={AXIS_Y} sign="−" time={local + 0.5} expression="proud" look={{ x: -1, y: -0.3 }} />
    <div style={{ position: "absolute", left: 260, right: 260, top: 150 }}>
      <Card opacity={fade(local, 4, 0.5)} fontSize={52} style={{ position: "relative" }}>
        <RichText text={CARDS.cta[ctx.lang]} />
      </Card>
    </div>
  </>
);

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  hook: Hook,
  charges: Charges,
  law: Law,
  third: Third,
  release: Release,
  superposition: Superposition,
  predict: Predict,
  reveal: Reveal,
  cta: Cta,
};

/** Cover still for the explainer. */
export const CoulombCover: React.FC<{ lang: Lang }> = ({ lang }) => {
  const r = 0.1;
  const x1 = 1300 - (r * 3000) / 2;
  const x2 = 1300 + (r * 3000) / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Svg>
        <Force x1={x1 - 66} y1={620} x2={x1 - 66 - 200} y2={620} width={8} />
        <Force x1={x2 + 66} y1={620} x2={x2 + 66 + 200} y2={620} width={8} />
      </Svg>
      <Charge x={x1} y={620} time={0.4} expression="excited" look={{ x: -1, y: 0 }} radius={60} />
      <Charge x={x2} y={620} time={1.1} expression="excited" look={{ x: 1, y: 0 }} radius={60} />
      <div style={{ position: "absolute", left: 90, top: 250, width: 820 }}>
        <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1.05 }}>{CARDS.title[lang]}</div>
        <div style={{ fontSize: 58, fontWeight: 700, color: COLORS.displacement, marginTop: 24 }}>{CARDS.subtitle[lang]}</div>
        <div style={{ fontSize: 56, marginTop: 40 }}>
          <Tex tex="F = \dfrac{k\,q_1 q_2}{r^2}" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 900, fontSize: 34, color: COLORS.chalkDim, letterSpacing: 2 }}>
        PRAYOG STUDIO
      </div>
    </AbsoluteFill>
  );
};

export const CoulombCoverProps = z.object({ lang: z.enum(["en", "hi"]) });
