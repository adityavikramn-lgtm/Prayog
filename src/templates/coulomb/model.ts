import { K_JEE, PointCharge, coulombForce, netForce, nullPointBetween, releaseSpeeds } from "../../physics/coulomb";
import { ReleaseSetup } from "./simulate";

const micro = 1e-6;

/**
 * Every setup the Coulomb explainer uses. Chosen so the answers come out clean,
 * the way JEE numbers do. All answers are computed, never typed.
 */
export const SETUPS = {
  /** F = kq₁q₂/r²: 2 µC and 3 µC, 3 cm apart → 60 N; at 6 cm → 15 N. */
  law: { q1: 2 * micro, q2: 3 * micro, r: 0.03 },
  /** Newton's third law: 1 µC and 4 µC, 30 cm apart → 0.4 N on each. */
  third: { q1: 1 * micro, q2: 4 * micro, r: 0.3 },
  /** Released from rest: 1 µC each, 10 g each, 10 cm apart, watched until 30 cm. */
  release: { k: K_JEE, q1: 1 * micro, q2: 1 * micro, m1: 0.01, m2: 0.01, r0: 0.1 } satisfies ReleaseSetup,
  releaseEnd: 0.3,
  /** Superposition: three 1 µC charges on an equilateral triangle of side 10 cm. */
  triangle: { q: 1 * micro, a: 0.1 },
  /** Pause and predict: +2 µC and +8 µC, 30 cm apart. Where is the net force on a test charge zero? */
  nullPoint: { q1: 2 * micro, q2: 8 * micro, d: 0.3 },
} as const;

export function lawForce(r: number = SETUPS.law.r): number {
  return coulombForce(K_JEE, SETUPS.law.q1, SETUPS.law.q2, r);
}

export function thirdLawForce(): number {
  return coulombForce(K_JEE, SETUPS.third.q1, SETUPS.third.q2, SETUPS.third.r);
}

export function releaseAt(r: number) {
  const s = SETUPS.release;
  return releaseSpeeds({ k: s.k, q1: s.q1, q2: s.q2, m1: s.m1, m2: s.m2, r0: s.r0, r });
}

/** Speed each charge approaches as they fly infinitely far apart. */
export function releaseTerminalSpeed(): number {
  const s = SETUPS.release;
  return releaseSpeeds({ k: s.k, q1: s.q1, q2: s.q2, m1: s.m1, m2: s.m2, r0: s.r0, r: Infinity }).v1;
}

/** Triangle corners: A at the top, B bottom-left, C bottom-right (metres, y up). */
export function triangleCharges(): { A: PointCharge; B: PointCharge; C: PointCharge } {
  const { q, a } = SETUPS.triangle;
  return {
    A: { q, x: 0, y: (a * Math.sqrt(3)) / 2 },
    B: { q, x: -a / 2, y: 0 },
    C: { q, x: a / 2, y: 0 },
  };
}

export function triangleNetForce() {
  const { A, B, C } = triangleCharges();
  return netForce(K_JEE, A, [B, C]);
}

/** Distance of the null point from the 2 µC charge. */
export function nullPointFromQ1(): number {
  const { q1, q2, d } = SETUPS.nullPoint;
  return nullPointBetween(q1, q2, d);
}

/** Net force on a +1 µC test charge at distance x from q1 (positive = towards q2). */
export function probeForce(x: number, testQ = 1e-6): number {
  const { q1, q2, d } = SETUPS.nullPoint;
  return coulombForce(K_JEE, testQ, q1, x) - coulombForce(K_JEE, testQ, q2, d - x);
}
