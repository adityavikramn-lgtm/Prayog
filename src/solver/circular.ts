// Circular motion: a car on a banked (or flat) road, and the conical pendulum.

import { z } from "zod";
import { rk4Step } from "../physics/rk4";
import { Check, Quantity, Solution, Step, fmt, q, trig } from "./common";

// ---------- banked road ----------

export const BankedParams = z.object({
  r: z.number().positive().max(1e5).describe("radius of the turn, m"),
  angleDeg: z.number().min(0).max(80).default(0).describe("banking angle, degrees (0 = flat road)"),
  mu: z.number().min(0).max(2).default(0).describe("coefficient of friction between tyres and road"),
  m: z.number().positive().max(1e6).default(1000).describe("mass of the car, kg"),
  v: z.number().min(0).max(500).optional().describe("actual speed of the car, m/s (optional)"),
  g: z.number().positive().max(100).default(10),
});
export type BankedParams = z.infer<typeof BankedParams>;
export const bankedExample: BankedParams = { r: 100, angleDeg: 37, mu: 0.25, m: 1000, g: 10 };

/** Normal force and friction (up-slope positive... here: friction positive DOWN the slope) needed at speed v, from the two force balances. */
export function bankedForces(p: BankedParams, v: number) {
  const { sin, cos } = trig(p.angleDeg);
  // Towards the centre: N sinθ + f cosθ = m v²/r ;  vertical: N cosθ − f sinθ = m g. Solve by Cramer's rule.
  const a1 = sin;
  const b1 = cos;
  const c1 = (p.m * v * v) / p.r;
  const a2 = cos;
  const b2 = -sin;
  const c2 = p.m * p.g;
  const det = a1 * b2 - b1 * a2; // = −1
  return { N: (c1 * b2 - b1 * c2) / det, f: (a1 * c2 - c1 * a2) / det };
}

export function bankedSpeeds(p: BankedParams) {
  const { tan } = trig(p.angleDeg);
  const vIdeal = Math.sqrt(p.r * p.g * tan);
  const vMax = 1 - p.mu * tan <= 0 ? Infinity : Math.sqrt((p.r * p.g * (tan + p.mu)) / (1 - p.mu * tan));
  const vMin = tan <= p.mu ? 0 : Math.sqrt((p.r * p.g * (tan - p.mu)) / (1 + p.mu * tan));
  return { vIdeal, vMax, vMin };
}

/** Speed where the friction needed is exactly `ratio` × N, found by bisection on the force balance (no formula). */
function bisectRatio(p: BankedParams, ratio: number, lo: number, hi: number) {
  const g = (v: number) => {
    const { N, f } = bankedForces(p, v);
    return f - ratio * N;
  };
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200; i++) {
    const mid = (a + b) / 2;
    if (Math.sign(g(mid)) === Math.sign(g(a))) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
}

export function solveBanked(p: BankedParams): Solution {
  const { sin, cos, tan, jee } = trig(p.angleDeg);
  const { vIdeal, vMax, vMin } = bankedSpeeds(p);
  const flat = p.angleDeg === 0;
  const steps: Step[] = [
    { text: "The car moves in a circle, so the net force must point to the centre: m v² / r." },
    flat
      ? { text: "On a flat road only friction can point to the centre.", tex: `f = \\dfrac{mv^2}{r} \\le \\mu mg` }
      : {
          text: `Forces: weight, normal force (tilted with the road) and friction along the road${jee ? " (JEE: sin 37° = 3/5, cos 37° = 4/5)" : ""}.`,
          tex: `N\\sin\\theta + f\\cos\\theta = \\dfrac{mv^2}{r},\\qquad N\\cos\\theta - f\\sin\\theta = mg`,
        },
  ];
  const quantities: Quantity[] = [];
  const checks: Check[] = [];
  const vHi = Math.max(10, (Number.isFinite(vMax) ? vMax : vIdeal) * 3 + 10);
  if (!flat) {
    steps.push({ text: "Ideal speed: no friction needed at all (f = 0).", tex: `v_0 = \\sqrt{rg\\tan\\theta} = \\sqrt{${fmt(p.r)}\\times${fmt(p.g)}\\times${fmt(tan)}} = ${fmt(vIdeal)}\\ \\text{m/s}` });
    quantities.push(q("vIdeal", "Ideal speed (no friction needed)", "v_0", vIdeal, "m/s"));
    checks.push({ label: "Ideal speed", formula: vIdeal, simulation: bisectRatio(p, 0, 0, vHi) });
  }
  if (p.mu > 0) {
    steps.push({
      text: flat ? "Fastest safe speed: friction at its limit gives all the centripetal force." : "Fastest safe speed: friction at its limit, pointing down the slope.",
      tex: flat
        ? `\\mu mg = \\dfrac{mv_{max}^2}{r} \\Rightarrow v_{max} = \\sqrt{\\mu r g} = ${fmt(vMax)}\\ \\text{m/s}`
        : Number.isFinite(vMax)
        ? `v_{max} =\\sqrt{\\dfrac{rg(\\tan\\theta + \\mu)}{1 - \\mu\\tan\\theta}} = ${fmt(vMax)}\\ \\text{m/s}`
        : `1 - \\mu\\tan\\theta \\le 0 \\Rightarrow \\text{no upper limit}`,
    });
    quantities.push(q("vMax", "Maximum safe speed", "v_{max}", vMax, "m/s"));
    if (Number.isFinite(vMax)) checks.push({ label: "Maximum safe speed", formula: vMax, simulation: bisectRatio(p, p.mu, flat ? 0 : vIdeal, vHi) });
    if (!flat) {
      steps.push({
        text: "Slowest safe speed: friction at its limit, pointing up the slope (so the car does not slide down).",
        tex: vMin > 0 ? `v_{min} = \\sqrt{\\dfrac{rg(\\tan\\theta - \\mu)}{1 + \\mu\\tan\\theta}} = ${fmt(vMin)}\\ \\text{m/s}` : `\\tan\\theta \\le \\mu \\Rightarrow \\text{it can even stand still}`,
      });
      quantities.push(q("vMin", "Minimum safe speed", "v_{min}", vMin, "m/s"));
      if (vMin > 0) checks.push({ label: "Minimum safe speed", formula: vMin, simulation: bisectRatio(p, -p.mu, 0, vIdeal) });
    }
  }
  if (p.v !== undefined) {
    const { N, f } = bankedForces(p, p.v);
    // Closed form for the friction needed at speed v (down-slope positive).
    const fFormula = p.m * ((p.v * p.v) / p.r) * cos - p.m * p.g * sin;
    steps.push({ text: `At v = ${fmt(p.v)} m/s, solve the two equations for N and f.`, tex: `N = ${fmt(N)}\\ \\text{N},\\quad f = ${fmt(Math.abs(f))}\\ \\text{N}\\ \\text{(${flat ? "towards the centre" : f >= 0 ? "down the slope" : "up the slope"})}` });
    quantities.push(q("N", "Normal force at that speed", "N", N, "N"), q("f", "Friction needed at that speed", "f", Math.abs(f), "N"));
    checks.push({ label: "Friction needed", formula: fFormula, simulation: f });
    if (Math.abs(f) > p.mu * N + 1e-9) steps.push({ text: "That is more friction than the road can give: the car would skid." });
  }
  return { quantities, steps, checks, notes: [] };
}

// ---------- conical pendulum ----------

export const ConicalParams = z.object({
  L: z.number().positive().max(1e3).describe("string length, m"),
  angleDeg: z.number().min(1).max(85).describe("angle of the string from the vertical, degrees"),
  m: z.number().positive().max(1e4).default(0.5).describe("mass of the bob, kg"),
  g: z.number().positive().max(100).default(10),
});
export type ConicalParams = z.infer<typeof ConicalParams>;
export const conicalExample: ConicalParams = { L: 1, angleDeg: 37, m: 0.5, g: 10 };

export function conicalMotion(p: ConicalParams) {
  const { sin, cos } = trig(p.angleDeg);
  const omega = Math.sqrt(p.g / (p.L * cos));
  return { omega, radius: p.L * sin, depth: p.L * cos, period: (2 * Math.PI) / omega };
}

export function solveConical(p: ConicalParams): Solution {
  const { cos, jee } = trig(p.angleDeg);
  const { omega, radius, period } = conicalMotion(p);
  const T = (p.m * p.g) / cos;
  const v = omega * radius;
  // Independent check: integrate the full spherical pendulum (θ, φ) for one period.
  const th0 = Math.acos(cos);
  const f = (_t: number, y: readonly number[]) => {
    const [th, dth, , dph] = y;
    return [dth, Math.sin(th) * Math.cos(th) * dph * dph - (p.g / p.L) * Math.sin(th), dph, (-2 * dth * dph * Math.cos(th)) / Math.sin(th)];
  };
  let y = [th0, 0, 0, omega];
  const n = 4000;
  const dt = period / n;
  for (let i = 0; i < n; i++) y = rk4Step(f, i * dt, y, dt);
  return {
    quantities: [
      q("tension", "String tension", "T", T, "N"),
      q("omega", "Angular speed", "\\omega", omega, "rad/s"),
      q("period", "Time for one circle", "t_{rev}", period, "s"),
      q("v", "Speed of the bob", "v", v, "m/s"),
      q("radius", "Radius of the circle", "r", radius, "m"),
    ],
    steps: [
      { text: `The bob moves in a horizontal circle of radius r = L sin θ = ${fmt(radius)} m${jee ? " (JEE: sin 37° = 3/5)" : ""}.` },
      { text: "Vertically nothing accelerates: the up part of the tension holds the weight.", tex: `T\\cos\\theta = mg \\Rightarrow T = \\dfrac{mg}{\\cos\\theta} = ${fmt(T)}\\ \\text{N}` },
      { text: "Horizontally the inward part of the tension gives the centripetal force.", tex: `T\\sin\\theta = m\\omega^2 r \\Rightarrow \\omega = \\sqrt{\\dfrac{g}{L\\cos\\theta}} = ${fmt(omega)}\\ \\text{rad/s}` },
      { text: "Time for one full circle.", tex: `t_{rev} = 2\\pi\\sqrt{\\dfrac{L\\cos\\theta}{g}} = ${fmt(period)}\\ \\text{s}` },
      { text: "Speed of the bob.", tex: `v = \\omega r = \\sqrt{gL\\sin\\theta\\tan\\theta} = ${fmt(v)}\\ \\text{m/s}` },
    ],
    checks: [
      { label: "Angle after one full circle (should not change)", formula: th0, simulation: y[0] },
      { label: "One full circle in t_rev", formula: 2 * Math.PI, simulation: y[2] },
      // Along the string the tension supplies m ω² L (for a steady cone), using the simulated spin rate.
      { label: "Tension (from the simulated spin rate)", formula: T, simulation: p.m * p.L * y[3] * y[3] },
      { label: "Speed (from the simulated motion)", formula: v, simulation: p.L * Math.sin(y[0]) * y[3] },
    ],
    notes: [],
  };
}
