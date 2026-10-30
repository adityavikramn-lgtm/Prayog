import { describe, expect, it } from "vitest";
import { forcesAt } from "../src/physics/hemisphere";
import { PRACTICE, WORKED } from "../src/notes/hemisphere";
import { simulateDrag } from "../src/templates/hemisphere/simulate";

/** Independent numerical route: add up T·R·dφ in many small steps (midpoint rule). */
function integratePull(setup: typeof WORKED.setup, phiEnd: number, steps = 20000) {
  let w = 0;
  const d = phiEnd / steps;
  for (let i = 0; i < steps; i++) w += forcesAt(setup, (i + 0.5) * d).tension * setup.R * d;
  return w;
}

describe("rough-dome notes: worked example", () => {
  it("2 kg, R = 1 m, μ = 0.5: lift 20 J + friction 10 J = 30 J; simulation agrees", () => {
    expect(WORKED.lift).toBeCloseTo(20, 9);
    expect(WORKED.friction).toBeCloseTo(10, 9);
    expect(WORKED.total).toBeCloseTo(30, 9);
    expect(simulateDrag(WORKED.setup).byMan).toBeCloseTo(30, 4);
  });
  it("traps: forgetting friction gives 20 J, taking N = mg gives 35.7 J", () => {
    expect(WORKED.wrongNoFriction).toBeCloseTo(20, 9);
    expect(WORKED.wrongNEqualsMg).toBeCloseTo(35.71, 2);
  });
  it("pull is 20 N at the bottom and 10 N at the top", () => {
    expect(WORKED.pullBottom).toBeCloseTo(20, 9);
    expect(WORKED.pullTop).toBeCloseTo(10, 9);
  });
});

describe("rough-dome notes: practice answers, each checked a second way", () => {
  it("P1 smooth dome: 20 J (simulation agrees)", () => {
    expect(PRACTICE.smooth.answer).toBeCloseTo(20, 9);
    expect(simulateDrag(PRACTICE.smooth.setup).byMan).toBeCloseTo(PRACTICE.smooth.answer, 4);
  });
  it("P2 m = 1 kg, R = 0.5 m, μ = 0.3: 6.5 J (simulation agrees)", () => {
    expect(PRACTICE.other.answer).toBeCloseTo(6.5, 9);
    expect(simulateDrag(PRACTICE.other.setup).byMan).toBeCloseTo(PRACTICE.other.answer, 4);
  });
  it("P3 stop at 60°: 17.3 J + 5 J = 22.3 J (numerical integral agrees)", () => {
    expect(PRACTICE.partial.againstGravity).toBeCloseTo(10 * Math.sqrt(3), 9);
    expect(PRACTICE.partial.againstFriction).toBeCloseTo(5, 9);
    expect(PRACTICE.partial.total).toBeCloseTo(integratePull(PRACTICE.partial.setup, Math.PI / 3), 6);
  });
  it("P4 at 30°: N = 10 N, friction = 5 N", () => {
    expect(PRACTICE.at30.normal).toBeCloseTo(10, 9);
    expect(PRACTICE.at30.friction).toBeCloseTo(5, 9);
  });
  it("P5 the pull peaks at tan φ = μ (26.6°) at 22.4 N, above the 20 N at the bottom (found by scanning)", () => {
    let best = { phi: 0, t: 0 };
    for (let i = 0; i <= 90000; i++) {
      const phi = (i / 90000) * (Math.PI / 2);
      const t = forcesAt(PRACTICE.peak.setup, phi).tension;
      if (t > best.t) best = { phi, t };
    }
    expect(PRACTICE.peak.phiDeg).toBeCloseTo((best.phi * 180) / Math.PI, 2);
    expect(PRACTICE.peak.tension).toBeCloseTo(best.t, 6);
    expect(PRACTICE.peak.tension).toBeGreaterThan(WORKED.pullBottom);
    expect(PRACTICE.peak.phiDeg).toBeCloseTo(26.57, 2);
  });
});
