// Shared pieces for the student solver: result types, JEE trig convention, and the check that
// compares each closed-form answer with an independent step-by-step simulation.

export interface Quantity {
  key: string;
  label: string;
  /** TeX symbol, e.g. "T" or "H_{max}". */
  symbol: string;
  value: number;
  unit: string;
}

export interface Step {
  /** Plain words. */
  text: string;
  /** Optional TeX line shown under the words. Every number in it comes from the solver. */
  tex?: string;
}

export interface Check {
  label: string;
  formula: number;
  simulation: number;
}

export interface Solution {
  quantities: Quantity[];
  steps: Step[];
  checks: Check[];
  /** Plain-language facts worth saying out loud (e.g. "the block does not slide"). */
  notes: string[];
}

/** Relative difference, safe at zero. */
export const relDiff = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-9, Math.abs(a), Math.abs(b));
/** A solution is "verified" only when every formula answer agrees with its simulation to 0.1 %. */
export const VERIFY_TOL = 1e-3;
export const isVerified = (s: Solution) => s.checks.length > 0 && s.checks.every((c) => Number.isFinite(c.formula) && relDiff(c.formula, c.simulation) < VERIFY_TOL);

/**
 * sin and cos in degrees, with the JEE convention: 37° → (3/5, 4/5), 53° → (4/5, 3/5).
 * Other angles use the true values.
 */
export function trig(deg: number): { sin: number; cos: number; tan: number; jee: boolean } {
  const d = Math.round(deg * 1e6) / 1e6;
  if (d === 37) return { sin: 0.6, cos: 0.8, tan: 0.75, jee: true };
  if (d === 53) return { sin: 0.8, cos: 0.6, tan: 4 / 3, jee: true };
  const r = (deg * Math.PI) / 180;
  return { sin: Math.sin(r), cos: Math.cos(r), tan: Math.tan(r), jee: false };
}

/** 3 significant figures, plain notation (no exponent for normal sizes). */
export function fmt(x: number): string {
  if (!Number.isFinite(x)) return "∞";
  if (Math.abs(x) < 1e-9) return "0";
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-3) {
    const [m, e] = x.toExponential(2).split("e");
    return `${m} × 10^{${Number(e)}}`;
  }
  return String(Number(x.toPrecision(3)));
}

export const q = (key: string, label: string, symbol: string, value: number, unit: string): Quantity => ({ key, label, symbol, value, unit });
