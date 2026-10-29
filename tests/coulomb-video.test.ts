import { describe, expect, it } from "vitest";
import { DEMO_BEATS, demoSeconds } from "../src/pitch/script";
import { K_JEE, coulombForce } from "../src/physics/coulomb";
import { SETUPS, nullPointFromQ1, releaseAt, triangleNetForce } from "../src/templates/coulomb/model";
import { planCoulomb } from "../src/templates/coulomb/plan";
import {
  BEATS,
  CARDS,
  EXACT,
  LAW_R_CLOSE,
  SAY_EN,
  fill,
  lineKey,
  scriptValues,
  spokenEn,
  spokenValues,
} from "../src/templates/coulomb/script";

const values = scriptValues();
const texts = [...BEATS.flatMap((b) => b.lines), ...Object.values(CARDS)];

describe("Coulomb explainer script", () => {
  it("every line exists in English and Hinglish (Roman script)", () => {
    for (const t of texts) {
      expect(t.en.trim().length).toBeGreaterThan(0);
      expect(t.hi.trim().length).toBeGreaterThan(0);
      expect(t.hi).not.toMatch(/[ऀ-ॿ]/);
    }
  });

  it("every placeholder is filled and maths markers pair up", () => {
    for (const t of texts) {
      for (const s of [t.en, t.hi]) {
        const f = fill(s, values);
        expect(f).not.toContain("{{");
        expect((f.match(/\$/g) ?? []).length % 2).toBe(0);
      }
    }
  });

  it("numbers on screen are the solver's: 60 N, 15 N, 0.4 N, 2.45 m/s, 3 m/s, 1.56 N, 10 cm", () => {
    expect(values.lawF).toBe("60.0");
    expect(values.lawF2).toBe("15.0");
    expect(values.lawFclose).toBe("135");
    expect(values.thirdF).toBe("0.400");
    expect(values.v30).toBe("2.45");
    expect(values.vinf).toBe("3.00");
    expect(values.pairF).toBe("0.900");
    expect(values.netF).toBe("1.56");
    expect(values.xNull).toBe("10");
    expect(coulombForce(K_JEE, SETUPS.law.q1, SETUPS.law.q2, LAW_R_CLOSE)).toBeCloseTo(135, 9);
  });

  it("exact forms shown on screen match the solver", () => {
    expect(EXACT.triangleNet).toBe("0.9\\sqrt{3}");
    expect(Math.hypot(triangleNetForce().fx, triangleNetForce().fy)).toBeCloseTo(0.9 * Math.sqrt(3), 12);
    expect(EXACT.releaseSpeed).toBe("\\sqrt{6}");
    expect(releaseAt(SETUPS.releaseEnd).v1).toBeCloseTo(Math.sqrt(6), 12);
    const used = BEATS.flatMap((b) => b.lines).map((l) => l.en).join(" ");
    expect(used).toContain(EXACT.triangleNet);
    expect(used).toContain(EXACT.releaseSpeed);
  });

  it("the reveal's worked step (30 − x = 2x, x = 10 cm) agrees with the solver", () => {
    const x = nullPointFromQ1() * 100;
    expect(30 - x).toBeCloseTo(2 * x, 9);
    expect(x).toBeCloseTo(10, 9);
  });

  it("lasts 4 to 5 minutes, with every caption inside its beat", () => {
    const plan = planCoulomb();
    expect(plan.seconds).toBeGreaterThanOrEqual(240);
    expect(plan.seconds).toBeLessThanOrEqual(300);
    for (const b of BEATS) for (const l of b.lines) expect(l.at).toBeLessThan(b.seconds - 2);
  });

  it("captions fit in two lines on a 16:9 frame (≤ 120 visible characters)", () => {
    for (const t of BEATS.flatMap((b) => b.lines)) {
      for (const s of [t.en, t.hi]) {
        const visible = fill(s, values).replace(/\$/g, "").replace(/\\[a-z]+/g, "x").replace(/[{}^_]/g, "");
        expect(visible.length).toBeLessThanOrEqual(120);
      }
    }
  });

  it("voice clips start with their captions and never run into the next line", () => {
    const voice = { "law-2": { src: "x.wav", seconds: 9 }, "hook-0": { src: "x.wav", seconds: 2 } };
    const plan = planCoulomb(voice);
    expect(plan.seconds).toBeCloseTo(planCoulomb().seconds, 9); // the animation timing never changes
    const law = plan.beats.find((b) => b.id === "law")!;
    const clip = law.clips[0];
    const script = BEATS.find((b) => b.id === "law")!;
    expect(clip.at).toBe(script.lines[2].at);
    expect(clip.at + clip.clip.seconds / clip.rate).toBeLessThanOrEqual(script.lines[3].at);
    expect(plan.beats.find((b) => b.id === "hook")!.clips[0].rate).toBe(1); // short clips play at normal speed
  });

  it("the voice reads words, not symbols, for every line", () => {
    const spoken = spokenValues();
    BEATS.forEach((b) =>
      b.lines.forEach((l, i) => {
        const say = spokenEn(b.id, i, spoken);
        expect(say).not.toMatch(/[$\\{}^_µ]/);
        if (/[$µ]|\{\{/.test(l.en)) expect(SAY_EN[lineKey(b.id, i)], `${lineKey(b.id, i)} needs a spoken version`).toBeDefined();
      }),
    );
    for (const key of Object.keys(SAY_EN)) {
      const [beat, i] = key.split("-");
      expect(BEATS.find((b) => b.id === beat)?.lines[Number(i)], `${key} is not a caption line`).toBeDefined();
    }
  });

  it("spoken numbers match the numbers on screen", () => {
    const s = spokenValues();
    expect(s.lawFSay).toBe("sixty");
    expect(s.lawFcloseSay).toBe("one hundred thirty-five");
    expect(s.thirdFSay).toBe("zero point four");
    expect(s.v30Say).toBe("two point four five");
    expect(s.netFSay).toBe("one point five six");
    expect(s.xNullSay).toBe("ten");
  });
});

describe("teacher demo script", () => {
  it("lasts 2 to 3 minutes and every caption is inside its beat", () => {
    expect(demoSeconds()).toBeGreaterThanOrEqual(120);
    expect(demoSeconds()).toBeLessThanOrEqual(180);
    for (const b of DEMO_BEATS) for (const l of b.lines) expect(l.at).toBeLessThan(b.seconds - 2);
  });

  it("says plainly which features are not built yet", () => {
    const all = DEMO_BEATS.flatMap((b) => b.lines.map((l) => l.text)).join(" ");
    expect(all).toMatch(/aren't built yet/);
  });
});
