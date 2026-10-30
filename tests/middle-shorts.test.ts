import { describe, expect, it } from "vitest";
import { BOX, FRICTION_LINES, G, KICK, MEASURE_LINES, RAMP, SPANS, TABLE_M, boxX, cruiseSpeed, frictionAt, pushAt, spansFor, weightN } from "../src/shorts/middle";
import { bare, planLines } from "../src/shorts/plane";

describe("Class 6 Short: handspans", () => {
  it("a 1.6 m table is 8 of Riya's 20 cm spans and 10 of Arjun's 16 cm spans", () => {
    expect(spansFor(SPANS.riya.cm)).toBe(8);
    expect(spansFor(SPANS.arjun.cm)).toBe(10);
    expect(spansFor(SPANS.riya.cm) * SPANS.riya.cm).toBeCloseTo(TABLE_M * 100, 9);
    expect(spansFor(SPANS.arjun.cm) * SPANS.arjun.cm).toBeCloseTo(TABLE_M * 100, 9);
  });
});

describe("Class 8 Short: static vs sliding friction (checked by stepping Newton's 2nd law)", () => {
  it("20 kg weighs 200 N; the box stays still while the push is below 100 N", () => {
    expect(weightN).toBe(200);
    for (let t = 0; t <= RAMP; t += 0.01) {
      expect(frictionAt(t)).toBeCloseTo(pushAt(t), 9);
      expect(boxX(t)).toBe(0);
    }
  });
  it("after it starts sliding, the closed-form position matches a step-by-step simulation", () => {
    let x = 0;
    let v = 0;
    const dt = 1e-5;
    for (let t = RAMP; t < RAMP + KICK + 2; t += dt) {
      const net = pushAt(t + dt / 2) - BOX.slidingN; // sliding friction once moving
      v += (net / BOX.kg) * dt;
      x += v * dt;
    }
    expect(v).toBeCloseTo(cruiseSpeed, 3);
    expect(x).toBeCloseTo(boxX(RAMP + KICK + 2), 2);
  });
  it("keeping it moving needs exactly the sliding friction: 60 N gives zero net force", () => {
    expect(pushAt(RAMP + KICK + 1) - frictionAt(RAMP + KICK + 1)).toBe(0);
    expect(BOX.staticMaxN).toBeGreaterThan(BOX.slidingN);
    expect(G).toBe(10);
  });
});

describe("Class 6–8 Short scripts", () => {
  it("accent and echo words are spoken in their lines", () => {
    for (const lines of [MEASURE_LINES, FRICTION_LINES])
      for (const l of lines) {
        const said = l.say.split(/\s+/).map(bare);
        for (const w of [...(l.accent ?? []), ...(l.echo ?? [])]) expect(said, `${w} in "${l.say}"`).toContain(w);
      }
  });
  it("each Short is 30–60 s without a voice", () => {
    for (const lines of [MEASURE_LINES, FRICTION_LINES]) {
      const s = planLines(lines).seconds;
      expect(s).toBeGreaterThan(30);
      expect(s).toBeLessThan(60);
    }
  });
});
