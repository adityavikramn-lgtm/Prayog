// Motion in a Plane (Class 11 · JEE): every number printed in the handwritten notes
// (scripts/motion-plane-notes.mts) is computed here. tests/motion-plane-notes.test.ts checks
// each answer a second, independent way (step-by-step simulation, components, or a numeric scan).

export const G = 10; // m/s², JEE convention
const DEG = Math.PI / 180;
const rad = (d: number) => d * DEG;
const deg = (r: number) => r / DEG;

export type V3 = [number, number, number];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const mag = (a: V3) => Math.hypot(a[0], a[1], a[2]);

/** Resultant of two vectors A, B at angle θ: magnitude and the angle α it makes with A. */
export function resultant(A: number, B: number, thetaDeg: number) {
  const t = rad(thetaDeg);
  const R = Math.sqrt(A * A + B * B + 2 * A * B * Math.cos(t));
  const alphaDeg = deg(Math.atan2(B * Math.sin(t), A + B * Math.cos(t)));
  return { R, alphaDeg };
}

/** Ground-to-ground projectile. */
export function projectile(u: number, thetaDeg: number, g = G) {
  const t = rad(thetaDeg);
  const ux = u * Math.cos(t);
  const uy = u * Math.sin(t);
  return { ux, uy, T: (2 * uy) / g, H: (uy * uy) / (2 * g), R: (u * u * Math.sin(2 * t)) / g, topRadius: (ux * ux) / g };
}

/** Thrown horizontally with speed u from height h. */
export function horizontal(u: number, h: number, g = G) {
  const T = Math.sqrt((2 * h) / g);
  const vy = g * T;
  return { T, x: u * T, speed: Math.hypot(u, vy), belowDeg: deg(Math.atan2(vy, u)) };
}

/** Projectile up an incline of angle α, launched at θ to the horizontal (θ > α). */
export function upIncline(u: number, thetaDeg: number, alphaDeg: number, g = G) {
  const th = rad(thetaDeg);
  const al = rad(alphaDeg);
  const T = (2 * u * Math.sin(th - al)) / (g * Math.cos(al));
  const R = (2 * u * u * Math.sin(th - al) * Math.cos(th)) / (g * Math.cos(al) ** 2);
  const Rmax = (u * u) / (g * (1 + Math.sin(al)));
  return { T, R, Rmax, bestThetaDeg: 45 + alphaDeg / 2 };
}

/** River of width d, flow speed vr, boat speed vb (relative to water). */
export function river(d: number, vr: number, vb: number) {
  const tMin = d / vb;
  const drift = vr * tMin;
  const upstreamDeg = deg(Math.asin(vr / vb)); // from the straight-across direction, for zero drift
  const tStraight = d / Math.sqrt(vb * vb - vr * vr);
  return { tMin, drift, upstreamDeg, tStraight };
}

/** Rain falling vertically at vRain, person walking at vMan: umbrella tilt from vertical and rain speed seen. */
export function rain(vRain: number, vMan: number) {
  return { tiltDeg: deg(Math.atan2(vMan, vRain)), relative: Math.hypot(vRain, vMan) };
}

/** Uniform circular motion: radius r, n revolutions per second. */
export function circle(r: number, revPerSec: number) {
  const w = 2 * Math.PI * revPerSec;
  return { w, v: w * r, a: w * w * r, T: 1 / revPerSec };
}

/** Non-uniform circular motion: speed v on radius r, speed changing at at (m/s²). */
export function nonUniform(r: number, v: number, at: number) {
  const ac = (v * v) / r;
  return { ac, at, a: Math.hypot(ac, at), angleWithVDeg: deg(Math.atan2(ac, at)) };
}

// ---------- worked examples and PYQ-pattern questions (each used in the PDF) ----------

const p30 = projectile(20, 30);
const p60 = projectile(20, 60);

export const ANSWERS = {
  /** Q1: |A| = 3, |B| = 5, angle 60°. */
  q1: resultant(3, 5, 60),
  /** Q2: two equal forces F give a resultant F. Angle between them? 2F cos(θ/2) = F → θ = 120°. */
  q2: { thetaDeg: 2 * deg(Math.acos(0.5)) },
  /** Q3: A = 2i + 3j − k, B = i − 2j + 2k. */
  q3: (() => {
    const A: V3 = [2, 3, -1];
    const B: V3 = [1, -2, 2];
    const d = dot(A, B);
    const c = cross(A, B);
    return { A, B, dot: d, angleDeg: deg(Math.acos(d / (mag(A) * mag(B)))), cross: c, crossMag: mag(c), magA: mag(A), magB: mag(B) };
  })(),
  /** Q4: r = 2t² i + (3t − t²) j (m). Velocity and acceleration at t = 1 s. */
  q4: { v: [4, 1] as [number, number], speed: Math.hypot(4, 1), a: [4, -2] as [number, number], accel: Math.hypot(4, -2) },
  /** Q5: u = 20 m/s at 30°. */
  q5: p30,
  /** Q6: same u = 20 at 30° and 60°: same range, R = 4√(H₁H₂). */
  q6: { H1: p30.H, H2: p60.H, R: 4 * Math.sqrt(p30.H * p60.H), Rcheck: p30.R, sumH: p30.H + p60.H, sumHformula: (20 * 20) / (2 * G) },
  /** Q7: thrown horizontally at 10 m/s from a 45 m cliff. */
  q7: horizontal(10, 45),
  /** Q8: maximum height equals the range → tan θ = 4. */
  q8: { thetaDeg: deg(Math.atan(4)) },
  /** Q9: river 100 m wide, flow 3 m/s, boat 5 m/s. */
  q9: river(100, 3, 5),
  /** Q10: rain 10 m/s straight down, man walks at 5 m/s. */
  q10: rain(10, 5),
  /** Q11: stone on a 0.5 m string, 2 revolutions per second. */
  q11: circle(0.5, 2),
  /** Q12: r = 2 m, speed 4 m/s, speeding up at 3 m/s². */
  q12: nonUniform(2, 4, 3),
  /** Q13: incline 30°, u = 20 m/s at 75° to the horizontal. */
  q13: upIncline(20, 75, 30),
  /** Q14: speed at the top is half the launch speed → cos θ = 1/2 → θ = 60°; KE at top = 1/4 of initial. */
  q14: { thetaDeg: deg(Math.acos(0.5)), keRatio: 0.25 },
  /** Q15: radius of curvature at the top for u = 20 m/s at 60°. */
  q15: { r: p60.topRadius },
};

/** Worked examples inside the theory pages. */
export const EXAMPLES = {
  /** 10 N at 37° to x (sin 37° = 3/5, cos 37° = 4/5). */
  force37: { fx: 10 * (4 / 5), fy: 10 * (3 / 5) },
  /** A = 3i + 4j: magnitude, angle with x. */
  a34: { mag: Math.hypot(3, 4), angleDeg: deg(Math.atan2(4, 3)) },
  /** (2i + λj) ⟂ (3i − 6j): 6 − 6λ = 0. */
  lambda: 6 / 6,
  /** Area of the triangle made by A = 2i + 3j − k and B = i − 2j + 2k. */
  triArea: mag(cross([2, 3, -1], [1, -2, 2])) / 2,
  /** x = 3t, y = 4t − 5t²: launch speed and angle (it is a projectile with g = 10). */
  path: { speed0: Math.hypot(3, 4), angleDeg: deg(Math.atan2(4, 3)), ay: -10 },
  /** u = 2i, a = 2j, t = 3 s. */
  constAcc: { v: [2, 2 * 3] as [number, number], r: [2 * 3, 0.5 * 2 * 9] as [number, number] },
  /** Car A 20 m/s east, car B 15 m/s north: velocity of A relative to B. */
  cars: { rel: Math.hypot(20, 15), southOfEastDeg: deg(Math.atan2(15, 20)) },
  /** Trajectory y = x − x²/20 (SI, g = 10): tanθ = 1, R = 20 m, g/(2u²cos²θ) = 1/20. */
  traj: (() => {
    const th = 45 * DEG;
    const u = Math.sqrt((G * 20) / (2 * Math.cos(th) ** 2));
    return { thetaDeg: 45, R: 20, u, H: projectile(u, 45).H, Rcheck: projectile(u, 45).R };
  })(),
  /** Range is the same for complementary angles: 20 m/s at 15° and 75°. */
  comp15: projectile(20, 15).R,
  comp75: projectile(20, 75).R,
  /** Max range for 20 m/s (45°): u²/g = 40 m, and H then = R/4 = 10 m. */
  max45: projectile(20, 45),
};
