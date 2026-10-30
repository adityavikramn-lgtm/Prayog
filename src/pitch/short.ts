import { sig3 } from "../physics/format";
import { solve } from "../templates/projectile/model";
import { simulateProjectile } from "../templates/projectile/simulate";

/**
 * The "Start Here" pitch as a 9:16 motion-graphics Short (kinetic typography).
 * One spoken line per scene; the big word on screen follows the voice word by word.
 * Every number comes from the solver.
 */

export type Visual = "ai" | "wrong" | "formula" | "number" | "split" | "words" | "code" | "agree" | "deliver" | "checked" | "name";

export interface ShortLine {
  say: string;
  visual: Visual;
  /** Words shown in the accent colour (matched case-insensitively, without punctuation). */
  accent?: string[];
  /** Words that get the stacked "echo" effect. */
  echo?: string[];
  /** What the voice reads, when it differs from the words on screen (e.g. numbers spelled out). */
  voice?: string;
}

/** The example slip: u = 20 m/s, θ = 30°, g = 10. Using sin θ instead of sin 2θ. */
export function slip() {
  const u = 20;
  const th = 30;
  const g = 10;
  const right = solve({ u, thetaDeg: th, g, trig: "exact" });
  const wrong = (u * u * Math.sin((th * Math.PI) / 180)) / g;
  const sim = simulateProjectile(right.components).range;
  return { wrong: sig3(wrong), right: sig3(right.range), sim: sig3(sim), diff: sig3(right.range - wrong) };
}

const s = slip();

export const SHORT_LINES: ShortLine[] = [
  { say: "You ask AI a physics question. Two seconds later, it's solved.", visual: "ai", accent: ["ai", "seconds"] },
  { say: "But here's the problem. Sometimes it's confidently wrong.", visual: "wrong", accent: ["wrong"], echo: ["wrong"] },
  { say: "Look closely. It forgot the two in sine two theta.", visual: "formula", accent: ["two"] },
  {
    say: `Now the answer is off by ${s.diff} metres. In JEE, that's marks gone.`,
    voice: "Now the answer is off by fourteen point six metres. In JEE, that's marks gone.",
    visual: "number",
    accent: [s.diff, "marks"],
  },
  { say: "So I split the job in two.", visual: "split", accent: ["split"] },
  { say: "AI writes the words: the story, the captions, the hook.", visual: "words", accent: ["ai", "words"] },
  { say: "Code checks every single number.", visual: "code", accent: ["code", "number"], echo: ["number"] },
  {
    say: "The formula and a real simulation have to agree. If they don't, no student ever sees it.",
    visual: "agree",
    accent: ["formula", "simulation", "agree"],
  },
  { say: "Shorts, full lessons, and notes. All made this way.", visual: "deliver", accent: ["shorts", "lessons", "notes"] },
  { say: "All original. All checked.", visual: "checked", accent: ["original", "checked"], echo: ["checked"] },
  { say: "I'm Adithya Vikram. Let's make physics that students can trust.", visual: "name", accent: ["adithya", "vikram", "trust"] },
];

export interface WordTime {
  start: number; // seconds from the start of the clip
  text: string;
}
export interface ShortClip {
  src: string;
  seconds: number;
  words?: WordTime[];
}
/** One clip per line, keyed "line-<index>". */
export type ShortVoice = Record<string, ShortClip>;

export interface PlannedShortLine {
  index: number;
  from: number; // seconds from the video start
  seconds: number;
  words: WordTime[]; // relative to the line start
  clip?: ShortClip;
}

const LEAD_S = 0.4;
const GAP_S = 0.25;
const TAIL_S = 1.2;
const WORDS_PER_SECOND = 2.8;

export const shortLineKey = (i: number) => `line-${i}`;

/** Splits a line into words and spreads them over `seconds`, weighted by length (used without word timings). */
function spreadWords(say: string, seconds: number): WordTime[] {
  const words = say.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 0.6 + w.replace(/[^\w.]/g, "").length);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return words.map((w, i) => {
    const start = t;
    t += (weights[i] / total) * seconds;
    return { start, text: w };
  });
}

/** Lines back to back. With a voice clip, a line lasts as long as its clip and uses its real word times. */
export function planShort(voice: ShortVoice = {}): { lines: PlannedShortLine[]; seconds: number } {
  let from = LEAD_S;
  const lines = SHORT_LINES.map((l, index) => {
    const clip = voice[shortLineKey(index)];
    const seconds = clip ? clip.seconds : 0.4 + l.say.split(/\s+/).length / WORDS_PER_SECOND;
    const words = clip?.words?.length ? clip.words : spreadWords(l.say, seconds - 0.2);
    const planned = { index, from, seconds, words, clip };
    from += seconds + GAP_S;
    return planned;
  });
  return { lines, seconds: from - GAP_S + TAIL_S };
}

/** Lower-case word without punctuation, for matching accent/echo lists. */
export const bare = (w: string) => w.toLowerCase().replace(/[^\w.]/g, "").replace(/\.$/, "");
