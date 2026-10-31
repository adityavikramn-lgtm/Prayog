// Simulates any SceneSpec step by step (RK4 between events) and measures quantities from the run.
// Nothing here knows the "answer": it only applies the forces the scene lists.

import { SceneSpec } from "./spec";

export const K_COULOMB = 9e9; // JEE value
export const G_NEWTON = 6.67e-11;

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.sqrt(dot(a, a));

export interface Frame {
  t: number;
  pos: V3[];
  vel: V3[];
}

export interface SimResult {
  frames: Frame[];
  /** Value measured from the run for scene.measure, with its unit (null when not measurable). */
  measured: { value: number; unit: string } | null;
  /** Things worth telling the student (e.g. "landed at t = 2.4 s"). */
  events: string[];
  bounds: { min: V3; max: V3 };
}

const UNIT: Record<string, string> = {
  max_height: "m",
  range: "m",
  time_to_ground: "s",
  time_of_flight: "s",
  speed_at_ground: "m/s",
  max_speed: "m/s",
  final_speed: "m/s",
  final_velocity_x: "m/s",
  period: "s",
  min_distance: "m",
  max_compression: "m",
  max_displacement: "m",
  bounce_height: "m",
  radius_of_path: "m",
  time_to_stop: "s",
  distance_travelled: "m",
};

export function simulate(scene: SceneSpec, opts: { steps?: number; frames?: number } = {}): SimResult {
  const n = scene.bodies.length;
  const idx = new Map(scene.bodies.map((b, i) => [b.id, i]));
  const mass = scene.bodies.map((b) => b.mass);
  const charge = scene.bodies.map((b) => b.charge);
  const fixed = scene.bodies.map((b) => b.fixed);
  let pos: V3[] = scene.bodies.map((b) => [...b.position] as V3);
  let vel: V3[] = scene.bodies.map((b) => (b.fixed ? [0, 0, 0] : ([...b.velocity] as V3)));
  const landed = Array(n).fill(false) as boolean[]; // stuck to the ground (no bounce, no friction slide)
  const onGround = Array(n).fill(false) as boolean[]; // sliding on the ground
  const gY = scene.groundY;
  // A body that starts resting on the floor (not moving up or down, within one radius of it) is placed on it.
  if (gY !== null)
    pos.forEach((p, i) => {
      const above = p[1] - gY;
      if (!fixed[i] && above >= 0 && above <= scene.bodies[i].radius * 1.05 && Math.abs(vel[i][1]) < 1e-12) {
        p[1] = gY;
        if (scene.g > 0) onGround[i] = true;
      }
    });
  const start = pos.map((p) => [...p] as V3);
  let bounced = false;
  let bounceDone = false;
  let bounceMaxY = -Infinity;
  const springs = scene.springs.map((s) => ({ a: s.a === "anchor" ? -1 : (idx.get(s.a) ?? -1), anchor: (s.anchor ?? [0, 0, 0]) as V3, b: idx.get(s.b) ?? -1, k: s.k, L0: s.restLength }));

  // Contact with the ground: a body sitting on it feels a normal force and sliding friction.
  const accel = (p: V3[], v: V3[]): V3[] => {
    const F: V3[] = p.map(() => [0, 0, 0]);
    for (let i = 0; i < n; i++) {
      if (fixed[i] || landed[i]) continue;
      F[i] = add(F[i], [0, -mass[i] * scene.g, 0]);
      if (charge[i] !== 0) {
        F[i] = add(F[i], mul(scene.E as V3, charge[i]));
        F[i] = add(F[i], mul(cross(v[i], scene.B as V3), charge[i]));
      }
      if (scene.drag > 0) F[i] = add(F[i], mul(v[i], -scene.drag));
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = sub(p[j], p[i]);
        const r = Math.max(len(d), 1e-9);
        const u = mul(d, 1 / r);
        let f = 0; // positive = repel
        if (scene.coulomb) f += (K_COULOMB * charge[i] * charge[j]) / (r * r);
        if (scene.gravitation) f -= (G_NEWTON * mass[i] * mass[j]) / (r * r);
        if (f !== 0) {
          F[i] = add(F[i], mul(u, -f));
          F[j] = add(F[j], mul(u, f));
        }
      }
    for (const s of springs) {
      if (s.b < 0) continue;
      const pa = s.a < 0 ? s.anchor : p[s.a];
      const d = sub(p[s.b], pa);
      const r = Math.max(len(d), 1e-12);
      const f = s.k * (r - s.L0); // positive = stretched, pulls together
      const u = mul(d, 1 / r);
      F[s.b] = add(F[s.b], mul(u, -f));
      if (s.a >= 0) F[s.a] = add(F[s.a], mul(u, f));
    }
    return F.map((f, i) => {
      if (fixed[i] || landed[i]) return [0, 0, 0] as V3;
      let a = mul(f, 1 / mass[i]);
      if (onGround[i] && gY !== null) {
        const N = Math.max(0, -f[1]); // ground pushes up as much as needed
        a = [a[0], 0, a[2]];
        const vh: V3 = [v[i][0], 0, v[i][2]];
        const sp = len(vh);
        if (scene.groundFriction > 0 && N > 0 && sp > 1e-9) a = add(a, mul(vh, (-scene.groundFriction * N) / (mass[i] * sp)));
      }
      return a;
    });
  };

  const deriv = (p: V3[], v: V3[]) => ({ dp: v.map((x, i) => (fixed[i] || landed[i] ? ([0, 0, 0] as V3) : x)), dv: accel(p, v) });
  const steps = Math.min(200_000, Math.max(2000, opts.steps ?? 20_000));
  const dt = scene.duration / steps;
  const every = Math.max(1, Math.floor(steps / (opts.frames ?? 1200)));
  const frames: Frame[] = [{ t: 0, pos: pos.map((x) => [...x] as V3), vel: vel.map((x) => [...x] as V3) }];
  const events: string[] = [];

  // What we measure along the way.
  const m = scene.measure;
  const mi = m ? (idx.get(m.body) ?? -1) : -1;
  const mj = m ? (idx.get(m.body2) ?? -1) : -1;
  let maxY = mi >= 0 ? pos[mi][1] : -Infinity;
  let landT = NaN;
  let landRange = NaN;
  let landSpeed = NaN;
  let maxSpeed = mi >= 0 ? len(vel[mi]) : 0;
  let minDist = mi >= 0 && mj >= 0 ? len(sub(pos[mi], pos[mj])) : Infinity;
  let maxComp = springs.length && springs[0].b >= 0 ? springs[0].L0 - len(sub(pos[springs[0].b], springs[0].a < 0 ? springs[0].anchor : pos[springs[0].a])) : -Infinity;
  let maxDisp = 0;
  let travelled = 0;
  let stopT = NaN;
  const dispTrace: { t: number; d: number }[] = [];
  const radii: number[] = [];

  let t = 0;
  for (let step = 0; step < steps; step++) {
    // RK4 for all bodies together.
    const k1 = deriv(pos, vel);
    const p2 = pos.map((x, i) => add(x, mul(k1.dp[i], dt / 2)));
    const v2 = vel.map((x, i) => add(x, mul(k1.dv[i], dt / 2)));
    const k2 = deriv(p2, v2);
    const p3 = pos.map((x, i) => add(x, mul(k2.dp[i], dt / 2)));
    const v3 = vel.map((x, i) => add(x, mul(k2.dv[i], dt / 2)));
    const k3 = deriv(p3, v3);
    const p4 = pos.map((x, i) => add(x, mul(k3.dp[i], dt)));
    const v4 = vel.map((x, i) => add(x, mul(k3.dv[i], dt)));
    const k4 = deriv(p4, v4);
    const oldPos = pos;
    const oldVel = vel;
    pos = pos.map((x, i) => add(x, mul(add(add(k1.dp[i], mul(k2.dp[i], 2)), add(mul(k3.dp[i], 2), k4.dp[i])), dt / 6)));
    vel = vel.map((x, i) => add(x, mul(add(add(k1.dv[i], mul(k2.dv[i], 2)), add(mul(k3.dv[i], 2), k4.dv[i])), dt / 6)));
    t += dt;

    // Sliding friction stops a body instead of reversing it.
    for (let i = 0; i < n; i++)
      if (onGround[i] && scene.groundFriction > 0 && dot([oldVel[i][0], 0, oldVel[i][2]], [vel[i][0], 0, vel[i][2]]) < 0) vel[i] = [0, 0, 0];

    // Ground: find the moment of crossing (linear in the last step), then bounce, slide or stick.
    if (gY !== null)
      for (let i = 0; i < n; i++) {
        if (fixed[i] || landed[i] || onGround[i]) continue;
        if (oldPos[i][1] >= gY && pos[i][1] < gY) {
          const frac = (oldPos[i][1] - gY) / (oldPos[i][1] - pos[i][1]);
          const hitT = t - dt + frac * dt;
          const hitP = add(oldPos[i], mul(sub(pos[i], oldPos[i]), frac));
          const hitV = add(oldVel[i], mul(sub(vel[i], oldVel[i]), frac));
          if (i === mi && Number.isNaN(landT)) {
            landT = hitT;
            landRange = Math.hypot(hitP[0] - start[i][0], hitP[2] - start[i][2]);
            landSpeed = len(hitV);
          }
          if (Number.isNaN(landT) || i !== mi) events.push(`${scene.bodies[i].label || scene.bodies[i].id} reaches the ground at t = ${hitT.toPrecision(3)} s`);
          pos[i] = [hitP[0], gY, hitP[2]];
          if (scene.restitution > 0 && Math.abs(hitV[1]) > 0.05) {
            vel[i] = [hitV[0], -scene.restitution * hitV[1], hitV[2]];
            if (i === mi) bounced = true;
          }
          else if (scene.groundFriction > 0) {
            vel[i] = [hitV[0], 0, hitV[2]];
            onGround[i] = true;
          } else {
            vel[i] = [0, 0, 0];
            landed[i] = true;
          }
        }
        // A body that starts on the ground (table problems) slides along it.
        if (!onGround[i] && !landed[i] && Math.abs(pos[i][1] - gY) < 1e-9 && Math.abs(vel[i][1]) < 1e-9 && scene.g > 0) onGround[i] = true;
      }

    // Body–body collisions (spheres), with restitution along the line of centres.
    if (scene.collisions)
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const d = sub(pos[j], pos[i]);
          const r = len(d);
          const minR = scene.bodies[i].radius + scene.bodies[j].radius;
          if (r >= minR || r === 0) continue;
          const u = mul(d, 1 / r);
          const rel = dot(sub(vel[j], vel[i]), u);
          if (rel >= 0) continue;
          const mi1 = fixed[i] ? Infinity : mass[i];
          const mj1 = fixed[j] ? Infinity : mass[j];
          const J = (-(1 + scene.restitution) * rel) / (1 / mi1 + 1 / mj1);
          if (!fixed[i]) vel[i] = sub(vel[i], mul(u, J / mass[i]));
          if (!fixed[j]) vel[j] = add(vel[j], mul(u, J / mass[j]));
          events.push(`${scene.bodies[i].label || scene.bodies[i].id} and ${scene.bodies[j].label || scene.bodies[j].id} collide at t = ${t.toPrecision(3)} s`);
        }

    if (mi >= 0) {
      maxY = Math.max(maxY, pos[mi][1]);
      if (bounced && !bounceDone) {
        // The first rise after the first bounce: its top is reached when it starts falling again.
        bounceMaxY = Math.max(bounceMaxY, pos[mi][1]);
        if (vel[mi][1] < 0) bounceDone = true;
      }
      const sp = len(vel[mi]);
      maxSpeed = Math.max(maxSpeed, sp);
      travelled += len(sub(pos[mi], oldPos[mi]));
      const disp = len(sub(pos[mi], start[mi]));
      maxDisp = Math.max(maxDisp, disp);
      if (step % 4 === 0) dispTrace.push({ t, d: disp });
      if (Number.isNaN(stopT) && step > 2 && sp < 1e-3 * Math.max(maxSpeed, 1e-9) && maxSpeed > 0) stopT = t;
      if (mj >= 0) minDist = Math.min(minDist, len(sub(pos[mi], pos[mj])));
      // Radius of curvature r = v² / |a⊥| (for circular paths).
      const a = sub(vel[mi], oldVel[mi]);
      const aPerp = sub(a, mul(vel[mi], dot(a, vel[mi]) / Math.max(sp * sp, 1e-18)));
      const ap = len(aPerp) / dt;
      if (ap > 1e-12 && step % 8 === 0) radii.push((sp * sp) / ap);
    }
    if (springs.length && springs[0].b >= 0) {
      const s = springs[0];
      maxComp = Math.max(maxComp, s.L0 - len(sub(pos[s.b], s.a < 0 ? s.anchor : pos[s.a])));
    }
    if ((step + 1) % every === 0) frames.push({ t, pos: pos.map((x) => [...x] as V3), vel: vel.map((x) => [...x] as V3) });
  }

  // Period: the first time the body comes back (closest) to its start after having moved away.
  let period = NaN;
  if (dispTrace.length > 4) {
    const far = Math.max(...dispTrace.map((x) => x.d));
    let away = false;
    for (let i = 1; i < dispTrace.length - 1; i++) {
      if (dispTrace[i].d > 0.5 * far) away = true;
      if (away && dispTrace[i].d <= dispTrace[i - 1].d && dispTrace[i].d <= dispTrace[i + 1].d && dispTrace[i].d < 0.05 * far) {
        // refine with a parabola through the three samples
        const [a, b, c] = [dispTrace[i - 1], dispTrace[i], dispTrace[i + 1]];
        const denom = a.d - 2 * b.d + c.d;
        period = denom > 0 ? b.t + ((a.d - c.d) / (2 * denom)) * (b.t - a.t) : b.t;
        break;
      }
    }
  }

  const all = frames.flatMap((f) => f.pos);
  const min: V3 = [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1])), Math.min(...all.map((p) => p[2]))];
  const max: V3 = [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1])), Math.max(...all.map((p) => p[2]))];
  if (gY !== null) min[1] = Math.min(min[1], gY);

  let value = NaN;
  if (m && mi >= 0) {
    const sorted = [...radii].sort((a, b) => a - b);
    const last = vel[mi];
    value = {
      max_height: maxY - (gY ?? 0),
      bounce_height: bounced ? bounceMaxY - (gY ?? 0) : NaN,
      range: landRange,
      time_to_ground: landT,
      time_of_flight: landT,
      speed_at_ground: landSpeed,
      max_speed: maxSpeed,
      final_speed: len(last),
      final_velocity_x: last[0],
      period,
      min_distance: minDist,
      max_compression: maxComp,
      max_displacement: maxDisp,
      radius_of_path: sorted.length ? sorted[Math.floor(sorted.length / 2)] : NaN,
      time_to_stop: stopT,
      distance_travelled: travelled,
    }[m.kind];
  }
  return {
    frames,
    measured: m && Number.isFinite(value) ? { value, unit: UNIT[m.kind] } : null,
    events: [...new Set(events)].slice(0, 6),
    bounds: { min, max },
  };
}

/**
 * Keeps an AI-built scene watchable: if the motion repeats many times within the run (e.g. 150 loops of a
 * proton), shorten the run to about two full cycles. The physics is unchanged; only how long we show it.
 */
export function tidyScene(scene: SceneSpec): SceneSpec {
  const main = scene.measure?.body ?? scene.bodies.find((b) => !b.fixed)?.id;
  if (!main) return scene;
  const probe = simulate({ ...scene, measure: { kind: "period", body: main, body2: "" } }, { steps: 40_000, frames: 20 });
  const T = probe.measured?.value;
  if (T && Number.isFinite(T) && T > 0 && T < scene.duration / 3) return { ...scene, duration: 2.2 * T };
  return scene;
}
