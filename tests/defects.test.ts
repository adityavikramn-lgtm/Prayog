import { describe, expect, it } from "vitest";
import {
  CU_VAC,
  CW_EX,
  HALL_PETCH,
  HP_EX,
  K_BOLTZ_EV,
  QUIZ,
  amplitudeRatio,
  avrami,
  grainGrowth,
  percentCW,
  sitesPerM3,
  slipped,
  vacancyFraction,
  yieldMPa,
} from "../src/templates/defects/model";
import { BEATS, PAUSE_AFTER, fill, planDefects, scriptValues, spokenText } from "../src/templates/defects/script";

describe("vacancies (book Example 5.1)", () => {
  it("copper: N = 8.0 × 10²⁸ sites/m³ and Nv = 2.2 × 10²⁵ /m³ at 1000 °C", () => {
    expect(CU_VAC.N / 1e28).toBeCloseTo(8.0, 1);
    expect(CU_VAC.Nv / 1e25).toBeCloseTo(2.2, 1);
  });
  it("second route: ln(Nv/N) = −Qv/kT", () => {
    expect(Math.log(CU_VAC.Nv / CU_VAC.N)).toBeCloseTo(-CU_VAC.qEv / (K_BOLTZ_EV * 1273), 10);
    expect(sitesPerM3(8.4, 63.5)).toBeCloseTo((6.022e23 * 8.4e6) / 63.5, 0);
  });
  it("about 1 in 3600 sites at 1000 °C, about 1 in 10¹⁵ at room temperature, and always rising with T", () => {
    expect(Math.round(CU_VAC.oneIn / 100) * 100).toBe(3600);
    expect(Math.round(Math.log10(1 / CU_VAC.roomFrac))).toBe(15);
    for (let K = 300; K < 1400; K += 50) expect(vacancyFraction(0.9, K + 50)).toBeGreaterThan(vacancyFraction(0.9, K));
  });
});

describe("edge dislocation slip profile", () => {
  it("far behind the core the crystal has slipped one spacing, far ahead none, half at the core", () => {
    expect(slipped(-1000, 0, 1)).toBeCloseTo(1, 3);
    expect(slipped(1000, 0, 1)).toBeCloseTo(0, 3);
    expect(slipped(5, 5, 1)).toBeCloseTo(0.5, 12);
  });
  it("once the dislocation has crossed a 15-spacing crystal, every top atom has moved by about b", () => {
    for (let i = 0; i < 15; i++) expect(slipped(i, 15 + 200, 0.8)).toBeGreaterThan(0.99);
  });
});

describe("Hall–Petch", () => {
  it("σy = σ0 + ky/√d: 100 µm → 144 MPa, 10 µm → 304 MPa with the example values", () => {
    expect(Math.round(HP_EX.coarseMPa)).toBe(144);
    expect(Math.round(HP_EX.fineMPa)).toBe(304);
  });
  it("is linear in d^(−1/2) with slope ky and intercept σ0 (second route)", () => {
    const x1 = 1 / Math.sqrt(100e-6);
    const x2 = 1 / Math.sqrt(10e-6);
    const slope = (yieldMPa(10) - yieldMPa(100)) / (x2 - x1);
    expect(slope).toBeCloseTo(HALL_PETCH.ky, 12);
    expect(yieldMPa(100) - slope * x1).toBeCloseTo(HALL_PETCH.sigma0, 9);
  });
});

describe("percent cold work", () => {
  it("book Example 8.2: 15.2 mm → 12.2 mm is 35.6 %CW, the same as 1 − (dd/d0)²", () => {
    expect(CW_EX.pct.toFixed(1)).toBe("35.6");
    expect(CW_EX.pct).toBeCloseTo((1 - (12.2 / 15.2) ** 2) * 100, 10);
  });
  it("quiz: 10 mm → 8 mm is 36 %CW", () => {
    expect(QUIZ.pct).toBeCloseTo(36, 10);
    expect(percentCW(10, 10)).toBe(0);
  });
});

describe("annealing laws used in the drawings", () => {
  it("Avrami fraction runs 0 → 1 and grows with time", () => {
    expect(avrami(0, 1)).toBe(0);
    expect(avrami(1, 1)).toBeCloseTo(1 - Math.exp(-1), 12);
    expect(avrami(5, 1)).toBeGreaterThan(0.999);
  });
  it("grain growth d² − d0² = Kt", () => {
    const d = grainGrowth(1, 1.2, 3);
    expect(d * d - 1).toBeCloseTo(1.2 * 3, 12);
    expect(grainGrowth(2, 5, 0)).toBe(2);
  });
  it("vibration amplitude grows as √T", () => {
    expect(amplitudeRatio(1200)).toBeCloseTo(2, 12);
  });
});

describe("script", () => {
  const values = scriptValues();
  it("every line can be spoken: no digits or symbols left for the voice", () => {
    for (const b of BEATS)
      for (const l of b.lines) {
        expect(() => fill(l.text, values)).not.toThrow();
        const said = spokenText(l, values);
        expect(said, said).not.toMatch(/[0-9$°%α-ω→−÷=×µ⅓½¹²³⁴⁵⁶⁷⁸⁹⁰_\\{}]/);
      }
  });
  it("numbers on screen come from the model", () => {
    expect(values.Nv).toBe("2.2 × 10²⁵");
    expect(values.cw).toBe("35.6");
    expect(values.quiz).toBe("36");
    expect(values.fineMPa).toBe("304");
  });
  it("covers every Unit II syllabus topic", () => {
    const all = BEATS.flatMap((b) => [b.chapter, ...b.lines.map((l) => l.text)])
      .join(" ")
      .toLowerCase();
    for (const topic of ["point defects", "line defects", "surface defects", "volume defects", "vacancy", "dislocation", "grain", "vibrat", "strain hardening", "recovery", "recrystallization", "grain growth", "hall–petch"])
      expect(all, topic).toContain(topic);
  });
  it("runs about 10 minutes without a voice, pauses only on known lines", () => {
    const m = planDefects().seconds / 60;
    expect(m).toBeGreaterThan(8);
    expect(m).toBeLessThan(12);
    const keys = new Set(BEATS.flatMap((b) => b.lines.map((_, i) => `${b.id}-${i}`)));
    for (const k of Object.keys(PAUSE_AFTER)) expect(keys.has(k), k).toBe(true);
  });
});
