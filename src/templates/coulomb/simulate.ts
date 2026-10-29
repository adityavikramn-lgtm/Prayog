import { Derivative, State, locateEvent, rk4Step } from "../../physics/rk4";

export interface ReleaseSetup {
  k: number;
  q1: number;
  q2: number;
  m1: number;
  m2: number;
  r0: number;
}

export interface ReleaseSample {
  t: number;
  x1: number;
  x2: number;
  v1: number; // signed, along +x
  v2: number;
}

/**
 * Two charges on a line, released from rest at x = 0 and x = r0. Only Coulomb's
 * law and F = ma go in: RK4 with a fixed step. No energy formula is used, so the
 * result is an independent check of `releaseSpeeds`.
 */
function setup({ k, q1, q2, m1, m2 }: ReleaseSetup): Derivative {
  return (_t, s) => {
    const r = s[2] - s[0];
    const f = (k * q1 * q2) / (r * r); // > 0 pushes them apart
    return [s[1], -f / m1, s[3], f / m2];
  };
}

/** Natural time scale of the motion, used to pick the fixed step. */
export function timeScale({ k, q1, q2, m1, m2, r0 }: ReleaseSetup): number {
  const mu = (m1 * m2) / (m1 + m2);
  return Math.sqrt((mu * r0 ** 3) / Math.abs(k * q1 * q2));
}

/** Runs until the separation reaches `rEnd`; the crossing is located by bisection. */
export function simulateRelease(
  s: ReleaseSetup,
  rEnd: number,
  stepsPerTimeScale = 2000,
): { t: number; v1: number; v2: number; momentum: number } {
  const f = setup(s);
  const dt = timeScale(s) / stepsPerTimeScale;
  let t = 0;
  let y: State = [0, 0, s.r0, 0];
  for (let i = 0; i < 50_000_000; i++) {
    const next = rk4Step(f, t, y, dt);
    if (next[2] - next[0] >= rEnd) {
      const hit = locateEvent(f, t, y, dt, (st) => st[2] - st[0] - rEnd);
      return { t: hit.t, v1: hit.y[1], v2: hit.y[3], momentum: s.m1 * hit.y[1] + s.m2 * hit.y[3] };
    }
    t += dt;
    y = next;
  }
  throw new Error("Charges did not reach the target separation");
}

/** Evenly spaced samples of the motion up to `tEnd`, for drawing frames. */
export function sampleRelease(s: ReleaseSetup, tEnd: number, samples: number): ReleaseSample[] {
  const f = setup(s);
  const dt = timeScale(s) / 2000;
  const out: ReleaseSample[] = [];
  let t = 0;
  let y: State = [0, 0, s.r0, 0];
  for (let i = 0; i <= samples; i++) {
    const target = (tEnd * i) / samples;
    while (t + dt <= target) {
      y = rk4Step(f, t, y, dt);
      t += dt;
    }
    const last = rk4Step(f, t, y, target - t);
    out.push({ t: target, x1: last[0], v1: last[1], x2: last[2], v2: last[3] });
  }
  return out;
}
