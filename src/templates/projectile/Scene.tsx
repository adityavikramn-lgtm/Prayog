import { Backdrop } from "../../video/ui";
import "katex/dist/katex.min.css";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { Tex } from "../../components/Tex";
import { poseFromPhysics } from "../../mascot/pose";
import { sig3 } from "../../physics/format";
import { LaunchComponents, stateAt } from "../../physics/projectile";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { ProjectileParams, gLabelFor, solve } from "./model";
import {
  ApexMarker,
  Hud,
  KanAt,
  RangeFormula,
  RangeMarker,
  StrobeDots,
  SvgLayer,
  SweepWorld,
  Ground,
  Trajectory,
  Vectors,
  tc,
} from "./parts";
import { buildTimeline, physicsTime, sweepAt } from "./timeline";
import { LANDSCAPE, makeWorld } from "./world";

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

const SWEEP_THETAS = Array.from({ length: 61 }, (_, i) => 15 + i);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The interactive lab scene (16:9). The Short and explainer reuse its parts. */
export const ProjectileScene: React.FC<ProjectileSceneProps> = (props) => {
  const { u, thetaDeg, g, trig, showVectors, showEquations, showTrail, includeSweep } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  const params = useMemo(() => ({ u, thetaDeg, g, trig }), [u, thetaDeg, g, trig]);
  const tl = useMemo(() => buildTimeline(params, includeSweep), [params, includeSweep]);
  const sol = useMemo(() => solve(params), [params]);
  const world = useMemo(() => makeWorld(params, includeSweep ? SWEEP_THETAS : [], LANDSCAPE), [params, includeSweep]);
  const c = sol.components;

  const t = physicsTime(tl, s);
  const st = stateAt(c, t);
  const launched = s >= tl.launchAt;
  const landed = s >= tl.landAt;
  const inSweep = includeSweep && s >= tl.sweepAt;
  const sweep = inSweep ? sweepAt(s - tl.sweepAt, thetaDeg) : null;

  const pose = poseFromPhysics({ videoTime: s, launchAt: tl.launchAt, landAt: tl.landAt, vy: st.vy, uy: c.uy });
  const look = !launched ? { x: c.ux, y: -c.uy } : landed ? { x: 1, y: 0.25 } : { x: st.vx, y: -st.vy };
  const apexVideoTime = tl.launchAt + sol.timeToApex / tl.rate;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <SvgLayer layout={LANDSCAPE}>
        <Ground world={world} />
        {!inSweep && (
          <>
            {showTrail && launched && <Trajectory c={c} world={world} tEnd={t} variant="trail" />}
            <StrobeDots c={c} world={world} t={launched ? t : -1} T={sol.timeOfFlight} />
            {launched && t >= sol.timeToApex && (
              <ApexMarker
                world={world}
                xApex={c.ux * sol.timeToApex}
                height={sol.maxHeight}
                pulse={interpolate(s, [apexVideoTime, apexVideoTime + 0.7], [0, 1], CLAMP)}
              />
            )}
            {landed && <RangeMarker world={world} range={sol.range} />}
            {showVectors && !landed && (
              <Vectors
                world={world}
                x={world.x(st.x)}
                y={world.y(st.y)}
                vx={st.vx}
                vy={st.vy}
                scale={170 / u}
                letter={launched ? "v" : "u"}
                show={{ total: true, components: true, g: launched }}
              />
            )}
          </>
        )}
        {sweep && <SweepWorld world={world} params={params} theta={sweep.theta} stage={sweep.stage} />}
      </SvgLayer>

      <KanAt
        world={world}
        x={world.x(st.x)}
        y={world.y(st.y)}
        {...pose}
        look={look}
        time={s}
        opacity={inSweep ? interpolate(s - tl.sweepAt, [0, 0.4], [1, 0], CLAMP) : 1}
      />

      <Hud gLabel={gLabelFor(g)} g={g} t={inSweep ? null : t} rate={tl.rate} style={{ left: 60, top: 44 }} />
      {!inSweep && <Readouts x={st.x} y={st.y} vx={st.vx} vy={st.vy} />}
      {!inSweep && showEquations && <EquationPanel c={c} t={t} st={st} />}
      {sweep && (
        <div style={{ position: "absolute", right: 60, top: 40 }}>
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
        </div>
      )}
    </AbsoluteFill>
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
    <div style={{ color: COLORS.velocity }}>|v| = {sig3(Math.hypot(vx, vy))} m/s</div>
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
