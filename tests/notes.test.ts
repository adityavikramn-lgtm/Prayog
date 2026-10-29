import { describe, expect, it } from "vitest";
import { ex1, ex10, ex10b, ex11, ex2, ex3, ex4, ex5, ex6, ex7, ex8a, ex8b, ex9, kFromEps0 } from "../src/notes/electrostatics";

describe("electrostatics notes: every worked answer", () => {
  it("k = 1/(4πε₀) ≈ 9 × 10⁹ with ε₀ = 8.85 × 10⁻¹²", () => {
    expect(kFromEps0() / 1e9).toBeCloseTo(8.99, 2);
  });
  it("E1: +3 µC and −2 µC at 30 cm attract with 0.6 N", () => {
    expect(ex1()).toBeCloseTo(-0.6, 12);
  });
  it("E2: in a medium with K = 4 the force drops to 0.15 N", () => {
    expect(Math.abs(ex2())).toBeCloseTo(0.15, 12);
  });
  it("E3: −3.2 µC means 2 × 10¹³ extra electrons", () => {
    expect(ex3()).toBeCloseTo(2e13, -6);
  });
  it("E4: electric/gravitational force for an electron and a proton ≈ 2.27 × 10³⁹", () => {
    expect(ex4() / 1e39).toBeCloseTo(2.27, 2);
  });
  it("E5: +8 µC and −2 µC touch → +3 µC each; force becomes 9/16 of before, and repulsive", () => {
    const r = ex5();
    expect(r.shared).toBe(3);
    expect(r.ratio).toBeCloseTo(9 / 16, 12);
    expect(r.attractiveBefore && r.repulsiveAfter).toBe(true);
  });
  it("E6: on B, 1.8 N towards A and 0.9 N towards C, so 0.9 N towards A", () => {
    const r = ex6();
    expect(r.fromA).toBeCloseTo(-1.8, 12);
    expect(r.fromC).toBeCloseTo(0.9, 12);
    expect(r.net).toBeCloseTo(-0.9, 12);
  });
  it("E7: square of equal charges → (√2 + ½)·kq²/a² ≈ 1.72 N on each corner", () => {
    const r = ex7();
    expect(r.unit).toBeCloseTo(0.9, 12);
    expect(r.magnitude).toBeCloseTo(r.factor * r.unit, 12);
    expect(r.magnitude).toBeCloseTo(1.72, 2);
  });
  it("E8a: null point between +2 µC and +8 µC is 10 cm from the 2 µC charge", () => {
    expect(ex8a()).toBeCloseTo(0.1, 12);
  });
  it("E8b: +4 µC and −1 µC → null point 30 cm beyond the −1 µC charge, where the forces really cancel", () => {
    const r = ex8b();
    expect(r.x).toBeCloseTo(0.3, 12);
    expect(Math.abs(r.net)).toBeLessThan(1e-12);
  });
  it("E9: Q = −4q/9 at d/3 from q puts all three charges in equilibrium", () => {
    const r = ex9();
    expect(r.x).toBeCloseTo(0.1, 12);
    expect(r.Qover_q).toBeCloseTo(-4 / 9, 12);
    expect(Math.abs(r.onQ)).toBeLessThan(1e-9);
    expect(Math.abs(r.onq)).toBeLessThan(1e-9);
  });
  it("E10: 0.1 µC balls of 0.9 g, 10 cm apart → tan θ = 1, θ = 45°", () => {
    const r = ex10();
    expect(r.F).toBeCloseTo(9e-3, 12);
    expect(r.tanTheta).toBeCloseTo(1, 12);
    expect(r.thetaDeg).toBeCloseTo(45, 9);
  });
  it("E10b: ball density 1600, liquid density 800 → the angle stays the same if K = 2", () => {
    expect(ex10b()).toBeCloseTo(2, 12);
  });
  it("E11: splitting a charge Q, the force is biggest when each part is Q/2", () => {
    expect(ex11()).toBeCloseTo(0.5, 9);
  });
});
