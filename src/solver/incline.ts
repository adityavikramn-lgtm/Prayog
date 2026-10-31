// Block on a rough incline: released from rest (does it slide? how fast?) or pushed up the slope.

import { z } from "zod";
import { locateEvent, rk4Step } from "../physics/rk4";
import { Check, Solution, Step, fmt, q, trig } from "./common";

export const InclineParams = z.object({
  m: z.number().positive().max(1e5).default(2).describe("mass, kg"),
  angleDeg: z.number().min(1).max(89).describe("incline angle, degrees"),
  mu: z.number().min(0).max(2).default(0).describe("coefficient of kinetic friction"),
  muS: z.number().min(0).max(2).optional().describe("coefficient of static friction (defaults to mu)"),
  L: z.number().positive().max(1e4).default(5).describe("distance along the incline, m (release case)"),
  u: z.number().min(0).max(500).default(0).describe("speed given up the incline, m/s (0 = released from rest)"),
  g: z.number().positive().max(100).default(10),
});
export type InclineParams = z.infer<typeof InclineParams>;

export const inclineExample: InclineParams = { m: 2, angleDeg: 37, mu: 0.5, L: 5, u: 0, g: 10 };

/** Acceleration along the slope (down-slope positive) for a block moving with velocity v (down-slope positive). */
function accel(p: InclineParams, v: number) {
  const { sin, cos, tan } = trig(p.angleDeg);
  const muS = p.muS ?? p.mu;
  if (Math.abs(v) < 1e-12) return tan > muS ? p.g * (sin - p.mu * cos) : 0; // static friction holds if it can
  return p.g * (sin - Math.sign(v) * p.mu * cos);
}

export function inclineMotion(p: InclineParams) {
  const { sin, cos, tan } = trig(p.angleDeg);
  const muS = p.muS ?? p.mu;
  const slides = tan > muS;
  const aDown = p.g * (sin - p.mu * cos);
  const aUp = p.g * (sin + p.mu * cos); // deceleration while moving up
  if (p.u > 0) {
    const t1 = p.u / aUp;
    const s1 = (p.u * p.u) / (2 * aUp);
    const back = slides && aDown > 0;
    const t2 = back ? Math.sqrt((2 * s1) / aDown) : Infinity;
    const end = t1 + (back ? t2 : 1.5);
    // position measured up the slope from the start
    const at = (t: number) => {
      if (t <= t1) return { s: p.u * t - 0.5 * aUp * t * t, v: p.u - aUp * t };
      if (!back) return { s: s1, v: 0 };
      const tt = Math.min(t - t1, t2);
      return { s: s1 - 0.5 * aDown * tt * tt, v: -aDown * tt };
    };
    return { mode: "up" as const, slides, aDown, aUp, t1, s1, back, t2, end, at };
  }
  const tL = slides ? Math.sqrt((2 * p.L) / aDown) : Infinity;
  const end = slides ? tL : 2;
  const at = (t: number) => (slides ? { s: -0.5 * aDown * Math.min(t, tL) ** 2, v: -aDown * Math.min(t, tL) } : { s: 0, v: 0 });
  return { mode: "release" as const, slides, aDown, aUp, tL, end, at };
}

export function solveIncline(p: InclineParams): Solution {
  const { sin, cos, tan, jee } = trig(p.angleDeg);
  const muS = p.muS ?? p.mu;
  const W = p.m * p.g;
  const N = W * cos;
  const along = W * sin;
  const mo = inclineMotion(p);
  const f = (_t: number, y: readonly number[]) => [y[1], accel(p, y[1])]; // y = [s down-slope, v down-slope]
  const steps: Step[] = [
    { text: `Split the weight W = mg = ${fmt(W)} N into parts along and across the slope${jee ? " (JEE: sin 37° = 3/5, cos 37° = 4/5)" : ""}.`, tex: `mg\\sin\\theta = ${fmt(along)}\\ \\text{N},\\quad mg\\cos\\theta = ${fmt(N)}\\ \\text{N}` },
    { text: "Across the slope nothing accelerates, so the normal force balances the across part.", tex: `N = mg\\cos\\theta = ${fmt(N)}\\ \\text{N}` },
  ];
  const quantities = [q("N", "Normal force", "N", N, "N")];
  const checks: Check[] = [];
  const notes: string[] = [];

  if (mo.mode === "release") {
    const fMax = muS * N;
    steps.push({ text: "Will it slide? Compare the pull down the slope with the most friction can give.", tex: `mg\\sin\\theta = ${fmt(along)}\\ \\text{N} ${mo.slides ? ">" : "\\le"} \\mu_s N = ${fmt(fMax)}\\ \\text{N}\\quad(\\tan\\theta = ${fmt(tan)}\\ ${mo.slides ? ">" : "\\le"}\\ \\mu_s = ${fmt(muS)})` });
    if (!mo.slides) {
      steps.push({ text: "So it stays at rest. Static friction is exactly as big as needed, not μN.", tex: `f = mg\\sin\\theta = ${fmt(along)}\\ \\text{N}` });
      quantities.push(q("f", "Friction force (static)", "f", along, "N"), q("a", "Acceleration", "a", 0, "m/s²"));
      notes.push("The block does not slide: tan θ ≤ μs.");
      // Check: simulate 2 s; it must not move.
      let y = [0, 0];
      for (let t = 0; t < 2; t += 0.01) y = rk4Step(f, t, y, 0.01);
      checks.push({ label: "Distance moved in 2 s", formula: 0, simulation: Math.abs(y[0]) });
      return { quantities, steps, checks, notes };
    }
    const fk = p.mu * N;
    const v = mo.aDown * mo.tL;
    steps.push(
      { text: "It slides, so kinetic friction acts up the slope: f = μN.", tex: `f = \\mu N = ${fmt(p.mu)}\\times${fmt(N)} = ${fmt(fk)}\\ \\text{N}` },
      { text: "Newton's second law along the slope.", tex: `a = \\dfrac{mg\\sin\\theta - f}{m} = g(\\sin\\theta - \\mu\\cos\\theta) = ${fmt(mo.aDown)}\\ \\text{m/s}^2` },
      { text: `Time to slide L = ${fmt(p.L)} m from rest.`, tex: `L = \\tfrac12 a t^2 \\Rightarrow t = \\sqrt{\\dfrac{2L}{a}} = ${fmt(mo.tL)}\\ \\text{s}` },
      { text: "Speed after that distance.", tex: `v = \\sqrt{2aL} = ${fmt(v)}\\ \\text{m/s}` },
    );
    quantities.push(q("f", "Friction force (kinetic)", "f", fk, "N"), q("a", "Acceleration down the slope", "a", mo.aDown, "m/s²"), q("t", `Time to slide ${fmt(p.L)} m`, "t", mo.tL, "s"), q("v", "Speed at that point", "v", v, "m/s"));
    // Check: integrate from rest (give it a nudge of 1e-12 so kinetic friction applies) until s = L.
    let y = [0, 0];
    let t = 0;
    const dt = Math.max(1e-4, mo.tL / 4000);
    for (let i = 0; i < 1e6; i++) {
      const next = rk4Step(f, t, y, dt);
      if (next[0] >= p.L) {
        const hit = locateEvent(f, t, y, dt, (s) => s[0] - p.L);
        t = hit.t;
        y = hit.y;
        break;
      }
      y = next;
      t += dt;
    }
    checks.push({ label: "Acceleration (from the simulated run, 2L/t²)", formula: mo.aDown, simulation: (2 * p.L) / (t * t) }, { label: "Time to slide", formula: mo.tL, simulation: t }, { label: "Final speed", formula: v, simulation: y[1] });
    return { quantities, steps, checks, notes };
  }

  // Pushed up the slope with speed u.
  const fk = p.mu * N;
  steps.push(
    { text: "Moving up: gravity's part AND friction both point down the slope, so it slows down fast.", tex: `a_{up} = g(\\sin\\theta + \\mu\\cos\\theta) = ${fmt(mo.aUp)}\\ \\text{m/s}^2` },
    { text: "Distance up the slope before it stops.", tex: `s = \\dfrac{u^2}{2a_{up}} = \\dfrac{${fmt(p.u)}^2}{2\\times${fmt(mo.aUp)}} = ${fmt(mo.s1!)}\\ \\text{m}` },
    { text: "Time to stop.", tex: `t_1 = \\dfrac{u}{a_{up}} = ${fmt(mo.t1!)}\\ \\text{s}` },
  );
  quantities.push(q("f", "Friction force (kinetic)", "f", fk, "N"), q("aUp", "Deceleration going up", "a_{up}", mo.aUp, "m/s²"), q("s", "Distance up the slope", "s", mo.s1!, "m"), q("t1", "Time to stop", "t_1", mo.t1!, "s"));
  if (mo.back) {
    const vBack = mo.aDown * mo.t2!;
    steps.push(
      { text: "At the top, tan θ > μs, so it slides back down. Now friction points up the slope.", tex: `a_{down} = g(\\sin\\theta - \\mu\\cos\\theta) = ${fmt(mo.aDown)}\\ \\text{m/s}^2` },
      { text: "Time and speed coming back to the start.", tex: `t_2 = \\sqrt{\\dfrac{2s}{a_{down}}} = ${fmt(mo.t2!)}\\ \\text{s},\\quad v = a_{down}t_2 = ${fmt(vBack)}\\ \\text{m/s}` },
    );
    quantities.push(q("t2", "Time to come back", "t_2", mo.t2!, "s"), q("vBack", "Speed back at the start", "v", vBack, "m/s"));
  } else {
    steps.push({ text: "At the top, tan θ ≤ μs, so static friction holds it there." });
    notes.push("After stopping, the block stays put.");
  }
  // Check: integrate (down-slope positive, so start with v = −u) until v = 0, then until back at s = 0.
  // Each phase is integrated with its own forces (friction opposes the motion of that phase), and the
  // moment the block stops is found by event detection, so friction never flips inside a step.
  const { sin: sn, cos: cs } = trig(p.angleDeg);
  const fUp = (_t: number, y: readonly number[]) => [y[1], p.g * (sn + p.mu * cs)]; // moving up the slope (v < 0)
  const fDown = (_t: number, y: readonly number[]) => [y[1], p.g * (sn - p.mu * cs)]; // moving down (v > 0)
  let y = [0, -p.u];
  let t = 0;
  const dt = Math.max(1e-5, mo.t1! / 4000);
  let tStop = NaN;
  let sStop = NaN;
  for (let i = 0; i < 1e6; i++) {
    const next = rk4Step(fUp, t, y, dt);
    if (y[1] < 0 && next[1] >= 0) {
      const hit = locateEvent(fUp, t, y, dt, (s) => s[1]);
      tStop = hit.t;
      sStop = -hit.y[0];
      break;
    }
    y = next;
    t += dt;
  }
  checks.push({ label: "Distance up the slope", formula: mo.s1!, simulation: sStop }, { label: "Time to stop", formula: mo.t1!, simulation: tStop });
  if (mo.back) {
    let z = [-sStop, 0];
    let tt = 0;
    for (let i = 0; i < 1e6; i++) {
      const next = rk4Step(fDown, tt, z, dt);
      if (next[0] >= 0) {
        const hit = locateEvent(fDown, tt, z, dt, (s) => s[0]);
        tt = hit.t;
        z = hit.y;
        break;
      }
      z = next;
      tt += dt;
    }
    checks.push({ label: "Time to come back", formula: mo.t2!, simulation: tt }, { label: "Speed back at the start", formula: mo.aDown * mo.t2!, simulation: z[1] });
  }
  return { quantities, steps, checks, notes };
}
