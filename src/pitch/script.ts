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
      { at: 0.4, text: "You teach science. Every week, you need fresh questions, quick Shorts, and visuals that really move." },
      { at: 5.2, text: "Here's how I can help." },
    ],
  },
  {
    id: "problem",
    seconds: 18,
    lines: [
      { at: 0.3, text: "AI can write a solution in seconds. But here's the catch: it sounds just as sure when it's wrong." },
      {
        at: 7,
        text: "Like this one. It dropped the 2 in $\\sin 2\\theta$, so the range is way off.",
        say: "Like this one. It dropped the two in sine two theta, so the range is way off.",
      },
      { at: 13, text: "And no teacher has time to check every number before class." },
    ],
  },
  {
    id: "principle",
    seconds: 14,
    lines: [
      { at: 0.3, text: "So I split the job in two." },
      { at: 3, text: "AI does the words: captions, Hinglish, hooks, and new stories for old questions." },
      { at: 8.5, text: "Code does the truth: every number, every bit of motion, and a second check with a simulation." },
    ],
  },
  {
    id: "templates",
    seconds: 34,
    lines: [
      { at: 0.3, text: "Here are templates a Vedantu teacher could pick from." },
      { at: 6, text: "A live simulation to share in class. Move one slider, and everything follows." },
      { at: 13, text: "A short video for YouTube and Reels, in English or Hinglish." },
      { at: 20, text: "A full lesson, like this one on Coulomb's law." },
      { at: 27, text: "A practice-sheet builder and paste-a-question come next. They aren't built yet." },
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
      { at: 15, text: "Then the code checks itself. The formula and a separate simulation must agree." },
      { at: 23, text: "Then render. English and Hinglish come out of the same scene." },
      { at: 31, text: "Have a voice recording? It fits right in. No recording? The captions carry it." },
    ],
  },
  {
    id: "proof",
    seconds: 16,
    lines: [
      { at: 0.3, text: "None of this is fake. These numbers come straight from real tests and real renders." },
      { at: 8, text: "If a formula and its simulation ever disagree, a test fails. I know before any student sees it." },
    ],
  },
  {
    id: "weekly",
    seconds: 14,
    lines: [
      { at: 0.3, text: "Here's what I can make for your classes." },
      { at: 8, text: "All original. Every number checked." },
    ],
  },
  {
    id: "close",
    seconds: 10,
    lines: [{ at: 0.4, text: "Thanks for watching. I'd love to make these for your students." }],
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
