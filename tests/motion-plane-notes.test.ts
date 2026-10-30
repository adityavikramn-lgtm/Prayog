import { describe, expect, it } from "vitest";
import { ANSWERS as A, EXAMPLES, G } from "../src/notes/motionPlane";
import { simulateProjectile } from "../src/templates/projectile/simulate";

const DEG = Math.PI / 180;
const E = EXAMPLES;

/** Independent route for anything thrown: step Newton's 2nd law until a stopping condition. */
function fly(x: number, y: number, vx: number, vy: number, stop: (x: number, y: number, t: number) => boolean, dt = 1e-5) {
  let t = 0;
  while (t < 100) {
    vy -= G * dt * 0.5;
    x += vx * dt;
    y += vy * dt;
    vy -= G * dt * 0.5;
    t += dt;
    if (stop(x, y, t)) break;
  }
  return { x, y, vx, vy, t };
}

describe("Motion in a Plane notes: vectors", () => {
  it("Q1 3 and 5 at 60°: R = 7, α ≈ 38.2° (component check)", () => {
    expect(A.q1.R).toBeCloseTo(7, 9);
    const rx = 3 + 5 * Math.cos(60 * DEG);
    const ry = 5 * Math.sin(60 * DEG);
    expect(Math.hypot(rx, ry)).toBeCloseTo(A.q1.R, 9);
    expect(Math.atan2(ry, rx) / DEG).toBeCloseTo(A.q1.alphaDeg, 9);
    expect(A.q1.alphaDeg).toBeCloseTo(38.21, 2);
  });
  it("Q2 equal forces with resultant F: 120° (components check)", () => {
    expect(A.q2.thetaDeg).toBeCloseTo(120, 9);
    const t = A.q2.thetaDeg * DEG;
    expect(Math.hypot(1 + Math.cos(t), Math.sin(t))).toBeCloseTo(1, 9);
  });
  it("Q3 dot = −6, cross = 4i − 5j − 7k, angle ≈ 122.3°; cross is ⟂ to both", () => {
    expect(A.q3.dot).toBe(-6);
    expect(A.q3.cross).toEqual([4, -5, -7]);
    const [a, b, c] = [A.q3.A, A.q3.B, A.q3.cross];
    expect(a[0] * c[0] + a[1] * c[1] + a[2] * c[2]).toBe(0);
    expect(b[0] * c[0] + b[1] * c[1] + b[2] * c[2]).toBe(0);
    expect(A.q3.crossMag ** 2 + A.q3.dot ** 2).toBeCloseTo((A.q3.magA * A.q3.magB) ** 2, 9); // Lagrange identity
    expect(A.q3.angleDeg).toBeCloseTo(122.31, 2);
  });
  it("Q4 v(1) = 4i + j, a = 4i − 2j (finite differences of r(t))", () => {
    const r = (t: number) => [2 * t * t, 3 * t - t * t];
    const h = 1e-5;
    const v = [0, 1].map((k) => (r(1 + h)[k] - r(1 - h)[k]) / (2 * h));
    const a = [0, 1].map((k) => (r(1 + h)[k] - 2 * r(1)[k] + r(1 - h)[k]) / (h * h));
    expect(v[0]).toBeCloseTo(A.q4.v[0], 6);
    expect(v[1]).toBeCloseTo(A.q4.v[1], 6);
    expect(a[0]).toBeCloseTo(A.q4.a[0], 3);
    expect(a[1]).toBeCloseTo(A.q4.a[1], 3);
  });
});

describe("Motion in a Plane notes: projectiles (checked by simulation)", () => {
  it("Q5 20 m/s at 30°: T = 2 s, H = 5 m, R = 34.6 m", () => {
    expect(A.q5.T).toBeCloseTo(2, 9);
    expect(A.q5.H).toBeCloseTo(5, 9);
    const s = simulateProjectile({ ux: A.q5.ux, uy: A.q5.uy, g: G });
    expect(s.range).toBeCloseTo(A.q5.R, 4);
    expect(s.maxHeight).toBeCloseTo(A.q5.H, 4);
    expect(s.timeOfFlight).toBeCloseTo(A.q5.T, 4);
  });
  it("Q6 complementary angles: R = 4√(H₁H₂), H₁ + H₂ = u²/2g", () => {
    expect(A.q6.R).toBeCloseTo(A.q6.Rcheck, 9);
    expect(A.q6.sumH).toBeCloseTo(A.q6.sumHformula, 9);
    expect(EXAMPLES.comp15).toBeCloseTo(EXAMPLES.comp75, 9);
  });
  it("Q7 horizontal from 45 m at 10 m/s: 3 s, 30 m, 31.6 m/s at 71.6° below horizontal", () => {
    const f = fly(0, 45, 10, 0, (_x, y) => y <= 0);
    expect(f.t).toBeCloseTo(A.q7.T, 3);
    expect(f.x).toBeCloseTo(A.q7.x, 2);
    expect(Math.hypot(f.vx, f.vy)).toBeCloseTo(A.q7.speed, 2);
    expect(Math.atan2(-f.vy, f.vx) / DEG).toBeCloseTo(A.q7.belowDeg, 1);
  });
  it("Q8 H = R ⇒ θ = tan⁻¹ 4 ≈ 76.0° (simulated H and R match)", () => {
    const t = A.q8.thetaDeg * DEG;
    const s = simulateProjectile({ ux: 20 * Math.cos(t), uy: 20 * Math.sin(t), g: G });
    expect(s.maxHeight).toBeCloseTo(s.range, 3);
  });
  it("Q13 up a 30° incline, 20 m/s at 75°: T ≈ 3.27 s, R ≈ 19.5 m along the slope", () => {
    const th = 75 * DEG;
    const al = 30 * DEG;
    const f = fly(0, 0, 20 * Math.cos(th), 20 * Math.sin(th), (x, y, t) => t > 0.01 && y <= x * Math.tan(al));
    expect(f.t).toBeCloseTo(A.q13.T, 3);
    expect(Math.hypot(f.x, f.y)).toBeCloseTo(A.q13.R, 2);
  });
  it("Q13 best launch angle on the incline is 45° + α/2 (scan)", () => {
    let best = { th: 0, R: 0 };
    for (let d = 30.1; d < 90; d += 0.01) {
      const th = d * DEG;
      const al = 30 * DEG;
      const R = (2 * 400 * Math.sin(th - al) * Math.cos(th)) / (G * Math.cos(al) ** 2);
      if (R > best.R) best = { th: d, R };
    }
    expect(best.th).toBeCloseTo(A.q13.bestThetaDeg, 1);
    expect(best.R).toBeCloseTo(A.q13.Rmax, 3);
  });
  it("Q14 speed at the top = u/2 ⇒ θ = 60°, KE ratio 1/4; Q15 top radius = 10 m", () => {
    expect(Math.cos(A.q14.thetaDeg * DEG)).toBeCloseTo(0.5, 9);
    expect(Math.cos(A.q14.thetaDeg * DEG) ** 2).toBeCloseTo(A.q14.keRatio, 9);
    expect(A.q15.r).toBeCloseTo(10, 9);
  });
  it("max range example: 45° gives u²/g = 40 m and H = R/4 = 10 m", () => {
    expect(EXAMPLES.max45.R).toBeCloseTo(40, 9);
    expect(EXAMPLES.max45.H).toBeCloseTo(EXAMPLES.max45.R / 4, 9);
  });
});

describe("Motion in a Plane notes: worked examples on the theory pages", () => {
  it("10 N at 37°: 8 N and 6 N; 3i + 4j has magnitude 5 at about 53°", () => {
    expect(E.force37.fx).toBeCloseTo(8, 9);
    expect(E.force37.fy).toBeCloseTo(6, 9);
    expect(Math.hypot(E.force37.fx, E.force37.fy)).toBeCloseTo(10, 9);
    expect(E.a34.mag).toBe(5);
    expect(E.a34.angleDeg).toBeCloseTo(53.13, 2);
  });
  it("λ = 1 makes 2i + λj ⟂ 3i − 6j; triangle area = √90 / 2", () => {
    expect(2 * 3 + E.lambda * -6).toBe(0);
    expect(E.triArea).toBeCloseTo(Math.sqrt(90) / 2, 9);
  });
  it("x = 3t, y = 4t − 5t² is a projectile: u = 5 m/s at 53°, a = −10 j (finite differences)", () => {
    const h = 1e-4;
    const y = (t: number) => 4 * t - 5 * t * t;
    expect((y(h) - y(-h)) / (2 * h)).toBeCloseTo(4, 6);
    expect((y(1 + h) - 2 * y(1) + y(1 - h)) / (h * h)).toBeCloseTo(E.path.ay, 3);
    expect(E.path.speed0).toBe(5);
  });
  it("u = 2i, a = 2j, t = 3: v = 2i + 6j, r = 6i + 9j (step-by-step check)", () => {
    const vx = 2;
    let [x, yy, vy] = [0, 0, 0];
    const dt = 1e-5;
    for (let t = 0; t < 3 - 1e-9; t += dt) {
      vy += 2 * dt * 0.5;
      x += vx * dt;
      yy += vy * dt;
      vy += 2 * dt * 0.5;
    }
    expect(vy).toBeCloseTo(E.constAcc.v[1], 3);
    expect(x).toBeCloseTo(E.constAcc.r[0], 3);
    expect(yy).toBeCloseTo(E.constAcc.r[1], 3);
  });
  it("cars: |v_AB| = 25 m/s at 36.9° south of east; trajectory y = x − x²/20 → u ≈ 14.1 m/s, R = 20 m, H = 5 m", () => {
    expect(E.cars.rel).toBe(25);
    expect(E.cars.southOfEastDeg).toBeCloseTo(36.87, 2);
    expect(E.traj.Rcheck).toBeCloseTo(E.traj.R, 9);
    expect(E.traj.H).toBeCloseTo(5, 9);
    expect(E.traj.u).toBeCloseTo(Math.sqrt(200), 9);
    const s = simulateProjectile({ ux: E.traj.u / Math.SQRT2, uy: E.traj.u / Math.SQRT2, g: G });
    expect(s.range).toBeCloseTo(20, 3);
  });
});

describe("Motion in a Plane notes: relative velocity and circles", () => {
  it("Q9 river: shortest time 20 s with 60 m drift; straight across: 36.9° upstream, 25 s", () => {
    expect(A.q9.tMin).toBeCloseTo(20, 9);
    expect(A.q9.drift).toBeCloseTo(60, 9);
    expect(A.q9.upstreamDeg).toBeCloseTo(36.87, 2);
    expect(A.q9.tStraight).toBeCloseTo(25, 9);
    // component check: heading upstream, the ground velocity has no along-river part
    const th = A.q9.upstreamDeg * DEG;
    expect(3 - 5 * Math.sin(th)).toBeCloseTo(0, 9);
  });
  it("Q10 rain 10 m/s, man 5 m/s: umbrella 26.6° forward, rain seen at 11.2 m/s", () => {
    expect(A.q10.tiltDeg).toBeCloseTo(26.57, 2);
    expect(A.q10.relative).toBeCloseTo(Math.sqrt(125), 9);
  });
  it("Q11 0.5 m, 2 rev/s: ω = 4π, v = 2π, a = 8π² ≈ 79.0 m/s²", () => {
    expect(A.q11.w).toBeCloseTo(4 * Math.PI, 9);
    expect(A.q11.v).toBeCloseTo(2 * Math.PI, 9);
    expect(A.q11.a).toBeCloseTo(A.q11.v ** 2 / 0.5, 9);
  });
  it("Q12 r = 2 m, v = 4 m/s, aₜ = 3: a_c = 8, a = √73 ≈ 8.54, 69.4° with v", () => {
    expect(A.q12.ac).toBeCloseTo(8, 9);
    expect(A.q12.a).toBeCloseTo(Math.sqrt(73), 9);
    expect(A.q12.angleWithVDeg).toBeCloseTo(69.44, 2);
  });
});
