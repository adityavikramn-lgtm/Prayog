// Practice set for the rough-dome notes (scripts/hemisphere-notes.mts).
// Every answer is computed here from the closed-form physics; tests/hemisphere-notes.test.ts
// checks each one a second, independent way (step-by-step simulation or numerical integration).

import { DragSetup, forcesAt, totalWork, workUpTo } from "../physics/hemisphere";
import { EXAMPLE, MISTAKES } from "../templates/hemisphere/model";

const DEG = Math.PI / 180;

/** The worked example from the video: 2 kg, R = 1 m, μ = 0.5, g = 10 → 30 J. */
export const WORKED = {
  setup: EXAMPLE,
  lift: workUpTo(EXAMPLE, Math.PI / 2).againstGravity,
  friction: workUpTo(EXAMPLE, Math.PI / 2).againstFriction,
  total: totalWork(EXAMPLE),
  wrongNoFriction: MISTAKES[0].value(EXAMPLE),
  wrongNEqualsMg: MISTAKES[1].value(EXAMPLE),
  pullBottom: forcesAt(EXAMPLE, 0).tension,
  pullTop: forcesAt(EXAMPLE, Math.PI / 2).tension,
};

/** Where the pull is largest: T = mg(cos φ + μ sin φ) peaks where tan φ = μ, at mg√(1 + μ²). */
export function maxPull(s: DragSetup) {
  const phi = Math.atan(s.mu);
  return { phiDeg: phi / DEG, tension: s.m * s.g * Math.sqrt(1 + s.mu * s.mu) };
}

const smooth: DragSetup = { m: 2, g: 10, R: 1, mu: 0 };
const other: DragSetup = { m: 1, g: 10, R: 0.5, mu: 0.3 };

export const PRACTICE = {
  /** P1. Same dome, but smooth (μ = 0). */
  smooth: { setup: smooth, answer: totalWork(smooth) },
  /** P2. m = 1 kg, R = 0.5 m, μ = 0.3. */
  other: { setup: other, answer: totalWork(other) },
  /** P3. The worked example, but the person stops at φ = 60°. */
  partial: { setup: EXAMPLE, phiDeg: 60, ...workUpTo(EXAMPLE, 60 * DEG) },
  /** P4. Normal force and friction at φ = 30° (worked example). */
  at30: { setup: EXAMPLE, phiDeg: 30, ...forcesAt(EXAMPLE, 30 * DEG) },
  /** P5. Where is the pull largest, and how large? (worked example) */
  peak: { setup: EXAMPLE, ...maxPull(EXAMPLE) },
};
