import { sig3 } from "../../physics/format";
import { totalWork, workUpTo } from "../../physics/hemisphere";
import { EXAMPLE, MISTAKES } from "./model";
import { simulateDrag } from "./simulate";

/**
 * A full lesson on "Work done dragging a block over a rough hemisphere",
 * written so someone starting from zero can follow every step (16:9, ~12 min).
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
  "A hemisphere of radius R is fixed on the ground. Its surface is rough, with coefficient of friction μ. Using a string, a person pulls a small body of mass m very slowly along the surface, from the ground all the way up to the top of the hemisphere. Find the work done by the person.";

export const BEATS: Beat[] = [
  {
    id: "question",
    title: "The question",
    lines: [
      line("Here's the question we're solving today. Let me read it out first."),
      line("A hemisphere of radius $R$ is fixed on the ground. Its surface is rough, with coefficient of friction $\\mu$.", {
        say: "A hemisphere of radius R is fixed on the ground. Its surface is rough, with coefficient of friction mu.",
      }),
      line("Using a string, a person pulls a small body of mass $m$ very slowly along the surface, from the ground all the way up to the top.", {
        say: "Using a string, a person pulls a small body of mass m very slowly along the surface, from the ground all the way up to the top.",
      }),
      line("Find the work done by the person."),
      line("Take a moment to picture it. Then we'll go through it together, one step at a time, starting from zero."),
    ],
  },
  {
    id: "givens",
    title: "What we know",
    lines: [
      line("First, let's write down what the question gives us."),
      line("The radius of the dome is $R$.", { say: "The radius of the dome is R.", math: "R = \\text{radius of the hemisphere}", reveal: ["R"] }),
      line("The mass of the block is $m$.", { say: "The mass of the block is m.", math: "m = \\text{mass of the block}", reveal: ["m"] }),
      line("The surface is rough, with friction coefficient $\\mu$.", { say: "The surface is rough, with friction coefficient mu.", math: "\\mu = \\text{coefficient of friction}", reveal: ["mu"] }),
      line("The block moves slowly. Remember this word. It's going to do a lot of the work for us.", { math: "\\text{moves slowly}" }),
      line("And we want one thing: the work done by the person.", { math: "\\text{Find: } W_{\\text{person}}" }),
    ],
  },
  {
    id: "approach",
    title: "How to attack it",
    lines: [
      line("Before any maths, let's plan how to attack this question. This is the part most people skip."),
      line("We want the work done by the person's pull. Work is force times distance, so first we need to know how big that pull is at every point.", {
        math: "\\text{Need: the pull } T \\text{ at every point}",
      }),
      line("Step one: draw every force acting on the block.", { math: "\\text{1. Draw every force on the block}" }),
      line("Step two: use the word slowly. It tells us the forces balance, and balancing them gives us the pull.", {
        math: "\\text{2. Slowly} \\Rightarrow \\text{forces balance} \\Rightarrow T",
      }),
      line("Step three: the pull changes along the path, so we add up its work in tiny pieces. That's an integral.", {
        math: "\\text{3. Add up tiny pieces: } W = \\int T\\,ds",
      }),
      line("And step four: at the end, we'll check the answer a completely different way, using energy.", { math: "\\text{4. Check the answer with energy}" }),
    ],
  },
  {
    id: "work",
    title: "What is work?",
    lines: [
      line("So, what is work? In physics, work is done when a force moves something."),
      line("Push with a force $F$, and if the object moves a distance $s$ in the same direction, the work is $F$ times $s$.", {
        say: "Push with a force F, and if the object moves a distance s in the same direction, the work is F times s.",
        math: "W = F\\,s",
        reveal: ["push"],
      }),
      line("If the force is at an angle $\\theta$ to the motion, only the part along the motion counts. That part is $F\\cos\\theta$.", {
        say: "If the force is at an angle theta to the motion, only the part along the motion counts. That part is F cos theta.",
        math: "W = F\\,s\\cos\\theta",
        reveal: ["angle"],
      }),
      line("In our problem, though, the pull keeps changing as the block climbs. So we can't just multiply once."),
      line("Instead, we cut the path into tiny pieces. On each tiny piece the force is almost constant, so that piece's work is $F\\,ds$.", {
        say: "Instead, we cut the path into tiny pieces. On each tiny piece the force is almost constant, so the work for that piece is F times d s.",
        math: "dW = F\\,ds",
        reveal: ["pieces"],
      }),
      line("Then we add up all the pieces. Adding up tiny pieces is exactly what an integral does.", { math: "W = \\int F\\,ds" }),
    ],
  },
  {
    id: "forces",
    title: "The forces on the block",
    lines: [
      line("Next, let's meet every force acting on the block."),
      line("Gravity pulls it straight down. That force is its weight, $mg$.", { say: "Gravity pulls it straight down. That force is its weight, m g.", math: "\\text{weight} = mg", reveal: ["mg"] }),
      line("The dome pushes back on the block. This push is always at right angles to the surface, so it points straight out along the radius. It's called the normal force, $N$.", {
        say: "The dome pushes back on the block. This push is always at right angles to the surface, so it points straight out along the radius. It's called the normal force, N.",
        math: "N = \\text{normal force (out along the radius)}",
        reveal: ["N"],
      }),
      line("The surface is rough, so there's friction. Friction always fights sliding, so it points against the motion, down the slope.", { reveal: ["f"] }),
      line("Its size is $\\mu$ times the normal force. That's the rule for sliding friction: $f = \\mu N$.", {
        say: "Its size is mu times the normal force. That's the rule for sliding friction: f equals mu N.",
        math: "f = \\mu N",
      }),
      line("And the string pulls the block. A string can only pull along itself, and here it lies along the surface, so the pull $T$ points up the slope.", {
        say: "And the string pulls the block. A string can only pull along itself, and here it lies along the surface, so the pull, T, points up the slope.",
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
      line("Moving slowly means the block's speed never changes. It doesn't speed up and it doesn't slow down."),
      line("No change in speed means no acceleration. And Newton's laws say that with no acceleration, the forces cancel out completely.", {
        math: "a = 0 \\;\\Rightarrow\\; \\text{net force} = 0",
      }),
      line("So at every point, the forces along the surface cancel, and the forces along the radius cancel. That's all we need to find the pull.", {
        math: "\\textstyle\\sum F_{\\text{along surface}} = 0,\\quad \\sum F_{\\text{along radius}} = 0",
      }),
      line("It also means the block never gains kinetic energy. We'll use that as a check at the end.", { math: "\\Delta KE = 0" }),
    ],
  },
  {
    id: "geometry",
    title: "Describing the position",
    lines: [
      line("To say where the block is, we use one angle, $\\varphi$.", { say: "To say where the block is, we use one angle. We'll call it phi.", reveal: ["phi"] }),
      line("Draw a line from the centre of the dome to the block. $\\varphi$ is the angle between that line and the ground.", {
        say: "Draw a line from the centre of the dome to the block. Phi is the angle between that line and the ground.",
        reveal: ["phi"],
      }),
      line("On the ground, $\\varphi$ is zero. At the very top, it's $90^\\circ$, which is $\\pi/2$ in radians.", {
        say: "On the ground, phi is zero. At the very top, it's ninety degrees, which is pi by two in radians.",
        math: "\\varphi: \\; 0 \\;\\to\\; 90^\\circ = \\tfrac{\\pi}{2}",
      }),
      line("When the angle grows by a tiny amount $d\\varphi$, the block moves along the curve by $ds = R\\,d\\varphi$.", {
        say: "When the angle grows by a tiny amount, d phi, the block moves along the curve by d s equals R d phi.",
        math: "ds = R\\,d\\varphi",
        reveal: ["ds"],
      }),
      line("That's the arc rule: arc length equals radius times angle, with the angle in radians."),
    ],
  },
  {
    id: "trig",
    title: "Splitting any force",
    lines: [
      line("Before we split the weight, a quick refresher on splitting a force. If you already know this, it's a good warm-up."),
      line("Take a force $F$, drawn as an arrow, and a line that makes an angle $\\theta$ with it.", {
        say: "Take a force, F, drawn as an arrow, and a line that makes an angle theta with it.",
        reveal: ["arrow"],
      }),
      line("From the tip of the arrow, drop a perpendicular onto the line. Now the force is split into two pieces at right angles to each other.", {
        reveal: ["arrow", "drop"],
      }),
      line("The piece along the line is the side next to the angle. Its size is $F\\cos\\theta$.", {
        say: "The piece along the line is the side next to the angle. Its size is F cos theta.",
        math: "\\text{along the line: } F\\cos\\theta",
        reveal: ["arrow", "drop", "adj"],
      }),
      line("The piece across the line is the side opposite the angle. Its size is $F\\sin\\theta$.", {
        say: "The piece across the line is the side opposite the angle. Its size is F sine theta.",
        math: "\\text{across the line: } F\\sin\\theta",
        reveal: ["arrow", "drop", "adj", "opp"],
      }),
      line("So here's the one rule to remember: the part of a force along any direction is the force times the cosine of the angle between them.", {
        math: "\\text{part along a direction} = F\\cos(\\text{angle between them})",
        reveal: ["arrow", "drop", "adj", "opp"],
      }),
    ],
  },
  {
    id: "resolve",
    title: "Splitting the weight",
    lines: [
      line("Now let's split the weight of the block. This is the step that confuses most people, so we'll take it really slowly."),
      line("Zoom in on the block. Three lines matter here: the radius, from the block to the centre of the dome; the surface, which just touches the dome at the block; and the vertical, the direction gravity pulls.", {
        reveal: ["lines"],
      }),
      line("The radius and the surface always meet at a right angle. That's true for every circle: the radius meets the curve square on.", {
        reveal: ["lines", "right"],
      }),
      line("So the radius and the surface make perfect axes. One runs along the motion, the other runs straight across it.", { reveal: ["lines", "right"] }),
      line("Now the angles. Down at the centre, the radius makes angle $\\varphi$ with the ground.", {
        say: "Now the angles. Down at the centre, the radius makes angle phi with the ground.",
        reveal: ["lines", "right", "phiC"],
      }),
      line("Turn both of those lines by ninety degrees. The radius turns into the surface, and the ground turns into the vertical.", {
        reveal: ["lines", "right", "phiC"],
      }),
      line("Turning two lines by the same amount doesn't change the angle between them. So the vertical and the surface also meet at angle $\\varphi$.", {
        say: "Turning two lines by the same amount doesn't change the angle between them. So the vertical and the surface also meet at angle phi.",
        math: "\\text{angle between } mg \\text{ and the surface} = \\varphi",
        reveal: ["lines", "right", "phiC", "angleT", "mgBig"],
      }),
      line("And since the surface and radius are at ninety degrees, the vertical makes $90^\\circ - \\varphi$ with the radius.", {
        say: "And since the surface and the radius are at ninety degrees, the vertical makes ninety degrees minus phi with the radius.",
        math: "\\text{angle between } mg \\text{ and the radius} = 90^\\circ - \\varphi",
        reveal: ["lines", "right", "phiC", "angleT", "angleR", "mgBig"],
      }),
      line("Now use our rule. The part of $mg$ along the surface is $mg\\cos\\varphi$, and it pulls the block down the slope.", {
        say: "Now use our rule. The part of m g along the surface is m g cos phi, and it pulls the block down the slope.",
        math: "\\text{along the surface: } mg\\cos\\varphi \\;(\\text{down the slope})",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT"],
      }),
      line("The part along the radius is $mg\\cos(90^\\circ - \\varphi)$. And $\\cos(90^\\circ - \\varphi)$ is the same as $\\sin\\varphi$. So it's $mg\\sin\\varphi$, pressing into the dome.", {
        say: "The part along the radius is m g cos of ninety degrees minus phi. And cos of ninety degrees minus phi is the same as sine phi. So it's m g sine phi, pressing into the dome.",
        math: "\\text{into the dome: } mg\\cos(90^\\circ-\\varphi) = mg\\sin\\varphi",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
      line("Always check the ends. At the bottom, $\\varphi = 0$, the surface is a vertical wall, and the whole weight runs along it: $mg\\cos 0 = mg$.", {
        say: "Always check the ends. At the bottom, phi is zero, the surface is a vertical wall, and the whole weight runs along it. m g cos zero is m g.",
        math: "\\varphi = 0:\\; mg\\cos 0 = mg \\text{ along the wall}",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
      line("At the top, $\\varphi = 90^\\circ$, the surface is flat, and the whole weight presses into it: $mg\\sin 90^\\circ = mg$. Both ends make sense, so the split is right.", {
        say: "At the top, phi is ninety degrees, the surface is flat, and the whole weight presses into it. m g sine ninety is m g. Both ends make sense, so the split is right.",
        math: "\\varphi = 90^\\circ:\\; mg\\sin 90^\\circ = mg \\text{ into the top}",
        reveal: ["lines", "right", "angleT", "angleR", "mgBig", "projT", "projR"],
      }),
    ],
  },
  {
    id: "balance",
    title: "Balancing the forces",
    lines: [
      line("Now we balance the forces, one direction at a time. Pick a direction, add up everything pointing one way, and set it equal to everything pointing the other way.", {
        reveal: ["mg", "N", "f", "T"],
      }),
      line("First, across the surface, along the radius. Pointing out: the normal force $N$. Pointing in: $mg\\sin\\varphi$.", {
        say: "First, across the surface, along the radius. Pointing out, the normal force, N. Pointing in, m g sine phi.",
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("The pull and friction both lie along the surface, so they have no part across it. They don't enter this balance.", {
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("Out equals in, so $N = mg\\sin\\varphi$. Notice the normal force is not $mg$. It depends on where the block is.", {
        say: "Out equals in, so N equals m g sine phi. Notice the normal force is not m g. It depends on where the block is.",
        math: "\\text{out} = \\text{in}:\\quad N = mg\\sin\\varphi",
        reveal: ["mg", "N", "f", "T", "mgsin"],
      }),
      line("That gives the friction: $f = \\mu N = \\mu mg\\sin\\varphi$.", {
        say: "That gives the friction. f equals mu N, which is mu m g sine phi.",
        math: "f = \\mu N = \\mu mg\\sin\\varphi",
      }),
      line("Next, along the surface. Pointing up the slope: the pull $T$. Pointing down the slope: gravity's part $mg\\cos\\varphi$, and friction, because the block is moving up.", {
        say: "Next, along the surface. Pointing up the slope, the pull, T. Pointing down the slope, gravity's part, m g cos phi, and friction, because the block is moving up.",
        reveal: ["mg", "N", "f", "T", "mgsin", "mgcos"],
      }),
      line("The normal force is across the surface, so it has no part along it. It doesn't enter this balance.", { reveal: ["mg", "N", "f", "T", "mgsin", "mgcos"] }),
      line("Up equals down, so $T = mg\\cos\\varphi + \\mu mg\\sin\\varphi$. That's exactly how hard the person must pull at angle $\\varphi$.", {
        say: "Up equals down, so T equals m g cos phi, plus mu m g sine phi. That's exactly how hard the person must pull at angle phi.",
        math: "\\text{up} = \\text{down}:\\quad T = mg\\cos\\varphi + \\mu mg\\sin\\varphi",
      }),
      line("At the bottom the pull is $mg$, and at the top it's only $\\mu mg$. It changes all the way up, and that's why we need an integral.", {
        say: "At the bottom the pull is m g, and at the top it's only mu m g. It changes all the way up, and that's why we need an integral.",
        math: "T(0) = mg, \\quad T\\!\\left(\\tfrac{\\pi}{2}\\right) = \\mu mg",
      }),
    ],
  },
  {
    id: "setup",
    title: "Setting up the work",
    lines: [
      line("Now we can write the work for one tiny step."),
      line("Work on a tiny step is force times tiny distance: $dW = T\\,ds$.", { say: "Work on a tiny step is force times tiny distance. d W equals T d s.", math: "dW = T\\,ds" }),
      line("Put in the pull $T$, and $ds = R\\,d\\varphi$.", {
        say: "Now put in the pull, T, and d s equals R d phi.",
        math: "dW = (mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi",
      }),
      line("For the total, we add up every tiny step, from the ground, $\\varphi = 0$, to the top, $\\varphi = \\pi/2$.", {
        say: "For the total, we add up every tiny step, from the ground, where phi is zero, to the top, where phi is pi by two.",
        math: "W = \\int_0^{\\pi/2}(mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi",
      }),
      line("$m$, $g$, $R$ and $\\mu$ don't change, so they come outside the integral.", {
        say: "m, g, R and mu don't change, so they come outside the integral.",
        math: "W = mgR\\!\\int_0^{\\pi/2}\\!\\cos\\varphi\\,d\\varphi + \\mu mgR\\!\\int_0^{\\pi/2}\\!\\sin\\varphi\\,d\\varphi",
      }),
    ],
  },
  {
    id: "integrate",
    title: "Doing the integrals",
    lines: [
      line("We only need two simple integrals."),
      line("The integral of $\\cos\\varphi$ is $\\sin\\varphi$.", { say: "The integral of cos phi is sine phi.", math: "\\int\\cos\\varphi\\,d\\varphi = \\sin\\varphi" }),
      line("The integral of $\\sin\\varphi$ is $-\\cos\\varphi$.", { say: "The integral of sine phi is minus cos phi.", math: "\\int\\sin\\varphi\\,d\\varphi = -\\cos\\varphi" }),
      line("First one: top limit minus bottom limit. $\\sin 90^\\circ - \\sin 0 = 1 - 0 = 1$.", {
        say: "First one. Top limit minus bottom limit. Sine ninety degrees minus sine zero is one minus zero, which is one.",
        math: "\\big[\\sin\\varphi\\big]_0^{\\pi/2} = 1 - 0 = 1",
      }),
      line("Second one: $-\\cos 90^\\circ - (-\\cos 0) = 0 + 1 = 1$.", {
        say: "Second one. Minus cos ninety degrees, minus, minus cos zero. That's zero plus one, which is one.",
        math: "\\big[-\\cos\\varphi\\big]_0^{\\pi/2} = 0 + 1 = 1",
      }),
      line("So $W = mgR \\times 1 + \\mu mgR \\times 1$.", { say: "So W equals m g R times one, plus mu m g R times one.", math: "W = mgR + \\mu mgR" }),
    ],
  },
  {
    id: "answer",
    title: "The answer",
    lines: [
      line("And that gives our answer."),
      line("$W = mgR(1 + \\mu)$.", { say: "W equals m g R, times one plus mu.", math: "\\boxed{W = mgR(1 + \\mu)}" }),
      line("Watch the bar fill as the block climbs. The white part pays for lifting. The green part pays for friction."),
    ],
  },
  {
    id: "meaning",
    title: "What the answer means",
    lines: [
      line("Let's understand the two pieces."),
      line("$mgR$ is the work to lift the block through a height $R$. Weight times height. The shape of the path doesn't matter.", {
        say: "m g R is the work to lift the block through a height R. Weight times height. The shape of the path doesn't matter.",
        math: "mgR = \\text{weight} \\times \\text{height}",
        reveal: ["height"],
      }),
      line("$\\mu mgR$ is the work against friction. And look: this $R$ is the horizontal distance the block moved, not the curved length.", {
        say: "mu m g R is the work against friction. And look, this R is the horizontal distance the block moved, not the curved length.",
        reveal: ["height", "horizontal"],
      }),
      line("That's a handy rule. When you drag something slowly, friction's work is $\\mu mg$ times the horizontal distance.", {
        say: "That's a handy rule. When you drag something slowly, the work against friction is mu m g times the horizontal distance.",
        math: "W_{\\text{friction}} = \\mu mg \\times \\text{horizontal distance}",
        reveal: ["height", "horizontal"],
      }),
      line("Quick check: if the dome were smooth, $\\mu = 0$, and the work is just $mgR$. That makes sense.", {
        say: "Quick check. If the dome were smooth, mu is zero, and the work is just m g R. That makes sense.",
        math: "\\mu = 0 \\;\\Rightarrow\\; W = mgR",
      }),
    ],
  },
  {
    id: "energy",
    title: "Check: the energy method",
    lines: [
      line("Now let's check the answer a completely different way, using energy. No integral this time."),
      line("The work-energy theorem says the total work done by all the forces equals the change in kinetic energy.", { math: "W_{\\text{total}} = \\Delta KE" }),
      line("The block moves slowly, so its kinetic energy never changes. The total work must be zero.", {
        math: "W_{\\text{person}} + W_{\\text{gravity}} + W_{\\text{friction}} + W_N = 0",
      }),
      line("The normal force always pushes at right angles to the motion, so it does no work at all.", { math: "W_N = 0" }),
      line("Gravity does negative work, because the block rises a height $R$ against it. That's $-mgR$.", {
        say: "Gravity does negative work, because the block rises a height R against it. That's minus m g R.",
        math: "W_{\\text{gravity}} = -mgR",
      }),
      line("Friction also does negative work. By the horizontal-distance rule, that's $-\\mu mgR$.", {
        say: "Friction also does negative work. By the horizontal distance rule, that's minus mu m g R.",
        math: "W_{\\text{friction}} = -\\mu mgR",
      }),
      line("So the person's work is $mgR + \\mu mgR$. The very same answer. Two different methods, one result.", {
        say: "So the person's work is m g R plus mu m g R. The very same answer. Two different methods, one result.",
        math: "W_{\\text{person}} = mgR(1+\\mu) \\;\\checkmark",
      }),
      line("The code checked this too. In the simulation, the three works add up to zero: {{wsim}} minus {{wg}} minus {{wf}}.", {
        say: "The code checked this too. In the simulation, the three works add up to zero. {{wsimSay}}, minus {{wgSay}}, minus {{wfSay}}.",
        math: "{{wsim}} - {{wg}} - {{wf}} = 0 \\text{ J}",
      }),
    ],
  },
  {
    id: "example",
    title: "With real numbers",
    lines: [
      line("Let's put numbers in: $m = 2$ kg, $R = 1$ m, $\\mu = 0.5$, and $g = 10$ m/s².", {
        say: "Let's put numbers in. Mass two kilograms, radius one metre, mu point five, and g ten metres per second squared.",
      }),
      line("Gravity part: $mgR = {{wg}}$ J. Friction part: $\\mu mgR = {{wf}}$ J.", {
        say: "The gravity part, m g R, is {{wgSay}} joules. The friction part, mu m g R, is {{wfSay}} joules.",
      }),
      line("Total: {{w}} J.", { say: "So the total is {{wSay}} joules." }),
      line("I also checked it with a step-by-step simulation in code. It gets {{wsim}} J.", { say: "I also checked it with a step by step simulation in code. It gets {{wsimSay}} joules." }),
    ],
  },
  {
    id: "traps",
    title: "Common traps",
    lines: [
      line("Now the traps students fall into."),
      line("Trap one: forgetting friction. You get $mgR$, which is {{wrong1}} J here. Too small.", {
        say: "Trap one, forgetting friction. You get m g R, which is {{wrong1Say}} joules here. Too small.",
      }),
      line("Trap two: taking $N = mg$ the whole way. Then friction looks like $\\mu mg$ times the arc, $\\pi R/2$, giving {{wrong2}} J. Too big.", {
        say: "Trap two, taking N equals m g the whole way. Then friction looks like mu m g times the arc, pi R by two, giving about {{wrong2Say}} joules. Too big.",
      }),
      line("The normal force changes along the dome, so friction changes too. That's the heart of this problem."),
    ],
  },
  {
    id: "recap",
    title: "Recap",
    lines: [
      line("Let's recap the steps.", { math: "\\text{1. Draw every force}" }),
      line("Draw every force. Then use slowly: the forces balance at every point.", { math: "\\text{2. Slowly} \\Rightarrow \\text{forces balance}" }),
      line("Find the pull $T$ at any angle, and add up $T\\,ds$ with an integral.", {
        say: "Find the pull, T, at any angle, and add up T d s with an integral.",
        math: "\\text{3. } T(\\varphi), \\text{ then } W = \\int T\\,ds",
      }),
      line("Answer: $W = mgR(1 + \\mu)$.", { say: "And the answer is m g R times one plus mu.", math: "\\boxed{W = mgR(1+\\mu)}" }),
      line("Try the smooth-dome version yourself, and tell me your answer in the comments."),
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
