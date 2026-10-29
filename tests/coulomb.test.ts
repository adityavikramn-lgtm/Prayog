import { describe, expect, it } from "vitest";
import { K_JEE, coulombForce, netForce, nullPointBetween, releaseSpeeds } from "../src/physics/coulomb";
import { seededRandom } from "../src/physics/random";
import {
  SETUPS,
  lawForce,
  nullPointFromQ1,
  probeForce,
  releaseAt,
  releaseTerminalSpeed,
  thirdLawForce,
  triangleCharges,
  triangleNetForce,
} from "../src/templates/coulomb/model";
import { sampleRelease, simulateRelease, timeScale } from "../src/templates/coulomb/simulate";

const relErr = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("Coulomb's law: hand-checked JEE values", () => {
  it("2 µC and 3 µC at 3 cm: F = 60 N; at 6 cm: 15 N (inverse square)", () => {
    expect(lawForce()).toBeCloseTo(60, 9);
    expect(lawForce(0.06)).toBeCloseTo(15, 9);
  });

  it("doubling r always quarters F", () => {
    const rand = seededRandom(7);
    for (let i = 0; i < 50; i++) {
      const r = 0.01 + rand();
      expect(relErr(lawForce(2 * r), lawForce(r) / 4)).toBeLessThan(1e-12);
    }
  });

  it("1 µC and 4 µC at 30 cm: 0.4 N on each (Newton's third law)", () => {
    expect(thirdLawForce()).toBeCloseTo(0.4, 12);
    const { q1, q2, r } = SETUPS.third;
    const onA = netForce(K_JEE, { q: q1, x: 0, y: 0 }, [{ q: q2, x: r, y: 0 }]);
    const onB = netForce(K_JEE, { q: q2, x: r, y: 0 }, [{ q: q1, x: 0, y: 0 }]);
    expect(onA.fx).toBeCloseTo(-onB.fx, 12);
    expect(Math.abs(onA.fx)).toBeCloseTo(0.4, 12);
  });

  it("unlike charges attract (negative sign)", () => {
    expect(coulombForce(K_JEE, 1e-6, -1e-6, 0.1)).toBeLessThan(0);
  });
});

describe("superposition: equilateral triangle", () => {
  it("each pair pushes with 0.9 N; net force on the top charge is 0.9√3 ≈ 1.56 N, straight up", () => {
    const { A, B } = triangleCharges();
    expect(coulombForce(K_JEE, A.q, B.q, SETUPS.triangle.a)).toBeCloseTo(0.9, 12);
    const f = triangleNetForce();
    expect(Math.abs(f.fx)).toBeLessThan(1e-12);
    expect(f.fy).toBeCloseTo(0.9 * Math.sqrt(3), 12);
  });
});

describe("null point between +2 µC and +8 µC, 30 cm apart", () => {
  it("is 10 cm from the 2 µC charge", () => {
    expect(nullPointFromQ1()).toBeCloseTo(0.1, 12);
  });

  it("is confirmed independently: bisection on the net force finds the same point", () => {
    let lo = 0.001;
    let hi = SETUPS.nullPoint.d - 0.001;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (probeForce(mid) > 0) lo = mid;
      else hi = mid;
    }
    expect(Math.abs((lo + hi) / 2 - nullPointFromQ1())).toBeLessThan(1e-12);
  });

  it("the formula works for other charge pairs too", () => {
    const rand = seededRandom(99);
    for (let i = 0; i < 50; i++) {
      const q1 = (0.5 + rand() * 9) * 1e-6;
      const q2 = (0.5 + rand() * 9) * 1e-6;
      const d = 0.05 + rand();
      const x = nullPointBetween(q1, q2, d);
      const f = coulombForce(K_JEE, 1e-6, q1, x) - coulombForce(K_JEE, 1e-6, q2, d - x);
      expect(Math.abs(f) / coulombForce(K_JEE, 1e-6, q1, x)).toBeLessThan(1e-9);
    }
  });
});

describe("released from rest: energy formula vs RK4 simulation", () => {
  it("video setup: speed at 30 cm is √6 ≈ 2.45 m/s and the limit far away is 3 m/s", () => {
    expect(releaseAt(SETUPS.releaseEnd).v1).toBeCloseTo(Math.sqrt(6), 12);
    expect(releaseTerminalSpeed()).toBeCloseTo(3, 12);
    const sim = simulateRelease(SETUPS.release, SETUPS.releaseEnd);
    expect(relErr(-sim.v1, Math.sqrt(6))).toBeLessThan(1e-6);
    expect(relErr(sim.v2, Math.sqrt(6))).toBeLessThan(1e-6);
    expect(Math.abs(sim.momentum)).toBeLessThan(1e-12);
  });

  const rand = seededRandom(20261029);
  const cases = Array.from({ length: 40 }, () => ({
    k: K_JEE,
    q1: (0.2 + rand() * 5) * 1e-6,
    q2: (0.2 + rand() * 5) * 1e-6,
    m1: 0.001 + rand() * 0.05,
    m2: 0.001 + rand() * 0.05,
    r0: 0.02 + rand() * 0.3,
  }));

  it.each(cases.map((c, i) => [i + 1, c] as const))("random case %i agrees within 0.1%%", (_i, c) => {
    const rEnd = c.r0 * (1.5 + 2 * ((c.q1 * 1e6) % 1));
    const exact = releaseSpeeds({ ...c, r: rEnd });
    const sim = simulateRelease(c, rEnd);
    expect(relErr(-sim.v1, exact.v1)).toBeLessThan(1e-3);
    expect(relErr(sim.v2, exact.v2)).toBeLessThan(1e-3);
    expect(Math.abs(sim.momentum) / (c.m1 * exact.v1)).toBeLessThan(1e-9);
  });

  it("samples used for drawing conserve energy along the whole motion", () => {
    const s = SETUPS.release;
    const samples = sampleRelease(s, 12 * timeScale(s), 60);
    const E0 = (s.k * s.q1 * s.q2) / s.r0;
    for (const p of samples) {
      const ke = 0.5 * s.m1 * p.v1 ** 2 + 0.5 * s.m2 * p.v2 ** 2;
      const pe = (s.k * s.q1 * s.q2) / (p.x2 - p.x1);
      expect(relErr(ke + pe, E0)).toBeLessThan(1e-6);
    }
  });
});
