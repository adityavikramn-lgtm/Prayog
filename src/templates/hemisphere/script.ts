import { sig3 } from "../../physics/format";
import { totalWork, workUpTo } from "../../physics/hemisphere";
import { EXAMPLE, MISTAKES } from "./model";
import { simulateDrag } from "./simulate";

/**
 * A full lesson on "Work done dragging a block over a rough hemisphere",
 * written so someone starting from zero can follow every step (16:9, ~9 min).
 *
 * Each line:
 *   text    caption on screen ($…$ = KaTeX, {{name}} = number from the solver)
 *   say     what the voice reads, written for the ear (defaults to text)
 *   math    a line added to the board panel when this line starts
 *   reveal  tags that switch on a drawing in the scene (a force, a label…)
 */

export type BeatId =
  | "question"
  | "givens"
  | "approach"
  | "work"
  | "forces"
  | "slowly"
  | "geometry"
  | "trig"
  | "resolve"
  | "balance"
  | "setup"
  | "integrate"
  | "answer"
  | "meaning"
  | "energy"
  | "example"
  | "traps"
  | "recap";

export interface Line {
  text: string;
  say?: string;
  math?: string;
  reveal?: string[];
}
export interface Beat {
  id: BeatId;
  title: string;
  lines: Line[];
}

const line = (text: string, extra: Omit<Line, "text"> = {}): Line => ({ text, ...extra });

/** The question, complete, in our own words (every given kept). */
export const QUESTION =
  "A hemisphere of radius R is fixed on the ground. Its surface is rough, with coefficient of friction μ. Using a string, a person pulls a small block of mass m very slowly along the surface, from the ground all the way up to the top of the hemisphere. Find the work done by the person.";

export const BEATS: Beat[] = [
  {
    id: "question",
    title: "The question",
    lines: [
      line("Here's today's question. Let me read it first."),
      line("A hemisphere of radius $R$ is fixed on the ground. Its surface is rough, with friction coefficient $\\mu$.", {
        say: "A hemisphere of radius R is fixed on the ground. Its surface is rough, with friction coefficient mu.",
      }),
      line("A person uses a string to pull a small block of mass $m$ very slowly along the surface, from the ground to the top.", {
        say: "A person uses a string to pull a small block of mass m very slowly along the surface, from the ground to the top.",
      }),
      line("Find the work done by the person."),
      line("Picture it for a second. Now let's solve it together, step by step, from zero."),
    ],
  },
  {
    id: "givens",
    title: "What we know",
    lines: [
      line("First, what are we given?"),
      line("The radius of the dome: $R$.", { say: "The radius of the dome, R.", math: "R = \\text{radius of the hemisphere}", reveal: ["R"] }),
      line("The mass of the block: $m$.", { say: "The mass of the block, m.", math: "m = \\text{mass of the block}", reveal: ["m"] }),
      line("The friction coefficient: $\\mu$.", { say: "The friction coefficient, mu.", math: "\\mu = \\text{coefficient of friction}", reveal: ["mu"] }),
      line("And the block moves slowly. Remember that word. It does a lot of the work for us.", { math: "\\text{moves slowly}" }),
      line("We want one thing: the work done by the person.", { math: "\\text{Find: } W_{\\text{person}}" }),
    ],
  },
  {
    id: "approach",
    title: "How to attack it",
    lines: [
      line("Before any maths, let's make a plan. Most people skip this step."),
      line("Work needs the pull. So first we must find how hard the person pulls at every point.", {
        math: "\\text{Need: the pull } T \\text{ at every point}",
      }),
      line("Step one: draw every force on the block.", { math: "\\text{1. Draw every force on the block}" }),
      line("Step two: slowly means the forces balance. Balancing them gives us the pull.", {
        math: "\\text{2. Slowly} \\Rightarrow \\text{forces balance} \\Rightarrow T",
      }),
      line("Step three: the pull keeps changing, so we add up its work in tiny pieces. That's an integral.", {
        math: "\\text{3. Add up tiny pieces: } W = \\int T\\,ds",
      }),
      line("Step four: we check the answer a second way, using energy.", { math: "\\text{4. Check the answer with energy}" }),
    ],
  },
  {
    id: "work",
    title: "What is work?",
    lines: [
      line("So, what is work? Work is done when a force moves something."),
      line("Push with force $F$ through a distance $s$, in the same direction. The work is $F$ times $s$.", {
        say: "Push with force F through a distance s, in the same direction. The work is F times s.",
        math: "W = F\\,s",
        reveal: ["push"],
      }),
      line("If the force is at an angle $\\theta$, only the part along the motion counts: $F\\cos\\theta$.", {
        say: "If the force is at an angle theta, only the part along the motion counts. That's F cos theta.",
        math: "W = F\\,s\\cos\\theta",
        reveal: ["angle"],
      }),
      line("But here the pull keeps changing as the block climbs. So one multiplication isn't enough."),
      line("So we cut the path into tiny pieces. On each piece the force is almost constant, so its work is $F\\,ds$.", {
        say: "So we cut the path into tiny pieces. On each piece the force is almost constant, so its work is F d s.",
        math: "dW = F\\,ds",
        reveal: ["pieces"],
      }),
      line("Then we add up all the pieces. That's exactly what an integral does.", { math: "W = \\int F\\,ds" }),
    ],
  },
  {
    id: "forces",
    title: "The forces on the block",
    lines: [
      line("Now, every force on the block."),
      line("Gravity pulls it straight down. That's its weight, $mg$.", { say: "Gravity pulls it straight down. That's its weight, m g.", math: "\\text{weight} = mg", reveal: ["mg"] }),
      line("The dome pushes back, at right angles to the surface, straight out along the radius. That's the normal force, $N$.", {
        say: "The dome pushes back, at right angles to the surface, straight out along the radius. That's the normal force, N.",
        math: "N = \\text{normal force (out along the radius)}",
        reveal: ["N"],
      }),
      line("The surface is rough, so there's friction. It fights the motion, so it points down the slope.", { reveal: ["f"] }),
      line("Its size is $\\mu$ times the normal force: $f = \\mu N$.", {
        say: "Its size is mu times the normal force. f equals mu N.",
        math: "f = \\mu N",
      }),
      line("And the string pulls along the surface, up the slope. That's the pull, $T$.", {
        say: "And the string pulls along the surface, up the slope. That's the pull, T.",
        math: "T = \\text{pull of the string (up the slope)}",
        reveal: ["T"],
      }),
    ],
  },
  {
    id: "slowly",
    title: "Why “slowly” matters",
    lines: [
      line("Now, that word: slowly."),
      line("Slowly means the speed never changes. No speeding up, no slowing down."),
      line("No change in speed means no acceleration. So the forces cancel completely.", {
        math: "a = 0 \\;\\Rightarrow\\; \\text{net force} = 0",
      }),
      line("At every point, forces along the surface cancel, and forces along the radius cancel. That's all we need.", {
        math: "\\textstyle\\sum F_{\\text{along surface}} = 0,\\quad \\sum F_{\\text{along radius}} = 0",
      }),
      line("It also means kinetic energy never changes. We'll use that at the end.", { math: "\\Delta KE = 0" }),
    ],
  },
  {
    id: "geometry",
    title: "Describing the position",
    lines: [
      line("To say where the block is, we use one angle, $\\varphi$.", { say: "To say where the block is, we use one angle. Let's call it phi.", reveal: ["phi"] }),
      line("Draw a line from the centre to the block. $\\varphi$ is the angle between that line and the ground.", {
        say: "Draw a line from the centre to the block. Phi is the angle between that line and the ground.",
        reveal: ["phi"],
      }),
      line("On the ground, $\\varphi$ is zero. At the top, it's $90^\\circ$, or $\\pi/2$ in radians.", {
        say: "On the ground, phi is zero. At the top, it's ninety degrees, or pi by two in radians.",
        math: "\\varphi: \\; 0 \\;\\to\\; 90^\\circ = \\tfrac{\\pi}{2}",
      }),
      line("If the angle grows by a tiny $d\\varphi$, the block moves along the curve by $ds = R\\,d\\varphi$.", {
        say: "If the angle grows by a tiny d phi, the block moves along the curve by d s equals R d phi.",
        math: "ds = R\\,d\\varphi",
        reveal: ["ds"],
      }),
      line("That's the arc rule: arc length is radius times angle, in radians."),
    ],
  },
  {
    id: "trig",
    title: "Splitting any force",
    lines: [
      line("Quick refresher: how to split a force into two parts."),
      line("Take a force $F$, and a line at angle $\\theta$ to it.", {
        say: "Take a force, F, and a line at angle theta to it.",
        reveal: ["arrow"],
      }),
      line("From the tip of the arrow, drop a perpendicular onto the line. Now we have two parts at right angles.", {
        reveal: ["arrow", "drop"],
      }),
      line("The part along the line is next to the angle: $F\\cos\\theta$.", {
        say: "The part along the line is next to the angle. That's F cos theta.",
        math: "\\text{along the line: } F\\cos\\theta",
        reveal: ["arrow", "drop", "adj"],
      }),
      line("The part across the line is opposite the angle: $F\\sin\\theta$.", {
        say: "The part across the line is opposite the angle. That's F sine theta.",
        math: "\\text{across the line: } F\\sin\\theta",
        reveal: ["arrow", "drop", "adj", "opp"],
      }),
      line("One rule to remember: the part along any direction is the force times the cosine of the angle between them.", {
        math: "\\text{part along a direction} = F\\cos(\\text{angle between them})",
        reveal: ["arrow", "drop", "adj", "opp"],
      }),
    ],
  },
  {
    id: "resolve",
    title: "Splitting the weight",
    lines: [
      line("Now let's split the weight. This step confuses most people, so let's go slowly."),
      line("Zoom in. Three lines matter: the radius, the surface, and the vertical, where gravity pulls.", {
        reveal: ["lines"],
      }),
      line("The radius and the surface always meet at a right angle. That's true for every circle.", {
        reveal: ["lines", "right"],
      }),
      line("So they make perfect axes: one along the motion, one straight across it.", { reveal: ["lines", "right"] }),
      line("At the centre, the radius makes angle $\\varphi$ with the ground.", {
        say: "At the centre, the radius makes angle phi with the ground.",
        reveal: ["lines", "right", "phiC"],
      }),
      line("Turn both lines by ninety degrees. The radius becomes the surface. The ground becomes the vertical.", {
        reveal: ["lines", "right", "phiC"],
      }),
      line("Turning both by the same amount keeps the angle the same. So the vertical and the surface meet at $\\varphi$ too.", {
        say: "Turning both by the same amount keeps the angle the same. So the vertical and the surface meet at phi too.",
        math: "\\text{angle between } mg \\text{ and the surface} = \\varphi",
        reveal: ["lines", "right", "phiC", "angleT", "mgBig"],
      }),
      line("And the vertical makes $90^\\circ - \\varphi$ with the radius.", {
        say: "And the vertical makes ninety degrees minus phi with the radius.",
        math: "\\text{angle between } mg \\text{ and the radius} = 90^\\circ - \\varphi",
        reveal: ["lines", "right", "phiC", "angleT", "angleR", "mgBig"],
      }),
      line("Use our rule. Along the surface: $mg\\cos\\varphi$, pulling the block down the slope.", {
        say: "Use our rule. Along the surface, m g cos phi, pulling the block down the slope.",
        math: "\\text{along the surface: } mg\\cos\\varphi \\;(\\text{down the slope})",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT"],
      }),
      line("Along the radius: $mg\\cos(90^\\circ - \\varphi)$, which is $mg\\sin\\varphi$, pressing into the dome.", {
        say: "Along the radius, m g cos of ninety degrees minus phi, which is m g sine phi, pressing into the dome.",
        math: "\\text{into the dome: } mg\\cos(90^\\circ-\\varphi) = mg\\sin\\varphi",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
      line("Always check the ends. At the bottom, $\\varphi = 0$: the surface is a wall, and all of $mg$ runs along it.", {
        say: "Always check the ends. At the bottom, phi is zero. The surface is a wall, and all of m g runs along it.",
        math: "\\varphi = 0:\\; mg\\cos 0 = mg \\text{ along the wall}",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
      line("At the top, $\\varphi = 90^\\circ$: the surface is flat, and all of $mg$ presses in. Both ends make sense.", {
        say: "At the top, phi is ninety degrees. The surface is flat, and all of m g presses in. Both ends make sense.",
        math: "\\varphi = 90^\\circ:\\; mg\\sin 90^\\circ = mg \\text{ into the top}",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
    ],
  },
  {
    id: "balance",
    title: "Balancing the forces",
    lines: [
      line("Now we balance the forces, one direction at a time.", {
        reveal: ["mg", "N", "f", "T"],
      }),
      line("First, along the radius. Out: the normal force $N$. In: $mg\\sin\\varphi$.", {
        say: "First, along the radius. Out, the normal force, N. In, m g sine phi.",
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("The pull and friction lie along the surface, so they don't count here.", {
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("Out equals in: $N = mg\\sin\\varphi$. So $N$ is not $mg$. It changes with position.", {
        say: "Out equals in. N equals m g sine phi. So N is not m g. It changes with position.",
        math: "\\text{out} = \\text{in}:\\quad N = mg\\sin\\varphi",
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("So friction is $f = \\mu N = \\mu mg\\sin\\varphi$.", {
        say: "So friction is f equals mu N, which is mu m g sine phi.",
        math: "f = \\mu N = \\mu mg\\sin\\varphi",
      }),
      line("Next, along the surface. Up the slope: the pull $T$. Down the slope: $mg\\cos\\varphi$ and friction.", {
        say: "Next, along the surface. Up the slope, the pull, T. Down the slope, m g cos phi, and friction.",
        reveal: ["mg", "N", "f", "T", "mgsin", "mgcos"],
      }),
      line("The normal force is across the surface, so it doesn't count here.", { reveal: ["mg", "N", "f", "T", "mgsin", "mgcos"] }),
      line("Up equals down: $T = mg\\cos\\varphi + \\mu mg\\sin\\varphi$. That's the pull at any angle.", {
        say: "Up equals down. T equals m g cos phi, plus mu m g sine phi. That's the pull at any angle.",
        math: "\\text{up} = \\text{down}:\\quad T = mg\\cos\\varphi + \\mu mg\\sin\\varphi",
      }),
      line("At the bottom, the pull is $mg$. At the top, only $\\mu mg$. It keeps changing, so we need an integral.", {
        say: "At the bottom, the pull is m g. At the top, only mu m g. It keeps changing, so we need an integral.",
        math: "T(0) = mg, \\quad T\\!\\left(\\tfrac{\\pi}{2}\\right) = \\mu mg",
      }),
    ],
  },
  {
    id: "setup",
    title: "Setting up the work",
    lines: [
      line("Now, the work for one tiny step."),
      line("Force times tiny distance: $dW = T\\,ds$.", { say: "Force times tiny distance. d W equals T d s.", math: "dW = T\\,ds" }),
      line("Put in $T$, and $ds = R\\,d\\varphi$.", {
        say: "Put in T, and d s equals R d phi.",
        math: "dW = (mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi",
      }),
      line("Add up every step, from the ground, $\\varphi = 0$, to the top, $\\varphi = \\pi/2$.", {
        say: "Add up every step, from the ground, where phi is zero, to the top, where phi is pi by two.",
        math: "W = \\int_0^{\\pi/2}(mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi",
      }),
      line("$m$, $g$, $R$ and $\\mu$ are constant, so they come outside.", {
        say: "m, g, R and mu are constant, so they come outside.",
        math: "W = mgR\\!\\int_0^{\\pi/2}\\!\\cos\\varphi\\,d\\varphi + \\mu mgR\\!\\int_0^{\\pi/2}\\!\\sin\\varphi\\,d\\varphi",
      }),
    ],
  },
  {
    id: "integrate",
    title: "Doing the integrals",
    lines: [
      line("Just two easy integrals."),
      line("The integral of $\\cos\\varphi$ is $\\sin\\varphi$.", { say: "The integral of cos phi is sine phi.", math: "\\int\\cos\\varphi\\,d\\varphi = \\sin\\varphi" }),
      line("The integral of $\\sin\\varphi$ is $-\\cos\\varphi$.", { say: "The integral of sine phi is minus cos phi.", math: "\\int\\sin\\varphi\\,d\\varphi = -\\cos\\varphi" }),
      line("First: top minus bottom. $\\sin 90^\\circ - \\sin 0 = 1$.", {
        say: "First one. Top minus bottom. Sine ninety minus sine zero is one.",
        math: "\\big[\\sin\\varphi\\big]_0^{\\pi/2} = 1 - 0 = 1",
      }),
      line("Second: $-\\cos 90^\\circ + \\cos 0 = 1$.", {
        say: "Second one. Minus cos ninety, plus cos zero, is also one.",
        math: "\\big[-\\cos\\varphi\\big]_0^{\\pi/2} = 0 + 1 = 1",
      }),
      line("So $W = mgR + \\mu mgR$.", { say: "So W equals m g R, plus mu m g R.", math: "W = mgR + \\mu mgR" }),
    ],
  },
  {
    id: "answer",
    title: "The answer",
    lines: [
      line("And there's our answer."),
      line("$W = mgR(1 + \\mu)$.", { say: "W equals m g R, times one plus mu.", math: "\\boxed{W = mgR(1 + \\mu)}" }),
      line("Watch the bar fill as the block climbs. White pays for lifting. Green pays for friction."),
    ],
  },
  {
    id: "meaning",
    title: "What the answer means",
    lines: [
      line("What do the two parts mean?"),
      line("$mgR$ is the work to lift the block by height $R$. Weight times height. The path doesn't matter.", {
        say: "m g R is the work to lift the block by height R. Weight times height. The path doesn't matter.",
        math: "mgR = \\text{weight} \\times \\text{height}",
        reveal: ["height"],
      }),
      line("$\\mu mgR$ is the work against friction. And this $R$ is the horizontal distance, not the curved length.", {
        say: "mu m g R is the work against friction. And this R is the horizontal distance, not the curved length.",
        reveal: ["height", "horizontal"],
      }),
      line("A handy rule: when you drag slowly, friction's work is $\\mu mg$ times the horizontal distance.", {
        say: "A handy rule. When you drag slowly, friction's work is mu m g times the horizontal distance.",
        math: "W_{\\text{friction}} = \\mu mg \\times \\text{horizontal distance}",
        reveal: ["height", "horizontal"],
      }),
      line("Check: on a smooth dome, $\\mu = 0$, so $W = mgR$. Makes sense.", {
        say: "Check. On a smooth dome, mu is zero, so W is m g R. Makes sense.",
        math: "\\mu = 0 \\;\\Rightarrow\\; W = mgR",
      }),
    ],
  },
  {
    id: "energy",
    title: "Check: the energy method",
    lines: [
      line("Now let's check it a different way, with energy. No integral this time."),
      line("The work-energy theorem: total work by all forces equals the change in kinetic energy.", { math: "W_{\\text{total}} = \\Delta KE" }),
      line("Slowly means kinetic energy doesn't change. So the total work is zero.", {
        math: "W_{\\text{person}} + W_{\\text{gravity}} + W_{\\text{friction}} + W_N = 0",
      }),
      line("The normal force is always at right angles to the motion, so it does no work.", { math: "W_N = 0" }),
      line("Gravity does negative work as the block rises by $R$: that's $-mgR$.", {
        say: "Gravity does negative work as the block rises by R. That's minus m g R.",
        math: "W_{\\text{gravity}} = -mgR",
      }),
      line("Friction also does negative work. By our horizontal-distance rule: $-\\mu mgR$.", {
        say: "Friction also does negative work. By our horizontal distance rule, that's minus mu m g R.",
        math: "W_{\\text{friction}} = -\\mu mgR",
      }),
      line("So the person's work is $mgR + \\mu mgR$. Same answer, two different methods.", {
        say: "So the person's work is m g R plus mu m g R. Same answer, two different methods.",
        math: "W_{\\text{person}} = mgR(1+\\mu) \\;\\checkmark",
      }),
      line("The code checked it too. In the simulation: {{wsim}} minus {{wg}} minus {{wf}} is zero.", {
        say: "The code checked it too. In the simulation, {{wsimSay}}, minus {{wgSay}}, minus {{wfSay}}, is zero.",
        math: "{{wsim}} - {{wg}} - {{wf}} = 0 \\text{ J}",
      }),
    ],
  },
  {
    id: "example",
    title: "With real numbers",
    lines: [
      line("Now with numbers: $m = 2$ kg, $R = 1$ m, $\\mu = 0.5$, $g = 10$ m/s².", {
        say: "Now with numbers. Mass two kilograms, radius one metre, mu point five, and g ten.",
      }),
      line("Lifting: $mgR = {{wg}}$ J. Friction: $\\mu mgR = {{wf}}$ J.", {
        say: "Lifting, m g R, is {{wgSay}} joules. Friction, mu m g R, is {{wfSay}} joules.",
      }),
      line("Total: {{w}} J.", { say: "Total, {{wSay}} joules." }),
      line("A step-by-step simulation in code gets {{wsim}} J. It matches.", { say: "A step by step simulation in code gets {{wsimSay}} joules. It matches." }),
    ],
  },
  {
    id: "traps",
    title: "Common traps",
    lines: [
      line("Now, two common traps."),
      line("Trap one: forgetting friction. You get $mgR$, which is {{wrong1}} J. Too small.", {
        say: "Trap one, forgetting friction. You get m g R, which is {{wrong1Say}} joules. Too small.",
      }),
      line("Trap two: taking $N = mg$ all the way. Friction times the arc, $\\pi R/2$, gives {{wrong2}} J. Too big.", {
        say: "Trap two, taking N equals m g all the way. Friction times the arc, pi R by two, gives about {{wrong2Say}} joules. Too big.",
      }),
      line("The normal force changes along the dome, so friction changes too. That's the heart of this problem."),
    ],
  },
  {
    id: "recap",
    title: "Recap",
    lines: [
      line("Let's recap.", { math: "\\text{1. Draw every force}" }),
      line("Draw every force. Slowly means they balance at every point.", { math: "\\text{2. Slowly} \\Rightarrow \\text{forces balance}" }),
      line("Find the pull $T$ at any angle, then add up $T\\,ds$ with an integral.", {
        say: "Find the pull, T, at any angle, then add up T d s with an integral.",
        math: "\\text{3. } T(\\varphi), \\text{ then } W = \\int T\\,ds",
      }),
      line("Answer: $W = mgR(1 + \\mu)$.", { say: "The answer: m g R, times one plus mu.", math: "\\boxed{W = mgR(1+\\mu)}" }),
      line("Try the smooth-dome version yourself, and share your answer in the comments."),
    ],
  },
];

export const TITLE = {
  title: "Dragging a block over a rough dome",
  subtitle: "Work done by the person, from zero, step by step",
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
export function spokenText(l: Line, values: Record<string, string>): string {
  return fill(l.say ?? l.text, values);
}

/** Voice file key for a line, e.g. "balance-3". */
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;
