import { sig3 } from "../../physics/format";
import {
  SETUPS,
  lawForce,
  nullPointFromQ1,
  releaseAt,
  releaseTerminalSpeed,
  thirdLawForce,
  triangleNetForce,
} from "./model";
import { coulombForce, K_JEE } from "../../physics/coulomb";
import { spokenDisplay } from "../../video/spoken";

/**
 * Words for the Coulomb's law explainer (16:9, about 4 min 50 s).
 * Same rules as the projectile script: $…$ is maths, {{name}} is filled from
 * the solver, and the Hinglish is a draft for a Hindi-speaking teacher to review.
 */

export type Lang = "en" | "hi";
export type BeatId =
  | "hook"
  | "charges"
  | "law"
  | "third"
  | "release"
  | "superposition"
  | "predict"
  | "reveal"
  | "cta";

export interface Line {
  at: number;
  en: string;
  hi: string;
}
export interface Beat {
  id: BeatId;
  seconds: number;
  lines: Line[];
}

/** Exact forms shown on screen; each one is checked against the solver in tests. */
export const EXACT = {
  triangleNet: "0.9\\sqrt{3}",
  releaseSpeed: "\\sqrt{6}",
} as const;

const l = (at: number, en: string, hi: string): Line => ({ at, en, hi });

export const BEATS: Beat[] = [
  {
    id: "hook",
    seconds: 15.5,
    lines: [
      l(0.3, "Two Kans. Same charge. Nobody is touching them.", "Do Kan. Same charge. Koi unhe chhoo bhi nahi raha."),
      l(4.5, "And still they fly apart. Something is pushing.", "Phir bhi dono door bhaag rahe hain. Koi toh push kar raha hai."),
      l(9.5, "That push follows a rule. Let's find it, and check it with real numbers.", "Is push ka ek rule hai. Chalo use dhoondhte hain, aur numbers se check bhi karte hain."),
    ],
  },
  {
    id: "charges",
    seconds: 38,
    lines: [
      l(0.3, "Charge comes in two kinds. We just call them plus and minus.", "Charge do type ka hota hai. Hum unhe bas plus aur minus kehte hain."),
      l(6, "Same signs push each other away.", "Same sign wale ek doosre ko door dhakelte hain."),
      l(12, "Opposite signs pull each other in.", "Opposite sign wale ek doosre ko paas kheenchte hain."),
      l(19, "Charge also comes in packets. The smallest one is $e = 1.6 \\times 10^{-19}$ C.", "Charge packets mein aata hai. Sabse chhota packet hai $e = 1.6 \\times 10^{-19}$ C."),
      l(28, "So every charge is a whole number of packets: $q = ne$. You never get half an electron.", "Isliye har charge packets ka poora number hota hai: $q = ne$. Aadha electron kabhi nahi milta."),
    ],
  },
  {
    id: "law",
    seconds: 58,
    lines: [
      l(0.3, "Here's the rule. Coulomb measured it in 1785.", "Rule yeh hai. Coulomb ne ise 1785 mein measure kiya tha."),
      l(6, "$F = \\dfrac{k\\,q_1 q_2}{r^2}$, and for JEE we take $k = 9 \\times 10^9$ N m²/C².", "$F = \\dfrac{k\\,q_1 q_2}{r^2}$, aur JEE mein hum $k = 9 \\times 10^9$ N m²/C² lete hain."),
      l(14, "Try it: {{lawQ1}} µC and {{lawQ2}} µC, {{lawR}} cm apart. That's {{lawF}} N.", "Try karo: {{lawQ1}} µC aur {{lawQ2}} µC, {{lawR}} cm door. Force aata hai {{lawF}} N."),
      l(22, "Now Kan grabs the $r$ and pulls.", "Ab Kan formula se $r$ pakad ke kheenchta hai."),
      l(30, "Double the distance. The force doesn't halve, it drops to a quarter: {{lawF2}} N.", "Distance double karo. Force aadha nahi hota, ek chauthai ho jaata hai: {{lawF2}} N."),
      l(41, "That square on $r$ is why far-away charges barely notice each other.", "$r$ ka yeh square hi wajah hai ki door ke charges ek doosre ko mushkil se mehsoos karte hain."),
      l(50, "Bring them closer instead, and the force shoots up: {{lawFclose}} N at {{lawRclose}} cm.", "Aur paas laao toh force tezi se badhta hai: {{lawRclose}} cm par {{lawFclose}} N."),
    ],
  },
  {
    id: "third",
    seconds: 28,
    lines: [
      l(0.3, "Quick trap. The 4 µC charge is bigger. Does it push harder?", "Ek chhota sa trap. 4 µC wala charge bada hai. Kya woh zyada zor se dhakelta hai?"),
      l(9, "No. Both feel exactly {{thirdF}} N, just in opposite directions.", "Nahi. Dono par bilkul {{thirdF}} N lagta hai, bas ulti directions mein."),
      l(18, "The formula has $q_1 q_2$ for both of them. Same product, same force. That's Newton's third law.", "Formula mein dono ke liye $q_1 q_2$ hai. Same product, same force. Yahi Newton ka third law hai."),
    ],
  },
  {
    id: "release",
    seconds: 42,
    lines: [
      l(0.3, "Now let's let go. Two Kans: 1 µC and 10 g each, starting 10 cm apart.", "Ab chhod ke dekhte hain. Do Kan: har ek 1 µC aur 10 g, shuru mein 10 cm door."),
      l(8, "Watch the force arrows shrink as the gap grows.", "Gap badhte hi force arrows chhote hote dekho."),
      l(16, "They keep speeding up, but each push is weaker than the last.", "Speed badhti rehti hai, par har push pichhle se kamzor hota hai."),
      l(25, "At 30 cm each one moves at {{v30}} m/s. The energy formula gives $\\sqrt{6}$, the same number.", "30 cm par har Kan {{v30}} m/s se chal raha hai. Energy formula bhi $\\sqrt{6}$ deta hai, wahi number."),
      l(34, "Even infinitely far away they'd never beat {{vinf}} m/s. The stored energy is all used up.", "Bahut door jaake bhi speed {{vinf}} m/s se zyada nahi hogi. Stored energy poori use ho chuki hogi."),
    ],
  },
  {
    id: "superposition",
    seconds: 40,
    lines: [
      l(0.3, "Three charges now, 1 µC each, on a triangle with 10 cm sides.", "Ab teen charges, har ek 1 µC, 10 cm side wale triangle par."),
      l(7, "The top one gets pushed by both of the others. Each push is {{pairF}} N.", "Upar wale ko baaki dono dhakelte hain. Har push {{pairF}} N ka hai."),
      l(15, "Forces are vectors, so we add them like arrows: tail of one on the tip of the other.", "Force vector hota hai, isliye arrows ki tarah jodo: ek ki tail doosre ke tip par."),
      l(24, "The sideways parts cancel out. The upward parts add up.", "Side wale hisse cancel ho jaate hain. Upar wale jud jaate hain."),
      l(32, "Net force: $0.9\\sqrt{3} \\approx$ {{netF}} N, straight up.", "Net force: $0.9\\sqrt{3} \\approx$ {{netF}} N, seedha upar."),
    ],
  },
  {
    id: "predict",
    seconds: 22,
    lines: [
      l(0.3, "Your turn. Pause the video and work it out.", "Ab aapki baari. Video pause karo aur khud solve karo."),
      l(12, "Hint: the answer is closer to the smaller charge. Can you say why?", "Hint: answer chhote charge ke paas hai. Bata sakte ho kyun?"),
    ],
  },
  {
    id: "reveal",
    seconds: 36,
    lines: [
      l(0.3, "Let's slide a test charge along the line and watch the force on it.", "Ek test charge ko line par slide karte hain aur us par force dekhte hain."),
      l(8, "Near the 2 µC charge it gets pushed right. Near the 8 µC charge, left.", "2 µC ke paas use right dhakka milta hai. 8 µC ke paas left."),
      l(17, "Somewhere in between the pushes cancel: {{xNull}} cm from the 2 µC charge.", "Beech mein kahin dono push cancel hote hain: 2 µC wale charge se {{xNull}} cm par."),
      l(25, "Check it: $\\dfrac{2}{x^2} = \\dfrac{8}{(30-x)^2}$ means $30 - x = 2x$, so $x = 10$ cm.", "Check karo: $\\dfrac{2}{x^2} = \\dfrac{8}{(30-x)^2}$ ka matlab $30 - x = 2x$, yaani $x = 10$ cm."),
    ],
  },
  {
    id: "cta",
    seconds: 14,
    lines: [
      l(0.3, "Recap: likes repel, opposites attract, force falls off as $r^2$, and forces add as vectors.", "Recap: same repel, opposite attract, force $r^2$ ke saath girta hai, aur forces vector ki tarah judte hain."),
    ],
  },
];

export const CARDS = {
  predict: {
    en: "+2 µC and +8 µC sit 30 cm apart. Where between them is the net force on a test charge zero?",
    hi: "+2 µC aur +8 µC, 30 cm door hain. Beech mein kahan test charge par net force zero hoga?",
  },
  cta: {
    en: "Comment below: double both charges AND the distance. What happens to F?",
    hi: "Comment karo: dono charges double, aur distance bhi double. F ka kya hoga?",
  },
  title: { en: "Coulomb's law", hi: "Coulomb's law" },
  subtitle: { en: "Why charges push and pull", hi: "Charges push aur pull kyun karte hain" },
  topic: { en: "Electrostatics · Class 12", hi: "Electrostatics · Class 12" },
  slowMo: { en: "Slow motion", hi: "Slow motion" },
} as const;

const microC = (q: number) => String(Math.round(q * 1e6));
const cm = (m: number) => String(Number((m * 100).toPrecision(6)));

/** The "bring them closer" distance in the law beat. */
export const LAW_R_CLOSE = 0.02;

/** Every number in the script, computed. */
export function scriptValues(): Record<string, string> {
  const closeR = LAW_R_CLOSE;
  return {
    lawQ1: microC(SETUPS.law.q1),
    lawQ2: microC(SETUPS.law.q2),
    lawR: cm(SETUPS.law.r),
    lawF: sig3(lawForce()),
    lawF2: sig3(lawForce(2 * SETUPS.law.r)),
    lawRclose: cm(closeR),
    lawFclose: sig3(lawForce(closeR)),
    thirdF: sig3(thirdLawForce()),
    v30: sig3(releaseAt(SETUPS.releaseEnd).v1),
    vinf: sig3(releaseTerminalSpeed()),
    pairF: sig3(coulombForce(K_JEE, SETUPS.triangle.q, SETUPS.triangle.q, SETUPS.triangle.a)),
    netF: sig3(Math.hypot(triangleNetForce().fx, triangleNetForce().fy)),
    xNull: cm(nullPointFromQ1()),
  };
}

export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Script placeholder {{${key}}} has no value`);
    return values[key];
  });
}

/** Every number again, written as words for the voice ({{lawFSay}} → "sixty"). */
export function spokenValues(): Record<string, string> {
  const v = scriptValues();
  return { ...v, ...Object.fromEntries(Object.entries(v).map(([k, s]) => [`${k}Say`, spokenDisplay(s)])) };
}

/**
 * What the English voice reads for each caption line, keyed "beat-index".
 * Lines not listed are read as their caption. Symbols and units are written
 * out for the ear, and the on-screen question cards are read aloud too.
 */
export const SAY_EN: Record<string, string> = {
  "charges-3": "Charge also comes in packets. The smallest one is e, one point six times ten to the power minus nineteen coulombs.",
  "charges-4": "So every charge is a whole number of packets. q equals n e. You never get half an electron.",
  "law-1": "F equals k, q one, q two, over r squared. For JEE, k is nine times ten to the power nine.",
  "law-2": "Try it. {{lawQ1Say}} micro coulombs and {{lawQ2Say}} micro coulombs, {{lawRSay}} centimetres apart. That's {{lawFSay}} newtons.",
  "law-3": "Now Kan grabs the r, and pulls.",
  "law-4": "Double the distance. The force doesn't halve. It drops to a quarter, {{lawF2Say}} newtons.",
  "law-5": "That square on r is why far-away charges barely notice each other.",
  "law-6": "Bring them closer instead, and the force shoots up. {{lawFcloseSay}} newtons at {{lawRcloseSay}} centimetres.",
  "third-0": "Quick trap. The four micro coulomb charge is bigger. Does it push harder?",
  "third-1": "No. Both feel exactly {{thirdFSay}} newtons, just in opposite directions.",
  "third-2": "The formula has q one q two for both of them. Same product, same force. That's Newton's third law.",
  "release-0": "Now let's let go. Two Kans, one micro coulomb and ten grams each, starting ten centimetres apart.",
  "release-3": "At thirty centimetres, each one moves at {{v30Say}} metres per second. The energy formula gives root six, the same number.",
  "release-4": "Even infinitely far away, they'd never beat {{vinfSay}} metres per second. The stored energy is all used up.",
  "superposition-0": "Three charges now, one micro coulomb each, on a triangle with ten centimetre sides.",
  "superposition-1": "The top one gets pushed by both of the others. Each push is {{pairFSay}} newtons.",
  "superposition-4": "Net force: zero point nine root three, which is about {{netFSay}} newtons, straight up.",
  "predict-0":
    "Your turn. A plus two micro coulomb charge and a plus eight micro coulomb charge sit thirty centimetres apart. Where between them is the net force on a test charge zero? Pause the video and work it out.",
  "reveal-1": "Near the two micro coulomb charge, it gets pushed right. Near the eight micro coulomb charge, left.",
  "reveal-2": "Somewhere in between, the pushes cancel. {{xNullSay}} centimetres from the two micro coulomb charge.",
  "reveal-3": "Check it. Two over x squared equals eight over thirty minus x, all squared. That means thirty minus x equals two x, so x is ten centimetres.",
  "cta-0":
    "Recap. Likes repel, opposites attract, the force falls off as r squared, and forces add as vectors. And one for the comments: double both charges, and double the distance too. What happens to the force?",
};

/** Voice clip key for a line, e.g. "law-2". */
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;

/** The English words the voice reads for one line (no $, braces or symbols). */
export function spokenEn(beat: BeatId, index: number, values: Record<string, string>): string {
  const line = BEATS.find((b) => b.id === beat)!.lines[index];
  return fill(SAY_EN[lineKey(beat, index)] ?? line.en, values);
}
