/** Words and timing for the teacher demo (pitch) video. Plain, spoken English. */

export type BeatId = "open" | "problem" | "principle" | "templates" | "workflow" | "proof" | "weekly" | "close";
export interface Beat {
  id: BeatId;
  seconds: number;
  /** text = caption ($…$ is maths); say = what the voice reads, when it differs. */
  lines: { at: number; text: string; say?: string }[];
}

export const DEMO_BEATS: Beat[] = [
  {
    id: "open",
    seconds: 9,
    lines: [
      { at: 0.4, text: "You teach JEE physics. Every week you need fresh questions, quick Shorts, and visuals that actually move." },
      { at: 5.2, text: "Here's how I'd help with that." },
    ],
  },
  {
    id: "problem",
    seconds: 18,
    lines: [
      { at: 0.3, text: "AI can write a solution in seconds. The trouble is, it sounds just as sure when it's wrong." },
      {
        at: 7,
        text: "Like this one. It dropped the 2 in $\\sin 2\\theta$, so the range is way off.",
        say: "Like this one. It dropped the two in sine two theta, so the range is way off.",
      },
      { at: 13, text: "And nobody has time to re-check every number before class." },
    ],
  },
  {
    id: "principle",
    seconds: 14,
    lines: [
      { at: 0.3, text: "So I split the job in two." },
      { at: 3, text: "AI handles the words: captions, Hinglish, hooks, a new story for an old question." },
      { at: 8.5, text: "Code handles the truth: every number, every frame of motion, and a second check by simulation." },
    ],
  },
  {
    id: "templates",
    seconds: 34,
    lines: [
      { at: 0.3, text: "These are templates a Vedantu JEE teacher could pick from." },
      { at: 6, text: "A live simulation you can screen-share in class. Move a slider and everything follows." },
      { at: 13, text: "A 30-second Short for YouTube and Reels, in English or Hinglish." },
      { at: 20, text: "A full explainer, like this one on Coulomb's law." },
      { at: 27, text: "Practice sheets and paste-a-question are next on my list. They aren't built yet." },
    ],
  },
  {
    id: "workflow",
    seconds: 38,
    lines: [
      { at: 0.3, text: "Making one takes four steps." },
      { at: 3, text: "Pick a template." },
      {
        at: 7,
        text: "Set the numbers. Here the speed stays at 20 m/s and the angle goes from 60° to 37°.",
        say: "Set the numbers. Here the speed stays at twenty metres per second, and the angle goes from sixty degrees to thirty-seven.",
      },
      { at: 15, text: "The code checks itself: the formula and an independent simulation have to agree." },
      { at: 23, text: "Then render. English and Hinglish come out of the same scene." },
      { at: 31, text: "Got a voice recording? It slots right in. No recording, and the captions carry it." },
    ],
  },
  {
    id: "proof",
    seconds: 16,
    lines: [
      { at: 0.3, text: "None of this is a mock-up. These numbers come straight from the test run and the renders." },
      { at: 8, text: "If a formula and its simulation ever disagree, a test fails and I know before any student sees it." },
    ],
  },
  {
    id: "weekly",
    seconds: 14,
    lines: [
      { at: 0.3, text: "Here's what I can send you every week." },
      { at: 8, text: "All original, and every number checked." },
    ],
  },
  {
    id: "close",
    seconds: 10,
    lines: [{ at: 0.4, text: "Thanks for watching. I'd love to build these for your classes." }],
  },
];

export interface VoiceClip {
  src: string;
  seconds: number;
}
/** One clip per caption line, keyed "beat-index" (e.g. "open-0"). */
export type Voice = Record<string, VoiceClip>;

export interface PlannedLine {
  at: number;
  text: string;
  clip?: VoiceClip;
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const GAP_S = 0.4; // breath between spoken lines
const TAIL_S = 1.0; // pause before the next beat

export const lineKey = (beat: BeatId, i: number) => `${beat}-${i}`;
/** What the voice reads for a line (no maths symbols). */
export const spoken = (l: Beat["lines"][number]) => l.say ?? l.text;

/**
 * Each line starts at its scripted time, or later if the line before it is still
 * being spoken; a beat stretches to fit its last line. Without a voice, timing is unchanged.
 */
export function planDemo(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  let from = 0;
  const beats = DEMO_BEATS.map((b) => {
    let prevEnd = 0;
    const lines = b.lines.map((l, i) => {
      const clip = voice[lineKey(b.id, i)];
      const at = clip ? Math.max(l.at, i === 0 ? l.at : prevEnd + GAP_S) : l.at;
      prevEnd = at + (clip?.seconds ?? 0);
      return { at, text: l.text, clip };
    });
    const seconds = Math.max(b.seconds, prevEnd + TAIL_S);
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}

export function demoSeconds(voice: Voice = {}): number {
  return planDemo(voice).seconds;
}
