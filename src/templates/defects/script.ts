// Words for the ASE102 Unit II lesson: imperfections in solids and strengthening (16:9, about 10 min).
// text = caption, say = what the voice reads when the automatic reading would not sound right.

import { fill, speak } from "../phase/script";
import { CU_VAC, CW_EX, HP_EX, QUIZ, fmtSci } from "./model";

export type BeatId = "intro" | "classify" | "point" | "line" | "surface" | "volume" | "vibration" | "grainsize" | "strain" | "anneal" | "quiz" | "recap";

export interface Line {
  text: string;
  say?: string;
}
export interface Beat {
  id: BeatId;
  chapter: string;
  lines: Line[];
}

export const BEATS: Beat[] = [
  {
    id: "intro",
    chapter: "Perfect? Never.",
    lines: [
      { text: "A perfect crystal has every atom exactly in place. Real metals are never like that." },
      { text: "They are full of mistakes, called defects. And here's the surprise: defects decide how strong a metal is." },
      { text: "In this unit: the types of defects, how we make metals stronger, and what heating does to them." },
      { text: "All of Unit II in about ten minutes. Short and clear. Let's go." },
    ],
  },
  {
    id: "classify",
    chapter: "Types of defects",
    lines: [
      { text: "First, how do we sort defects? By their size, or dimension." },
      { text: "Point defects are zero-dimensional: one atom out of place." },
      { text: "Line defects are one-dimensional: these are dislocations." },
      { text: "Surface defects are two-dimensional: grain boundaries, twin boundaries and stacking faults." },
      { text: "Volume defects are three-dimensional: voids, cracks and inclusions." },
    ],
  },
  {
    id: "point",
    chapter: "Point defects",
    lines: [
      { text: "Point defects first. A vacancy is an empty lattice site: one atom is missing." },
      { text: "A self-interstitial is an extra host atom squeezed into a gap. It distorts the lattice a lot, so it's rare." },
      { text: "Impurity atoms can replace host atoms, that's substitutional, or sit in the gaps, that's interstitial." },
      {
        text: "Every crystal has some vacancies, and the number rises fast with heat: $N_v = N\\,e^{-Q_v/kT}$",
        say: "Every crystal has some vacancies, and the number rises fast with heat. N v equals N times e to the power minus Q v over k T.",
      },
      { text: "N is the number of atom sites, Qv is the energy to make one vacancy, k is Boltzmann's constant, and T is in kelvin." },
      {
        text: "Copper at 1000 °C: Qv = 0.9 eV and N = {{N}} sites per m³. So Nv = {{Nv}} vacancies per m³.",
        say: "Book example: copper at one thousand degrees. Q v is zero point nine electron volts, and N is {{NSay}} sites per cubic metre. So N v is {{NvSay}} vacancies per cubic metre.",
      },
      {
        text: "That's 1 vacancy in every {{oneIn}} sites. At room temperature, only about 1 in 10¹⁵.",
        say: "That's one vacancy in every {{oneInSay}} sites. At room temperature, it's only about one in a million billion.",
      },
      { text: "In ionic crystals, defects come in pairs, so the charges stay balanced." },
      { text: "Frenkel defect: a cation leaves its site and sits in a gap. Schottky defect: one cation and one anion are both missing." },
    ],
  },
  {
    id: "line",
    chapter: "Dislocations",
    lines: [
      { text: "Now line defects, called dislocations. They are the reason metals can bend without breaking." },
      { text: "An edge dislocation is an extra half-plane of atoms that ends inside the crystal." },
      { text: "The Burgers vector b gives the size and direction of the distortion. For an edge dislocation, b is perpendicular to the line." },
      { text: "In a screw dislocation, the atomic planes spiral around the line, like a ramp in a car park. Here b is parallel to the line." },
      { text: "Most real dislocations are mixed: part edge, part screw." },
      { text: "Now watch one move. Push the top with a shear stress, and the extra half-plane shifts along, one row of bonds at a time." },
      { text: "When it leaves the crystal, the top has slipped by exactly one atom spacing: b." },
      { text: "That's far easier than breaking every bond at once. It's like moving a big carpet by pushing a ruck along it." },
      { text: "So: moving dislocations means plastic deformation. To make a metal stronger, make dislocations hard to move." },
    ],
  },
  {
    id: "surface",
    chapter: "Surface defects",
    lines: [
      { text: "Surface defects are boundaries. The outer surface is one: atoms there have fewer neighbours to bond with." },
      { text: "A grain boundary separates two crystals, or grains, that point in different directions." },
      { text: "If the tilt between them is small, it's a low-angle boundary: a neat row of edge dislocations." },
      { text: "A twin boundary is a mirror. The atoms on one side are a mirror image of the other side." },
      { text: "A stacking fault is a mistake in the order of the atom layers: A B C A B, then A B C again, with one layer missing." },
      { text: "All these boundaries store energy, and they get in the way of moving dislocations." },
    ],
  },
  {
    id: "volume",
    chapter: "Volume defects",
    lines: [
      { text: "Volume defects are much bigger: pores or voids, cracks, and foreign particles called inclusions." },
      { text: "They usually come from casting or processing." },
      { text: "They weaken the metal and can start a fracture. That's why aircraft parts are scanned for them." },
    ],
  },
  {
    id: "vibration",
    chapter: "Atomic vibrations",
    lines: [
      { text: "And atoms are never still. Each one vibrates about its site, about 10¹³ times every second.", say: "And atoms are never still. Each one vibrates about its site, about ten trillion times every second." },
      { text: "The swing is only a few thousandths of a nanometre. Hotter means bigger swings. Temperature is really this vibration." },
      { text: "When the vibrations get strong enough to break many bonds at once, the solid melts." },
    ],
  },
  {
    id: "grainsize",
    chapter: "Strength from small grains",
    lines: [
      { text: "Now, how do we make metals stronger? Method one: make the grains smaller." },
      { text: "At a grain boundary, the next grain is tilted, so a dislocation can't simply carry on. It gets stuck." },
      { text: "Smaller grains mean more boundaries, and more obstacles for dislocations." },
      { text: "This is the Hall–Petch equation: $\\sigma_y = \\sigma_0 + k_y\\,d^{-1/2}$", say: "This is the Hall Petch equation. Sigma y equals sigma zero, plus k y over the square root of d." },
      {
        text: "With example values for a steel: {{coarse}} µm grains give {{coarseMPa}} MPa, but {{fine}} µm grains give {{fineMPa}} MPa.",
        say: "With example values for a steel: {{coarse}} micrometre grains give {{coarseMPa}} megapascals, but {{fine}} micrometre grains give {{fineMPa}} megapascals.",
      },
      { text: "Smaller grains make a metal stronger and tougher at the same time. That's rare, and very useful." },
      { text: "We control grain size by how fast the metal cools from the liquid, or by deforming it and then recrystallizing it." },
    ],
  },
  {
    id: "strain",
    chapter: "Strain hardening",
    lines: [
      { text: "Method two: strain hardening, also called cold working." },
      { text: "Bend or roll a metal at room temperature, and it gets harder and stronger. Bend a copper wire back and forth and feel it." },
      { text: "Why? Deformation creates lots of new dislocations. They tangle and block each other, like a traffic jam." },
      { text: "We measure it as percent cold work: $\\%CW = \\dfrac{A_0 - A_d}{A_0} \\times 100$", say: "We measure it as percent cold work: A zero minus A d, over A zero, times one hundred." },
      { text: "Book example: a copper rod drawn from 15.2 mm to 12.2 mm diameter. That's {{cw}}% cold work." },
      { text: "In the book's graphs, that copper rod reaches about 340 MPa tensile strength, but its ductility drops to about 7% elongation.", say: "In the book's graphs, that copper rod reaches about three hundred forty megapascals tensile strength, but its ductility drops to about seven percent elongation." },
      { text: "That's the price: the metal loses ductility. Too much cold work, and it cracks." },
    ],
  },
  {
    id: "anneal",
    chapter: "Recovery, recrystallization, grain growth",
    lines: [
      { text: "Can we undo cold work? Yes, by heating it. This is annealing, and it happens in three stages." },
      { text: "Stage one, recovery. Dislocations move and rearrange into low-energy patterns. Internal stresses are relieved." },
      { text: "Electrical and thermal conductivity come back, but the grains still look the same." },
      { text: "Stage two, recrystallization. New, strain-free, equal-sized grains form and grow, and eat up the old deformed grains." },
      { text: "The metal becomes soft and ductile again, just like before cold working." },
      {
        text: "Recrystallization temperature: where it finishes in 1 hour. Usually ⅓ to ½ of the melting point in kelvin. About 450 °C for one brass.",
        say: "The recrystallization temperature is where it finishes in one hour. It's usually one third to one half of the melting point in kelvin. For one brass alloy, about four hundred fifty degrees.",
      },
      { text: "More cold work means faster recrystallization at a lower temperature. Below a critical 2 to 20% cold work, it won't happen at all." },
      { text: "Stage three, grain growth. Keep heating, and big grains swallow small ones, because less boundary means less energy." },
      { text: "Shaping a metal above its recrystallization temperature is called hot working. It never strain hardens, so huge deformations are possible." },
      { text: "Grain size follows $d^n - d_0^n = Kt$, with n of 2 or more. Bigger grains mean a weaker metal.", say: "The grain size follows d to the n, minus d zero to the n, equals K t, with n of two or more. Bigger grains mean a weaker metal." },
    ],
  },
  {
    id: "quiz",
    chapter: "Your turn",
    lines: [
      { text: "Your turn. A rod is drawn from 10 mm to 8 mm diameter. What is the percent cold work? Pause and try." },
      { text: "Area goes with diameter squared: (100 − 64) ÷ 100 = {{quiz}}% cold work.", say: "Area goes with diameter squared. One hundred minus sixty-four, over one hundred. That's {{quiz}} percent cold work." },
    ],
  },
  {
    id: "recap",
    chapter: "Remember",
    lines: [
      { text: "Quick recap." },
      { text: "Defects by dimension: point, line, surface, volume. Vacancies rise fast with temperature." },
      { text: "Dislocations move by slip. Edge: b perpendicular to the line. Screw: b parallel." },
      { text: "Make metals stronger with smaller grains, that's Hall–Petch, and with cold work, more dislocations." },
      { text: "Heat undoes it: recovery, then recrystallization, then grain growth." },
      { text: "Exam tip: always draw the grains at each stage. A neat sketch earns easy marks. That's Unit II. All the best!" },
    ],
  },
];

const sciText = (x: number) => {
  const { mantissa, exp } = fmtSci(x);
  const sup = String(exp)
    .split("")
    .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)])
    .join("");
  return `${mantissa} × 10${sup}`;
};
const sciSay = (x: number) => {
  const { mantissa, exp } = fmtSci(x);
  return `${mantissa} times ten to the ${exp}`;
};

export function scriptValues(): Record<string, string> {
  const oneIn = Math.round(CU_VAC.oneIn / 100) * 100;
  return {
    N: sciText(CU_VAC.N),
    Nv: sciText(CU_VAC.Nv),
    NSay: sciSay(CU_VAC.N),
    NvSay: sciSay(CU_VAC.Nv),
    oneIn: oneIn.toLocaleString("en-US"),
    oneInSay: `${Math.floor(oneIn / 1000)} thousand ${oneIn % 1000}`,
    coarse: String(HP_EX.coarse),
    fine: String(HP_EX.fine),
    coarseMPa: String(Math.round(HP_EX.coarseMPa)),
    fineMPa: String(Math.round(HP_EX.fineMPa)),
    cw: CW_EX.pct.toFixed(1),
    quiz: String(Math.round(QUIZ.pct)),
  };
}

export const spokenText = (l: Line, values: Record<string, string>) =>
  speak(fill(l.say ?? l.text, values).replace(/ mm\b/g, " millimetres"));
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;
export { fill };

// ---------- timing ----------

export interface VoiceClip {
  src: string;
  seconds: number;
}
export type Voice = Record<string, VoiceClip>;
export interface PlannedLine {
  key: string;
  at: number;
  seconds: number;
  clip?: VoiceClip;
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const LEAD_S = 0.7;
const GAP_S = 0.45;
const TAIL_S = 1.1;
export const PAUSE_AFTER: Record<string, number> = {
  "line-5": 1.0,
  "line-6": 1.2,
  "anneal-3": 1.2,
  "anneal-8": 1.2,
  "quiz-0": 5,
};

export const estimateSeconds = (say: string) => 0.4 + say.trim().split(/\s+/).length / 2.6;

export function planDefects(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  const values = scriptValues();
  let from = 0;
  const beats = BEATS.map((b) => {
    let t = LEAD_S;
    const lines = b.lines.map((line, i) => {
      const key = lineKey(b.id, i);
      const clip = voice[key];
      const seconds = clip ? clip.seconds : estimateSeconds(spokenText(line, values));
      const planned = { key, at: t, seconds, clip };
      t += seconds + GAP_S + (PAUSE_AFTER[key] ?? 0);
      return planned;
    });
    const seconds = t - GAP_S + TAIL_S;
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
