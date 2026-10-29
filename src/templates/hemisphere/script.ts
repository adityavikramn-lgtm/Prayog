import { sig3 } from "../../physics/format";
import { totalWork, workUpTo } from "../../physics/hemisphere";
import { EXAMPLE, MISTAKES } from "./model";
import { simulateDrag } from "./simulate";

/**
 * Narration for "Work done dragging a block over a rough hemisphere" (16:9, ~5.5 min).
 * `text` is the caption ($…$ = KaTeX, {{name}} filled from the solver).
 * `say` is what the voice reads, written out for the ear. Lines without `say`
 * are read as their text.
 */

export type BeatId = "hook" | "setup" | "fbd" | "integral" | "insight" | "traps" | "example" | "cta";

export interface Line {
  at: number; // seconds from the beat start when there is no voiceover
  text: string;
  say?: string;
}
export interface Beat {
  id: BeatId;
  seconds: number;
  lines: Line[];
}

const l = (at: number, text: string, say?: string): Line => ({ at, text, say });

export const BEATS: Beat[] = [
  {
    id: "hook",
    seconds: 22,
    lines: [
      l(0.5, "Here's a question that looks simple and still catches a lot of people."),
      l(5.5, "A man drags a small block, slowly, over a rough dome, all the way from the ground to the top."),
      l(13, "How much work does he do? Most students get half of it right. Let's get all of it."),
    ],
  },
  {
    id: "setup",
    seconds: 38,
    lines: [
      l(
        0.3,
        "The dome is a fixed hemisphere of radius $R$. The block has mass $m$, and the surface is rough, with friction coefficient $\\mu$.",
        "The dome is a fixed hemisphere of radius R. The block has mass m, and the surface is rough, with friction coefficient mu.",
      ),
      l(10, "The string runs along the surface, so the man's pull always points along the slope."),
      l(17, "And the word slowly matters. The block never speeds up, so the forces balance at every single point."),
      l(
        27,
        "We'll track the block with one angle, $\\varphi$. It's zero on the ground and $90^\\circ$ at the top.",
        "We'll track the block with one angle, phi. It's zero on the ground and ninety degrees at the top.",
      ),
    ],
  },
  {
    id: "fbd",
    seconds: 62,
    lines: [
      l(0.3, "Let's freeze the block somewhere on the way up and look at every force on it."),
      l(6, "Gravity, $mg$, straight down.", "Gravity, m g, straight down."),
      l(10, "The surface pushes back along the radius. That's the normal force, $N$.", "The surface pushes back along the radius. That's the normal force, N."),
      l(17, "Friction fights the motion, so it points down the slope. Its size is $\\mu N$.", "Friction fights the motion, so it points down the slope. Its size is mu times N."),
      l(25, "And the tension $T$ pulls up along the slope.", "And the tension, T, pulls up along the slope."),
      l(
        31,
        "Balance along the radius: $N = mg\\sin\\varphi$. Zero at the bottom, growing to $mg$ at the top.",
        "Balance along the radius gives N equals m g sine phi. That's zero at the bottom, and it grows to m g at the top.",
      ),
      l(
        42,
        "Balance along the slope: $T = mg\\cos\\varphi + \\mu mg\\sin\\varphi$.",
        "Balance along the slope gives T equals m g cos phi, plus mu m g sine phi.",
      ),
      l(52, "So the pull isn't constant. It changes as the block climbs."),
    ],
  },
  {
    id: "integral",
    seconds: 60,
    lines: [
      l(0.3, "Since the pull keeps changing, we can't just do force times distance. We add it up in tiny pieces."),
      l(
        9,
        "Each small step along the surface is $ds = R\\,d\\varphi$, and the work for that step is $T\\,ds$.",
        "Each small step along the surface is d s equals R d phi, and the work for that step is T times d s.",
      ),
      l(
        19,
        "So $W = \\displaystyle\\int_0^{\\pi/2} (mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi$.",
        "So the work is the integral, from zero to pi by two, of m g cos phi plus mu m g sine phi, times R d phi.",
      ),
      l(31, "The first part gives $mgR$. The second part gives $\\mu mgR$.", "The first part gives m g R. The second part gives mu m g R."),
      l(40, "Put together: $W = mgR(1 + \\mu)$.", "Put together, the work is m g R times one plus mu."),
      l(48, "Watch the bar as the block climbs. One piece pays for gravity, the other pays for friction."),
    ],
  },
  {
    id: "insight",
    seconds: 46,
    lines: [
      l(0.3, "Here's the part I really like."),
      l(4, "The gravity part, $mgR$, is just weight times the height climbed. The shape of the path doesn't matter.", "The gravity part, m g R, is just weight times the height climbed. The shape of the path doesn't matter."),
      l(
        14,
        "The friction part is $\\mu mg$ times $R$. And $R$ is the horizontal distance the block moved, not the curved length.",
        "The friction part is mu m g, times R. And R is the horizontal distance the block moved, not the curved length.",
      ),
      l(
        26,
        "That's not luck. On any slope, $\\mu N\\,ds$ works out to $\\mu mg$ times the horizontal step.",
        "That's not luck. On any slope, mu N d s works out to mu m g times the horizontal step.",
      ),
      l(36, "So when you drag something slowly, friction's work is $\\mu mg$ times the horizontal distance.", "So when you drag something slowly, friction's work is mu m g times the horizontal distance."),
    ],
  },
  {
    id: "traps",
    seconds: 38,
    lines: [
      l(0.3, "Now the traps."),
      l(3, "Trap one: forgetting friction. You get $mgR$, and that's too small.", "Trap one: forgetting friction. You get m g R, and that's too small."),
      l(
        13,
        "Trap two: taking $N = mg$ the whole way. Then friction looks like $\\mu mg$ times the arc, $\\pi R/2$. That's too big.",
        "Trap two: taking N equals m g the whole way. Then friction looks like mu m g times the arc, pi R by two. That's too big.",
      ),
      l(27, "The normal force changes along the dome, so friction does too. That's the whole problem."),
    ],
  },
  {
    id: "example",
    seconds: 40,
    lines: [
      l(
        0.3,
        "Let's put numbers in: $m = 2$ kg, $R = 1$ m, $\\mu = 0.5$, and $g = 10$ m/s².",
        "Let's put numbers in. Mass two kilograms, radius one metre, mu point five, and g ten metres per second squared.",
      ),
      l(9, "Gravity part: $mgR = {{wg}}$ J. Friction part: $\\mu mgR = {{wf}}$ J.", "Gravity part, m g R, is {{wgSay}} joules. Friction part, mu m g R, is {{wfSay}} joules."),
      l(18, "Total: {{w}} J.", "So the total is {{wSay}} joules."),
      l(23, "I also checked it with a step-by-step simulation in code. It gets {{wsim}} J.", "I also checked it with a step by step simulation in code. It gets {{wsimSay}} joules."),
      l(31, "The traps would have given {{wrong1}} J and {{wrong2}} J.", "The traps would have given {{wrong1Say}} joules, and about {{wrong2Say}} joules."),
    ],
  },
  {
    id: "cta",
    seconds: 24,
    lines: [
      l(0.3, "So, dragging slowly up a rough dome: $W = mgR(1 + \\mu)$.", "So, dragging slowly up a rough dome, the work is m g R times one plus mu."),
      l(7, "One piece for gravity, one for friction, and friction only cares about the horizontal distance."),
      l(15, "One for the comments: what if the dome were smooth? Does the radius still matter?"),
    ],
  },
];

export const TITLE = {
  title: "Dragging a block over a rough dome",
  subtitle: "Work done by the man, step by step",
  topic: "Work, energy and power · JEE",
};

/** Speaks a number the way a teacher would: 30 → "thirty", 15.7 → "fifteen point seven". */
function spoken(n: number): string {
  const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const whole = (k: number): string =>
    k < 20 ? ones[k] : k < 100 ? tens[Math.floor(k / 10)] + (k % 10 ? "-" + ones[k % 10] : "") : String(k);
  const rounded = Math.round(n * 10) / 10;
  const int = Math.floor(rounded);
  const dec = Math.round((rounded - int) * 10);
  return dec === 0 ? whole(int) : `${whole(int)} point ${ones[dec]}`;
}

/** Every number in the narration, computed. */
export function scriptValues(): Record<string, string> {
  const parts = workUpTo(EXAMPLE, Math.PI / 2);
  const sim = simulateDrag(EXAMPLE).byMan;
  const w = totalWork(EXAMPLE);
  const wrong1 = MISTAKES[0].value(EXAMPLE);
  const wrong2 = MISTAKES[1].value(EXAMPLE);
  return {
    wg: sig3(parts.againstGravity),
    wf: sig3(parts.againstFriction),
    w: sig3(w),
    wsim: sig3(sim),
    wrong1: sig3(wrong1),
    wrong2: sig3(wrong2),
    wgSay: spoken(parts.againstGravity),
    wfSay: spoken(parts.againstFriction),
    wSay: spoken(w),
    wsimSay: spoken(sim),
    wrong1Say: spoken(wrong1),
    wrong2Say: spoken(wrong2),
  };
}

export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Script placeholder {{${key}}} has no value`);
    return values[key];
  });
}

/** The words the voice reads for a line (never contains $ or {{ }}). */
export function spokenText(line: Line, values: Record<string, string>): string {
  return fill(line.say ?? line.text, values);
}

/** Voice file key for a line, e.g. "fbd-3". */
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;
