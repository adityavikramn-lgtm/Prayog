import { describe, expect, it } from "vitest";
import { SHORT_LINES, bare, planShort, shortLineKey, slip } from "../src/pitch/short";

describe("'Start Here' motion-graphics Short", () => {
  it("its numbers come from the solver: sin θ slip gives 20.0 m, right answer 34.6 m, off by 14.6 m, simulation agrees", () => {
    const s = slip();
    expect(s.wrong).toBe("20.0");
    expect(s.right).toBe("34.6");
    expect(s.diff).toBe("14.6");
    expect(s.sim).toBe(s.right);
    expect(SHORT_LINES[3].say).toContain(s.diff);
  });

  it("is 30–60 s long without a voice, and lines never overlap", () => {
    const plan = planShort();
    expect(plan.seconds).toBeGreaterThanOrEqual(30);
    expect(plan.seconds).toBeLessThanOrEqual(60);
    for (let i = 1; i < plan.lines.length; i++) {
      expect(plan.lines[i].from).toBeGreaterThanOrEqual(plan.lines[i - 1].from + plan.lines[i - 1].seconds);
    }
  });

  it("uses the voice's real word times and clip lengths when they exist", () => {
    const words = [
      { start: 0.1, text: "AI" },
      { start: 0.4, text: "can" },
    ];
    const plan = planShort({ [shortLineKey(0)]: { src: "x.wav", seconds: 3.2, words } });
    expect(plan.lines[0].seconds).toBe(3.2);
    expect(plan.lines[0].words).toEqual(words);
  });

  it("every accent and echo word is actually spoken in its line", () => {
    for (const l of SHORT_LINES) {
      const spoken = l.say.split(/\s+/).map(bare);
      for (const w of [...(l.accent ?? []), ...(l.echo ?? [])]) expect(spoken, `${w} in "${l.say}"`).toContain(w);
    }
  });
});
