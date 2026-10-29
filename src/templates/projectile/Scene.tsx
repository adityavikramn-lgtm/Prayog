import { loadFont } from "@remotion/google-fonts/AtkinsonHyperlegible";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { Tex } from "../../components/Tex";
import { Kan } from "../../mascot/Kan";
import { poseFromPhysics } from "../../mascot/pose";
import { sig3 } from "../../physics/format";
import { LaunchComponents, stateAt } from "../../physics/projectile";
import { COLORS } from "../../theme";
import { ProjectileParams, gLabelFor, solve } from "./model";
import {
  SweepStage,
  buildTimeline,
  complementaryPair,
  physicsTime,
  sweepAt,
} from "./timeline";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const ProjectileSceneProps = ProjectileParams.extend({
  showVectors: z.boolean(),
  showEquations: z.boolean(),
  showTrail: z.boolean(),
  includeSweep: z.boolean(),
});
export type ProjectileSceneProps = z.infer<typeof ProjectileSceneProps>;

export const defaultSceneProps: ProjectileSceneProps = {
  u: 20,
  thetaDeg: 60,
  g: 10,
  trig: "exact",
  showVectors: true,
  showEquations: true,
  showTrail: true,
  includeSweep: true,
};

// Layout of the 1920×1080 board.
const W = 1920;
const H = 1080;
const GROUND_Y = 760;
const LEFT = 180;
const RIGHT = 1760;
const TOP = 150;
const KAN_R = 40;
const STROBE_INTERVALS = 16;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Paper-to-screen mapping. One fixed scale for the whole video, so every distance is comparable. */
function makeWorld(p: ProjectileParams, includeSweep: boolean) {
  const thetas = includeSweep ? Array.from({ length: 61 }, (_, i) => 15 + i) : [];
  let maxR = solve(p).range;
  let maxH = solve(p).maxHeight;
  for (const th of thetas) {
    const r = solve({ ...p, thetaDeg: th, trig: "exact" });
    maxR = Math.max(maxR, r.range);
    maxH = Math.max(maxH, r.maxHeight);
  }
  const k = Math.min((RIGHT - LEFT) / maxR, (GROUND_Y - KAN_R - TOP) / maxH);
  return {
    k,
    maxR,
    x: (xm: number) => LEFT + xm * k,
    y: (ym: number) => GROUND_Y - KAN_R - ym * k,
  };
}
type World = ReturnType<typeof makeWorld>;

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

function pathFor(c: LaunchComponents, world: World, tEnd: number, samples = 80): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const s = stateAt(c, (tEnd * i) / samples);
    d += `${i === 0 ? "M" : "L"} ${world.x(s.x).toFixed(1)} ${world.y(s.y).toFixed(1)} `;
  }
  return d;
}

const tc = (color: string, tex: string) => `\\textcolor{${color}}{${tex}}`;

export const ProjectileScene: React.FC<ProjectileSceneProps> = (props) => {
  const { u, thetaDeg, g, trig, showVectors, showEquations, showTrail, includeSweep } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  const params = useMemo(() => ({ u, thetaDeg, g, trig }), [u, thetaDeg, g, trig]);
  const tl = useMemo(() => buildTimeline(params, includeSweep), [params, includeSweep]);
  const sol = useMemo(() => solve(params), [params]);
  const world = useMemo(() => makeWorld(params, includeSweep), [params, includeSweep]);
  const c = sol.components;

  const t = physicsTime(tl, s);
  const st = stateAt(c, t);
  const launched = s >= tl.launchAt;
  const landed = s >= tl.landAt;
  const inSweep = includeSweep && s >= tl.sweepAt;
  const sweep = inSweep ? sweepAt(s - tl.sweepAt, thetaDeg) : null;

  const pose = poseFromPhysics({ videoTime: s, launchAt: tl.launchAt, landAt: tl.landAt, vy: st.vy, uy: c.uy });
  const look = !launched ? { x: c.ux, y: -c.uy } : landed ? { x: 1, y: 0.25 } : { x: st.vx, y: -st.vy };
  const kanX = world.x(st.x);
  const kanY = world.y(st.y);
  const kanSize = (KAN_R / 60) * 200;
  const worldKanOpacity = inSweep ? interpolate(s - tl.sweepAt, [0, 0.4], [1, 0], CLAMP) : 1;

  const apexVideoTime = tl.launchAt + sol.timeToApex / tl.rate;
  const pastApex = launched && t >= sol.timeToApex;
  const vScale = 170 / u; // pixels per m/s

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ground world={world} />

        {!inSweep && (
          <>
            {showTrail && launched && (
              <path d={pathFor(c, world, t, 60)} fill="none" stroke={COLORS.chalkDim} strokeWidth={3} strokeOpacity={0.7} />
            )}
            <StrobeDots c={c} world={world} t={launched ? t : -1} T={sol.timeOfFlight} />
            {pastApex && (
              <ApexMarker
                world={world}
                xApex={c.ux * sol.timeToApex}
                height={sol.maxHeight}
                pulse={interpolate(s, [apexVideoTime, apexVideoTime + 0.7], [0, 1], CLAMP)}
              />
            )}
            {landed && <RangeMarker world={world} range={sol.range} />}
            {showVectors && !landed && (
              <Vectors x={kanX} y={kanY} vx={st.vx} vy={st.vy} scale={vScale} beforeLaunch={!launched} />
            )}
          </>
        )}

        {sweep && <SweepWorld world={world} params={params} theta={sweep.theta} stage={sweep.stage} />}
      </svg>

      <div
        style={{
          position: "absolute",
          left: kanX - kanSize / 2,
          top: kanY - kanSize / 2,
          opacity: worldKanOpacity,
        }}
      >
        <Kan radius={KAN_R} {...pose} look={look} time={s} />
      </div>

      <Hud gLabel={gLabelFor(g)} g={g} t={inSweep ? null : t} rate={tl.rate} />
      {!inSweep && <Readouts x={st.x} y={st.y} vx={st.vx} vy={st.vy} />}
      {!inSweep && showEquations && <EquationPanel c={c} t={t} st={st} />}
      {sweep && (
        <RangeFormula
          u={u}
          g={g}
          theta0={thetaDeg}
          trig={trig}
          theta={sweep.theta}
          stage={sweep.stage}
          grab={sweep.grab}
          time={s}
        />
      )}
    </AbsoluteFill>
  );
};

const Label: React.FC<{
  x: number;
  y: number;
  color: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  children: React.ReactNode;
}> = ({ x, y, color, size = 30, anchor = "middle", children }) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    fontWeight={700}
    textAnchor={anchor}
    dominantBaseline="middle"
    stroke={COLORS.board}
    strokeWidth={8}
    paintOrder="stroke"
  >
    {children}
  </text>
);

const Ground: React.FC<{ world: World }> = ({ world }) => {
  const step = niceStep(world.maxR / 6);
  const ticks: number[] = [];
  for (let x = 0; world.x(x) <= RIGHT + 40; x += step) ticks.push(x);
  return (
    <g>
      <line x1={60} y1={GROUND_Y} x2={W - 60} y2={GROUND_Y} stroke={COLORS.chalk} strokeWidth={4} strokeLinecap="round" />
      {ticks.map((x) => (
        <g key={x}>
          <line x1={world.x(x)} y1={GROUND_Y} x2={world.x(x)} y2={GROUND_Y + 12} stroke={COLORS.chalkDim} strokeWidth={3} />
          <text x={world.x(x)} y={GROUND_Y + 34} fill={COLORS.chalkDim} fontSize={22} textAnchor="middle">
            {Number(x.toPrecision(6))} m
          </text>
        </g>
      ))}
    </g>
  );
};

/** Equal-time dots, like a multi-flash photo: x-spacing stays equal, y-spacing changes. */
const StrobeDots: React.FC<{ c: LaunchComponents; world: World; t: number; T: number }> = ({ c, world, t, T }) => (
  <g fill={COLORS.chalk}>
    {Array.from({ length: STROBE_INTERVALS + 1 }, (_, i) => (T * i) / STROBE_INTERVALS)
      .filter((tk) => tk <= t + 1e-9)
      .map((tk) => {
        const p = stateAt(c, tk);
        return <circle key={tk} cx={world.x(p.x)} cy={world.y(p.y)} r={6} />;
      })}
  </g>
);

const ApexMarker: React.FC<{ world: World; xApex: number; height: number; pulse: number }> = ({
  world,
  xApex,
  height,
  pulse,
}) => {
  const ax = world.x(xApex);
  const ay = world.y(height);
  return (
    <g>
      {pulse < 1 && (
        <circle cx={ax} cy={ay} r={KAN_R + 10 + 70 * pulse} fill="none" stroke={COLORS.velocity} strokeWidth={5} opacity={1 - pulse} />
      )}
      <Arrow x1={ax} y1={ay} x2={ax} y2={world.y(0)} color={COLORS.displacement} head="bars" width={4} dashed />
      <Label x={ax + 22} y={(ay + world.y(0)) / 2} color={COLORS.displacement} anchor="start">
        H = {sig3(height)} m
      </Label>
      <Label x={ax} y={ay - KAN_R - 34} color={COLORS.velocity}>
        v<tspan fontSize={20} dy={8}>y</tspan>
        <tspan dy={-8}> = 0 at the top</tspan>
      </Label>
    </g>
  );
};

const RangeMarker: React.FC<{ world: World; range: number }> = ({ world, range }) => (
  <g>
    <Arrow x1={world.x(0)} y1={GROUND_Y + 62} x2={world.x(range)} y2={GROUND_Y + 62} color={COLORS.displacement} head="bars" width={4} />
    <Label x={world.x(range) + 24} y={GROUND_Y + 62} color={COLORS.displacement} anchor="start">
      R = {sig3(range)} m
    </Label>
  </g>
);

const Vectors: React.FC<{ x: number; y: number; vx: number; vy: number; scale: number; beforeLaunch: boolean }> = ({
  x,
  y,
  vx,
  vy,
  scale,
  beforeLaunch,
}) => (
  <g>
    <Arrow x1={x} y1={y} x2={x + vx * scale} y2={y} color={COLORS.velocity} head="open" dashed width={4} label={{ text: beforeLaunch ? "u" : "v", sub: "x" }} />
    {Math.abs(vy * scale) > 6 && (
      <Arrow x1={x} y1={y} x2={x} y2={y - vy * scale} color={COLORS.velocity} head="open" dashed width={4} label={{ text: beforeLaunch ? "u" : "v", sub: "y" }} />
    )}
    <Arrow x1={x} y1={y} x2={x + vx * scale} y2={y - vy * scale} color={COLORS.velocity} head="triangle" width={6} label={{ text: beforeLaunch ? "u" : "v" }} />
    {!beforeLaunch && (
      <Arrow x1={x} y1={y + KAN_R + 10} x2={x} y2={y + KAN_R + 90} color={COLORS.acceleration} head="double-chevron" width={5} label={{ text: "g" }} />
    )}
  </g>
);

const SweepWorld: React.FC<{ world: World; params: ProjectileParams; theta: number; stage: SweepStage }> = ({
  world,
  params,
  theta,
  stage,
}) => {
  const original = solve(params);
  const at = (th: number) => solve({ ...params, thetaDeg: th, trig: th === params.thetaDeg ? params.trig : "exact" });
  const shown = stage === "pair" ? complementaryPair(params.thetaDeg) : [theta];
  const sweepRange = at(shown[0]).range;

  return (
    <g>
      <path
        d={pathFor(original.components, world, original.timeOfFlight)}
        fill="none"
        stroke={COLORS.chalkDim}
        strokeWidth={3}
        strokeDasharray="4 10"
        strokeOpacity={0.6}
      />
      {shown.map((th) => {
        const r = at(th);
        const apex = stateAt(r.components, r.timeToApex);
        return (
          <g key={th}>
            <path d={pathFor(r.components, world, r.timeOfFlight)} fill="none" stroke={COLORS.chalk} strokeWidth={5} />
            {stage === "pair" && (
              <Label x={world.x(apex.x)} y={world.y(apex.y) - 30} color={COLORS.kan}>
                {Math.round(th)}°
              </Label>
            )}
          </g>
        );
      })}
      <AngleArc world={world} theta={shown[0]} />
      <circle cx={world.x(sweepRange)} cy={world.y(0)} r={10} fill={COLORS.displacement} />
      <Arrow x1={world.x(0)} y1={GROUND_Y + 62} x2={world.x(sweepRange)} y2={GROUND_Y + 62} color={COLORS.displacement} head="bars" width={4} />
      <Label x={world.x(sweepRange) + 24} y={GROUND_Y + 62} color={COLORS.displacement} anchor="start">
        R = {sig3(sweepRange)} m
      </Label>
      {stage === "max" && (
        <Label x={W / 2} y={GROUND_Y + 150} color={COLORS.chalk} size={46}>
          Maximum range at θ = 45°
        </Label>
      )}
      {stage === "pair" && (
        <Label x={W / 2} y={GROUND_Y + 150} color={COLORS.chalk} size={46}>
          {`θ and 90° − θ land at the same point`}
        </Label>
      )}
    </g>
  );
};

const AngleArc: React.FC<{ world: World; theta: number }> = ({ world, theta }) => {
  const r = 90;
  const ox = world.x(0);
  const oy = world.y(0);
  const rad = (theta * Math.PI) / 180;
  return (
    <g>
      <path
        d={`M ${ox + r} ${oy} A ${r} ${r} 0 0 0 ${ox + r * Math.cos(rad)} ${oy - r * Math.sin(rad)}`}
        fill="none"
        stroke={COLORS.kan}
        strokeWidth={4}
      />
      <Label x={ox + (r + 50) * Math.cos(rad / 2)} y={oy - (r + 40) * Math.sin(rad / 2)} color={COLORS.kan}>
        {theta.toFixed(0)}°
      </Label>
    </g>
  );
};

/** t is null outside the flight's clock (during the θ sweep). */
const Hud: React.FC<{ gLabel: string; g: number; t: number | null; rate: number }> = ({ gLabel, g, t, rate }) => {
  const realTime = Math.abs(rate - 1) < 1e-9;
  return (
    <div style={{ position: "absolute", left: 60, top: 44, fontSize: 30, lineHeight: 1.4 }}>
      <div style={{ color: COLORS.chalkDim }}>
        {gLabel} · g = {sig3(g)} m/s²
      </div>
      {t !== null && (
        <div style={{ fontSize: 44, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>t = {sig3(t)} s</div>
      )}
      {t !== null && !realTime && (
        <div style={{ color: COLORS.chalkDim, fontSize: 26 }}>
          {rate < 1 ? `Slow motion: ${sig3(rate)}× speed` : `Fast-forward: ${sig3(rate)}× speed`}
        </div>
      )}
    </div>
  );
};

const Readouts: React.FC<{ x: number; y: number; vx: number; vy: number }> = ({ x, y, vx, vy }) => (
  <div
    style={{
      position: "absolute",
      right: 60,
      top: 44,
      fontSize: 30,
      lineHeight: 1.5,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    <div style={{ color: COLORS.displacement }}>
      x = {sig3(x)} m · y = {sig3(y)} m
    </div>
    <div style={{ color: COLORS.velocity }}>
      |v| = {sig3(Math.hypot(vx, vy))} m/s
    </div>
  </div>
);

const EquationPanel: React.FC<{ c: LaunchComponents; t: number; st: ReturnType<typeof stateAt> }> = ({ c, t, st }) => {
  const n = sig3;
  const V = COLORS.velocity;
  const D = COLORS.displacement;
  const A = COLORS.acceleration;
  const lines = [
    `${tc(D, "x")} = ${tc(V, "u_x")} t = (${n(c.ux)})(${n(t)}) = ${tc(D, n(st.x))}\\,\\text{m}`,
    `${tc(V, "v_x")} = ${tc(V, "u_x")} = ${tc(V, n(st.vx))}\\,\\text{m/s}`,
    `${tc(D, "y")} = ${tc(V, "u_y")} t - \\tfrac{1}{2}${tc(A, "g")} t^{2} = (${n(c.uy)})(${n(t)}) - \\tfrac{1}{2}(${n(c.g)})(${n(t)})^{2} = ${tc(D, n(st.y))}\\,\\text{m}`,
    `${tc(V, "v_y")} = ${tc(V, "u_y")} - ${tc(A, "g")} t = ${n(c.uy)} - (${n(c.g)})(${n(t)}) = ${tc(V, n(st.vy))}\\,\\text{m/s}`,
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 872,
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        rowGap: 18,
        columnGap: 40,
        fontSize: 30,
      }}
    >
      {lines.map((line) => (
        <Tex key={line.slice(0, 24)} tex={line} />
      ))}
    </div>
  );
};

/** The signature move: Kan pulls θ out of the range formula and drags it. */
const RangeFormula: React.FC<{
  u: number;
  g: number;
  theta0: number;
  trig: ProjectileParams["trig"];
  theta: number;
  stage: SweepStage;
  grab: number;
  time: number;
}> = ({ u, g, theta0, trig, theta, stage, grab, time }) => {
  const [a, b] = complementaryPair(theta0);
  const range = solve({ u, g, thetaDeg: theta, trig: theta === theta0 ? trig : "exact" }).range;
  const rhs =
    stage === "pair"
      ? `R(${a}^\\circ) = R(${b}^\\circ) = ${tc(COLORS.displacement, sig3(solve({ u, g, thetaDeg: a, trig: "exact" }).range))}\\,\\text{m}`
      : `= \\dfrac{(${sig3(u)})^{2}\\sin(2 \\times ${tc(COLORS.kan, theta.toFixed(1) + "^\\circ")})}{${sig3(g)}} = ${tc(COLORS.displacement, sig3(range))}\\,\\text{m}`;
  const dx = (theta - theta0) * 3;
  const dy = 70 * grab;

  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: 40,
        padding: "20px 36px 30px",
        borderRadius: 20,
        background: COLORS.boardRaised,
        border: `2px solid ${COLORS.boardLine}`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontSize: 50,
      }}
    >
      <Tex tex="R =" />
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <Tex tex="u^{2}\sin 2" />
          <span style={{ position: "relative", display: "inline-block" }}>
            <Tex tex="\theta" style={{ opacity: grab > 0.02 ? 0.25 : 0 }} />
            <span style={{ position: "absolute", left: 0, top: 0, translate: `${dx}px ${dy}px`, color: COLORS.kan }}>
              <Tex tex="\theta" />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "100%",
                  translate: "-50% -12px",
                  scale: String(grab),
                  transformOrigin: "50% 0%",
                }}
              >
                <Kan radius={30} expression={stage === "drag" ? "excited" : "proud"} arms="up" look={{ x: dx >= 0 ? 1 : -1, y: -0.4 }} time={time} />
              </div>
            </span>
          </span>
        </div>
        <div style={{ height: 4, alignSelf: "stretch", background: COLORS.chalk, margin: "6px 0" }} />
        <Tex tex="g" />
      </div>
      <Tex tex={rhs} style={{ fontSize: 40 }} />
    </div>
  );
};
