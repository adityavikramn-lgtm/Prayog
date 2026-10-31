import { describe, expect, it } from "vitest";
import { TEMPLATES, TemplateId, solveTemplate } from "../src/solver";
import { bankedForces, bankedSpeeds } from "../src/solver/circular";
import { relDiff, trig } from "../src/solver/common";
import { agm, pendulumMotion } from "../src/solver/shm";

const value = (id: TemplateId, p: Record<string, unknown>, key: string) => solveTemplate(id, p).solution.quantities.find((q) => q.key === key)!.value;

/** Small seeded generator so the random checks are the same every run. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("every example question: formula = simulation", () => {
  for (const t of TEMPLATES)
    it(`${t.id}`, () => {
      const s = solveTemplate(t.id, t.example);
      expect(s.verified).toBe(true);
      for (const c of s.solution.checks) expect(relDiff(c.formula, c.simulation), c.label).toBeLessThan(1e-3);
    });
});

describe("hand-checked JEE values (third route)", () => {
  it("projectile 20 m/s at 37°: T = 2.4 s, R = 38.4 m, H = 7.2 m", () => {
    expect(value("projectile", { u: 20, angleDeg: 37 }, "T")).toBeCloseTo(2.4, 10);
    expect(value("projectile", { u: 20, angleDeg: 37 }, "R")).toBeCloseTo(38.4, 10);
    expect(value("projectile", { u: 20, angleDeg: 37 }, "H")).toBeCloseTo(7.2, 10);
  });
  it("thrown flat at 10 m/s from 20 m: lands after 2 s, 20 m away, at √500 m/s", () => {
    expect(value("projectile", { u: 10, angleDeg: 0, h: 20 }, "T")).toBeCloseTo(2, 10);
    expect(value("projectile", { u: 10, angleDeg: 0, h: 20 }, "R")).toBeCloseTo(20, 10);
    expect(value("projectile", { u: 10, angleDeg: 0, h: 20 }, "vEnd")).toBeCloseTo(Math.sqrt(500), 10);
  });
  it("incline 37°, μ = 0.5: a = 2 m/s², 5 m in √5 s", () => {
    expect(value("incline", { m: 2, angleDeg: 37, mu: 0.5, L: 5 }, "a")).toBeCloseTo(2, 10);
    expect(value("incline", { m: 2, angleDeg: 37, mu: 0.5, L: 5 }, "t")).toBeCloseTo(Math.sqrt(5), 10);
  });
  it("incline 37°, μs = 0.8: does not slide, friction = mg sin θ = 12 N", () => {
    const s = solveTemplate("incline", { m: 2, angleDeg: 37, mu: 0.8 });
    expect(s.solution.notes[0]).toContain("does not slide");
    expect(s.solution.quantities.find((q) => q.key === "f")!.value).toBeCloseTo(12, 10);
  });
  it("banked 37°, r = 100 m, μ = 0.25: v0 = √750, vmax = √(1000·1/0.8125), vmin = √(1000·0.5/1.1875)", () => {
    const sp = bankedSpeeds({ r: 100, angleDeg: 37, mu: 0.25, m: 1000, g: 10 });
    expect(sp.vIdeal).toBeCloseTo(Math.sqrt(750), 10);
    expect(sp.vMax).toBeCloseTo(Math.sqrt(1000 / 0.8125), 10);
    expect(sp.vMin).toBeCloseTo(Math.sqrt(500 / 1.1875), 10);
  });
  it("flat road: vmax = √(μrg)", () => {
    expect(value("banked", { r: 50, angleDeg: 0, mu: 0.4 }, "vMax")).toBeCloseTo(Math.sqrt(200), 10);
  });
  it("conical pendulum 1 m at 37°: T = mg/cos θ = 6.25 N", () => {
    expect(value("conical", { L: 1, angleDeg: 37, m: 0.5 }, "tension")).toBeCloseTo(6.25, 10);
  });
  it("spring m = 0.5, k = 50: T = π/5 s, vmax = 1 m/s at A = 0.1 m", () => {
    expect(value("spring", { m: 0.5, k: 50, A: 0.1 }, "period")).toBeCloseTo(Math.PI / 5, 10);
    expect(value("spring", { m: 0.5, k: 50, A: 0.1 }, "vMax")).toBeCloseTo(1, 10);
  });
  it("pendulum 1 m, g = 10: T = 2π/√10; exact period ≥ small-swing period", () => {
    expect(value("pendulum", { L: 1 }, "period")).toBeCloseTo((2 * Math.PI) / Math.sqrt(10), 10);
    const m = pendulumMotion({ L: 1, amplitudeDeg: 30, g: 10 });
    expect(m.exact).toBeGreaterThan(m.small);
    expect(agm(1, 1)).toBe(1);
  });
});

describe("random questions: formula = simulation (seeded)", () => {
  const r = rng(42);
  const pick = (a: number, b: number) => a + (b - a) * r();
  it("60 projectiles", () => {
    for (let i = 0; i < 60; i++) {
      const s = solveTemplate("projectile", { u: pick(1, 60), angleDeg: pick(-60, 85), h: pick(0, 50) + (i % 3 === 0 ? 5 : 0), g: pick(9, 11) });
      expect(s.verified).toBe(true);
    }
  });
  it("60 blocks on inclines (released and pushed up)", () => {
    for (let i = 0; i < 60; i++) {
      const s = solveTemplate("incline", { m: pick(0.5, 10), angleDeg: pick(10, 60), mu: pick(0, 0.6), L: pick(1, 10), u: i % 2 ? pick(1, 15) : 0 });
      expect(s.verified, JSON.stringify(s.params)).toBe(true);
    }
  });
  it("60 banked roads and conical pendulums", () => {
    for (let i = 0; i < 30; i++) {
      expect(solveTemplate("banked", { r: pick(20, 300), angleDeg: pick(0, 40), mu: pick(0, 0.5), v: pick(5, 40) }).verified).toBe(true);
      expect(solveTemplate("conical", { L: pick(0.2, 3), angleDeg: pick(5, 75), m: pick(0.1, 3) }).verified).toBe(true);
    }
  });
  it("60 springs and pendulums", () => {
    for (let i = 0; i < 30; i++) {
      expect(solveTemplate("spring", { m: pick(0.1, 5), k: pick(5, 500), A: pick(0.01, 0.5) }).verified).toBe(true);
      expect(solveTemplate("pendulum", { L: pick(0.2, 5), amplitudeDeg: pick(1, 50) }).verified).toBe(true);
    }
  });
});

describe("safety", () => {
  it("JEE angles use 3/5 and 4/5; others use true trig", () => {
    expect(trig(37).sin).toBe(0.6);
    expect(trig(53).cos).toBe(0.6);
    expect(trig(30).sin).toBeCloseTo(0.5, 12);
  });
  it("force balance on the banked road holds at any speed", () => {
    const p = { r: 80, angleDeg: 20, mu: 0.3, m: 900, g: 10 };
    const { sin, cos } = trig(20);
    for (const v of [5, 15, 25]) {
      const { N, f } = bankedForces(p, v);
      expect(N * sin + f * cos).toBeCloseTo((p.m * v * v) / p.r, 6);
      expect(N * cos - f * sin).toBeCloseTo(p.m * p.g, 6);
    }
  });
  it("bad input gives a plain-English error, not a wrong answer", () => {
    expect(() => solveTemplate("spring", { m: -1, k: 10 })).toThrow(/Mass/);
    expect(() => solveTemplate("projectile", { u: 10, angleDeg: -30, h: 0 })).toThrow();
  });
});
