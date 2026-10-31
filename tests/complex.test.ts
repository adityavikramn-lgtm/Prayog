import { describe, expect, it } from "vitest";
import { CR_POINTS, FN, MCQS, MCQ_FACTS, abs, c, cexp, crGap, laplacian, quotient, sub } from "../src/templates/complex/model";

const pts = [c(0.7, 0.3), c(-1.2, 0.8), c(0.4, -1.1), c(1.5, 1.4), c(-0.6, -0.9)];
const ANALYTIC = ["z2", "ez", "constQuad", "constTrig", "cubicHarm", "recip", "zemz", "logr", "zPlusInv"];

describe("analytic functions: CR holds, u and v are harmonic, and u + iv equals the claimed f(z)", () => {
  for (const id of ANALYTIC)
    it(id, () => {
      const f = FN[id];
      for (const p of pts) {
        expect(crGap(f, p.re, p.im), `CR at ${p.re},${p.im}`).toBeLessThan(1e-6);
        expect(Math.abs(laplacian(f.u, p.re, p.im)), "u harmonic").toBeLessThan(1e-3);
        expect(Math.abs(laplacian(f.v, p.re, p.im)), "v harmonic").toBeLessThan(1e-3);
        const w = f.f!(p);
        expect(abs(sub(w, c(f.u(p.re, p.im), f.v(p.re, p.im)))), "u + iv = f(z)").toBeLessThan(1e-12);
      }
    });
});

describe("non-analytic functions fail CR, except at the stated points", () => {
  it("z̄ fails everywhere; its difference quotient depends on the direction (e^{-2iφ})", () => {
    for (const p of pts) expect(crGap(FN.conj, p.re, p.im)).toBeGreaterThan(1);
    const along = quotient(FN.conj, c(1, 1), 0);
    const up = quotient(FN.conj, c(1, 1), Math.PI / 2);
    expect(along.re).toBeCloseTo(1, 6);
    expect(up.re).toBeCloseTo(-1, 6);
    const diag = quotient(FN.conj, c(1, 1), Math.PI / 4);
    expect(abs(sub(diag, cexp(c(0, -Math.PI / 2))))).toBeLessThan(1e-6);
  });
  it("z² gives the same quotient 2z from every direction", () => {
    for (const phi of [0, 0.7, 1.6, 3, 4.5]) {
      const qv = quotient(FN.z2, c(1, 0.5), phi, 1e-7);
      expect(abs(sub(qv, c(2, 1)))).toBeLessThan(1e-5);
    }
  });
  it("|z|², (x − iy)², iz − |z|²: CR only at the origin; (x³ + xy) + i(y³ − 3x): only at two points", () => {
    for (const id of ["abs2", "xMinusIy2", "izMinusAbs2"] as const) {
      expect(crGap(FN[id], 0, 0)).toBeLessThan(1e-8);
      for (const p of pts) expect(crGap(FN[id], p.re, p.im)).toBeGreaterThan(0.1);
    }
    for (const p of CR_POINTS.cubicMix) expect(crGap(FN.cubicMix, p.re, p.im)).toBeLessThan(1e-4);
    for (const p of pts) expect(crGap(FN.cubicMix, p.re, p.im)).toBeGreaterThan(0.1);
  });
});

describe("MCQ answers", () => {
  it("|3 + 4i| = 5 and f(z) = z³ has f'(i) = −3", () => {
    expect(MCQ_FACTS.absOf34).toBe(5);
    expect(MCQ_FACTS.dCubeAtI.re).toBeCloseTo(-3, 4);
    expect(MCQ_FACTS.dCubeAtI.im).toBeCloseTo(0, 4);
  });
  it("only x² − y² is harmonic among the options", () => {
    const opts = [(x: number, y: number) => x * x + y * y, (x: number, y: number) => x * x - y * y, (x: number) => x ** 3, (x: number, y: number) => x * y * y];
    const harmonic = opts.map((u) => pts.every((p) => Math.abs(laplacian(u, p.re, p.im)) < 1e-3));
    expect(harmonic).toEqual([false, true, false, false]);
  });
  it("every MCQ has a valid answer index and an explanation", () => {
    expect(MCQS.length).toBe(20);
    for (const m of MCQS) {
      expect(m.correct).toBeGreaterThanOrEqual(0);
      expect(m.correct).toBeLessThan(m.options.length);
      expect(m.why.length).toBeGreaterThan(5);
    }
  });
});
