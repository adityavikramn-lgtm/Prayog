// Simple harmonic motion: a mass on a spring, and the simple pendulum.

import { z } from "zod";
import { locateEvent, rk4Step } from "../physics/rk4";
import { Solution, fmt, q } from "./common";

// ---------- spring ----------

export const SpringParams = z.object({
  m: z.number().positive().max(1e4).describe("mass, kg"),
  k: z.number().positive().max(1e7).describe("spring constant, N/m"),
  A: z.number().positive().max(100).default(0.1).describe("amplitude, m"),
});
export type SpringParams = z.infer<typeof SpringParams>;
export const springExample: SpringParams = { m: 0.5, k: 50, A: 0.1 };

export const springMotion = (p: SpringParams) => {
  const omega = Math.sqrt(p.k / p.m);
  return { omega, period: (2 * Math.PI) / omega, at: (t: number) => ({ x: p.A * Math.cos(omega * t), v: -p.A * omega * Math.sin(omega * t) }) };
};

export function solveSpring(p: SpringParams): Solution {
  const { omega, period } = springMotion(p);
  const vMax = p.A * omega;
  const aMax = p.A * omega * omega;
  const E = 0.5 * p.k * p.A * p.A;
  // Independent check: integrate m x'' = −k x from rest at x = A, find when it is next at rest at x = A.
  const f = (_t: number, y: readonly number[]) => [y[1], (-p.k / p.m) * y[0]];
  let y = [p.A, 0];
  let t = 0;
  const dt = period / 4000;
  let vPeak = 0;
  let turns = 0;
  for (let i = 0; i < 1e6; i++) {
    const next = rk4Step(f, t, y, dt);
    vPeak = Math.max(vPeak, Math.abs(next[1]));
    if (Math.sign(next[1]) !== Math.sign(y[1]) && t > 0) {
      turns++;
      if (turns === 2) {
        t = locateEvent(f, t, y, dt, (s) => s[1]).t;
        break;
      }
    }
    y = next;
    t += dt;
  }
  return {
    quantities: [
      q("omega", "Angular frequency", "\\omega", omega, "rad/s"),
      q("period", "Time period", "T", period, "s"),
      q("freq", "Frequency", "f", 1 / period, "Hz"),
      q("vMax", "Maximum speed (at the middle)", "v_{max}", vMax, "m/s"),
      q("aMax", "Maximum acceleration (at the ends)", "a_{max}", aMax, "m/s²"),
      q("E", "Total energy", "E", E, "J"),
    ],
    steps: [
      { text: "The spring pulls back with F = −kx, so the motion is SHM.", tex: `\\omega = \\sqrt{\\dfrac{k}{m}} = \\sqrt{\\dfrac{${fmt(p.k)}}{${fmt(p.m)}}} = ${fmt(omega)}\\ \\text{rad/s}` },
      { text: "Time period: one full back-and-forth.", tex: `T = 2\\pi\\sqrt{\\dfrac{m}{k}} = ${fmt(period)}\\ \\text{s}` },
      { text: "Fastest at the middle, where all the energy is kinetic.", tex: `v_{max} = A\\omega = ${fmt(p.A)}\\times${fmt(omega)} = ${fmt(vMax)}\\ \\text{m/s}` },
      { text: "Biggest acceleration at the ends, where the spring is stretched most.", tex: `a_{max} = A\\omega^2 = ${fmt(aMax)}\\ \\text{m/s}^2` },
      { text: "Total energy stays the same: all spring energy at the ends.", tex: `E = \\tfrac12 kA^2 = ${fmt(E)}\\ \\text{J}` },
    ],
    checks: [
      { label: "Time period", formula: period, simulation: t },
      { label: "Maximum speed", formula: vMax, simulation: vPeak },
    ],
    notes: [],
  };
}

// ---------- pendulum ----------

export const PendulumParams = z.object({
  L: z.number().positive().max(1e3).describe("length, m"),
  amplitudeDeg: z.number().min(0.5).max(60).default(5).describe("how far it is pulled aside, degrees"),
  g: z.number().positive().max(100).default(10),
});
export type PendulumParams = z.infer<typeof PendulumParams>;
export const pendulumExample: PendulumParams = { L: 1, amplitudeDeg: 5, g: 10 };

/** Arithmetic–geometric mean: gives the exact large-swing period, T = T₀ / AGM(1, cos(θ₀/2)). */
export function agm(a: number, b: number) {
  for (let i = 0; i < 60 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return a;
}

export function pendulumMotion(p: PendulumParams) {
  const th0 = (p.amplitudeDeg * Math.PI) / 180;
  const small = 2 * Math.PI * Math.sqrt(p.L / p.g);
  const exact = small / agm(1, Math.cos(th0 / 2));
  return { th0, small, exact };
}

/** The swing angle over time from a step-by-step integration (used to draw the 3D pendulum). */
export function pendulumPath(p: PendulumParams, seconds: number, dt = 1 / 240) {
  const { th0 } = pendulumMotion(p);
  const f = (_t: number, y: readonly number[]) => [y[1], (-p.g / p.L) * Math.sin(y[0])];
  const out: number[] = [];
  let y = [th0, 0];
  for (let i = 0; i * dt <= seconds; i++) {
    out.push(y[0]);
    y = rk4Step(f, i * dt, y, dt);
  }
  return { dt, angles: out };
}

export function solvePendulum(p: PendulumParams): Solution {
  const { th0, small, exact } = pendulumMotion(p);
  const vMax = Math.sqrt(2 * p.g * p.L * (1 - Math.cos(th0)));
  // Independent check: integrate θ'' = −(g/L) sin θ (no small-angle shortcut) and time one full swing.
  const f = (_t: number, y: readonly number[]) => [y[1], (-p.g / p.L) * Math.sin(y[0])];
  let y = [th0, 0];
  let t = 0;
  const dt = exact / 8000;
  let turns = 0;
  let wPeak = 0;
  for (let i = 0; i < 1e6; i++) {
    const next = rk4Step(f, t, y, dt);
    wPeak = Math.max(wPeak, Math.abs(next[1]));
    if (Math.sign(next[1]) !== Math.sign(y[1]) && t > 0) {
      turns++;
      if (turns === 2) {
        t = locateEvent(f, t, y, dt, (s) => s[1]).t;
        break;
      }
    }
    y = next;
    t += dt;
  }
  const diffPct = ((exact - small) / small) * 100;
  return {
    quantities: [
      q("period", "Time period (small swings)", "T", small, "s"),
      q("exact", "Exact period at this swing", "T_{exact}", exact, "s"),
      q("freq", "Frequency", "f", 1 / small, "Hz"),
      q("vMax", "Speed at the bottom", "v_{max}", vMax, "m/s"),
    ],
    steps: [
      { text: "For small swings, sin θ ≈ θ, so the pendulum does SHM.", tex: `T = 2\\pi\\sqrt{\\dfrac{L}{g}} = 2\\pi\\sqrt{\\dfrac{${fmt(p.L)}}{${fmt(p.g)}}} = ${fmt(small)}\\ \\text{s}` },
      { text: "Mass does not appear: a heavy and a light bob swing at the same rate." },
      { text: "Speed at the bottom, from energy (height lost = L(1 − cos θ₀)).", tex: `v_{max} = \\sqrt{2gL(1-\\cos\\theta_0)} = ${fmt(vMax)}\\ \\text{m/s}` },
      { text: `Big swings are slightly slower. At ${fmt(p.amplitudeDeg)}° the exact period is ${diffPct.toFixed(2)}% longer.`, tex: `T_{exact} = ${fmt(exact)}\\ \\text{s}` },
    ],
    checks: [
      { label: "Exact period", formula: exact, simulation: t },
      { label: "Speed at the bottom", formula: vMax, simulation: wPeak * p.L },
    ],
    notes: [`Exam answer uses the small-swing formula; the exact period differs by ${diffPct.toFixed(2)}%.`],
  };
}
