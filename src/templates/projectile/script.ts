import { sig3 } from "../../physics/format";
import { ProjectileParams, solve } from "./model";

/**
 * Words for the projectile Short and explainer, in English and Hinglish.
 * Text between $…$ is maths (KaTeX). Numbers are never typed here: {{name}}
 * placeholders are filled from the solver (see `scriptValues`).
 * Hinglish is a draft: a Hindi-speaking teacher should review it before publishing.
 */

export type Lang = "en" | "hi";
export type Format = "short" | "explainer";
export type BeatId = "hook" | "concept" | "demo" | "sweep" | "predict" | "reveal" | "cta";
/** A caption starts at a time in seconds from the beat start, or at a physics event. */
export type CueTime = number | "launch" | "apex" | "land" | "land2";

export interface Text {
  en: string;
  hi: string;
}
export interface Cue extends Text {
  at: CueTime;
}
export interface BeatScript {
  id: BeatId;
  /** Default length in seconds. For "demo" this is the hold after landing. */
  seconds: number;
  cues: Cue[];
}

/** The launch every video uses: u = 20 m/s, θ = 60°, g = 10 m/s² (JEE). */
export const VIDEO_PARAMS: ProjectileParams = { u: 20, thetaDeg: 60, g: 10, trig: "exact" };
/** The "pause and predict" pair. 30° and 60° are complementary. */
export const PAIR = [30, 60] as const;
/** Exact form of the shared range, R = u² sin 60° / g = 20√3 m. Checked against the solver in tests. */
export const EXACT_RANGE_TEX = "20\\sqrt{3}";

const T = {
  hook: {
    en: "Physics knows where Kan will land, before it even jumps.",
    hi: "Kan ke jump karne se pehle hi physics jaanti hai ki woh kahaan girega.",
  },
  conceptSplit: {
    en: "Split the launch speed $u = {{u}}$ m/s into two parts.",
    hi: "Launch speed $u = {{u}}$ m/s ko do hisson mein todo.",
  },
  conceptX: {
    en: String.raw`Sideways: $u_x = u\cos\theta = {{ux}}$ m/s. Nothing pushes sideways, so it never changes.`,
    hi: String.raw`Side mein: $u_x = u\cos\theta = {{ux}}$ m/s. Side mein koi force nahi, isliye yeh badalta nahi.`,
  },
  conceptY: {
    en: String.raw`Upwards: $u_y = u\sin\theta = {{uy}}$ m/s. Gravity pulls it down at $g = {{g}}$ m/s².`,
    hi: String.raw`Upar: $u_y = u\sin\theta = {{uy}}$ m/s. Gravity ise $g = {{g}}$ m/s² se neeche kheenchti hai.`,
  },
  conceptTwo: {
    en: "Two simple motions, happening at the same time.",
    hi: "Do simple motions, ek hi time par.",
  },
  demoLaunch: {
    en: "Watch: $v_x$ never changes, $v_y$ keeps shrinking.",
    hi: "Dekho: $v_x$ kabhi nahi badalta, $v_y$ kam hota jaata hai.",
  },
  demoApex: {
    en: "At the top, $v_y = 0$. Height $H = {{H}}$ m.",
    hi: "Sabse upar $v_y = 0$. Height $H = {{H}}$ m.",
  },
  demoLand: {
    en: "Lands right on the mark: $R = {{R}}$ m.",
    hi: "Bilkul mark par landing: $R = {{R}}$ m.",
  },
  sweepGrab: {
    en: String.raw`Now Kan grabs $\theta$ in the range formula.`,
    hi: String.raw`Ab Kan range formula mein se $\theta$ pakad leta hai.`,
  },
  sweepSteep: {
    en: "Steeper: higher, but not farther.",
    hi: "Zyada steep: upar zyada, par door nahi.",
  },
  sweepFlat: {
    en: "Flatter: fast, but it lands early.",
    hi: "Zyada flat: tez, par jaldi gir jaata hai.",
  },
  sweepMax: {
    en: String.raw`45° gives the maximum range, because $\sin 2\theta = 1$.`,
    hi: String.raw`45° par range maximum hoti hai, kyunki $\sin 2\theta = 1$.`,
  },
  predictPause: {
    en: "Pause and predict!",
    hi: "Video pause karo aur predict karo!",
  },
  revealGo: {
    en: "Launch both!",
    hi: "Dono ko launch karo!",
  },
  revealSame: {
    en: "Same spot! Both land at $R = {{R}}$ m.",
    hi: "Same jagah! Dono $R = {{R}}$ m par girte hain.",
  },
  revealWhy: {
    en: String.raw`Because $\sin 60^\circ = \sin 120^\circ$: any $\theta$ and $90^\circ - \theta$ give equal range.`,
    hi: String.raw`Kyunki $\sin 60^\circ = \sin 120^\circ$: $\theta$ aur $90^\circ - \theta$ ki range hamesha barabar.`,
  },
} satisfies Record<string, Text>;

/** Big on-screen cards (not captions). */
export const CARDS = {
  predictQuestion: {
    en: "Same speed. 30° or 60°: which lands farther?",
    hi: "Same speed. 30° ya 60°: kaun zyada door girega?",
  },
  ctaShort: {
    en: "Comment: which angle gives the maximum range?",
    hi: "Comment karo: kis angle par range maximum hoti hai?",
  },
  ctaExplainer: {
    en: "Comment: if g were halved, what would happen to R?",
    hi: "Comment karo: agar g aadha ho jaaye, toh R ka kya hoga?",
  },
  landsHere: { en: "lands here", hi: "yahaan girega" },
  shortCoverTitle: { en: "30° or 60°?", hi: "30° ya 60°?" },
  shortCoverSub: { en: "Which lands farther?", hi: "Kaun zyada door girega?" },
  explainerCoverTitle: { en: "Projectile motion", hi: "Projectile motion" },
  explainerCoverSub: { en: "Why 45° goes farthest", hi: "45° sabse door kyun?" },
} satisfies Record<string, Text>;

const cue = (at: CueTime, text: Text): Cue => ({ at, ...text });

export const SCRIPT: Record<Format, BeatScript[]> = {
  short: [
    { id: "hook", seconds: 3, cues: [cue(0.2, T.hook)] },
    {
      id: "concept",
      seconds: 7.5,
      cues: [cue(0.2, T.conceptSplit), cue(2.5, T.conceptX), cue(5, T.conceptY)],
    },
    { id: "demo", seconds: 2.3, cues: [cue("launch", T.demoLaunch), cue("apex", T.demoApex), cue("land", T.demoLand)] },
    { id: "predict", seconds: 5, cues: [cue(0.3, T.predictPause)] },
    { id: "reveal", seconds: 8.5, cues: [cue(0.2, T.revealGo), cue("land2", T.revealSame), cue(6.2, T.revealWhy)] },
    { id: "cta", seconds: 4.5, cues: [] },
  ],
  explainer: [
    { id: "hook", seconds: 3.5, cues: [cue(0.2, T.hook)] },
    {
      id: "concept",
      seconds: 13,
      cues: [cue(0.3, T.conceptSplit), cue(3.2, T.conceptX), cue(7, T.conceptY), cue(10.5, T.conceptTwo)],
    },
    { id: "demo", seconds: 2.6, cues: [cue("launch", T.demoLaunch), cue("apex", T.demoApex), cue("land", T.demoLand)] },
    {
      id: "sweep",
      seconds: 10,
      cues: [cue(0.2, T.sweepGrab), cue(1.4, T.sweepSteep), cue(3.4, T.sweepFlat), cue(6.8, T.sweepMax)],
    },
    { id: "predict", seconds: 7, cues: [cue(0.3, T.predictPause)] },
    { id: "reveal", seconds: 10.5, cues: [cue(0.2, T.revealGo), cue("land2", T.revealSame), cue(6.8, T.revealWhy)] },
    { id: "cta", seconds: 6, cues: [] },
  ],
};

/** Every number in the script, computed by the solver. */
export function scriptValues(): Record<string, string> {
  const r = solve(VIDEO_PARAMS);
  return {
    u: sig3(VIDEO_PARAMS.u),
    g: sig3(VIDEO_PARAMS.g),
    ux: sig3(r.components.ux),
    uy: sig3(r.components.uy),
    H: sig3(r.maxHeight),
    R: sig3(r.range),
  };
}

export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Script placeholder {{${key}}} has no value`);
    return values[key];
  });
}
