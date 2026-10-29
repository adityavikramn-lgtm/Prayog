import { describe, expect, it } from "vitest";
import { planHemisphere } from "../src/templates/hemisphere/plan";
import { BEATS, fill, lineKey, scriptValues, spokenText } from "../src/templates/hemisphere/script";

const values = scriptValues();
const lines = BEATS.flatMap((b) => b.lines.map((line, i) => ({ beat: b.id, i, line })));

describe("hemisphere explainer narration", () => {
  it("captions fill every placeholder and pair their maths markers", () => {
    for (const { line } of lines) {
      const text = fill(line.text, values);
      expect(text).not.toContain("{{");
      expect((text.match(/\$/g) ?? []).length % 2).toBe(0);
    }
  });

  it("the voice never reads raw maths: no $, no backslashes, no braces", () => {
    for (const { line } of lines) {
      const say = spokenText(line, values);
      expect(say).not.toMatch(/[$\\{}^_]/);
      if (line.text.includes("$")) expect(line.say, `"${line.text}" needs a spoken version`).toBeDefined();
    }
  });

  it("numbers spoken and shown agree with the solver (30 J total, 20 J + 10 J, traps 20 J and 35.7 J)", () => {
    expect(values.w).toBe("30.0");
    expect(values.wSay).toBe("thirty");
    expect(values.wg).toBe("20.0");
    expect(values.wf).toBe("10.0");
    expect(values.wsim).toBe("30.0");
    expect(values.wrong2).toBe("35.7");
    expect(values.wrong2Say).toBe("thirty-five point seven");
  });

  it("is a full-size video of 5 to 6 minutes without a voiceover", () => {
    const s = planHemisphere().seconds;
    expect(s).toBeGreaterThanOrEqual(300);
    expect(s).toBeLessThanOrEqual(360);
  });

  it("with a voiceover, lines never overlap and each beat waits for its last line", () => {
    const voice = Object.fromEntries(
      lines.map(({ beat, i, line }) => [lineKey(beat, i), { src: "x.mp3", seconds: 2 + spokenText(line, values).length / 14 }]),
    );
    const plan = planHemisphere(voice);
    for (const b of plan.beats) {
      for (let i = 1; i < b.lines.length; i++) {
        const prev = b.lines[i - 1];
        expect(b.lines[i].at).toBeGreaterThanOrEqual(prev.at + prev.clip!.seconds);
      }
      const last = b.lines[b.lines.length - 1];
      expect(b.seconds).toBeGreaterThan(last.at + last.clip!.seconds);
    }
    expect(plan.seconds).toBeGreaterThanOrEqual(planHemisphere().seconds);
  });

  it("lines without a clip keep their scripted times", () => {
    const plan = planHemisphere();
    BEATS.forEach((b, bi) => b.lines.forEach((line, i) => expect(plan.beats[bi].lines[i].at).toBe(line.at)));
  });
});
