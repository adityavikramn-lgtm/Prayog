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
import { KanExpression } from "../../mascot/Kan";
import { poseFromPhysics } from "../../mascot/pose";
import { sig3 } from "../../physics/format";
import { stateAt } from "../../physics/projectile";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { gLabelFor, solve } from "./model";
import {
  AngleArc,
  ApexMarker,
  Ground,
  Hud,
  KanAt,
  Label,
  LandingMark,
  RangeFormula,
  RangeMarker,
  StrobeDots,
  SvgLayer,
  SweepWorld,
  Trajectory,
  Vectors,
  tc,
} from "./parts";
import {
  BeatId,
  CARDS,
  EXACT_RANGE_TEX,
  Format,
  Lang,
  PAIR,
  SCRIPT,
  Text,
  VIDEO_PARAMS,
  fill,
  scriptValues,
} from "./script";
import { sweepAt } from "./timeline";
import { BOXES } from "./videoLayout";
import { PlannedBeat, Voice, cueSeconds, planBeats } from "./videoPlan";
import { LANDSCAPE, Layout, PORTRAIT, SHORTS_SAFE, World, makeWorld } from "./world";

const BEAT_IDS = ["hook", "concept", "demo", "sweep", "predict", "reveal", "cta"] as const satisfies readonly BeatId[];

export const ProjectileVideoProps = z.object({
  format: z.enum(["short", "explainer"]),
  lang: z.enum(["en", "hi"]),
  showSafeZones: z.boolean(),
  voice: z.partialRecord(z.enum(BEAT_IDS), z.object({ src: z.string(), seconds: z.number().positive() })),
});
export type ProjectileVideoProps = z.infer<typeof ProjectileVideoProps>;

export const VIDEO_FPS = 30;

export const videoMetadata: CalculateMetadataFunction<ProjectileVideoProps> = ({ props }) => ({
  durationInFrames: Math.round(planBeats(props.format, props.voice as Voice).seconds * VIDEO_FPS),
});

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fade = (t: number, start: number, length = 0.25) =>
  interpolate(t, [start, start + length], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

interface Ctx {
  format: Format;
  lang: Lang;
  layout: Layout;
  world: World;
  values: Record<string, string>;
  beat: PlannedBeat;
}

/** The Short (9:16) and the explainer (16:9): one set of beats, two layouts. */
export const ProjectileVideo: React.FC<ProjectileVideoProps> = ({ format, lang, showSafeZones, voice }) => {
  const { fps } = useVideoConfig();
  const layout = format === "short" ? PORTRAIT : LANDSCAPE;
  const plan = useMemo(() => planBeats(format, voice as Voice), [format, voice]);
  const world = useMemo(
    () => makeWorld(VIDEO_PARAMS, format === "explainer" ? [...PAIR, 15, 45, 75] : [...PAIR], layout),
    [format, layout],
  );
  const values = useMemo(() => scriptValues(), []);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      {plan.beats.map((beat) => {
        const from = Math.round(beat.from * fps);
        const to = Math.round((beat.from + beat.seconds) * fps);
        const clip = voice[beat.id];
        const ctx: Ctx = { format, lang, layout, world, values, beat };
        return (
          <Sequence key={beat.id} name={beat.id} from={from} durationInFrames={to - from}>
            <BeatView ctx={ctx} />
            {clip && <Audio src={staticFile(clip.src)} />}
          </Sequence>
        );
      })}
      {showSafeZones && format === "short" && <SafeZones />}
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const { world, layout, format } = ctx;
  const showClock = ctx.beat.id === "demo" || ctx.beat.id === "reveal";

  return (
    <AbsoluteFill>
      <SvgLayer layout={layout}>
        <Ground world={world} />
      </SvgLayer>
      {ctx.beat.id === "hook" && <Hook ctx={ctx} local={local} />}
      {ctx.beat.id === "concept" && <Concept ctx={ctx} local={local} />}
      {ctx.beat.id === "demo" && <Demo ctx={ctx} local={local} />}
      {ctx.beat.id === "sweep" && <Sweep ctx={ctx} local={local} />}
      {ctx.beat.id === "predict" && <Predict ctx={ctx} local={local} />}
      {ctx.beat.id === "reveal" && <Reveal ctx={ctx} local={local} />}
      {ctx.beat.id === "cta" && <Cta ctx={ctx} local={local} />}
      {!showClock && (
        <Hud
          gLabel={gLabelFor(VIDEO_PARAMS.g)}
          g={VIDEO_PARAMS.g}
          t={null}
          rate={1}
          style={BOXES[format].hud}
          scale={layout.textScale}
        />
      )}
      <Captions ctx={ctx} local={local} />
    </AbsoluteFill>
  );
};

/** The caption for the latest cue that has started. */
const Captions: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const cues = SCRIPT[ctx.format].find((b) => b.id === ctx.beat.id)!.cues;
  const started = cues.map((c) => ({ c, at: cueSeconds(c.at, ctx.beat) })).filter((x) => x.at <= local);
  const active = started[started.length - 1];
  if (!active) return null;
  const box = BOXES[ctx.format];
  return (
    <div style={{ position: "absolute", ...box.caption, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          opacity: fade(local, active.at),
          translate: `0 ${(1 - fade(local, active.at)) * 16}px`,
          fontSize: box.captionFont,
          lineHeight: 1.25,
          fontWeight: 700,
          textAlign: "center",
          padding: "12px 24px",
          borderRadius: 18,
          background: "rgba(22, 35, 30, 0.94)",
          border: `2px solid ${COLORS.boardLine}`,
        }}
      >
        <RichText text={fill(active.c[ctx.lang], ctx.values)} />
      </div>
    </div>
  );
};

const Card: React.FC<{ ctx: Ctx; opacity: number; children: React.ReactNode; fontSize?: number; top?: number }> = ({
  ctx,
  opacity,
  children,
  fontSize,
  top,
}) => {
  const box = BOXES[ctx.format];
  return (
    <div
      style={{
        position: "absolute",
        ...box.card,
        ...(top !== undefined ? { top } : {}),
        opacity,
        scale: String(0.94 + 0.06 * opacity),
        padding: "22px 30px",
        borderRadius: 22,
        background: COLORS.boardRaised,
        border: `2px solid ${COLORS.boardLine}`,
        fontSize: fontSize ?? box.cardFont,
        fontWeight: 700,
        lineHeight: 1.25,
        textAlign: "center",
        maxWidth: ctx.format === "explainer" ? 900 : undefined,
      }}
    >
      {children}
    </div>
  );
};

const t = (text: Text, ctx: Ctx) => fill(text[ctx.lang], ctx.values);

const PAD_LOOK = { x: 1, y: -0.3 };

const Hook: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world } = ctx;
  const r = solve(VIDEO_PARAMS);
  const mark = fade(local, 0.5, 0.5);
  const s = ctx.layout.textScale;
  return (
    <>
      <SvgLayer layout={ctx.layout}>
        <LandingMark world={world} range={r.range} opacity={mark} />
        <Label
          x={world.x(r.range) + 24 * s}
          y={ctx.layout.groundY - 50 * s}
          color={COLORS.displacement}
          size={30 * s}
          opacity={mark}
          anchor="end"
        >
          {t(CARDS.landsHere, ctx)}
        </Label>
        <RangeMarker world={world} range={r.range} opacity={mark} />
      </SvgLayer>
      <KanAt
        world={world}
        x={world.x(0)}
        y={world.y(0)}
        expression={local < 1.2 ? "calm" : "excited"}
        squashOrigin="bottom"
        look={local < 1.2 ? PAD_LOOK : { x: 1, y: 0.15 }}
        time={local}
      />
    </>
  );
};

const Concept: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world } = ctx;
  const s = ctx.layout.textScale;
  const c = solve(VIDEO_PARAMS).components;
  const cues = SCRIPT[ctx.format].find((b) => b.id === "concept")!.cues;
  const at = (i: number) => cueSeconds(cues[i].at, ctx.beat);
  const x0 = world.x(0);
  const y0 = world.y(0);
  const scale = (220 * s) / VIDEO_PARAMS.u;
  const comp = fade(local, at(1), 0.4);
  const grav = fade(local, at(2), 0.4);
  return (
    <>
      <SvgLayer layout={ctx.layout}>
        <AngleArc world={world} theta={VIDEO_PARAMS.thetaDeg} opacity={fade(local, at(0), 0.4)} />
        <g opacity={fade(local, at(0), 0.4)}>
          <Vectors world={world} x={x0} y={y0} vx={c.ux} vy={c.uy} scale={scale} letter="u" show={{ total: true }} />
        </g>
        <g opacity={comp}>
          <Vectors world={world} x={x0} y={y0} vx={c.ux} vy={c.uy} scale={scale} letter="u" show={{ components: true }} />
        </g>
        <g opacity={grav}>
          <Vectors world={world} x={x0} y={y0 - 260 * s} vx={0} vy={0} scale={scale} letter="u" show={{ g: true }} />
        </g>
      </SvgLayer>
      <KanAt world={world} x={x0} y={y0} expression="calm" squashOrigin="bottom" look={{ x: c.ux, y: -c.uy }} time={local} />
      <TopRight ctx={ctx}>
        <div style={{ opacity: comp }}>
          <Tex tex={`${tc(COLORS.velocity, "u_x")} = u\\cos\\theta = ${tc(COLORS.velocity, sig3(c.ux))}\\,\\text{m/s}`} />
        </div>
        <div style={{ opacity: fade(local, at(2), 0.4) }}>
          <Tex tex={`${tc(COLORS.velocity, "u_y")} = u\\sin\\theta = ${tc(COLORS.velocity, sig3(c.uy))}\\,\\text{m/s}`} />
        </div>
      </TopRight>
    </>
  );
};

/** Small live-maths panel opposite the HUD. */
const TopRight: React.FC<{ ctx: Ctx; children: React.ReactNode }> = ({ ctx, children }) => {
  const short = ctx.format === "short";
  return (
    <div
      style={{
        position: "absolute",
        ...BOXES[ctx.format].topRight,
        fontSize: short ? 40 : 34,
        lineHeight: 1.6,
        textAlign: "right",
      }}
    >
      {children}
    </div>
  );
};

const Demo: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world, beat } = ctx;
  const sol = solve(VIDEO_PARAMS);
  const c = sol.components;
  const launchAt = beat.events.launch!;
  const landAt = beat.events.land!;
  const apexAt = beat.events.apex!;
  const tPhys = Math.min(sol.timeOfFlight, Math.max(0, (local - launchAt) * beat.rate));
  const st = stateAt(c, tPhys);
  const launched = local >= launchAt;
  const landed = local >= landAt;
  const pose = poseFromPhysics({ videoTime: local, launchAt, landAt, vy: st.vy, uy: c.uy });
  const look = !launched ? { x: c.ux, y: -c.uy } : landed ? { x: 1, y: 0.25 } : { x: st.vx, y: -st.vy };
  const s = ctx.layout.textScale;
  return (
    <>
      <SvgLayer layout={ctx.layout}>
        {!landed && <LandingMark world={world} range={sol.range} opacity={0.6} />}
        {launched && <Trajectory c={c} world={world} tEnd={tPhys} variant="trail" />}
        <StrobeDots c={c} world={world} t={launched ? tPhys : -1} T={sol.timeOfFlight} />
        {launched && tPhys >= sol.timeToApex && (
          <ApexMarker
            world={world}
            xApex={c.ux * sol.timeToApex}
            height={sol.maxHeight}
            pulse={interpolate(local, [apexAt, apexAt + 0.7], [0, 1], CLAMP)}
          />
        )}
        {landed && <RangeMarker world={world} range={sol.range} />}
        {!landed && (
          <Vectors
            world={world}
            x={world.x(st.x)}
            y={world.y(st.y)}
            vx={st.vx}
            vy={st.vy}
            scale={(150 * s) / VIDEO_PARAMS.u}
            letter={launched ? "v" : "u"}
            show={{ total: true, components: true, g: launched }}
          />
        )}
      </SvgLayer>
      <KanAt world={world} x={world.x(st.x)} y={world.y(st.y)} {...pose} look={look} time={local} />
      <Hud
        gLabel={gLabelFor(VIDEO_PARAMS.g)}
        g={VIDEO_PARAMS.g}
        t={tPhys}
        rate={beat.rate}
        style={BOXES[ctx.format].hud}
        scale={ctx.layout.textScale}
      />
      <LiveVelocity ctx={ctx} vx={st.vx} vy={st.vy} />
    </>
  );
};

const LiveVelocity: React.FC<{ ctx: Ctx; vx: number; vy: number }> = ({ ctx, vx, vy }) => {
  const V = COLORS.velocity;
  return (
    <TopRight ctx={ctx}>
      <div>
        <Tex tex={`${tc(V, "v_x")} = ${tc(V, sig3(vx))}\\,\\text{m/s}`} />
      </div>
      <div>
        <Tex tex={`${tc(V, "v_y")} = ${tc(V, sig3(vy))}\\,\\text{m/s}`} />
      </div>
    </TopRight>
  );
};

const SWEEP_END_S = 8.1; // stop before the timeline's complementary-pair stage; that is the next beat's question

const Sweep: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world } = ctx;
  const sol = solve(VIDEO_PARAMS);
  const sweep = sweepAt(Math.min(local, SWEEP_END_S), VIDEO_PARAMS.thetaDeg);
  return (
    <>
      <SvgLayer layout={ctx.layout}>
        <SweepWorld world={world} params={VIDEO_PARAMS} theta={sweep.theta} stage={sweep.stage} />
      </SvgLayer>
      <KanAt
        world={world}
        x={world.x(sol.range)}
        y={world.y(0)}
        expression="proud"
        squashOrigin="bottom"
        time={local}
        opacity={interpolate(local, [0, 0.4], [1, 0], CLAMP)}
      />
      <div style={{ position: "absolute", right: 60, top: 40 }}>
        <RangeFormula
          u={VIDEO_PARAMS.u}
          g={VIDEO_PARAMS.g}
          theta0={VIDEO_PARAMS.thetaDeg}
          trig={VIDEO_PARAMS.trig}
          theta={sweep.theta}
          stage={sweep.stage}
          grab={sweep.grab}
          time={local}
        />
      </div>
    </>
  );
};

const Predict: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world } = ctx;
  const s = ctx.layout.textScale;
  const x0 = world.x(0);
  const y0 = world.y(0);
  const len = 230 * s;
  const countFrom = ctx.beat.seconds - 3.5;
  const count = local >= countFrom && local < countFrom + 3 ? 3 - Math.floor(local - countFrom) : null;
  return (
    <>
      <SvgLayer layout={ctx.layout}>
        {PAIR.map((th, i) => {
          const rad = (th * Math.PI) / 180;
          const x2 = x0 + Math.cos(rad) * len;
          const y2 = y0 - Math.sin(rad) * len;
          return (
            <g key={th} opacity={fade(local, 0.2 + i * 0.3, 0.4)}>
              <Arrow x1={x0} y1={y0} x2={x2} y2={y2} color={COLORS.velocity} head="triangle" width={6} />
              <Label x={x2 + Math.cos(rad) * 50 * s} y={y2 - Math.sin(rad) * 40 * s} color={COLORS.kan} size={34 * s}>
                {th}°
              </Label>
            </g>
          );
        })}
      </SvgLayer>
      <KanAt world={world} x={x0} y={y0} expression="excited" squashOrigin="bottom" look={{ x: 1, y: -0.6 }} time={local} />
      <Card ctx={ctx} opacity={fade(local, 0.1, 0.35)}>
        <RichText text={t(CARDS.predictQuestion, ctx)} />
        <div style={{ marginTop: 12, fontSize: 30 * s, color: COLORS.chalkDim }}>u = {ctx.values.u} m/s</div>
        <div style={{ height: 90 * s, fontSize: 80 * s, color: COLORS.kan }}>{count}</div>
      </Card>
    </>
  );
};

const Reveal: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world, beat } = ctx;
  const s = ctx.layout.textScale;
  const launchAt = beat.events.launch!;
  const flights = PAIR.map((th) => ({ th, sol: solve({ ...VIDEO_PARAMS, thetaDeg: th }) }));
  const clock = Math.max(0, (local - launchAt) * beat.rate);
  const longest = Math.max(...flights.map((f) => f.sol.timeOfFlight));
  const cues = SCRIPT[ctx.format].find((b) => b.id === "reveal")!.cues;
  const whyAt = cueSeconds(cues[2].at, beat);
  const allLanded = local >= beat.events.land2!;
  const range = flights[0].sol.range;
  const short = ctx.format === "short";
  const cardShown = local >= whyAt - 0.3;

  return (
    <>
      <SvgLayer layout={ctx.layout}>
        {flights.map(({ th, sol }) => {
          const tp = Math.min(sol.timeOfFlight, clock);
          const apex = stateAt(sol.components, sol.timeToApex);
          return (
            <g key={th}>
              {local >= launchAt && <Trajectory c={sol.components} world={world} tEnd={tp} variant="trail" color={COLORS.chalk} />}
              {tp >= sol.timeToApex && (
                <Label x={world.x(apex.x)} y={world.y(apex.y) - 40 * s} color={COLORS.kan} size={32 * s}>
                  {th}°
                </Label>
              )}
            </g>
          );
        })}
        {allLanded && <RangeMarker world={world} range={range} />}
      </SvgLayer>
      {flights.map(({ th, sol }, i) => {
        const tp = Math.min(sol.timeOfFlight, clock);
        const st = stateAt(sol.components, tp);
        const landAt = launchAt + sol.timeOfFlight / beat.rate;
        const pose = poseFromPhysics({ videoTime: local, launchAt, landAt, vy: st.vy, uy: sol.components.uy });
        const landedNow = local >= landAt;
        return (
          <KanAt
            key={th}
            world={world}
            x={world.x(st.x)}
            y={world.y(st.y)}
            {...pose}
            look={landedNow ? { x: 1, y: 0.25 } : { x: st.vx, y: -st.vy }}
            time={local + i * 0.7}
            opacity={i === 0 ? 0.8 : 1}
          />
        );
      })}
      {/* In the Short the card takes the top band, so the clock steps aside. */}
      {!(short && cardShown) && (
        <Hud
          gLabel={gLabelFor(VIDEO_PARAMS.g)}
          g={VIDEO_PARAMS.g}
          t={Math.min(longest, clock)}
          rate={beat.rate}
          style={BOXES[ctx.format].hud}
          scale={ctx.layout.textScale}
        />
      )}
      <Card ctx={ctx} opacity={fade(local, whyAt - 0.3, 0.4)} fontSize={38} top={short ? BOXES.short.revealCardTop : undefined}>
        <div style={{ lineHeight: 1.9 }}>
          <div>
            <Tex tex={String.raw`R = \dfrac{u^{2}\sin 2\theta}{g}`} />
          </div>
          <div>
            <Tex tex={String.raw`\sin(2\times ${PAIR[0]}^\circ) = \sin(2\times ${PAIR[1]}^\circ)`} />
          </div>
          <div>
            <Tex tex={`R = ${tc(COLORS.displacement, EXACT_RANGE_TEX)} \\approx ${tc(COLORS.displacement, sig3(range))}\\,\\text{m}`} />
          </div>
        </div>
      </Card>
    </>
  );
};

const Cta: React.FC<{ ctx: Ctx; local: number }> = ({ ctx, local }) => {
  const { world } = ctx;
  const end = ctx.beat.seconds;
  // The last 0.7 s returns to the exact opening picture so the Short loops cleanly.
  const out = interpolate(local, [end - 0.7, end - 0.2], [1, 0], CLAMP);
  const expression: KanExpression = local < end - 0.7 ? "proud" : "calm";
  return (
    <>
      <KanAt
        world={world}
        x={world.x(0)}
        y={world.y(0)}
        expression={expression}
        squashOrigin="bottom"
        look={PAD_LOOK}
        time={local - end}
      />
      <Card ctx={ctx} opacity={Math.min(fade(local, 0.1, 0.35), out)}>
        <RichText text={t(ctx.format === "short" ? CARDS.ctaShort : CARDS.ctaExplainer, ctx)} />
      </Card>
    </>
  );
};

/** Debug overlay: shades the areas the Shorts UI may cover. */
const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width={1080} height={1920}>
      <path
        d={`M0 0 H1080 V1920 H0 Z M${SHORTS_SAFE.left} ${SHORTS_SAFE.top} V${SHORTS_SAFE.bottom} H${SHORTS_SAFE.right} V${SHORTS_SAFE.top} Z`}
        fill="rgba(255, 60, 60, 0.25)"
        fillRule="evenodd"
      />
      <rect
        x={SHORTS_SAFE.left}
        y={SHORTS_SAFE.top}
        width={SHORTS_SAFE.right - SHORTS_SAFE.left}
        height={SHORTS_SAFE.bottom - SHORTS_SAFE.top}
        fill="none"
        stroke="#ff3c3c"
        strokeWidth={4}
        strokeDasharray="16 10"
      />
    </svg>
  </AbsoluteFill>
);
