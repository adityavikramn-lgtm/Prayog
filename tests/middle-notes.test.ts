import { describe, expect, it } from "vitest";
import { BOARD_M, BROKEN, CONVERSIONS, FRICTION_ANSWERS, FRICTION_Q, HANDSPANS, LAPS, SHORT_EXAMPLE, UNIT } from "../src/notes/middle";

describe("Class 6 measurement pack: answers", () => {
  it("conversions match the direct factors (second route)", () => {
    const direct: Record<string, number> = {
      "2.5 m = ___ cm": 2.5 * UNIT.cmPerM,
      "340 cm = ___ m": 340 / UNIT.cmPerM,
      "4.2 cm = ___ mm": 4.2 * UNIT.mmPerCm,
      "3 km = ___ m": 3 * UNIT.mPerKm,
      "1500 m = ___ km": 1500 / UNIT.mPerKm,
      "75 mm = ___ cm": 75 / UNIT.mmPerCm,
    };
    for (const c of CONVERSIONS) expect(c.answer).toBeCloseTo(direct[c.q], 9);
    expect(CONVERSIONS.map((c) => c.answer)).toEqual([250, 3.4, 42, 3000, 1.5, 7.5]);
  });
  it("broken ruler: 9.5 − 2.0 = 7.5 cm and 10.0 − 1.5 = 8.5 cm", () => {
    expect(BROKEN.map((b) => b.length)).toEqual([7.5, 8.5]);
  });
  it("handspans across a 3.2 m board: 20 for 16 cm, 16 for 20 cm; both × span give 320 cm", () => {
    expect(HANDSPANS.map((h) => h.spans)).toEqual([20, 16]);
    for (const h of HANDSPANS) expect(h.spans * h.cm).toBeCloseTo(BOARD_M * 100, 9);
  });
  it("5 laps of 400 m = 2000 m = 2 km", () => {
    expect(LAPS.totalM).toBe(2000);
    expect(LAPS.totalKm).toBe(2);
  });
});

describe("Class 8 friction pack: answers", () => {
  it("80 N to start, 50 N to slide: a 70 N push doesn't move it (friction 70 N); 90 N does (net 40 N); steady needs 50 N", () => {
    expect(FRICTION_ANSWERS.push70).toEqual({ moves: false, friction: 70, net: 0 });
    expect(FRICTION_ANSWERS.push90).toEqual({ moves: true, friction: 50, net: 40 });
    expect(FRICTION_ANSWERS.steady).toBe(FRICTION_Q.box.slideN);
  });
  it("the Short's example: 20 kg weighs 200 N; at 100 N push while sliding, net 40 N gives 2 m/s²", () => {
    expect(SHORT_EXAMPLE.weightN).toBe(SHORT_EXAMPLE.kg * 10);
    expect(SHORT_EXAMPLE.kickNet).toBe(SHORT_EXAMPLE.startN - SHORT_EXAMPLE.slideN);
    expect(SHORT_EXAMPLE.kickAccel).toBe(2);
  });
});
