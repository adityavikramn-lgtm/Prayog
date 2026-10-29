import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { Tex } from "../../components/Tex";
import { Kan, KanExpression } from "../../mascot/Kan";
import { sig3 } from "../../physics/format";
import { forcesAt, totalWork, workUpTo } from "../../physics/hemisphere";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { CLAMP, Captions, Card, fade } from "../../video/ui";
import { EXAMPLE, MISTAKES } from "./model";
import { PlannedBeat, Voice, planHemisphere } from "./plan";
import { BEATS, BeatId, QUESTION, TITLE, fill, scriptValues } from "./script";
import { simulateDrag } from "./simulate";

export const HemisphereExplainerProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(z.string(), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type HemisphereExplainerProps = z.infer<typeof HemisphereExplainerProps>;

export const HEMI_FPS = 30;
export const hemisphereMetadata: CalculateMetadataFunction<HemisphereExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planHemisphere(props.voice as Voice).seconds * HEMI_FPS),
});

// Board geometry (pixels). The dome's radius stands for R.
const W = 1920;
const CX = 640;
const GROUND = 800;
const RP = 300;
const KAN_R = 30;
const ROPE_R = RP + 6;
const PULLER_START = CX + RP + 70;
const FORCE_SCALE = 8; // px per newton, for the worked example (m = 2 kg, μ = 0.5)
const DEG = Math.PI / 180;
const PANEL = { left: 1130, top: 80, width: 740 };

interface Ctx {
  beat: PlannedBeat;
  values: Record<string, string>;
  local: number;
}

/** The full lesson (16:9): question first, then every idea from zero, then the answer. */
export const HemisphereExplainer: React.FC<HemisphereExplainerProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planHemisphere(voice as Voice), [voice]);
  const values = useMemo(() => scriptValues(), []);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
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
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ beat: PlannedBeat; values: Record<string, string> }> = ({ beat, values }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctx: Ctx = { beat, values, local: frame / fps };
  const script = BEATS.find((b) => b.id === beat.id)!;
  const Scene = SCENES[beat.id];
  return (
    <AbsoluteFill>
      <Scene ctx={ctx} />
      <div style={{ position: "absolute", left: 60, top: 30, fontSize: 26, color: COLORS.chalkDim }}>{TITLE.topic}</div>
      <Captions
        cues={script.lines.map((l, i) => ({ at: beat.lines[i].at, text: fill(l.text, values) }))}
        local={ctx.local}
        box={{ left: 120, right: 120, bottom: 26 }}
        fontSize={40}
      />
    </AbsoluteFill>
  );
};

// ---------- timing helpers: everything follows the spoken lines ----------

const lineAt = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;
const lineEnd = (ctx: Ctx, i: number) => {
  const l = ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)];
  return l.at + l.seconds;
};

/** Opacity for a drawing tagged `tag`: on from the first line that reveals it. */
function shown(ctx: Ctx, tag: string): number {
  const script = BEATS.find((b) => b.id === ctx.beat.id)!;
  const i = script.lines.findIndex((l) => l.reveal?.includes(tag));
  return i < 0 ? 0 : fade(ctx.local, lineAt(ctx, i), 0.4);
}

/** The board panel: a title and every math line spoken so far in this beat. */
const MathPanel: React.FC<{ ctx: Ctx; fontSize?: number; top?: number }> = ({ ctx, fontSize = 32, top = PANEL.top }) => {
  const script = BEATS.find((b) => b.id === ctx.beat.id)!;
  const rows = script.lines.map((l, i) => ({ math: l.math, at: lineAt(ctx, i) })).filter((r) => r.math && r.at <= ctx.local + 0.01);
  return (
    <div style={{ position: "absolute", left: PANEL.left, top, width: PANEL.width }}>
      <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 18, opacity: fade(ctx.local, 0, 0.4) }}>{script.title}</div>
      <div style={{ fontSize, lineHeight: 1.25, display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              opacity: fade(ctx.local, r.at, 0.4),
              padding: "10px 16px",
              borderRadius: 12,
              background: i === rows.length - 1 ? COLORS.boardRaised : "transparent",
              border: `2px solid ${i === rows.length - 1 ? COLORS.boardLine : "transparent"}`,
            }}
          >
            <Tex tex={r.math!} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- the board ----------

const surface = (phi: number, r = RP) => ({ x: CX - r * Math.cos(phi), y: GROUND - r * Math.sin(phi) });
/** Kan's centre sits one body-radius off the surface; near the ground it rests on the ground line. */
const blockAt = (phi: number) => {
  const p = surface(phi, RP + KAN_R);
  return { x: p.x, y: Math.min(p.y, GROUND - KAN_R) };
};
const outward = (phi: number) => ({ x: -Math.cos(phi), y: -Math.sin(phi) });
const upSlope = (phi: number) => ({ x: Math.sin(phi), y: -Math.cos(phi) });
const neg = (v: { x: number; y: number }) => ({ x: -v.x, y: -v.y });

/** The block climbs at a constant angular rate between t0 and t1 (no easing on a physical object). */
const climb = (local: number, t0: number, t1: number) => interpolate(local, [t0, t1], [0, 90 * DEG], CLAMP);

const Svg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={1080} viewBox={`0 0 ${W} 1080`} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Text: React.FC<{ x: number; y: number; color?: string; size?: number; anchor?: "start" | "middle" | "end"; opacity?: number; children: React.ReactNode }> = ({
  x,
  y,
  color = COLORS.chalk,
  size = 32,
  anchor = "middle",
  opacity = 1,
  children,
}) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor={anchor} dominantBaseline="middle" stroke={COLORS.board} strokeWidth={size / 4} paintOrder="stroke" opacity={opacity}>
    {children}
  </text>
);

/** Dome, ground, the rope over the top and the person pulling it. The rope keeps its length. */
const Board: React.FC<{ phi: number; local: number; pullerExpression?: KanExpression }> = ({ phi, local, pullerExpression = "excited" }) => {
  const b = surface(phi, ROPE_R);
  const ropeEnd = surface(Math.PI, ROPE_R);
  const pullerX = PULLER_START + ROPE_R * phi; // every bit of arc the block climbs comes out on the person's side
  const hatch = Array.from({ length: 22 }, (_, i) => 70 + i * 50);
  return (
    <>
      <Svg>
        <path d={`M ${CX - RP} ${GROUND} A ${RP} ${RP} 0 0 1 ${CX + RP} ${GROUND} Z`} fill={COLORS.boardRaised} stroke={COLORS.chalk} strokeWidth={4} />
        <path d={`M ${CX - RP} ${GROUND} A ${RP} ${RP} 0 0 1 ${CX + RP} ${GROUND}`} fill="none" stroke={COLORS.chalkDim} strokeWidth={10} strokeDasharray="1 16" strokeLinecap="round" opacity={0.6} />
        <line x1={60} y1={GROUND} x2={1100} y2={GROUND} stroke={COLORS.chalk} strokeWidth={4} />
        {hatch.map((x) => (
          <line key={x} x1={x} y1={GROUND + 4} x2={x - 22} y2={GROUND + 26} stroke={COLORS.chalkDim} strokeWidth={2} opacity={0.5} />
        ))}
        <path d={`M ${b.x} ${b.y} A ${ROPE_R} ${ROPE_R} 0 0 1 ${ropeEnd.x} ${ropeEnd.y} L ${pullerX - 34} ${GROUND - 26}`} fill="none" stroke="#c9b48a" strokeWidth={4} />
      </Svg>
      <div style={{ position: "absolute", left: pullerX - 50, top: GROUND - 100 }}>
        <Kan radius={30} expression={pullerExpression} arms="out" look={{ x: -1, y: -0.2 }} time={local + 0.7} />
      </div>
    </>
  );
};

const Block: React.FC<{ phi: number; local: number; expression?: KanExpression }> = ({ phi, local, expression = "calm" }) => {
  const p = blockAt(phi);
  const size = (KAN_R / 60) * 200;
  const u = upSlope(phi);
  return (
    <div style={{ position: "absolute", left: p.x - size / 2, top: p.y - size / 2 }}>
      <Kan radius={KAN_R} expression={expression} look={{ x: u.x, y: u.y }} time={local} />
    </div>
  );
};

const Force: React.FC<{ from: { x: number; y: number }; dir: { x: number; y: number }; newtons: number; label: string; opacity: number; dashed?: boolean; color?: string }> = ({
  from,
  dir,
  newtons,
  label,
  opacity,
  dashed,
  color = COLORS.force,
}) => {
  if (opacity <= 0) return null;
  const len = newtons * FORCE_SCALE;
  return (
    <g opacity={opacity}>
      <Arrow x1={from.x} y1={from.y} x2={from.x + dir.x * len} y2={from.y + dir.y * len} color={color} head="open-triangle" width={dashed ? 4 : 6} dashed={dashed} label={label ? { text: label } : undefined} fontSize={32} />
    </g>
  );
};

const AngleMark: React.FC<{ phi: number; opacity: number }> = ({ phi, opacity }) => {
  const r = 90;
  const end = surface(phi, r);
  const lab = surface(phi / 2, r + 34);
  const tip = surface(phi, RP);
  return (
    <g opacity={opacity}>
      <line x1={CX} y1={GROUND} x2={tip.x} y2={tip.y} stroke={COLORS.chalkDim} strokeWidth={3} strokeDasharray="8 8" />
      <path d={`M ${CX - r} ${GROUND} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke={COLORS.kan} strokeWidth={4} />
      <Text x={lab.x} y={lab.y} color={COLORS.kan}>
        φ
      </Text>
    </g>
  );
};

/** All forces on the block at angle φ, each switched on by its tag. Drawn to scale for the worked example. */
const ForcesAt: React.FC<{ ctx: Ctx; phi: number }> = ({ ctx, phi }) => {
  const f = forcesAt(EXAMPLE, phi);
  const p = blockAt(phi);
  const mg = EXAMPLE.m * EXAMPLE.g;
  return (
    <Svg>
      <Force from={p} dir={{ x: 0, y: 1 }} newtons={mg} label="mg" opacity={shown(ctx, "mg")} />
      <Force from={p} dir={outward(phi)} newtons={f.normal} label="N" opacity={shown(ctx, "N")} />
      <Force from={p} dir={neg(upSlope(phi))} newtons={f.friction} label="f" opacity={shown(ctx, "f")} />
      <Force from={p} dir={upSlope(phi)} newtons={f.tension} label="T" opacity={shown(ctx, "T")} />
      <Force from={p} dir={neg(outward(phi))} newtons={mg * Math.sin(phi)} label="" dashed opacity={shown(ctx, "mgsin") * 0.9} color={COLORS.chalk} />
      <Force from={p} dir={neg(upSlope(phi))} newtons={mg * Math.cos(phi)} label="" dashed opacity={shown(ctx, "mgcos") * 0.9} color={COLORS.chalk} />
    </Svg>
  );
};

/** Stacked bar of the person's work so far: lifting part + friction part (worked example). */
const WorkBar: React.FC<{ phi: number; opacity: number; top: number }> = ({ phi, opacity, top }) => {
  const w = workUpTo(EXAMPLE, phi);
  const full = totalWork(EXAMPLE);
  const width = 640;
  return (
    <div style={{ position: "absolute", left: PANEL.left, top, width, opacity }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
        Work by the person so far: <span style={{ color: COLORS.displacement }}>{sig3(w.total)} J</span>
      </div>
      <div style={{ display: "flex", height: 34, background: COLORS.boardRaised, borderRadius: 8, overflow: "hidden", border: `2px solid ${COLORS.boardLine}` }}>
        <div style={{ width: (w.againstGravity / full) * width, background: COLORS.chalk }} />
        <div style={{ width: (w.againstFriction / full) * width, background: COLORS.kan }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginTop: 8 }}>
        <span>lifting {sig3(w.againstGravity)} J</span>
        <span style={{ color: COLORS.kan }}>friction {sig3(w.againstFriction)} J</span>
      </div>
      <div style={{ fontSize: 20, color: COLORS.chalkDim, marginTop: 6 }}>example: m = 2 kg, R = 1 m, μ = 0.5, g = 10 m/s²</div>
    </div>
  );
};

// ---------- scenes ----------

type SceneProps = { ctx: Ctx };

const Question: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const phi = 25 * DEG;
  return (
    <>
      <Board phi={phi} local={local} />
      <Block phi={phi} local={local} />
      <Card opacity={fade(local, 0.1, 0.5)} fontSize={36} style={{ left: PANEL.left - 20, top: 80, width: PANEL.width + 20, textAlign: "left", fontWeight: 400, lineHeight: 1.45 }}>
        <div style={{ fontSize: 28, color: COLORS.displacement, fontWeight: 700, marginBottom: 12 }}>QUESTION</div>
        {QUESTION}
      </Card>
    </>
  );
};

const Givens: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const phi = 25 * DEG;
  const top = surface(70 * DEG);
  const p = blockAt(phi);
  return (
    <>
      <Board phi={phi} local={local} pullerExpression="calm" />
      <Svg>
        <g opacity={shown(ctx, "R")}>
          <Arrow x1={CX} y1={GROUND} x2={CX + RP * Math.cos(35 * DEG)} y2={GROUND - RP * Math.sin(35 * DEG)} color={COLORS.displacement} head="bars" width={4} />
          <Text x={CX + 150} y={GROUND - 130} color={COLORS.displacement}>
            R
          </Text>
        </g>
        <Text x={p.x - 70} y={p.y - 40} color={COLORS.kan} opacity={shown(ctx, "m")}>
          m
        </Text>
        <Text x={top.x - 60} y={top.y - 40} color={COLORS.chalkDim} size={30} opacity={shown(ctx, "mu")}>
          rough: μ
        </Text>
      </Svg>
      <Block phi={phi} local={local} />
      <MathPanel ctx={ctx} />
    </>
  );
};

/** What work means: a push on flat ground, then a slanted push, then a changing force cut into pieces. */
const WorkScene: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const y = 600;
  const push = shown(ctx, "push");
  const angle = shown(ctx, "angle");
  const pieces = shown(ctx, "pieces");
  const flat = 1 - pieces;
  const t0 = lineAt(ctx, 1);
  const x = interpolate(local, [t0, t0 + 8], [220, 760], CLAMP); // steady speed: work is done against friction
  const th = 30 * DEG;
  // A quarter-circle path cut into pieces; each arrow's length is the pull there (example values).
  const n = 9;
  const arcC = { x: 560, y: 820 };
  const arcR = 330;
  return (
    <>
      <Svg>
        <g opacity={flat}>
          <line x1={100} y1={y + 32} x2={1060} y2={y + 32} stroke={COLORS.chalk} strokeWidth={4} />
          <g opacity={push * (1 - angle)}>
            <Arrow x1={x - 150} y1={y} x2={x - 34} y2={y} color={COLORS.force} head="open-triangle" width={6} label={{ text: "F" }} fontSize={34} />
          </g>
          <g opacity={angle}>
            <Arrow x1={x - 34 - 130 * Math.cos(th)} y1={y + 130 * Math.sin(th)} x2={x - 34} y2={y} color={COLORS.force} head="open-triangle" width={6} label={{ text: "F" }} fontSize={34} />
            <Arrow x1={x - 34 - 130 * Math.cos(th)} y1={y} x2={x - 34} y2={y} color={COLORS.force} head="open" width={4} dashed />
            <Text x={x - 34 - 150} y={y - 30} color={COLORS.force} size={26}>
              F cos θ
            </Text>
            <Text x={x - 34 - 70} y={y + 40} color={COLORS.kan} size={26}>
              θ
            </Text>
          </g>
          <g opacity={push}>
            <Arrow x1={220} y1={y + 90} x2={x} y2={y + 90} color={COLORS.displacement} head="bars" width={4} />
            <Text x={(220 + x) / 2} y={y + 130} color={COLORS.displacement}>
              s
            </Text>
          </g>
        </g>
        <g opacity={pieces}>
          <path d={`M ${arcC.x - arcR} ${arcC.y} A ${arcR} ${arcR} 0 0 1 ${arcC.x} ${arcC.y - arcR}`} fill="none" stroke={COLORS.chalk} strokeWidth={4} />
          {Array.from({ length: n }, (_, i) => {
            const a = ((i + 0.5) / n) * (Math.PI / 2);
            const px = arcC.x - arcR * Math.cos(a);
            const py = arcC.y - arcR * Math.sin(a);
            const len = forcesAt(EXAMPLE, a).tension * 6;
            const tick = (k: number) => ({ x: arcC.x - (arcR - k) * Math.cos((i / n) * (Math.PI / 2)), y: arcC.y - (arcR - k) * Math.sin((i / n) * (Math.PI / 2)) });
            const t1 = tick(-14);
            const t2 = tick(14);
            return (
              <g key={i} opacity={fade(local, lineAt(ctx, 4) + i * 0.25, 0.3)}>
                <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke={COLORS.displacement} strokeWidth={3} />
                <Arrow x1={px} y1={py} x2={px + Math.sin(a) * len} y2={py - Math.cos(a) * len} color={COLORS.force} head="open-triangle" width={4} />
              </g>
            );
          })}
          <Text x={arcC.x - arcR - 40} y={arcC.y - 140} color={COLORS.displacement} size={28} anchor="end">
            ds
          </Text>
        </g>
      </Svg>
      {flat > 0.02 && (
        <div style={{ position: "absolute", left: x - 34, top: y - 34, opacity: flat * Math.max(push, 0.0001) }}>
          <Kan radius={30} expression="calm" look={{ x: 1, y: 0 }} time={local} />
        </div>
      )}
      <MathPanel ctx={ctx} />
    </>
  );
};

const FBD_PHI = 40 * DEG;

const Forces: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Board phi={FBD_PHI} local={ctx.local} pullerExpression="calm" />
    <ForcesAt ctx={ctx} phi={FBD_PHI} />
    <Block phi={FBD_PHI} local={ctx.local} />
    <MathPanel ctx={ctx} fontSize={30} />
  </>
);

const Slowly: React.FC<SceneProps> = ({ ctx }) => {
  const phi = climb(ctx.local, lineAt(ctx, 1), ctx.beat.seconds - 1);
  return (
    <>
      <Board phi={phi} local={ctx.local} />
      <Block phi={phi} local={ctx.local} expression="calm" />
      <MathPanel ctx={ctx} fontSize={30} />
    </>
  );
};

const Geometry: React.FC<SceneProps> = ({ ctx }) => {
  const phi = FBD_PHI;
  const d = 8 * DEG;
  const a = surface(phi, RP);
  const b = surface(phi + d, RP);
  const mid = surface(phi + d / 2, RP + 46);
  return (
    <>
      <Board phi={phi} local={ctx.local} pullerExpression="calm" />
      <Svg>
        <AngleMark phi={phi} opacity={shown(ctx, "phi")} />
        <g opacity={shown(ctx, "ds")}>
          <path d={`M ${a.x} ${a.y} A ${RP} ${RP} 0 0 1 ${b.x} ${b.y}`} fill="none" stroke={COLORS.displacement} strokeWidth={10} strokeLinecap="round" />
          <Text x={mid.x} y={mid.y} color={COLORS.displacement}>
            ds
          </Text>
          <line x1={CX} y1={GROUND} x2={b.x} y2={b.y} stroke={COLORS.chalkDim} strokeWidth={2} strokeDasharray="6 8" />
        </g>
      </Svg>
      <Block phi={phi} local={ctx.local} />
      <MathPanel ctx={ctx} />
    </>
  );
};

const Components: React.FC<SceneProps> = ({ ctx }) => {
  const phi = FBD_PHI;
  const p = blockAt(phi);
  const mg = EXAMPLE.m * EXAMPLE.g;
  const inward = neg(outward(phi));
  const down = neg(upSlope(phi));
  const sinTip = { x: p.x + inward.x * mg * Math.sin(phi) * FORCE_SCALE, y: p.y + inward.y * mg * Math.sin(phi) * FORCE_SCALE };
  const cosTip = { x: p.x + down.x * mg * Math.cos(phi) * FORCE_SCALE, y: p.y + down.y * mg * Math.cos(phi) * FORCE_SCALE };
  return (
    <>
      <Board phi={phi} local={ctx.local} pullerExpression="calm" />
      <Svg>
        <AngleMark phi={phi} opacity={0.6} />
      </Svg>
      <ForcesAt ctx={ctx} phi={phi} />
      <Svg>
        <Text x={sinTip.x + 30} y={sinTip.y + 10} color={COLORS.chalk} size={26} anchor="start" opacity={shown(ctx, "mgsin")}>
          mg sin φ
        </Text>
        <Text x={cosTip.x - 20} y={cosTip.y + 30} color={COLORS.chalk} size={26} anchor="end" opacity={shown(ctx, "mgcos")}>
          mg cos φ
        </Text>
      </Svg>
      <Block phi={phi} local={ctx.local} />
      <MathPanel ctx={ctx} fontSize={30} />
    </>
  );
};

const Balance: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Board phi={FBD_PHI} local={ctx.local} pullerExpression="calm" />
    <Svg>
      <AngleMark phi={FBD_PHI} opacity={0.6} />
    </Svg>
    <ForcesAt ctx={ctx} phi={FBD_PHI} />
    <Block phi={FBD_PHI} local={ctx.local} />
    <MathPanel ctx={ctx} fontSize={30} />
    <div style={{ position: "absolute", left: 60, top: 80, fontSize: 22, color: COLORS.chalkDim, opacity: fade(ctx.local, 0.5, 0.5) }}>
      arrows drawn to scale for m = 2 kg, μ = 0.5, φ = 40°
    </div>
  </>
);

const Derivation: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Board phi={FBD_PHI} local={ctx.local} pullerExpression="calm" />
    <Svg>
      <AngleMark phi={FBD_PHI} opacity={0.6} />
    </Svg>
    <Block phi={FBD_PHI} local={ctx.local} />
    <MathPanel ctx={ctx} fontSize={28} />
  </>
);

const Answer: React.FC<SceneProps> = ({ ctx }) => {
  const phi = climb(ctx.local, lineAt(ctx, 2), Math.max(lineEnd(ctx, 2), lineAt(ctx, 2) + 6));
  return (
    <>
      <Board phi={phi} local={ctx.local} />
      <Block phi={phi} local={ctx.local} expression="excited" />
      <MathPanel ctx={ctx} fontSize={44} />
      <WorkBar phi={phi} opacity={fade(ctx.local, lineAt(ctx, 2), 0.5)} top={480} />
    </>
  );
};

const Meaning: React.FC<SceneProps> = ({ ctx }) => {
  const phi = climb(ctx.local, lineAt(ctx, 2), lineAt(ctx, 2) + 7);
  const p = surface(phi);
  return (
    <>
      <Board phi={phi} local={ctx.local} />
      <Svg>
        <g opacity={shown(ctx, "height")}>
          <Arrow x1={CX - RP - 60} y1={GROUND} x2={CX - RP - 60} y2={GROUND - RP} color={COLORS.displacement} head="bars" width={4} />
          <Text x={CX - RP - 80} y={GROUND - RP / 2} color={COLORS.displacement} anchor="end" size={28}>
            height R
          </Text>
        </g>
        <g opacity={shown(ctx, "horizontal")}>
          <Arrow x1={CX - RP} y1={GROUND + 40} x2={Math.max(CX - RP + 2, p.x)} y2={GROUND + 40} color={COLORS.kan} head="bars" width={5} />
          <Text x={CX - RP} y={GROUND + 80} color={COLORS.kan} anchor="start" size={26}>
            horizontal distance: {sig3((p.x - (CX - RP)) / RP)} R
          </Text>
        </g>
      </Svg>
      <Block phi={phi} local={ctx.local} expression="excited" />
      <MathPanel ctx={ctx} fontSize={30} />
    </>
  );
};

const Example: React.FC<SceneProps> = ({ ctx }) => {
  const { local, values } = ctx;
  const sim = simulateDrag(EXAMPLE);
  return (
    <>
      <Board phi={90 * DEG} local={local} pullerExpression="proud" />
      <Block phi={90 * DEG} local={local} expression="proud" />
      <div style={{ position: "absolute", left: PANEL.left, top: PANEL.top, width: PANEL.width, fontSize: 32, lineHeight: 2 }}>
        <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 10 }}>With real numbers</div>
        <div style={{ opacity: fade(local, lineAt(ctx, 0), 0.4) }}>
          <Tex tex="m = 2\text{ kg},\quad R = 1\text{ m},\quad \mu = 0.5,\quad g = 10\text{ m/s}^2" />
        </div>
        <div style={{ opacity: fade(local, lineAt(ctx, 1), 0.4) }}>
          <Tex tex={`mgR = (2)(10)(1) = ${values.wg}\\text{ J}`} />
        </div>
        <div style={{ opacity: fade(local, lineAt(ctx, 1), 0.4) }}>
          <Tex tex={`\\mu mgR = (0.5)(2)(10)(1) = ${values.wf}\\text{ J}`} />
        </div>
        <div style={{ opacity: fade(local, lineAt(ctx, 2), 0.4), fontSize: 44 }}>
          <Tex tex={`W = \\textcolor{${COLORS.displacement}}{${values.w}\\text{ J}}`} />
        </div>
        <div style={{ opacity: fade(local, lineAt(ctx, 3), 0.4), fontSize: 26, color: COLORS.kan, lineHeight: 1.4 }}>
          Step-by-step simulation: {sig3(sim.byMan)} J (lifting {sig3(-sim.byGravity)} J + friction {sig3(-sim.byFriction)} J)
        </div>
      </div>
    </>
  );
};

const Traps: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const right = totalWork(EXAMPLE);
  const rows = [
    { label: "Correct: mgR(1 + μ)", value: right, color: COLORS.displacement, at: lineAt(ctx, 0) },
    { label: MISTAKES[0].en, value: MISTAKES[0].value(EXAMPLE), color: COLORS.chalkDim, at: lineAt(ctx, 1) },
    { label: MISTAKES[1].en, value: MISTAKES[1].value(EXAMPLE), color: COLORS.chalkDim, at: lineAt(ctx, 2) },
  ];
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 120, fontSize: 60, fontWeight: 700 }}>Common traps</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{ position: "absolute", left: 140, top: 250 + i * 160, width: 1640, opacity: fade(local, r.at, 0.5) }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: i === 0 ? COLORS.displacement : COLORS.chalk }}>
            {i === 0 ? "✓ " : "✗ "}
            {r.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
            <div style={{ width: (r.value / max) * 1200, height: 30, background: r.color, borderRadius: 6 }} />
            <div style={{ fontSize: 32 }}>{sig3(r.value)} J</div>
          </div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 140, top: 740, fontSize: 24, color: COLORS.chalkDim }}>values for m = 2 kg, R = 1 m, μ = 0.5, g = 10 m/s²</div>
    </>
  );
};

const Recap: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Board phi={90 * DEG} local={ctx.local} pullerExpression="proud" />
    <Block phi={90 * DEG} local={ctx.local} expression="proud" />
    <MathPanel ctx={ctx} fontSize={34} />
  </>
);

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  question: Question,
  givens: Givens,
  work: WorkScene,
  forces: Forces,
  slowly: Slowly,
  geometry: Geometry,
  components: Components,
  balance: Balance,
  setup: Derivation,
  integrate: Derivation,
  answer: Answer,
  meaning: Meaning,
  example: Example,
  traps: Traps,
  recap: Recap,
};

export const HemisphereCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
    <Board phi={45 * DEG} local={0.4} />
    <Block phi={45 * DEG} local={0.4} expression="scared" />
    <div style={{ position: "absolute", left: 1150, top: 150, width: 700 }}>
      <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Work done on a rough dome</div>
      <div style={{ fontSize: 40, color: COLORS.displacement, marginTop: 24 }}>From zero, step by step</div>
      <div style={{ fontSize: 32, color: COLORS.chalkDim, marginTop: 30 }}>JEE · Work, energy and power</div>
    </div>
  </AbsoluteFill>
);
