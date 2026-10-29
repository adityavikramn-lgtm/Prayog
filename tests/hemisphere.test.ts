import { describe, expect, it } from "vitest";
import { forcesAt, totalWork, workUpTo } from "../src/physics/hemisphere";
import { seededRandom } from "../src/physics/random";
import { EXAMPLE, MISTAKES } from "../src/templates/hemisphere/model";
import { simulateDrag } from "../src/templates/hemisphere/simulate";

const relErr = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("dragging a block slowly up a rough hemisphere", () => {
  it("worked example: m = 2 kg, R = 1 m, μ = 0.5, g = 10 → W = mgR(1 + μ) = 30 J", () => {
    expect(totalWork(EXAMPLE)).toBeCloseTo(30, 12);
    expect(workUpTo(EXAMPLE, Math.PI / 2).total).toBeCloseTo(30, 12);
  });

  it("forces at the ground and the top make sense", () => {
    const ground = forcesAt(EXAMPLE, 0);
    expect(ground.normal).toBeCloseTo(0, 12);
    expect(ground.tension).toBeCloseTo(20, 12); // holding the full weight along a vertical wall
    const top = forcesAt(EXAMPLE, Math.PI / 2);
    expect(top.normal).toBeCloseTo(20, 12);
    expect(top.tension).toBeCloseTo(EXAMPLE.mu * 20, 12); // only friction left to beat
  });

  it("the numerical drag gives the same work, and the energy books balance", () => {
    const sim = simulateDrag(EXAMPLE);
    expect(relErr(sim.byMan, 30)).toBeLessThan(1e-6);
    expect(sim.byGravity).toBeCloseTo(-20, 6); // −mgR
    expect(sim.byFriction).toBeCloseTo(-10, 6); // −μmgR
    expect(sim.byMan + sim.byGravity + sim.byFriction).toBeCloseTo(0, 6); // ΔKE = 0 when slow
    expect(sim.end.x).toBeCloseTo(0, 9);
    expect(sim.end.y).toBeCloseTo(EXAMPLE.R, 9);
  });

  it("friction's work equals μmg × the horizontal distance (R), not the arc length", () => {
    const sim = simulateDrag(EXAMPLE);
    const horizontal = EXAMPLE.R;
    const arc = (Math.PI * EXAMPLE.R) / 2;
    expect(-sim.byFriction).toBeCloseTo(EXAMPLE.mu * EXAMPLE.m * EXAMPLE.g * horizontal, 6);
    expect(Math.abs(-sim.byFriction - EXAMPLE.mu * EXAMPLE.m * EXAMPLE.g * arc)).toBeGreaterThan(1);
  });

  const rand = seededRandom(42);
  const cases = Array.from({ length: 50 }, () => ({
    m: 0.1 + rand() * 20,
    g: 9.8 + rand() * 0.2,
    R: 0.1 + rand() * 5,
    mu: rand(),
  }));

  it.each(cases.map((c, i) => [i + 1, c] as const))("random case %i: formula and simulation agree within 0.1%%", (_i, c) => {
    const sim = simulateDrag(c, 5000);
    expect(relErr(sim.byMan, totalWork(c))).toBeLessThan(1e-3);
  });

  it("partial work W(φ) at 60° matches a direct numerical sum of T·R dφ", () => {
    const phi = Math.PI / 3;
    const part = workUpTo(EXAMPLE, phi);
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) sum += forcesAt(EXAMPLE, ((i + 0.5) * phi) / n).tension * EXAMPLE.R * (phi / n);
    expect(relErr(sum, part.total)).toBeLessThan(1e-8);
  });

  it("each wrong option differs from the right answer and matches its named mistake", () => {
    const right = totalWork(EXAMPLE);
    const values = MISTAKES.map((m) => m.value(EXAMPLE));
    expect(values[0]).toBeCloseTo(20, 12);
    expect(values[1]).toBeCloseTo(20 + 5 * Math.PI, 12);
    expect(values[2]).toBeCloseTo(10, 12);
    for (const v of values) expect(Math.abs(v - right)).toBeGreaterThan(1);
  });
});
