import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { RichText } from "../../components/RichText";
import { Tex } from "../../components/Tex";
import { Kan, KanExpression } from "../../mascot/Kan";
import { sig3 } from "../../physics/format";
import { forcesAt, totalWork, workUpTo } from "../../physics/hemisphere";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { CLAMP, Captions, Card, fade } from "../../video/ui";
import { EXAMPLE, MISTAKES } from "./model";
import { PlannedBeat, Voice, planHemisphere } from "./plan";
import { BEATS, BeatId, TITLE, fill, scriptValues } from "./script";
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
const CX = 760;
const GROUND = 820;
const RP = 300;
const KAN_R = 30;
const ROPE_R = RP + 6;
const PULLER_START = CX + RP + 70;
const FORCE_SCALE = 8; // px per newton, worked example values
const DEG = Math.PI / 180;

interface Ctx {
  beat: PlannedBeat;
  values: Record<string, string>;
}

/** Full-size (16:9) explainer for the rough-hemisphere work problem. */
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
            <BeatView ctx={{ beat, values }} />
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

const BeatView: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const script = BEATS.find((b) => b.id === ctx.beat.id)!;
  const Scene = SCENES[ctx.beat.id];
  return (
    <AbsoluteFill>
      <Scene ctx={ctx} local={local} />
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 28, color: COLORS.chalkDim }}>{TITLE.topic}</div>
      <Captions
        cues={script.lines.map((line, i) => ({ at: ctx.beat.lines[i].at, text: fill(line.text, ctx.values) }))}
        local={local}
        box={{ left: 140, right: 140, bottom: 30 }}
        fontSize={44}
      />
    </AbsoluteFill>
  );
};

/** Start time of line i in this beat (follows the voiceover when there is one). */
const at = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;

// ---------- the board ----------

const surface = (phi: number, r = RP) => ({ x: CX - r * Math.cos(phi), y: GROUND - r * Math.sin(phi) });
/** Kan's centre sits one body-radius off the surface; near the ground it rests on the ground line. */
const blockAt = (phi: number) => {
  const p = surface(phi, RP + KAN_R);
  return { x: p.x, y: Math.min(p.y, GROUND - KAN_R) };
};
/** Unit vectors at angle φ in screen coordinates (y down). */
const outward = (phi: number) => ({ x: -Math.cos(phi), y: -Math.sin(phi) });
const upSlope = (phi: number) => ({ x: Math.sin(phi), y: -Math.cos(phi) });

/** The block climbs at a constant angular rate between t0 and t1 (no easing on a physical object). */
function climb(local: number, t0: number, t1: number, from = 0, to = 90 * DEG): number {
  return interpolate(local, [t0, t1], [from, to], CLAMP);
}

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

/** Dome, ground, the rope over the top and the man pulling it. The rope keeps its length. */
const Board: React.FC<{ phi: number; local: number; pullerExpression?: KanExpression; showRope?: boolean }> = ({
  phi,
  local,
  pullerExpression = "excited",
  showRope = true,
}) => {
  const b = surface(phi, ROPE_R);
  const ropeEnd = surface(Math.PI, ROPE_R);
  const pullerX = PULLER_START + ROPE_R * phi; // every bit of arc the block climbs comes out on the man's side
  const hatch = Array.from({ length: 34 }, (_, i) => 80 + i * 52);
  return (
    <>
      <Svg>
        <path d={`M ${CX - RP} ${GROUND} A ${RP} ${RP} 0 0 1 ${CX + RP} ${GROUND} Z`} fill={COLORS.boardRaised} stroke={COLORS.chalk} strokeWidth={4} />
        <path d={`M ${CX - RP} ${GROUND} A ${RP} ${RP} 0 0 1 ${CX + RP} ${GROUND}`} fill="none" stroke={COLORS.chalkDim} strokeWidth={10} strokeDasharray="1 16" strokeLinecap="round" opacity={0.6} />
        <line x1={60} y1={GROUND} x2={W - 60} y2={GROUND} stroke={COLORS.chalk} strokeWidth={4} />
        {hatch.map((x) => (
          <line key={x} x1={x} y1={GROUND + 4} x2={x - 22} y2={GROUND + 26} stroke={COLORS.chalkDim} strokeWidth={2} opacity={0.5} />
        ))}
        {showRope && (
          <>
            <path
              d={`M ${b.x} ${b.y} A ${ROPE_R} ${ROPE_R} 0 0 1 ${ropeEnd.x} ${ropeEnd.y} L ${pullerX - 34} ${GROUND - 26}`}
              fill="none"
              stroke="#c9b48a"
              strokeWidth={4}
            />
          </>
        )}
      </Svg>
      {showRope && (
        <div style={{ position: "absolute", left: pullerX - 50, top: GROUND - 100 }}>
          <Kan radius={30} expression={pullerExpression} arms="out" look={{ x: -1, y: -0.2 }} time={local + 0.7} />
        </div>
      )}
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

const Force: React.FC<{ from: { x: number; y: number }; dir: { x: number; y: number }; newtons: number; label: string; opacity?: number; dashed?: boolean }> = ({
  from,
  dir,
  newtons,
  label,
  opacity = 1,
  dashed,
}) => {
  const len = newtons * FORCE_SCALE;
  return (
    <g opacity={opacity}>
      <Arrow x1={from.x} y1={from.y} x2={from.x + dir.x * len} y2={from.y + dir.y * len} color={COLORS.force} head="open-triangle" width={dashed ? 4 : 6} dashed={dashed} label={{ text: label }} fontSize={34} />
    </g>
  );
};

const AngleMark: React.FC<{ phi: number; opacity: number }> = ({ phi, opacity }) => {
  const r = 90;
  const end = surface(phi, r);
  const lab = surface(phi / 2, r + 36);
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

/** Stacked bar of the man's work so far: gravity part + friction part (worked example). */
const WorkBar: React.FC<{ phi: number; opacity: number; top?: number }> = ({ phi, opacity, top = 560 }) => {
  const w = workUpTo(EXAMPLE, phi);
  const full = totalWork(EXAMPLE);
  const width = 600;
  const left = 1200;
  return (
    <div style={{ position: "absolute", left, top, width, opacity }}>
      <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
        Work by the man so far: <span style={{ color: COLORS.displacement }}>{sig3(w.total)} J</span>
      </div>
      <div style={{ display: "flex", height: 34, background: COLORS.boardRaised, borderRadius: 8, overflow: "hidden", border: `2px solid ${COLORS.boardLine}` }}>
        <div style={{ width: (w.againstGravity / full) * width, background: COLORS.chalk }} />
        <div style={{ width: (w.againstFriction / full) * width, background: COLORS.kan }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginTop: 8 }}>
        <span>gravity {sig3(w.againstGravity)} J</span>
        <span style={{ color: COLORS.kan }}>friction {sig3(w.againstFriction)} J</span>
      </div>
      <div style={{ fontSize: 20, color: COLORS.chalkDim, marginTop: 6 }}>example: m = 2 kg, R = 1 m, μ = 0.5, g = 10 m/s²</div>
    </div>
  );
};

const RightCard: React.FC<{ opacity: number; top?: number; children: React.ReactNode; fontSize?: number }> = ({ opacity, top = 110, children, fontSize = 38 }) => (
  <Card opacity={opacity} fontSize={fontSize} style={{ left: 1160, top, width: 720, textAlign: "left", fontWeight: 400 }}>
    {children}
  </Card>
);

// ---------- beats ----------

type SceneProps = { ctx: Ctx; local: number };

const Hook: React.FC<SceneProps> = ({ ctx, local }) => {
  const phi = climb(local, 3, ctx.beat.seconds - 2);
  return (
    <>
      <Board phi={phi} local={local} />
      <Block phi={phi} local={local} expression={phi < 0.05 ? "calm" : phi < 1.5 ? "scared" : "dizzy"} />
      <div style={{ position: "absolute", left: 1240, top: 120, width: 620, opacity: fade(local, 0.3, 0.6) }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{TITLE.title}</div>
        <div style={{ fontSize: 36, color: COLORS.displacement, marginTop: 16 }}>{TITLE.subtitle}</div>
      </div>
    </>
  );
};

const Setup: React.FC<SceneProps> = ({ ctx, local }) => {
  const phi = 35 * DEG;
  const top = surface(90 * DEG);
  return (
    <>
      <Board phi={phi} local={local} pullerExpression="calm" />
      <Svg>
        <g opacity={fade(local, at(ctx, 0) + 0.5, 0.5)}>
          <Arrow x1={CX} y1={GROUND} x2={CX + RP * Math.cos(30 * DEG)} y2={GROUND - RP * Math.sin(30 * DEG)} color={COLORS.displacement} head="bars" width={4} />
          <Text x={CX + 150} y={GROUND - 110} color={COLORS.displacement}>
            R
          </Text>
          <Text x={top.x} y={top.y - 40} color={COLORS.chalkDim} size={28}>
            rough surface, μ
          </Text>
        </g>
        <AngleMark phi={phi} opacity={fade(local, at(ctx, 3), 0.6)} />
      </Svg>
      <Block phi={phi} local={local} />
      <RightCard opacity={fade(local, at(ctx, 1), 0.5)}>
        <div style={{ lineHeight: 1.7 }}>
          <div>· string along the surface, sliding freely</div>
          <div style={{ opacity: fade(local, at(ctx, 2), 0.5) }}>· slowly: no speeding up, forces balance</div>
          <div style={{ opacity: fade(local, at(ctx, 3), 0.5) }}>
            · <Tex tex="\varphi = 0" /> on the ground, <Tex tex="90^\circ" /> at the top
          </div>
        </div>
      </RightCard>
    </>
  );
};

const FBD_PHI = 40 * DEG;

const Fbd: React.FC<SceneProps> = ({ ctx, local }) => {
  const phi = FBD_PHI;
  const f = forcesAt(EXAMPLE, phi);
  const p = blockAt(phi);
  const down = { x: 0, y: 1 };
  const out = outward(phi);
  const up = upSlope(phi);
  const backDown = { x: -up.x, y: -up.y };
  const inward = { x: -out.x, y: -out.y };
  const comps = fade(local, at(ctx, 5) - 0.2, 0.6);
  return (
    <>
      <Board phi={phi} local={local} pullerExpression="calm" />
      <Svg>
        <AngleMark phi={phi} opacity={0.8} />
        <Force from={p} dir={down} newtons={EXAMPLE.m * EXAMPLE.g} label="mg" opacity={fade(local, at(ctx, 1), 0.4)} />
        <Force from={p} dir={out} newtons={f.normal} label="N" opacity={fade(local, at(ctx, 2), 0.4)} />
        <Force from={p} dir={backDown} newtons={f.friction} label="f" opacity={fade(local, at(ctx, 3), 0.4)} />
        <Force from={p} dir={up} newtons={f.tension} label="T" opacity={fade(local, at(ctx, 4), 0.4)} />
        <g opacity={comps * 0.9}>
          <Force from={p} dir={inward} newtons={EXAMPLE.m * EXAMPLE.g * Math.sin(phi)} label="" dashed />
          <Force from={p} dir={backDown} newtons={EXAMPLE.m * EXAMPLE.g * Math.cos(phi)} label="" dashed />
        </g>
      </Svg>
      <Block phi={phi} local={local} expression="calm" />
      <RightCard opacity={fade(local, at(ctx, 5), 0.5)} fontSize={40}>
        <div style={{ lineHeight: 2 }}>
          <div>
            <Tex tex="N = mg\sin\varphi" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 6), 0.5) }}>
            <Tex tex="f = \mu N = \mu mg\sin\varphi" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 6), 0.5) }}>
            <Tex tex={`T = mg\\cos\\varphi + \\mu mg\\sin\\varphi`} />
          </div>
        </div>
        <div style={{ fontSize: 22, color: COLORS.chalkDim, marginTop: 8 }}>arrows drawn to scale for m = 2 kg, μ = 0.5, φ = 40°</div>
      </RightCard>
    </>
  );
};

const Integral: React.FC<SceneProps> = ({ ctx, local }) => {
  const phi = climb(local, 2, ctx.beat.seconds - 3);
  return (
    <>
      <Board phi={phi} local={local} />
      <Svg>
        <AngleMark phi={phi} opacity={0.6} />
      </Svg>
      <Block phi={phi} local={local} expression="excited" />
      <RightCard opacity={fade(local, at(ctx, 1), 0.5)} fontSize={30} top={90}>
        <div style={{ lineHeight: 2.2 }}>
          <div>
            <Tex tex="dW = T\,ds = T\,R\,d\varphi" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 2), 0.5) }}>
            <Tex tex="W = \int_0^{\pi/2}(mg\cos\varphi + \mu mg\sin\varphi)\,R\,d\varphi" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 3), 0.5) }}>
            <Tex tex="= mgR\,\big[\sin\varphi\big]_0^{\pi/2} + \mu mgR\,\big[-\cos\varphi\big]_0^{\pi/2}" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 4), 0.5), fontSize: 42 }}>
            <Tex tex={`= \\textcolor{${COLORS.displacement}}{mgR(1+\\mu)}`} />
          </div>
        </div>
      </RightCard>
      <WorkBar phi={phi} opacity={fade(local, 1.5, 0.5)} top={500} />
    </>
  );
};

const Insight: React.FC<SceneProps> = ({ ctx, local }) => {
  const phi = climb(local, at(ctx, 2), at(ctx, 4) + 4);
  const p = surface(phi);
  const heightOn = fade(local, at(ctx, 1), 0.5);
  const horizOn = fade(local, at(ctx, 2), 0.5);
  return (
    <>
      <Board phi={phi} local={local} />
      <Svg>
        <g opacity={heightOn}>
          <Arrow x1={CX - RP - 70} y1={GROUND} x2={CX - RP - 70} y2={GROUND - RP} color={COLORS.displacement} head="bars" width={4} />
          <Text x={CX - RP - 110} y={GROUND - RP / 2} color={COLORS.displacement} anchor="end">
            height R
          </Text>
        </g>
        <g opacity={horizOn}>
          <Arrow x1={CX - RP} y1={GROUND + 40} x2={Math.max(CX - RP + 2, p.x)} y2={GROUND + 40} color={COLORS.kan} head="bars" width={5} />
          <Text x={CX + RP + 30} y={GROUND + 42} color={COLORS.kan} anchor="start" size={28}>
            horizontal: {sig3((p.x - (CX - RP)) / RP)} R
          </Text>
        </g>
      </Svg>
      <Block phi={phi} local={local} expression="excited" />
      <RightCard opacity={fade(local, at(ctx, 3), 0.5)} fontSize={34}>
        <div style={{ lineHeight: 2 }}>
          <div>
            <Tex tex="dx = ds\,\sin\varphi" />
          </div>
          <div>
            <Tex tex="f\,ds = \mu mg\sin\varphi\,ds = \mu mg\,dx" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 4), 0.5) }}>
            <Tex tex={`W_\\text{friction} = \\mu mg \\times \\textcolor{${COLORS.kan}}{\\text{horizontal distance}}`} />
          </div>
        </div>
      </RightCard>
    </>
  );
};

const Traps: React.FC<SceneProps> = ({ ctx, local }) => {
  const right = totalWork(EXAMPLE);
  const rows = [
    { label: "Correct: mgR(1 + μ)", value: right, color: COLORS.displacement, at: 0 },
    { label: MISTAKES[0].en, value: MISTAKES[0].value(EXAMPLE), color: COLORS.chalkDim, at: at(ctx, 1) },
    { label: MISTAKES[1].en, value: MISTAKES[1].value(EXAMPLE), color: COLORS.chalkDim, at: at(ctx, 2) },
  ];
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <>
      <div style={{ position: "absolute", left: 140, top: 140, fontSize: 60, fontWeight: 700 }}>The traps</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{ position: "absolute", left: 140, top: 270 + i * 160, width: 1640, opacity: fade(local, r.at, 0.5) }}>
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
      <div style={{ position: "absolute", left: 140, top: 760, fontSize: 24, color: COLORS.chalkDim }}>
        values for m = 2 kg, R = 1 m, μ = 0.5, g = 10 m/s²
      </div>
    </>
  );
};

const Example: React.FC<SceneProps> = ({ ctx, local }) => {
  const sim = simulateDrag(EXAMPLE);
  return (
    <>
      <Board phi={90 * DEG} local={local} pullerExpression="proud" />
      <Block phi={90 * DEG} local={local} expression="proud" />
      <RightCard opacity={fade(local, at(ctx, 0), 0.5)} fontSize={32} top={80}>
        <div style={{ lineHeight: 1.9 }}>
          <div>
            <Tex tex="m = 2\text{ kg},\quad R = 1\text{ m}" />
          </div>
          <div>
            <Tex tex="\mu = 0.5,\quad g = 10\text{ m/s}^2" />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 1), 0.5) }}>
            <Tex tex={`mgR = ${ctx.values.wg}\\text{ J}`} />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 1), 0.5) }}>
            <Tex tex={`\\mu mgR = ${ctx.values.wf}\\text{ J}`} />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 2), 0.5), fontSize: 44 }}>
            <Tex tex={`W = \\textcolor{${COLORS.displacement}}{${ctx.values.w}\\text{ J}}`} />
          </div>
          <div style={{ opacity: fade(local, at(ctx, 3), 0.5), fontSize: 28, color: COLORS.kan }}>
            Step-by-step simulation: {sig3(sim.byMan)} J (gravity {sig3(-sim.byGravity)} J + friction {sig3(-sim.byFriction)} J)
          </div>
        </div>
      </RightCard>
      <WorkBar phi={90 * DEG} opacity={fade(local, at(ctx, 1), 0.5)} top={605} />
    </>
  );
};

const Cta: React.FC<SceneProps> = ({ ctx, local }) => (
  <>
    <Board phi={90 * DEG} local={local} pullerExpression="proud" />
    <Block phi={90 * DEG} local={local} expression="proud" />
    <RightCard opacity={fade(local, at(ctx, 0), 0.5)} fontSize={56} top={140}>
      <div style={{ textAlign: "center" }}>
        <Tex tex={`W = \\textcolor{${COLORS.displacement}}{mgR(1 + \\mu)}`} />
      </div>
      <div style={{ fontSize: 30, marginTop: 18, opacity: fade(local, at(ctx, 1), 0.5) }}>
        <RichText text="gravity: weight × height · friction: $\mu mg$ × horizontal distance" />
      </div>
    </RightCard>
    <RightCard opacity={fade(local, at(ctx, 2), 0.5)} fontSize={34} top={470}>
      Comment: smooth dome, does R still matter?
    </RightCard>
  </>
);

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  hook: Hook,
  setup: Setup,
  fbd: Fbd,
  integral: Integral,
  insight: Insight,
  traps: Traps,
  example: Example,
  cta: Cta,
};

export const HemisphereCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
    <Board phi={45 * DEG} local={0.4} />
    <Block phi={45 * DEG} local={0.4} expression="scared" />
    <div style={{ position: "absolute", left: 1220, top: 150, width: 640 }}>
      <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>Work done on a rough dome</div>
      <div style={{ fontSize: 60, marginTop: 30 }}>
        <Tex tex={`W = \\textcolor{${COLORS.displacement}}{mgR(1+\\mu)}`} />
      </div>
      <div style={{ fontSize: 32, color: COLORS.chalkDim, marginTop: 30 }}>JEE · Work, energy and power</div>
    </div>
  </AbsoluteFill>
);
