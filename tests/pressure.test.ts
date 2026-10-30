import { describe, expect, it } from "vitest";
import { BAG, BRICK, BRICK_FACES, KNIFE, PRACTICE, pressure, pressureFromCm2 } from "../src/templates/pressure/model";
import { BEATS, fill, planPressure, scriptValues, spokenText } from "../src/templates/pressure/script";

describe("Class 8 pressure lesson: numbers", () => {
  it("brick (2 kg, 20 N): flat 200 cm² → 1000 Pa, on end 50 cm² → 4000 Pa, by two routes", () => {
    const [flat, end] = BRICK_FACES;
    expect(BRICK.weightN).toBe(20);
    expect(flat.areaCm2).toBe(200);
    expect(end.areaCm2).toBe(50);
    expect(flat.pressurePa).toBeCloseTo(1000, 6);
    expect(end.pressurePa).toBeCloseTo(4000, 6);
    expect(pressureFromCm2(20, flat.areaCm2)).toBeCloseTo(flat.pressurePa, 6);
    expect(pressureFromCm2(20, end.areaCm2)).toBeCloseTo(end.pressurePa, 6);
    expect(end.pressurePa / flat.pressurePa).toBeCloseTo(4, 9);
  });

  it("knife (20 N, 10 cm edge): sharp 0.1 mm → 2,000,000 Pa, blunt 1 mm → 200,000 Pa", () => {
    const [sharp, blunt] = KNIFE.edges;
    expect(sharp.pressurePa).toBeCloseTo(2_000_000, 3);
    expect(blunt.pressurePa).toBeCloseTo(200_000, 3);
    expect(pressureFromCm2(20, 10 * 0.01)).toBeCloseTo(sharp.pressurePa, 3);
  });

  it("school bag (5 kg = 50 N on two straps, 10 cm contact): 2 cm → 12,500 Pa, 5 cm → 5,000 Pa", () => {
    const [thin, wide] = BAG.straps;
    expect(thin.pressurePa).toBeCloseTo(12_500, 6);
    expect(wide.pressurePa).toBeCloseTo(5_000, 6);
    expect(pressureFromCm2(50, 2 * 10 * 2)).toBeCloseTo(thin.pressurePa, 6);
  });

  it("practice: 40 N on 0.02 m² = 2000 Pa", () => {
    expect(PRACTICE.answerPa).toBeCloseTo(2000, 9);
    expect(pressure(40, 0.02)).toBeCloseTo(pressureFromCm2(40, 200), 9);
  });
});

describe("Class 8 pressure lesson: script", () => {
  const values = scriptValues();
  it("fills every placeholder and states the computed answers", () => {
    const all = BEATS.flatMap((b) => b.lines.map((l) => fill(l.text, values))).join(" ");
    expect(all).not.toMatch(/\{\{/);
    for (const s of ["1,000 Pa", "4,000 Pa", "2,000,000 Pa", "12,500 Pa", "5,000 Pa", "Answer: 2,000 Pa"]) expect(all).toContain(s);
  });
  it("the voice never reads maths symbols", () => {
    for (const b of BEATS) for (const l of b.lines) expect(spokenText(l, values)).not.toMatch(/[$\\²]/);
  });
  it("is about 1.5 to 2.5 minutes without a voice", () => {
    const { seconds } = planPressure();
    expect(seconds).toBeGreaterThan(80);
    expect(seconds).toBeLessThan(150);
  });
});
