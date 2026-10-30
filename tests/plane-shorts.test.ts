import { describe, expect, it } from "vitest";
import {
  DROP,
  DROP_LINES,
  G,
  MONKEY,
  MONKEY_LINES,
  aimAngle,
  bare,
  dropBy,
  dropTime,
  hitHeight,
  hitTime,
  monkeyLandTime,
  planLines,
  throwRange,
} from "../src/shorts/plane";

/** Step Newton's 2nd law for any number of bodies (velocity Verlet, dt small). */
function step(bodies: { x: number; y: number; vx: number; vy: number }[], dt: number) {
  for (const b of bodies) {
    b.vy -= G * dt * 0.5;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vy -= G * dt * 0.5;
  }
}

describe("Part 1: drop vs throw", () => {
  it("both balls land after √(2h/g) = 2 s; the thrown one lands 20 m away (simulated)", () => {
    expect(dropTime).toBeCloseTo(2, 12);
    expect(throwRange).toBeCloseTo(20, 12);
    const a = { x: 0, y: DROP.h, vx: 0, vy: 0 };
    const b = { x: 0, y: DROP.h, vx: DROP.u, vy: 0 };
    let t = 0;
    let tA = 0;
    let tB = 0;
    const dt = 1e-5;
    while ((!tA || !tB) && t < 5) {
      step([a, b], dt);
      t += dt;
      if (!tA && a.y <= 0) tA = t;
      if (!tB && b.y <= 0) tB = t;
      // at every instant the two heights are equal
      expect(Math.abs(a.y - b.y)).toBeLessThan(1e-9);
    }
    expect(tA).toBeCloseTo(dropTime, 3);
    expect(tB).toBeCloseTo(dropTime, 3);
    expect(b.x).toBeCloseTo(throwRange, 2);
  });
});

describe("Part 2: the monkey problem", () => {
  it("aiming straight at the monkey (37°, 25 m/s) the ball meets it after 1 s, 10 m up, both 5 m below their straight paths", () => {
    expect((aimAngle * 180) / Math.PI).toBeCloseTo(36.87, 2);
    expect(hitTime).toBeCloseTo(1, 12);
    expect(dropBy).toBeCloseTo(5, 12);
    expect(hitHeight).toBeCloseTo(10, 12);
    const ball = { x: 0, y: 0, vx: MONKEY.u * Math.cos(aimAngle), vy: MONKEY.u * Math.sin(aimAngle) };
    const monkey = { x: MONKEY.d, y: MONKEY.H, vx: 0, vy: 0 };
    let t = 0;
    let best = { d: Infinity, t: 0, y: 0 };
    const dt = 1e-5;
    while (t < 1.6) {
      step([ball, monkey], dt);
      t += dt;
      const d = Math.hypot(ball.x - monkey.x, ball.y - monkey.y);
      if (d < best.d) best = { d, t, y: ball.y };
    }
    expect(best.d).toBeLessThan(1e-3);
    expect(best.t).toBeCloseTo(hitTime, 3);
    expect(best.y).toBeCloseTo(hitHeight, 3);
  });
  it("the hit happens before the monkey would reach the ground (1 s < 1.73 s)", () => {
    expect(monkeyLandTime).toBeCloseTo(Math.sqrt(3), 9);
    expect(hitTime).toBeLessThan(monkeyLandTime);
  });
});

describe("scripts", () => {
  it("every accent and echo word is spoken in its line", () => {
    for (const lines of [DROP_LINES, MONKEY_LINES])
      for (const l of lines) {
        const said = l.say.split(/\s+/).map(bare);
        for (const w of [...(l.accent ?? []), ...(l.echo ?? [])]) expect(said, `${w} in "${l.say}"`).toContain(w);
      }
  });
  it("the numbers on screen are the computed ones", () => {
    expect(DROP_LINES.find((l) => l.visual === "numbers")!.say).toContain(`${dropTime} seconds`);
    expect(MONKEY_LINES.find((l) => l.visual === "five")!.say).toContain(`${dropBy} metres`);
  });
  it("each Short is 30–60 s without a voice", () => {
    for (const lines of [DROP_LINES, MONKEY_LINES]) {
      const s = planLines(lines).seconds;
      expect(s).toBeGreaterThan(30);
      expect(s).toBeLessThan(60);
    }
  });
});
