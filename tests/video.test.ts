import { describe, expect, it } from "vitest";
import { solve } from "../src/templates/projectile/model";
import {
  CARDS,
  EXACT_RANGE_TEX,
  Format,
  PAIR,
  SCRIPT,
  VIDEO_PARAMS,
  fill,
  scriptValues,
} from "../src/templates/projectile/script";
import { BOXES } from "../src/templates/projectile/videoLayout";
import { cueSeconds, planBeats } from "../src/templates/projectile/videoPlan";
import { PORTRAIT, SHORTS_SAFE } from "../src/templates/projectile/world";

const FORMATS: Format[] = ["short", "explainer"];
const values = scriptValues();
const allTexts = [
  ...FORMATS.flatMap((f) => SCRIPT[f].flatMap((b) => b.cues)),
  ...Object.values(CARDS),
];
/** Roughly what a viewer reads: maths markers and TeX commands removed. */
const visible = (s: string) => s.replace(/\$/g, "").replace(/\\[a-z]+/g, "x").replace(/[{}^_]/g, "");

describe("script: words", () => {
  it("every caption and card exists in English and Hinglish", () => {
    for (const t of allTexts) {
      expect(t.en.trim().length).toBeGreaterThan(0);
      expect(t.hi.trim().length).toBeGreaterThan(0);
    }
  });

  it("Hinglish is written in Roman script (no Devanagari)", () => {
    for (const t of allTexts) expect(t.hi).not.toMatch(/[ऀ-ॿ]/);
  });

  it("every {{placeholder}} is filled from the solver", () => {
    for (const t of allTexts) {
      for (const text of [t.en, t.hi]) {
        const filled = fill(text, values);
        expect(filled).not.toContain("{{");
        expect((filled.match(/\$/g) ?? []).length % 2).toBe(0); // maths markers come in pairs
      }
    }
  });

  it("numbers in the script come from the solver, not typing", () => {
    const r = solve(VIDEO_PARAMS);
    expect(values.R).toBe("34.6");
    expect(Number(values.R)).toBeCloseTo(r.range, 1);
    expect(values.H).toBe("15.0");
    expect(values.ux).toBe("10.0");
    expect(values.uy).toBe("17.3");
  });

  it("Short captions fit in three lines on a phone (≤ 95 visible characters)", () => {
    for (const b of SCRIPT.short) {
      for (const c of b.cues) {
        for (const text of [c.en, c.hi]) expect(visible(fill(text, values)).length).toBeLessThanOrEqual(95);
      }
    }
  });
});

describe("script: physics claims", () => {
  it("30° and 60° are complementary and land at the same R = 20√3 m (exact form shown in the reveal)", () => {
    expect(PAIR[0] + PAIR[1]).toBe(90);
    const [a, b] = PAIR.map((th) => solve({ ...VIDEO_PARAMS, thetaDeg: th }).range);
    expect(Math.abs(a - b)).toBeLessThan(1e-9);
    expect(EXACT_RANGE_TEX).toBe("20\\sqrt{3}");
    expect(a).toBeCloseTo(20 * Math.sqrt(3), 10);
  });

  it("sin 60° = sin 120° (the reason given in the reveal)", () => {
    const rad = (d: number) => (d * Math.PI) / 180;
    expect(Math.sin(rad(60))).toBeCloseTo(Math.sin(rad(120)), 12);
  });

  it("45° beats every other whole-degree angle (the sweep's claim)", () => {
    const r45 = solve({ ...VIDEO_PARAMS, thetaDeg: 45 }).range;
    for (let th = 1; th < 90; th++) {
      if (th !== 45) expect(solve({ ...VIDEO_PARAMS, thetaDeg: th }).range).toBeLessThan(r45);
    }
  });
});

describe("video plan: timing", () => {
  it("the Short lasts 30–45 s and the explainer 60–90 s (no voiceover)", () => {
    const short = planBeats("short").seconds;
    const explainer = planBeats("explainer").seconds;
    expect(short).toBeGreaterThanOrEqual(30);
    expect(short).toBeLessThanOrEqual(45);
    expect(explainer).toBeGreaterThanOrEqual(60);
    expect(explainer).toBeLessThanOrEqual(90);
  });

  it("starts with the hook, ends with the call to action, and has the predict → reveal order", () => {
    for (const f of FORMATS) {
      const ids = planBeats(f).beats.map((b) => b.id);
      expect(ids[0]).toBe("hook");
      expect(ids[ids.length - 1]).toBe("cta");
      expect(ids.indexOf("reveal")).toBe(ids.indexOf("predict") + 1);
    }
  });

  it("beats follow each other with no gaps and every cue starts inside its beat", () => {
    for (const f of FORMATS) {
      const plan = planBeats(f);
      let end = 0;
      for (const beat of plan.beats) {
        expect(beat.from).toBeCloseTo(end, 9);
        end = beat.from + beat.seconds;
        const cues = SCRIPT[f].find((b) => b.id === beat.id)!.cues;
        for (const c of cues) {
          const at = cueSeconds(c.at, beat);
          expect(at).toBeGreaterThanOrEqual(0);
          expect(at).toBeLessThan(beat.seconds - 0.5);
        }
      }
      expect(end).toBeCloseTo(plan.seconds, 9);
    }
  });

  it("physics events are in order: launch < top < landing", () => {
    for (const f of FORMATS) {
      const demo = planBeats(f).beats.find((b) => b.id === "demo")!;
      expect(demo.events.launch!).toBeLessThan(demo.events.apex!);
      expect(demo.events.apex!).toBeLessThan(demo.events.land!);
      const reveal = planBeats(f).beats.find((b) => b.id === "reveal")!;
      expect(reveal.events.land!).toBeLessThan(reveal.events.land2!);
    }
  });

  it("a voiceover clip longer than its beat stretches that beat only", () => {
    const base = planBeats("short");
    const voiced = planBeats("short", { concept: { src: "voice/x/concept.mp3", seconds: 20 } });
    const concept = voiced.beats.find((b) => b.id === "concept")!;
    expect(concept.seconds).toBeCloseTo(20.5, 9);
    const before = base.beats.find((b) => b.id === "concept")!.seconds;
    expect(voiced.seconds - base.seconds).toBeCloseTo(20.5 - before, 9);
  });

  it("a short voiceover clip never shortens a beat", () => {
    const voiced = planBeats("short", { hook: { src: "voice/x/hook.mp3", seconds: 0.5 } });
    expect(voiced.seconds).toBeCloseTo(planBeats("short").seconds, 9);
  });
});

describe("Short layout: text stays clear of the Shorts UI", () => {
  const W = 1080;
  const H = 1920;
  const box = BOXES.short;

  it("captions sit inside the safe area", () => {
    expect(box.caption.left).toBeGreaterThanOrEqual(SHORTS_SAFE.left);
    expect(W - box.caption.right).toBeLessThanOrEqual(SHORTS_SAFE.right);
    expect(H - box.caption.bottom).toBeLessThanOrEqual(SHORTS_SAFE.bottom);
  });

  it("cards, HUD and live maths start below the top margin and inside the sides", () => {
    for (const top of [box.card.top, box.revealCardTop, box.hud.top, box.topRight.top]) {
      expect(top).toBeGreaterThanOrEqual(SHORTS_SAFE.top);
    }
    expect(box.card.left).toBeGreaterThanOrEqual(SHORTS_SAFE.left);
    expect(W - box.card.right).toBeLessThanOrEqual(SHORTS_SAFE.right);
    expect(box.hud.left).toBeGreaterThanOrEqual(SHORTS_SAFE.left);
    expect(W - box.topRight.right).toBeLessThanOrEqual(SHORTS_SAFE.right);
  });

  it("the board sits inside the safe area", () => {
    expect(PORTRAIT.left).toBeGreaterThanOrEqual(SHORTS_SAFE.left);
    expect(PORTRAIT.right).toBeLessThanOrEqual(SHORTS_SAFE.right);
    expect(PORTRAIT.top).toBeGreaterThanOrEqual(SHORTS_SAFE.top);
    expect(PORTRAIT.groundY).toBeLessThan(SHORTS_SAFE.bottom);
  });
});
