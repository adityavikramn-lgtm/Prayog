// Two physics Shorts for Class 11 "Motion in a Plane" (a two-part series, 9:16):
//   Part 1 "drop":   a dropped ball and a ball thrown sideways land together.
//   Part 2 "monkey": aim straight at a monkey that lets go, and you still hit it.
// Every position on screen comes from these equations; tests/plane-shorts.test.ts checks them
// against a step-by-step simulation.

export const G = 10; // m/s²

// ---------- Part 1: drop vs throw ----------

export const DROP = { h: 20, u: 10 }; // m, m/s
export const dropTime = Math.sqrt((2 * DROP.h) / G); // 2 s
export const throwRange = DROP.u * dropTime; // 20 m

/** Height above the ground at time t (same for both balls: the fall ignores sideways speed). */
export const fallHeight = (t: number) => Math.max(0, DROP.h - 0.5 * G * Math.min(t, dropTime) ** 2);
/** Sideways distance of the thrown ball at time t. */
export const throwX = (t: number) => DROP.u * Math.min(t, dropTime);
/** Vertical speed (downwards) at time t. */
export const fallSpeed = (t: number) => G * Math.min(t, dropTime);

// ---------- Part 2: the monkey problem ----------

export const MONKEY = { d: 20, H: 15, u: 25 }; // horizontal distance (m), height of monkey above launch (m), launch speed (m/s)
export const aimAngle = Math.atan2(MONKEY.H, MONKEY.d); // straight at the monkey: tanθ = 15/20 (37°)
export const ux = MONKEY.u * Math.cos(aimAngle); // 20 m/s
export const uy = MONKEY.u * Math.sin(aimAngle); // 15 m/s
export const hitTime = MONKEY.d / ux; // 1 s
export const dropBy = 0.5 * G * hitTime ** 2; // 5 m: how far both have fallen below their no-gravity positions
export const hitHeight = MONKEY.H - dropBy; // 10 m above the launch point
export const monkeyLandTime = Math.sqrt((2 * MONKEY.H) / G); // 1.73 s: the monkey would reach the ground then

export const ballAt = (t: number) => ({ x: ux * t, y: uy * t - 0.5 * G * t * t });
export const monkeyAt = (t: number) => ({ x: MONKEY.d, y: MONKEY.H - 0.5 * G * t * t });

// ---------- scripts ----------

export type DropVisual = "setup" | "question" | "guess" | "watch" | "land" | "secret" | "split" | "numbers" | "plane" | "next";
export type MonkeyVisual = "monkey" | "aim" | "letgo" | "watch" | "hit" | "nogravity" | "both" | "five" | "meet" | "condition" | "end";

export interface PlaneLine<V extends string> {
  say: string; // on screen (and the words the big-word track follows)
  voice?: string; // what the voice reads, when it differs (numbers spelled out)
  visual: V;
  accent?: string[];
  echo?: string[];
}

const n = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(1));

export const DROP_LINES: PlaneLine<DropVisual>[] = [
  { say: "Two balls. Same height. Same moment.", visual: "setup", accent: ["two", "same"] },
  { say: "One is dropped. The other is thrown sideways.", visual: "setup", accent: ["dropped", "sideways"] },
  { say: "Which one hits the ground first?", visual: "question", accent: ["first"], echo: ["first"] },
  { say: "Most people say the dropped one. The thrown ball has a longer path, right?", visual: "guess", accent: ["longer"] },
  { say: "Let's watch it in slow motion.", visual: "watch", accent: ["slow", "motion"] },
  { say: "They land together. At the exact same moment.", visual: "land", accent: ["together"], echo: ["together"] },
  { say: "Here's the secret. Gravity only pulls down.", visual: "secret", accent: ["secret", "down"] },
  { say: "The sideways speed never changes, and it never slows the fall.", visual: "split", accent: ["never"] },
  {
    say: `From ${n(DROP.h)} metres, both take ${n(dropTime)} seconds. Every single time.`,
    voice: "From twenty metres, both take two seconds. Every single time.",
    visual: "numbers",
    accent: [n(dropTime), "seconds"],
  },
  { say: "Two simple motions, running side by side. That's motion in a plane.", visual: "plane", accent: ["plane"] },
  { say: "Part two: the throw that can't miss.", visual: "next", accent: ["miss"] },
];

export const MONKEY_LINES: PlaneLine<MonkeyVisual>[] = [
  { say: "A monkey is hanging from a branch.", visual: "monkey", accent: ["monkey"] },
  { say: "You aim a ball straight at it, and throw.", visual: "aim", accent: ["straight"] },
  { say: "The moment you throw, the monkey lets go to dodge it.", visual: "letgo", accent: ["dodge"] },
  { say: "Smart move? Watch.", visual: "watch", accent: ["watch"] },
  { say: "It still gets hit. Every single time.", visual: "hit", accent: ["hit"], echo: ["hit"] },
  { say: "Here's why. Without gravity, the ball flies straight to the monkey.", visual: "nogravity", accent: ["without", "straight"] },
  { say: "With gravity, both fall by the same amount: half g t squared.", visual: "both", accent: ["same"] },
  {
    say: `After ${n(hitTime)} second, both have dropped exactly ${n(dropBy)} metres.`,
    voice: "After one second, both have dropped exactly five metres.",
    visual: "five",
    accent: [n(dropBy), "metres"],
  },
  { say: "So they still meet. Gravity can't pull them apart.", visual: "meet", accent: ["meet"] },
  { say: "One condition: the ball must reach before the monkey lands.", visual: "condition", accent: ["condition"] },
  { say: "Aim straight at it, and you can't miss. Save this for your exam.", visual: "end", accent: ["miss", "save"] },
];

// ---------- timing: lines back to back, following the voice ----------

export interface WordTime {
  start: number;
  text: string;
}
export interface ShortClip {
  src: string;
  seconds: number;
  words?: WordTime[];
}
export type ShortVoice = Record<string, ShortClip>;
export interface PlannedLine {
  index: number;
  from: number;
  seconds: number;
  words: WordTime[];
  clip?: ShortClip;
}

const LEAD_S = 0.4;
const GAP_S = 0.3;
const TAIL_S = 1.4;
/** Extra time to watch the slow-motion animation before the next line. */
const HOLD_AFTER: Partial<Record<string, number>> = { watch: 2.4 };

export const lineKey = (i: number) => `line-${i}`;
export const bare = (w: string) => w.toLowerCase().replace(/[^\w.]/g, "").replace(/\.$/, "");

function spread(say: string, seconds: number): WordTime[] {
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

export function planLines<V extends string>(lines: PlaneLine<V>[], voice: ShortVoice = {}) {
  let from = LEAD_S;
  const planned = lines.map((l, index) => {
    const clip = voice[lineKey(index)];
    const seconds = clip ? clip.seconds : 0.4 + l.say.split(/\s+/).length / 2.8;
    const words = clip?.words?.length ? clip.words : spread(l.say, seconds - 0.2);
    const p = { index, from, seconds, words, clip };
    from += seconds + GAP_S + (HOLD_AFTER[l.visual] ?? 0);
    return p;
  });
  return { lines: planned, seconds: from - GAP_S + TAIL_S };
}

/** When (seconds into the Short) a visual first starts. */
export function visualStart<V extends string>(lines: PlaneLine<V>[], plan: { lines: PlannedLine[] }, v: V): number {
  const i = lines.findIndex((l) => l.visual === v);
  return i < 0 ? Infinity : plan.lines[i].from;
}
