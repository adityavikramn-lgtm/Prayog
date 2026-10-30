import { Audio } from "@remotion/media";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { Tex } from "../../components/Tex";
import { Kan } from "../../mascot/Kan";
import { sceneFont } from "../../sceneFont";
import { COLORS, SURFACE } from "../../theme";
import { Backdrop, CLAMP, Captions, ChapterTitle, Progress, PunchIn, fade } from "../../video/ui";
import { BAG, BRICK, BRICK_FACES, KNIFE, PRACTICE, pa } from "./model";
import { BEATS, BeatId, PlannedBeat, Voice, fill, planPressure, scriptValues } from "./script";

export const PressureExplainerProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(z.string(), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type PressureExplainerProps = z.infer<typeof PressureExplainerProps>;

export const PRESSURE_FPS = 30;
export const pressureMetadata: CalculateMetadataFunction<PressureExplainerProps> = ({ props }) => ({
  durationInFrames: Math.round(planPressure(props.voice as Voice).seconds * PRESSURE_FPS),
});

// Colours: force keeps its project colour; area and pressure get their own, always labelled.
const FORCE = COLORS.force;
const AREA = COLORS.kan;
const PRESSURE = "#b79bff";
const BRICK_FILL = "#b4583f";
const CAPTION_BOX = { left: 160, right: 160, bottom: 36 };
const PX_PER_CM = 14; // brick drawings are to scale
const ARROW_PX = 120; // the same 20 N arrow everywhere in the brick scene

interface Ctx {
  beat: PlannedBeat;
  values: Record<string, string>;
  local: number;
}
const at = (ctx: Ctx, i: number) => ctx.beat.lines[Math.min(i, ctx.beat.lines.length - 1)].at;
const show = (ctx: Ctx, i: number) => fade(ctx.local, at(ctx, i), 0.4);

/** Class 8: pressure = force ÷ area. Every size, ratio and number comes from model.ts. */
export const PressureExplainer: React.FC<PressureExplainerProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = useMemo(() => planPressure(voice as Voice), [voice]);
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
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 26, color: COLORS.chalkDim }}>Science · Class 8 · Force and pressure</div>
      <PunchIn local={local}>
        <Scene ctx={ctx} />
      </PunchIn>
      <ChapterTitle local={local} index={index} label={script.chapter} />
      <Captions
        cues={script.lines.map((l, i) => ({ at: beat.lines[i].at, dur: beat.lines[i].seconds, text: fill(l.text, values) }))}
        local={local}
        box={CAPTION_BOX}
        fontSize={44}
      />
    </AbsoluteFill>
  );
};

// ---------- small building blocks ----------

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const Label: React.FC<{ x: number; y: number; color?: string; size?: number; opacity?: number; children: React.ReactNode }> = ({
  x,
  y,
  color = COLORS.chalk,
  size = 34,
  opacity = 1,
  children,
}) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor="middle" opacity={opacity} fontFamily={sceneFont}>
    {children}
  </text>
);

/** A horizontal pressure bar: length is proportional to the pressure (same scale within a scene). */
const PressureBar: React.FC<{ x: number; y: number; value: number; max: number; width: number; opacity: number; grow: number }> = ({
  x,
  y,
  value,
  max,
  width,
  opacity,
  grow,
}) => (
  <g opacity={opacity}>
    <rect x={x} y={y} width={width} height={34} rx={17} fill="rgba(255,255,255,0.07)" />
    <rect x={x} y={y} width={Math.max(34, (value / max) * width * grow)} height={34} rx={17} fill={PRESSURE} />
    <text x={x + width + 20} y={y + 27} fill={PRESSURE} fontSize={32} fontWeight={800} fontFamily={sceneFont}>
      P = {pa(value)} Pa
    </text>
  </g>
);

const Panel: React.FC<{ style: React.CSSProperties; opacity: number; children: React.ReactNode; color?: string }> = ({
  style,
  opacity,
  children,
  color = COLORS.boardLine,
}) => (
  <div
    style={{
      position: "absolute",
      background: SURFACE,
      border: `3px solid ${color}`,
      borderRadius: 26,
      padding: "26px 36px",
      boxShadow: `0 0 36px ${color}33, 0 12px 40px rgba(0,0,0,0.45)`,
      opacity,
      scale: String(0.92 + 0.08 * opacity),
      ...style,
    }}
  >
    {children}
  </div>
);

type SceneProps = { ctx: Ctx };

// ---------- scenes ----------

const Apple: React.FC<{ cx: number; cy: number; split: number; squash: number }> = ({ cx, cy, split, squash }) => (
  <g>
    {[-1, 1].map((side) => (
      <g key={side} transform={`translate(${side * split * 40}, 0)`}>
        <clipPath id={`half${side}${cx}`}>
          <rect x={side < 0 ? cx - 120 : cx} y={cy - 120} width={120} height={240} />
        </clipPath>
        <ellipse cx={cx} cy={cy + (1 - squash) * 70} rx={95 * (2 - squash)} ry={90 * squash} fill="#e5484d" clipPath={`url(#half${side}${cx})`} />
      </g>
    ))}
    <path d={`M ${cx} ${cy - 88 * squash} q 8 -30 30 -36`} stroke="#5aa651" strokeWidth={8} fill="none" />
  </g>
);

/** A knife seen from the side, edge down. `edge` = how wide the edge is drawn (px). */
const Knife: React.FC<{ cx: number; tipY: number; edge: number }> = ({ cx, tipY, edge }) => (
  <g>
    <rect x={cx - 24} y={tipY - 330} width={48} height={110} rx={12} fill="#7a4a2c" />
    <path d={`M ${cx - 34} ${tipY - 220} L ${cx + 34} ${tipY - 220} L ${cx + edge / 2} ${tipY} L ${cx - edge / 2} ${tipY} Z`} fill="#cfd6e6" />
  </g>
);

const Hook: React.FC<SceneProps> = ({ ctx }) => {
  const { local } = ctx;
  const t0 = at(ctx, 0);
  const t1 = at(ctx, 1);
  // Both knives move down at a steady speed (no easing): the sharp one goes through, the blunt one stops on the skin.
  const sharpTip = interpolate(local, [t0 + 0.3, t0 + 2.3], [300, 650], CLAMP);
  const bluntTip = interpolate(local, [t1 + 0.3, t1 + 1.3], [300, 470], CLAMP);
  const split = interpolate(sharpTip, [560, 650], [0, 1], CLAMP);
  const squash = interpolate(local, [t1 + 1.3, t1 + 1.8], [1, 0.82], CLAMP);
  return (
    <>
      <Svg>
        <g opacity={show(ctx, 0)}>
          <Apple cx={620} cy={560} split={split} squash={1} />
          <Knife cx={620} tipY={sharpTip} edge={4} />
          <Label x={620} y={760} color={COLORS.kan}>Sharp knife</Label>
        </g>
        <g opacity={show(ctx, 1)}>
          <Apple cx={1300} cy={560} split={0} squash={squash} />
          <Knife cx={1300} tipY={bluntTip} edge={40} />
          <Label x={1300} y={760} color={COLORS.chalkDim}>Blunt knife</Label>
        </g>
      </Svg>
      <div style={{ position: "absolute", left: 1560, top: 300, opacity: show(ctx, 2) }}>
        <Kan radius={70} expression="dizzy" arms="up" look={{ x: -1, y: 0 }} time={local} />
      </div>
      <div style={{ position: "absolute", left: 1600, top: 160, fontSize: 140, fontWeight: 800, color: COLORS.displacement, opacity: show(ctx, 2) }}>?</div>
    </>
  );
};

/** One brick, drawn to scale from the side, plus its footprint (contact area) drawn to scale below the ground. */
const BrickOnGround: React.FC<{ cx: number; ground: number; wCm: number; hCm: number; footA: number; footB: number; opacity: number; footOpacity: number; label: string }> = ({
  cx,
  ground,
  wCm,
  hCm,
  footA,
  footB,
  opacity,
  footOpacity,
  label,
}) => {
  const w = wCm * PX_PER_CM;
  const h = hCm * PX_PER_CM;
  const top = ground - h;
  return (
    <g>
      <g opacity={opacity}>
        <rect x={cx - w / 2} y={top} width={w} height={h} rx={6} fill={BRICK_FILL} stroke="#e08b6f" strokeWidth={3} />
        <rect x={cx - w / 2} y={ground - 6} width={w} height={6} fill={AREA} />
        <Arrow x1={cx} y1={top - 30 - ARROW_PX} x2={cx} y2={top - 30} color={FORCE} head="open-triangle" width={6} label={{ text: "W" }} labelAt="middle" labelOffset={{ x: 34, y: 0 }} />
        <Label x={cx - 120} y={top - 30 - ARROW_PX / 2 + 12} color={FORCE} size={30}>
          {BRICK.weightN} N
        </Label>
      </g>
      <g opacity={footOpacity}>
        <rect x={cx - (footA * PX_PER_CM) / 2} y={ground + 40} width={footA * PX_PER_CM} height={footB * PX_PER_CM} fill={`${AREA}33`} stroke={AREA} strokeWidth={3} strokeDasharray="10 6" />
        <Label x={cx} y={ground + 40 + footB * PX_PER_CM + 44} color={AREA} size={32}>
          {label}: {footA} × {footB} = {footA * footB} cm²
        </Label>
      </g>
    </g>
  );
};

const BrickScene: React.FC<SceneProps> = ({ ctx }) => {
  const [flat, end] = BRICK_FACES;
  const ground = 520;
  const barShow = show(ctx, 3);
  const grow = interpolate(ctx.local, [at(ctx, 3), at(ctx, 3) + 0.8], [0, 1], CLAMP);
  return (
    <Svg>
      <line x1={120} x2={1800} y1={ground} y2={ground} stroke={COLORS.chalkDim} strokeWidth={4} />
      <BrickOnGround cx={560} ground={ground} wCm={flat.aCm} hCm={BRICK.heightCm} footA={flat.aCm} footB={flat.bCm} opacity={show(ctx, 0)} footOpacity={show(ctx, 1)} label="Flat" />
      <BrickOnGround cx={1320} ground={ground} wCm={end.aCm} hCm={BRICK.lengthCm} footA={end.aCm} footB={end.bCm} opacity={show(ctx, 2)} footOpacity={show(ctx, 2)} label="Standing up" />
      <PressureBar x={300} y={860} value={flat.pressurePa} max={end.pressurePa} width={300} opacity={barShow} grow={grow} />
      <PressureBar x={1060} y={860} value={end.pressurePa} max={end.pressurePa} width={300} opacity={barShow} grow={grow} />
    </Svg>
  );
};

const Formula: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontSize: 150, opacity: show(ctx, 2), scale: String(0.9 + 0.1 * show(ctx, 2)) }}>
      <Tex tex={`\\textcolor{${PRESSURE}}{P} = \\dfrac{\\textcolor{${FORCE}}{F}}{\\textcolor{${AREA}}{A}}`} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontSize: 90, fontWeight: 800, color: PRESSURE, opacity: show(ctx, 0) * (1 - show(ctx, 2)) }}>
      pressure
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", gap: 50, fontSize: 40, fontWeight: 700, opacity: show(ctx, 1) }}>
      <span style={{ color: FORCE }}>F = how hard you push (N)</span>
      <span style={{ color: AREA }}>A = surface it touches (m²)</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 730, textAlign: "center", fontSize: 44, fontWeight: 800, color: PRESSURE, opacity: show(ctx, 3) }}>
      1 pascal (Pa) = 1 N on 1 m²
    </div>
  </>
);

const Numbers: React.FC<SceneProps> = ({ ctx }) => {
  const [flat, end] = BRICK_FACES;
  const v = ctx.values;
  const row = (i: number, label: string, cm2: number, m2: string, p: string, color: string) => (
    <Panel style={{ left: 260, right: 260, top: 230 + i * 300 }} opacity={show(ctx, i)} color={color}>
      <div style={{ fontSize: 32, color: COLORS.chalkDim, marginBottom: 6 }}>
        {label}: {cm2} cm² = {m2} m²
      </div>
      <div style={{ fontSize: 64 }}>
        <Tex tex={`P = \\dfrac{\\textcolor{${FORCE}}{${v.weight}\\,\\text{N}}}{\\textcolor{${AREA}}{${m2}\\,\\text{m}^2}} = \\textcolor{${PRESSURE}}{${p}\\,\\text{Pa}}`} />
      </div>
    </Panel>
  );
  return (
    <>
      {row(0, "Lying flat", flat.areaCm2, v.flatM2, v.flatPa, AREA)}
      {row(1, "Standing up", end.areaCm2, v.endM2, v.endPa, PRESSURE)}
      <div style={{ position: "absolute", right: 300, top: 760, fontSize: 56, fontWeight: 800, color: COLORS.displacement, opacity: show(ctx, 1) }}>× {v.ratio}</div>
    </>
  );
};

const KnifeScene: React.FC<SceneProps> = ({ ctx }) => {
  const [sharp, blunt] = KNIFE.edges;
  const PX_PER_MM = 60; // zoomed in: 0.1 mm = 6 px, 1 mm = 60 px (true 1 : 10)
  const surface = 620;
  const grow1 = interpolate(ctx.local, [at(ctx, 1), at(ctx, 1) + 0.8], [0, 1], CLAMP);
  const grow2 = interpolate(ctx.local, [at(ctx, 2), at(ctx, 2) + 0.8], [0, 1], CLAMP);
  const edge = (cx: number, widthMm: number, label: string, o: number) => (
    <g opacity={o}>
      <Knife cx={cx} tipY={surface} edge={widthMm * PX_PER_MM} />
      <Arrow x1={cx + 120} y1={surface - 330} x2={cx + 120} y2={surface - 330 + 120} color={FORCE} head="open-triangle" width={6} />
      <Label x={cx + 200} y={surface - 260} color={FORCE} size={30}>
        {KNIFE.pushN} N
      </Label>
      <rect x={cx - (widthMm * PX_PER_MM) / 2} y={surface} width={Math.max(3, widthMm * PX_PER_MM)} height={8} fill={AREA} />
      <Label x={cx} y={surface + 60} color={AREA} size={30}>
        {label}: {widthMm} mm wide
      </Label>
    </g>
  );
  return (
    <Svg>
      <rect x={200} y={surface} width={1520} height={30} fill="#e5484d" opacity={0.5 * show(ctx, 0)} />
      <Label x={960} y={surface + 140} color={COLORS.chalkDim} size={26} opacity={show(ctx, 0)}>
        zoomed in, edge widths to scale · edge length {KNIFE.lengthCm} cm
      </Label>
      {edge(560, sharp.widthMm, "Sharp", show(ctx, 0))}
      {edge(1360, blunt.widthMm, "Blunt", show(ctx, 2))}
      <PressureBar x={300} y={830} value={sharp.pressurePa} max={sharp.pressurePa} width={260} opacity={show(ctx, 1)} grow={grow1} />
      <PressureBar x={1100} y={830} value={blunt.pressurePa} max={sharp.pressurePa} width={260} opacity={show(ctx, 2)} grow={grow2} />
    </Svg>
  );
};

/** A student seen from behind, wearing the bag; the straps run over the shoulders. Strap width to scale. */
const Student: React.FC<{ cx: number; strapCm: number; opacity: number }> = ({ cx, strapCm, opacity }) => {
  const s = strapCm * 9; // px per cm for the straps
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={290} r={56} fill="#3a2a22" />
      <path d={`M ${cx - 160} 600 Q ${cx - 160} 390 ${cx - 60} 375 L ${cx + 60} 375 Q ${cx + 160} 390 ${cx + 160} 600 Z`} fill="#3b6fd8" />
      <rect x={cx - 120} y={430} width={240} height={190} rx={30} fill="#d9822b" stroke="#f0a55a" strokeWidth={4} />
      <rect x={cx - 70} y={530} width={140} height={60} rx={14} fill="#c06f1f" />
      {[-1, 1].map((side) => (
        <rect key={side} x={cx + side * 80 - s / 2} y={370} width={s} height={66} rx={4} fill="#20263f" stroke={AREA} strokeWidth={3} />
      ))}
    </g>
  );
};

const BagScene: React.FC<SceneProps> = ({ ctx }) => {
  const [thin, wide] = BAG.straps;
  const max = thin.pressurePa;
  const grow1 = interpolate(ctx.local, [at(ctx, 1), at(ctx, 1) + 0.8], [0, 1], CLAMP);
  const grow2 = interpolate(ctx.local, [at(ctx, 2), at(ctx, 2) + 0.8], [0, 1], CLAMP);
  return (
    <Svg>
      <Student cx={600} strapCm={thin.widthCm} opacity={show(ctx, 0)} />
      <Student cx={1320} strapCm={wide.widthCm} opacity={show(ctx, 0)} />
      <Label x={600} y={680} color={AREA} size={32} opacity={show(ctx, 1)}>
        {thin.label}: {thin.widthCm} cm
      </Label>
      <Label x={1320} y={680} color={AREA} size={32} opacity={show(ctx, 2)}>
        {wide.label}: {wide.widthCm} cm
      </Label>
      <g opacity={show(ctx, 1)}>
        <Arrow x1={960} y1={420} x2={960} y2={570} color={FORCE} head="open-triangle" width={6} />
        <Label x={960} y={390} color={FORCE} size={32}>
          bag {BAG.weightN} N
        </Label>
      </g>
      <PressureBar x={330} y={730} value={thin.pressurePa} max={max} width={300} opacity={show(ctx, 1)} grow={grow1} />
      <PressureBar x={1050} y={730} value={wide.pressurePa} max={max} width={300} opacity={show(ctx, 2)} grow={grow2} />
      <Label x={960} y={850} color={COLORS.chalkDim} size={26} opacity={show(ctx, 1)}>
        each strap touches the shoulder over {BAG.contactCm} cm
      </Label>
    </Svg>
  );
};

const Try: React.FC<SceneProps> = ({ ctx }) => {
  const v = ctx.values;
  const qEnd = at(ctx, 0) + ctx.beat.lines[0].seconds;
  const count = Math.ceil(interpolate(ctx.local, [qEnd, at(ctx, 1)], [3, 0], CLAMP));
  return (
    <>
      <Panel style={{ left: 360, right: 360, top: 220, textAlign: "center" }} opacity={show(ctx, 0)} color={COLORS.displacement}>
        <div style={{ fontSize: 36, color: COLORS.displacement, fontWeight: 800, letterSpacing: 2 }}>PAUSE AND TRY</div>
        <div style={{ fontSize: 60, marginTop: 14 }}>
          <Tex tex={`\\textcolor{${FORCE}}{F = ${v.practiceN}\\,\\text{N}},\\quad \\textcolor{${AREA}}{A = ${v.practiceM2}\\,\\text{m}^2},\\quad \\textcolor{${PRESSURE}}{P = ?}`} />
        </div>
      </Panel>
      {ctx.local >= qEnd && ctx.local < at(ctx, 1) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontSize: 160, fontWeight: 800, color: COLORS.kan }}>{count}</div>
      )}
      <Panel style={{ left: 460, right: 460, top: 520, textAlign: "center" }} opacity={show(ctx, 1)} color={COLORS.kan}>
        <div style={{ fontSize: 60 }}>
          <Tex tex={`P = \\dfrac{${v.practiceN}}{${v.practiceM2}} = \\textcolor{${PRESSURE}}{${pa(PRACTICE.answerPa)}\\,\\text{Pa}}\\ \\textcolor{${COLORS.kan}}{\\checkmark}`} />
        </div>
      </Panel>
    </>
  );
};

const Recap: React.FC<SceneProps> = ({ ctx }) => (
  <>
    <Panel style={{ left: 200, width: 700, top: 250, textAlign: "center" }} opacity={show(ctx, 0)} color={PRESSURE}>
      <div style={{ fontSize: 46, fontWeight: 800 }}>
        Small <span style={{ color: AREA }}>area</span>
      </div>
      <div style={{ fontSize: 60, fontWeight: 800, color: PRESSURE }}>BIG pressure</div>
      <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 8 }}>knives, nails, needles</div>
    </Panel>
    <Panel style={{ right: 200, width: 700, top: 250, textAlign: "center" }} opacity={show(ctx, 0)} color={AREA}>
      <div style={{ fontSize: 46, fontWeight: 800 }}>
        Big <span style={{ color: AREA }}>area</span>
      </div>
      <div style={{ fontSize: 60, fontWeight: 800, color: PRESSURE }}>small pressure</div>
      <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 8 }}>bag straps, camel feet, tractor tyres</div>
    </Panel>
    <div style={{ position: "absolute", left: 0, right: 0, top: 600, textAlign: "center", fontSize: 110, opacity: show(ctx, 1) }}>
      <Tex tex={`\\textcolor{${PRESSURE}}{P} = \\dfrac{\\textcolor{${FORCE}}{F}}{\\textcolor{${AREA}}{A}}`} />
    </div>
  </>
);

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  hook: Hook,
  brick: BrickScene,
  formula: Formula,
  numbers: Numbers,
  knife: KnifeScene,
  bag: BagScene,
  try: Try,
  recap: Recap,
};

export const PressureCover: React.FC = () => {
  const [flat, end] = BRICK_FACES;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 110, top: 220, width: 900 }}>
        <div style={{ fontSize: 34, letterSpacing: 3, color: COLORS.kan, fontWeight: 800 }}>CLASS 8 SCIENCE</div>
        <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1.02, marginTop: 14 }}>Why does a sharp knife cut?</div>
        <div style={{ fontSize: 64, marginTop: 30 }}>
          <Tex tex={`\\textcolor{${PRESSURE}}{P} = \\dfrac{\\textcolor{${FORCE}}{F}}{\\textcolor{${AREA}}{A}}`} />
        </div>
      </div>
      <Svg>
        <line x1={1080} x2={1820} y1={760} y2={760} stroke={COLORS.chalkDim} strokeWidth={4} />
        <rect x={1180} y={760 - BRICK.heightCm * PX_PER_CM} width={flat.aCm * PX_PER_CM} height={BRICK.heightCm * PX_PER_CM} rx={6} fill={BRICK_FILL} />
        <rect x={1580} y={760 - BRICK.lengthCm * PX_PER_CM} width={end.aCm * PX_PER_CM} height={BRICK.lengthCm * PX_PER_CM} rx={6} fill={BRICK_FILL} />
        <Label x={1320} y={830} color={PRESSURE}>{pa(flat.pressurePa)} Pa</Label>
        <Label x={1650} y={830} color={PRESSURE}>{pa(end.pressurePa)} Pa</Label>
      </Svg>
      <div style={{ position: "absolute", left: 110, top: 900, fontSize: 32, color: COLORS.chalkDim, letterSpacing: 2 }}>ADITHYA VIKRAM</div>
    </AbsoluteFill>
  );
};
