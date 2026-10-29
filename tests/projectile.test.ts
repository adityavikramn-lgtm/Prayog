import { describe, expect, it } from "vitest";
import { sig3 } from "../src/physics/format";
import { seededRandom } from "../src/physics/random";
import { rk4Step } from "../src/physics/rk4";
import { solveProjectile, stateAt } from "../src/physics/projectile";
import {
  ProjectileParams,
  launchComponents,
  solve,
} from "../src/templates/projectile/model";
import { simulateProjectile } from "../src/templates/projectile/simulate";

const relErr = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("RK4 integrator on its own", () => {
  // A projectile has constant acceleration, which RK4 integrates almost exactly.
  // This harder case (a spring, x'' = -x) shows the integrator really converges.
  it("tracks simple harmonic motion: x(t) = cos t", () => {
    const f = (_t: number, y: readonly number[]) => [y[1], -y[0]];
    let y: readonly number[] = [1, 0];
    const dt = 1e-3;
    for (let i = 0; i < 10_000; i++) y = rk4Step(f, i * dt, y, dt);
    expect(Math.abs(y[0] - Math.cos(10))).toBeLessThan(1e-9);
    expect(Math.abs(y[1] + Math.sin(10))).toBeLessThan(1e-9);
  });
});

describe("closed form: hand-checked JEE values", () => {
  it("u = 20 m/s, θ = 45°, g = 10: R = 40 m, H = 10 m, T = 2√2 s", () => {
    const r = solve({ u: 20, thetaDeg: 45, g: 10, trig: "exact" });
    expect(r.range).toBeCloseTo(40, 10);
    expect(r.maxHeight).toBeCloseTo(10, 10);
    expect(r.timeOfFlight).toBeCloseTo(2 * Math.SQRT2, 10);
  });

  it("u = 50 m/s, θ = 37° (JEE: sin 37° = 3/5), g = 10: T = 6 s, H = 45 m, R = 240 m", () => {
    const r = solve({ u: 50, thetaDeg: 37, g: 10, trig: "jee" });
    expect(r.components.ux).toBeCloseTo(40, 12);
    expect(r.components.uy).toBeCloseTo(30, 12);
    expect(r.timeOfFlight).toBeCloseTo(6, 12);
    expect(r.maxHeight).toBeCloseTo(45, 12);
    expect(r.range).toBeCloseTo(240, 12);
  });

  it("matches R = u² sin 2θ / g for true trig values", () => {
    const u = 30, g = 9.8;
    for (const th of [10, 25, 45, 61, 80]) {
      const r = solve({ u, thetaDeg: th, g, trig: "exact" });
      const formula = (u * u * Math.sin((2 * th * Math.PI) / 180)) / g;
      expect(relErr(r.range, formula)).toBeLessThan(1e-12);
    }
  });

  it("complementary angles give equal range; 45° gives the maximum", () => {
    const base = { u: 25, g: 10, trig: "exact" as const };
    for (const th of [15, 30, 37, 50]) {
      const a = solve({ ...base, thetaDeg: th }).range;
      const b = solve({ ...base, thetaDeg: 90 - th }).range;
      expect(relErr(a, b)).toBeLessThan(1e-12);
    }
    const r45 = solve({ ...base, thetaDeg: 45 }).range;
    for (let th = 1; th < 90; th++) {
      expect(solve({ ...base, thetaDeg: th }).range).toBeLessThanOrEqual(r45 + 1e-9);
    }
  });

  it("v_y = 0 at the top and the particle is back at y = 0 after T", () => {
    const c = launchComponents({ u: 18, thetaDeg: 62, g: 10, trig: "exact" });
    const r = solveProjectile(c);
    expect(Math.abs(stateAt(c, r.timeToApex).vy)).toBeLessThan(1e-12);
    expect(stateAt(c, r.timeToApex).y).toBeCloseTo(r.maxHeight, 10);
    expect(Math.abs(stateAt(c, r.timeOfFlight).y)).toBeLessThan(1e-9);
  });
});

describe("closed form vs RK4 simulation: 100 random launches", () => {
  const rand = seededRandom(20261029);
  const cases = Array.from({ length: 100 }, () =>
    ProjectileParams.parse({
      u: 1 + rand() * 99,
      thetaDeg: 1 + rand() * 88,
      g: 0.5 + rand() * 29.5,
      trig: "exact",
    }),
  );

  it.each(cases.map((p, i) => [i + 1, p] as const))(
    "case %i agrees within 0.1%%",
    (_i, p) => {
      const exact = solve(p);
      const measured = simulateProjectile(exact.components);
      expect(relErr(measured.timeOfFlight, exact.timeOfFlight)).toBeLessThan(1e-3);
      expect(relErr(measured.range, exact.range)).toBeLessThan(1e-3);
      expect(relErr(measured.maxHeight, exact.maxHeight)).toBeLessThan(1e-3);
      expect(relErr(measured.timeToApex, exact.timeToApex)).toBeLessThan(1e-3);
    },
  );
});

describe("number formatting (3 significant figures)", () => {
  it("keeps trailing zeros and avoids exponent form", () => {
    expect(sig3(1.2)).toBe("1.20");
    expect(sig3(40)).toBe("40.0");
    expect(sig3(2 * Math.SQRT2)).toBe("2.83");
    expect(sig3(12345)).toBe("12300");
    expect(sig3(1e-15)).toBe("0.00");
  });
});

describe("parameter validation", () => {
  it("rejects impossible launches", () => {
    expect(ProjectileParams.safeParse({ u: 20, thetaDeg: 90, g: 10, trig: "exact" }).success).toBe(false);
    expect(ProjectileParams.safeParse({ u: 20, thetaDeg: 30, g: 0, trig: "exact" }).success).toBe(false);
    expect(ProjectileParams.safeParse({ u: -5, thetaDeg: 30, g: 10, trig: "exact" }).success).toBe(false);
  });
});
