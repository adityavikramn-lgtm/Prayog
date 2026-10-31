import { describe, expect, it } from "vitest";
import { G_NEWTON, simulate, tidyScene } from "../src/sandbox/sim";
import { SceneSpec } from "../src/sandbox/spec";

const run = (s: unknown) => simulate(SceneSpec.parse(s));
const near = (a: number | undefined, b: number, rel = 2e-3) => expect(Math.abs((a ?? NaN) - b) / Math.abs(b)).toBeLessThan(rel);

describe("universal simulator matches exact physics", () => {
  const ball = (measure: string) => ({
    g: 10,
    groundY: 0,
    bodies: [{ id: "ball", mass: 1, position: [0, 0, 0], velocity: [16, 12, 0] }],
    duration: 3,
    measure: { kind: measure, body: "ball" },
  });
  it("projectile 20 m/s at 37°: R = 38.4 m, T = 2.4 s, H = 7.2 m, lands at 20 m/s", () => {
    near(run(ball("range")).measured?.value, 38.4);
    near(run(ball("time_to_ground")).measured?.value, 2.4);
    near(run(ball("max_height")).measured?.value, 7.2);
    near(run(ball("speed_at_ground")).measured?.value, 20);
  });
  it("spring m = 0.5 kg, k = 50 N/m: period 2π√(m/k) = π/5 s", () => {
    const r = run({ g: 0, bodies: [{ id: "m", mass: 0.5, position: [0.1, 0, 0], velocity: [0, 0, 0] }], springs: [{ a: "anchor", anchor: [-1, 0, 0], b: "m", k: 50, restLength: 1 }], duration: 2, measure: { kind: "period", body: "m" } });
    near(r.measured?.value, Math.PI / 5);
  });
  it("charge in a magnetic field: r = mv/qB = 10 m and period 2πm/qB", () => {
    const s = { g: 0, B: [0, 0, 1], bodies: [{ id: "q", mass: 1e-3, charge: 1e-3, position: [0, 0, 0], velocity: [10, 0, 0] }], duration: 8 };
    near(run({ ...s, measure: { kind: "radius_of_path", body: "q" } }).measured?.value, 10);
    near(run({ ...s, measure: { kind: "period", body: "q" } }).measured?.value, 2 * Math.PI);
  });
  it("elastic head-on collision of equal masses: velocities swap", () => {
    const r = run({ g: 0, collisions: true, restitution: 1, bodies: [{ id: "a", mass: 2, radius: 0.1, position: [0, 0, 0], velocity: [4, 0, 0] }, { id: "b", mass: 2, radius: 0.1, position: [1, 0, 0], velocity: [0, 0, 0] }], duration: 1, measure: { kind: "final_velocity_x", body: "b" } });
    near(r.measured?.value, 4);
  });
  it("perfectly inelastic collision: common velocity m1u/(m1+m2)", () => {
    const r = run({ g: 0, collisions: true, restitution: 0, bodies: [{ id: "a", mass: 3, radius: 0.1, position: [0, 0, 0], velocity: [4, 0, 0] }, { id: "b", mass: 1, radius: 0.1, position: [1, 0, 0], velocity: [0, 0, 0] }], duration: 1, measure: { kind: "final_velocity_x", body: "b" } });
    near(r.measured?.value, 3);
  });
  it("circular orbit: period 2π√(r³/GM)", () => {
    const M = 6e24;
    const R = 7e6;
    const v = Math.sqrt((G_NEWTON * M) / R);
    const T = 2 * Math.PI * Math.sqrt(R ** 3 / (G_NEWTON * M));
    const r = run({ g: 0, gravitation: true, bodies: [{ id: "earth", mass: M, fixed: true, radius: 6.4e6, position: [0, 0, 0], velocity: [0, 0, 0] }, { id: "sat", mass: 1000, position: [R, 0, 0], velocity: [0, v, 0] }], duration: T * 1.3, measure: { kind: "period", body: "sat" } });
    near(r.measured?.value, T);
  });
  it("block sliding on a rough table, μ = 0.2, from 10 m/s: stops after 5 s and 25 m", () => {
    const s = { g: 10, groundY: 0, groundFriction: 0.2, bodies: [{ id: "block", mass: 2, position: [0, 0, 0], velocity: [10, 0, 0] }], duration: 7 };
    near(run({ ...s, measure: { kind: "time_to_stop", body: "block" } }).measured?.value, 5, 5e-3);
    near(run({ ...s, measure: { kind: "distance_travelled", body: "block" } }).measured?.value, 25, 5e-3);
  });
  it("two like charges pushed together: closest approach from energy", () => {
    // q = 1 µC each, m = 1 g, fired at 10 m/s from far away at a fixed charge: r_min = kq²/(½mv²) = 9e9·1e-12/0.05 = 0.18 m
    const r = run({ g: 0, coulomb: true, bodies: [{ id: "fixed", mass: 1, charge: 1e-6, fixed: true, position: [0, 0, 0], velocity: [0, 0, 0] }, { id: "q", mass: 1e-3, charge: 1e-6, position: [-50, 0, 0], velocity: [10, 0, 0] }], duration: 12, measure: { kind: "min_distance", body: "q", body2: "fixed" } });
    near(r.measured?.value, (9e9 * 1e-12) / (0.5 * 1e-3 * 100) / (1 - 0.18 / 50) ** 0, 5e-3);
  });
  it("a scene with bad numbers is rejected before it runs", () => {
    expect(SceneSpec.safeParse({ g: 10, bodies: [], duration: 1 }).success).toBe(false);
    expect(SceneSpec.safeParse({ g: 10, bodies: [{ id: "a", mass: -1, position: [0, 0, 0], velocity: [0, 0, 0] }], duration: 1 }).success).toBe(false);
  });
});

describe("simulator details found in live testing", () => {
  it("a body placed one radius above the floor starts on it (friction stop distance v²/2μg = 8 m)", () => {
    const r = simulate(SceneSpec.parse({ g: 10, groundY: 0, groundFriction: 0.4, bodies: [{ id: "b", mass: 1, radius: 0.2, position: [0, 0.2, 0], velocity: [8, 0, 0] }], duration: 5, measure: { kind: "distance_travelled", body: "b" } }));
    expect(Math.abs(r.measured!.value - 8) / 8).toBeLessThan(5e-3);
  });
  it("bounce: dropped from 5 m with e = 0.5 rises to e²·5 = 1.25 m", () => {
    const r = simulate(SceneSpec.parse({ g: 10, groundY: 0, restitution: 0.5, bodies: [{ id: "ball", mass: 1, radius: 0.05, position: [0, 5, 0], velocity: [0, 0, 0] }], duration: 2.5, measure: { kind: "bounce_height", body: "ball" } }));
    expect(Math.abs(r.measured!.value - 1.25) / 1.25).toBeLessThan(5e-3);
  });
});

describe("tidyScene", () => {
  it("trims 150 loops of a proton to about two loops, without changing the measured radius", () => {
    const scene = SceneSpec.parse({ g: 0, B: [0, 0, 0.1], bodies: [{ id: "p", mass: 1.67e-27, charge: 1.6e-19, radius: 0.01, position: [0, 0, 0], velocity: [1e6, 0, 0] }], duration: 1e-4, measure: { kind: "radius_of_path", body: "p" } });
    const T = (2 * Math.PI * 1.67e-27) / (1.6e-19 * 0.1);
    const tidy = tidyScene(scene);
    expect(tidy.duration / T).toBeGreaterThan(2);
    expect(tidy.duration / T).toBeLessThan(2.5);
    const r = simulate(tidy).measured!.value;
    expect(Math.abs(r - (1.67e-27 * 1e6) / (1.6e-19 * 0.1)) / r).toBeLessThan(2e-3);
  });
  it("leaves a one-off motion (a projectile) alone", () => {
    const scene = SceneSpec.parse({ g: 10, groundY: 0, bodies: [{ id: "b", mass: 1, position: [0, 0, 0], velocity: [16, 12, 0] }], duration: 3 });
    expect(tidyScene(scene).duration).toBe(3);
  });
});
