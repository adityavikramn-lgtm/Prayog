import React from "react";
import { Arrow } from "../../components/Arrow";
import { Tex } from "../../components/Tex";
import { Kan, KanProps } from "../../mascot/Kan";
import { sig3 } from "../../physics/format";
import { LaunchComponents, stateAt } from "../../physics/projectile";
import { COLORS } from "../../theme";
import { ProjectileParams, solve } from "./model";
import { SweepStage, complementaryPair } from "./timeline";
import { Layout, World, niceStep, pathFor } from "./world";

// Building blocks shared by the lab scene, the Short and the explainer.
// Every position comes from the world mapping, so they work in 16:9 and 9:16.

export const tc = (color: string, tex: string) => `\\textcolor{${color}}{${tex}}`;

export const SvgLayer: React.FC<{ layout: Layout; children: React.ReactNode }> = ({ layout, children }) => (
  <svg
    width={layout.width}
    height={layout.height}
    viewBox={`0 0 ${layout.width} ${layout.height}`}
    style={{ position: "absolute", inset: 0 }}
  >
    {children}
  </svg>
);

export const Label: React.FC<{
  x: number;
  y: number;
  color: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  children: React.ReactNode;
}> = ({ x, y, color, size = 30, anchor = "middle", opacity = 1, children }) => (
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

export const Ground: React.FC<{ world: World }> = ({ world }) => {
  const { layout } = world;
  const step = niceStep(world.maxR / (layout.width > layout.height ? 6 : 4));
  const ticks: number[] = [];
  for (let x = 0; world.x(x) <= layout.right + 10; x += step) ticks.push(x);
  return (
    <g>
      <line
        x1={Math.min(60, layout.left - 70)}
        y1={layout.groundY}
        x2={layout.width - 60}
        y2={layout.groundY}
        stroke={COLORS.chalk}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {ticks.map((x) => (
        <g key={x}>
          <line x1={world.x(x)} y1={layout.groundY} x2={world.x(x)} y2={layout.groundY + 12} stroke={COLORS.chalkDim} strokeWidth={3} />
          <text x={world.x(x)} y={layout.groundY + 34 * layout.textScale} fill={COLORS.chalkDim} fontSize={22 * layout.textScale} textAnchor="middle">
            {Number(x.toPrecision(6))} m
          </text>
        </g>
      ))}
    </g>
  );
};

export const Trajectory: React.FC<{
  c: LaunchComponents;
  world: World;
  tEnd: number;
  variant: "solid" | "ghost" | "trail";
  color?: string;
}> = ({ c, world, tEnd, variant, color }) => (
  <path
    d={pathFor(c, world, tEnd, variant === "trail" ? 60 : 80)}
    fill="none"
    stroke={color ?? (variant === "solid" ? COLORS.chalk : COLORS.chalkDim)}
    strokeWidth={variant === "solid" ? 5 : 3}
    strokeOpacity={variant === "solid" ? 1 : 0.6}
    strokeDasharray={variant === "ghost" ? "4 10" : undefined}
  />
);

export const STROBE_INTERVALS = 16;

/** Equal-time dots, like a multi-flash photo: x-spacing stays equal, y-spacing changes. */
export const StrobeDots: React.FC<{ c: LaunchComponents; world: World; t: number; T: number }> = ({ c, world, t, T }) => (
  <g fill={COLORS.chalk}>
    {Array.from({ length: STROBE_INTERVALS + 1 }, (_, i) => (T * i) / STROBE_INTERVALS)
      .filter((tk) => tk <= t + 1e-9)
      .map((tk) => {
        const p = stateAt(c, tk);
        return <circle key={tk} cx={world.x(p.x)} cy={world.y(p.y)} r={6 * world.layout.textScale} />;
      })}
  </g>
);

export const ApexMarker: React.FC<{ world: World; xApex: number; height: number; pulse: number }> = ({
  world,
  xApex,
  height,
  pulse,
}) => {
  const s = world.layout.textScale;
  const r = world.layout.kanR;
  const ax = world.x(xApex);
  const ay = world.y(height);
  return (
    <g>
      {pulse < 1 && (
        <circle cx={ax} cy={ay} r={r + 10 + 70 * pulse} fill="none" stroke={COLORS.velocity} strokeWidth={5} opacity={1 - pulse} />
      )}
      <Arrow x1={ax} y1={ay} x2={ax} y2={world.y(0)} color={COLORS.displacement} head="bars" width={4} dashed />
      <Label x={ax + 22} y={(ay + world.y(0)) / 2} color={COLORS.displacement} anchor="start" size={30 * s}>
        H = {sig3(height)} m
      </Label>
      <Label x={ax} y={ay - r - 34 * s} color={COLORS.velocity} size={30 * s}>
        v<tspan fontSize={20 * s} dy={8 * s}>y</tspan>
        <tspan dy={-8 * s}> = 0 at the top</tspan>
      </Label>
    </g>
  );
};

export const RangeMarker: React.FC<{ world: World; range: number; opacity?: number }> = ({ world, range, opacity = 1 }) => {
  const { layout } = world;
  const y = layout.groundY + 62 * layout.textScale;
  const labelRight = world.x(range) + 24 + 190 * layout.textScale > layout.right + 60;
  return (
    <g opacity={opacity}>
      <Arrow x1={world.x(0)} y1={y} x2={world.x(range)} y2={y} color={COLORS.displacement} head="bars" width={4} />
      <Label
        x={labelRight ? (world.x(0) + world.x(range)) / 2 : world.x(range) + 24}
        y={labelRight ? y + 40 * layout.textScale : y}
        color={COLORS.displacement}
        anchor={labelRight ? "middle" : "start"}
        size={30 * layout.textScale}
      >
        R = {sig3(range)} m
      </Label>
    </g>
  );
};

/** A landing spot predicted by the solver, drawn before the flight happens. */
export const LandingMark: React.FC<{ world: World; range: number; opacity: number }> = ({ world, range, opacity }) => {
  const x = world.x(range);
  const y = world.layout.groundY;
  const s = 16 * world.layout.textScale;
  return (
    <g opacity={opacity} stroke={COLORS.displacement} strokeWidth={6} strokeLinecap="round">
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
      <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
    </g>
  );
};

export const Vectors: React.FC<{
  world: World;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  letter: "u" | "v";
  show?: { total?: boolean; components?: boolean; g?: boolean };
}> = ({ world, x, y, vx, vy, scale, letter, show = { total: true, components: true, g: true } }) => {
  const s = world.layout.textScale;
  const r = world.layout.kanR;
  return (
    <g>
      {show.components && (
        <>
          <Arrow x1={x} y1={y} x2={x + vx * scale} y2={y} color={COLORS.velocity} head="open" dashed width={4} label={{ text: letter, sub: "x" }} fontSize={32 * s} />
          {Math.abs(vy * scale) > 6 && (
            <Arrow x1={x} y1={y} x2={x} y2={y - vy * scale} color={COLORS.velocity} head="open" dashed width={4} label={{ text: letter, sub: "y" }} fontSize={32 * s} />
          )}
        </>
      )}
      {show.total && (
        <Arrow x1={x} y1={y} x2={x + vx * scale} y2={y - vy * scale} color={COLORS.velocity} head="triangle" width={6} label={{ text: letter }} fontSize={32 * s} />
      )}
      {show.g && (
        <Arrow x1={x} y1={y + r + 10} x2={x} y2={y + r + 90 * s} color={COLORS.acceleration} head="double-chevron" width={5} label={{ text: "g" }} fontSize={32 * s} />
      )}
    </g>
  );
};

export const AngleArc: React.FC<{ world: World; theta: number; opacity?: number }> = ({ world, theta, opacity = 1 }) => {
  const s = world.layout.textScale;
  const r = 90 * s;
  const ox = world.x(0);
  const oy = world.y(0);
  const rad = (theta * Math.PI) / 180;
  return (
    <g opacity={opacity}>
      <path
        d={`M ${ox + r} ${oy} A ${r} ${r} 0 0 0 ${ox + r * Math.cos(rad)} ${oy - r * Math.sin(rad)}`}
        fill="none"
        stroke={COLORS.kan}
        strokeWidth={4}
      />
      <Label x={ox + (r + 50 * s) * Math.cos(rad / 2)} y={oy - (r + 40 * s) * Math.sin(rad / 2)} color={COLORS.kan} size={30 * s}>
        {theta.toFixed(0)}°
      </Label>
    </g>
  );
};

/** Kan placed at a board position (its centre is the particle). */
export const KanAt: React.FC<Omit<KanProps, "radius"> & { world: World; x: number; y: number; opacity?: number }> = ({
  world,
  x,
  y,
  opacity = 1,
  ...kan
}) => {
  const r = world.layout.kanR;
  const size = (r / 60) * 200;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity }}>
      <Kan radius={r} {...kan} />
    </div>
  );
};

/** Lab/explainer θ sweep: the original path as a ghost plus the path for the current θ. */
export const SweepWorld: React.FC<{ world: World; params: ProjectileParams; theta: number; stage: SweepStage }> = ({
  world,
  params,
  theta,
  stage,
}) => {
  const { layout } = world;
  const s = layout.textScale;
  const original = solve(params);
  const at = (th: number) => solve({ ...params, thetaDeg: th, trig: th === params.thetaDeg ? params.trig : "exact" });
  const shown = stage === "pair" ? complementaryPair(params.thetaDeg) : [theta];
  const sweepRange = at(shown[0]).range;

  return (
    <g>
      <Trajectory c={original.components} world={world} tEnd={original.timeOfFlight} variant="ghost" />
      {shown.map((th) => {
        const r = at(th);
        const apex = stateAt(r.components, r.timeToApex);
        return (
          <g key={th}>
            <Trajectory c={r.components} world={world} tEnd={r.timeOfFlight} variant="solid" />
            {stage === "pair" && (
              <Label x={world.x(apex.x)} y={world.y(apex.y) - 30 * s} color={COLORS.kan} size={30 * s}>
                {Math.round(th)}°
              </Label>
            )}
          </g>
        );
      })}
      <AngleArc world={world} theta={shown[0]} />
      <circle cx={world.x(sweepRange)} cy={world.y(0)} r={10} fill={COLORS.displacement} />
      <RangeMarker world={world} range={sweepRange} />
    </g>
  );
};

/** The signature move: Kan pulls θ out of R = u² sin 2θ / g and drags it. Caller positions it. */
export const RangeFormula: React.FC<{
  u: number;
  g: number;
  theta0: number;
  trig: ProjectileParams["trig"];
  theta: number;
  stage: SweepStage;
  grab: number;
  time: number;
  fontSize?: number;
}> = ({ u, g, theta0, trig, theta, stage, grab, time, fontSize = 50 }) => {
  const [a, b] = complementaryPair(theta0);
  const range = solve({ u, g, thetaDeg: theta, trig: theta === theta0 ? trig : "exact" }).range;
  const rhs =
    stage === "pair"
      ? `R(${a}^\\circ) = R(${b}^\\circ) = ${tc(COLORS.displacement, sig3(solve({ u, g, thetaDeg: a, trig: "exact" }).range))}\\,\\text{m}`
      : `= \\dfrac{(${sig3(u)})^{2}\\sin(2 \\times ${tc(COLORS.kan, theta.toFixed(1) + "^\\circ")})}{${sig3(g)}} = ${tc(COLORS.displacement, sig3(range))}\\,\\text{m}`;
  const dx = (theta - theta0) * 1.5;
  const dy = 3.4 * fontSize * grab; // below the denominator, so g stays readable

  return (
    <div
      style={{
        padding: "20px 36px 30px",
        borderRadius: 20,
        background: COLORS.boardRaised,
        border: `2px solid ${COLORS.boardLine}`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontSize,
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
      <Tex tex={rhs} style={{ fontSize: fontSize * 0.8 }} />
    </div>
  );
};

/** g label, physics clock and (when not real time) the playback rate. */
export const Hud: React.FC<{
  gLabel: string;
  g: number;
  t: number | null;
  rate: number;
  style: React.CSSProperties;
  scale?: number;
}> = ({ gLabel, g, t, rate, style, scale = 1 }) => {
  const realTime = Math.abs(rate - 1) < 1e-9;
  return (
    <div style={{ position: "absolute", fontSize: 30 * scale, lineHeight: 1.4, ...style }}>
      <div style={{ color: COLORS.chalkDim }}>
        {gLabel} · g = {sig3(g)} m/s²
      </div>
      {t !== null && (
        <div style={{ fontSize: 44 * scale, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>t = {sig3(t)} s</div>
      )}
      {t !== null && !realTime && (
        <div style={{ color: COLORS.chalkDim, fontSize: 26 * scale }}>
          {rate < 1 ? `Slow motion: ${sig3(rate)}× speed` : `Fast-forward: ${sig3(rate)}× speed`}
        </div>
      )}
    </div>
  );
};
