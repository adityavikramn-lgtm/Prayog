import { describe, expect, it } from "vitest";
import { planHemisphere } from "../src/templates/hemisphere/plan";
import { BEATS, QUESTION, fill, lineKey, scriptValues, spokenText } from "../src/templates/hemisphere/script";

const values = scriptValues();
const lines = BEATS.flatMap((b) => b.lines.map((line, i) => ({ beat: b.id, i, line })));
const KNOWN_TAGS = [
  ...["R", "m", "mu", "push", "angle", "pieces", "mg", "N", "f", "T", "mgsin", "mgcos", "phi", "ds", "height", "horizontal"],
  ...["arrow", "drop", "adj", "opp", "lines", "right", "phiC", "angleT", "angleR", "mgBig", "projT", "projR"],
];

describe("rough-dome lesson: words", () => {
  it("starts with the complete question, read aloud", () => {
    expect(BEATS[0].id).toBe("question");
    for (const given of ["radius R", "fixed", "rough", "friction", "mass m", "slowly", "string", "ground", "top", "work done by the person"]) {
      expect(QUESTION).toContain(given);
    }
    const spokenQuestion = BEATS[0].lines.map((l) => spokenText(l, values)).join(" ");
    for (const given of ["radius R", "fixed", "rough", "mu", "mass m", "slowly", "string", "top", "work done by the person"]) {
      expect(spokenQuestion).toContain(given);
    }
  });

  it("explains each idea before it is used", () => {
    const order = BEATS.map((b) => b.id);
    const before = (a: string, b: string) => expect(order.indexOf(a as never)).toBeLessThan(order.indexOf(b as never));
    before("givens", "approach"); // plan the attack before any maths
    before("approach", "work");
    before("work", "setup"); // what work is, before writing dW = T ds
    before("forces", "balance"); // meet the forces before balancing them
    before("slowly", "balance"); // why they balance
    before("geometry", "setup"); // ds = R dφ before using it
    before("trig", "resolve"); // how to split any force, before splitting mg
    before("resolve", "balance"); // splitting mg before using its parts
    before("setup", "integrate");
    before("integrate", "answer");
    before("answer", "energy"); // a second, independent check
  });

  it("resolving the weight explains every angle: right angle, φ with the surface, 90° − φ with the radius", () => {
    const resolve = BEATS.find((b) => b.id === "resolve")!;
    const said = resolve.lines.map((l) => spokenText(l, values)).join(" ");
    for (const idea of ["right angle", "same amount", "phi", "ninety degrees minus phi", "cos phi", "sine phi", "check the ends"]) {
      expect(said.toLowerCase()).toContain(idea.toLowerCase());
    }
    const tags = new Set(resolve.lines.flatMap((l) => l.reveal ?? []));
    for (const t of ["lines", "right", "angleT", "angleR", "projT", "projR"]) expect(tags).toContain(t);
  });

  it("the energy check uses the work-energy theorem and agrees with the simulation", () => {
    const energy = BEATS.find((b) => b.id === "energy")!;
    const math = energy.lines.map((l) => fill(l.math ?? "", values)).join(" ");
    expect(math).toContain("\\Delta KE");
    expect(math).toContain("30.0 - 20.0 - 10.0 = 0");
  });

  it("captions fill every placeholder and pair their maths markers", () => {
    for (const { line } of lines) {
      const text = fill(line.text, values);
      expect(text).not.toContain("{{");
      expect((text.match(/\$/g) ?? []).length % 2).toBe(0);
    }
  });

  it("the voice never reads raw maths: no $, backslashes or braces", () => {
    for (const { line } of lines) {
      const say = spokenText(line, values);
      expect(say).not.toMatch(/[$\\{}^_]/);
      if (line.text.includes("$")) expect(line.say, `"${line.text}" needs a spoken version`).toBeDefined();
    }
  });

  it("every drawing tag used in the script is one the scenes know", () => {
    for (const { line } of lines) for (const tag of line.reveal ?? []) expect(KNOWN_TAGS).toContain(tag);
  });

  it("numbers spoken and shown agree with the solver (30 J, 20 J + 10 J, traps 20 J and 35.7 J)", () => {
    expect(values.w).toBe("30.0");
    expect(values.wSay).toBe("thirty");
    expect(values.wg).toBe("20.0");
    expect(values.wf).toBe("10.0");
    expect(values.wsim).toBe("30.0");
    expect(values.wrong1).toBe("20.0");
    expect(values.wrong2).toBe("35.7");
  });
});

describe("rough-dome lesson: timing", () => {
  it("is a focused full lesson of 8 to 16 minutes", () => {
    const s = planHemisphere().seconds;
    expect(s).toBeGreaterThanOrEqual(8 * 60);
    expect(s).toBeLessThanOrEqual(16 * 60);
  });

  it("with a voiceover, lines play one after another and each beat waits for its last line", () => {
    const voice = Object.fromEntries(lines.map(({ beat, i }) => [lineKey(beat, i), { src: "x.wav", seconds: 3 + i }]));
    const plan = planHemisphere(voice);
    for (const b of plan.beats) {
      for (let i = 1; i < b.lines.length; i++) {
        const prev = b.lines[i - 1];
        expect(b.lines[i].at).toBeGreaterThanOrEqual(prev.at + prev.clip!.seconds);
      }
      const last = b.lines[b.lines.length - 1];
      expect(b.seconds).toBeGreaterThan(last.at + last.clip!.seconds);
    }
  });

  it("beats follow each other with no gaps", () => {
    const plan = planHemisphere();
    let end = 0;
    for (const b of plan.beats) {
      expect(b.from).toBeCloseTo(end, 9);
      end = b.from + b.seconds;
    }
    expect(end).toBeCloseTo(plan.seconds, 9);
  });
});
