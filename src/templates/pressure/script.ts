// Words for the Class 8 pressure lesson (16:9, about 1.5 min). Plain, spoken English.
// text = caption ($…$ is maths), say = what the voice reads when it differs. {{placeholders}} come from model.ts.

import { BAG, BRICK, BRICK_FACES, KNIFE, PRACTICE, pa, paSpoken } from "./model";

export type BeatId = "hook" | "brick" | "formula" | "numbers" | "knife" | "bag" | "try" | "recap";

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
    id: "hook",
    chapter: "A puzzle",
    lines: [
      { text: "Why does a sharp knife cut an apple so easily," },
      { text: "but a blunt knife just squashes it?" },
      { text: "You push just as hard. So what changed?" },
    ],
  },
  {
    id: "brick",
    chapter: "The brick test",
    lines: [
      { text: "Let's try it with a brick. It weighs {{weight}} N.", say: "Let's try it with a brick. It weighs {{weight}} newtons." },
      {
        text: "Lay it flat. Its weight spreads over {{flatCm2}} cm².",
        say: "Lay it flat. Its weight spreads over {{flatCm2}} square centimetres.",
      },
      {
        text: "Now stand it on its end. Same weight, but only {{endCm2}} cm².",
        say: "Now stand it on its end. Same weight, but only {{endCm2}} square centimetres.",
      },
      { text: "Now it presses {{ratio}} times harder on each bit of the ground.", say: "Now it presses {{ratioWord}} times harder on each bit of the ground." },
    ],
  },
  {
    id: "formula",
    chapter: "The rule",
    lines: [
      { text: "That pressing on each bit of area is called pressure." },
      { text: "$P = \\dfrac{F}{A}$: pressure is force divided by area.", say: "Pressure equals force divided by area." },
      {
        text: "Force in newtons, area in m². So pressure is in N/m², which we call a pascal (Pa).",
        say: "Force in newtons, area in square metres. So pressure is in newtons per square metre, which we call a pascal.",
      },
    ],
  },
  {
    id: "numbers",
    chapter: "Check with numbers",
    lines: [
      {
        text: "Flat: {{weight}} N on {{flatM2}} m² gives {{flatPa}} Pa.",
        say: "Flat: {{weight}} newtons on {{flatM2Say}} square metres gives {{flatPaSay}} pascals.",
      },
      {
        text: "On its end: {{weight}} N on {{endM2}} m² gives {{endPa}} Pa. {{ratio}} times more.",
        say: "On its end: {{weight}} newtons on {{endM2Say}} square metres gives {{endPaSay}} pascals. {{ratioWord}} times more.",
      },
    ],
  },
  {
    id: "knife",
    chapter: "Back to the knife",
    lines: [
      { text: "Back to the knife. You push with {{push}} N.", say: "Back to the knife. You push with {{push}} newtons." },
      {
        text: "A sharp edge is only {{sharpMm}} mm wide. That's {{sharpPa}} Pa.",
        say: "A sharp edge is only {{sharpMmSay}} of a millimetre wide. That's {{sharpPaSay}} pascals.",
      },
      {
        text: "A blunt edge is {{knifeRatio}} times wider, so the pressure is {{knifeRatio}} times smaller. Not enough to cut.",
        say: "A blunt edge is {{knifeRatioWord}} times wider, so the pressure is {{knifeRatioWord}} times smaller. Not enough to cut.",
      },
    ],
  },
  {
    id: "bag",
    chapter: "The opposite trick",
    lines: [
      { text: "Sometimes we want less pressure. Think of your school bag." },
      {
        text: "A {{bagN}} N bag on thin straps presses {{thinPa}} Pa into your shoulders.",
        say: "A {{bagN}} newton bag on thin straps presses {{thinPaSay}} pascals into your shoulders.",
      },
      {
        text: "Wide straps spread it out: only {{widePa}} Pa. That's why they hurt less.",
        say: "Wide straps spread it out: only {{widePaSay}} pascals. That's why they hurt less.",
      },
    ],
  },
  {
    id: "try",
    chapter: "Your turn",
    lines: [
      {
        text: "Your turn: {{practiceN}} N on {{practiceM2}} m². Pause and work it out.",
        say: "Your turn: {{practiceN}} newtons on {{practiceM2Say}} square metres. Pause and work it out.",
      },
      { text: "Answer: {{practicePa}} Pa.", say: "The answer is {{practicePaSay}} pascals." },
    ],
  },
  {
    id: "recap",
    chapter: "Remember",
    lines: [
      { text: "Small area, big pressure. Big area, small pressure." },
      { text: "$P = \\dfrac{F}{A}$, measured in pascals.", say: "Pressure equals force divided by area, measured in pascals." },
    ],
  },
];

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const sayDecimal = (x: number) => (x < 1 ? `zero point ${String(x).split(".")[1].split("").map((d) => words[Number(d)]).join(" ")}` : String(x));

export function scriptValues(): Record<string, string> {
  const [flat, end] = BRICK_FACES;
  const [sharp, blunt] = KNIFE.edges;
  const [thin, wide] = BAG.straps;
  const ratio = Math.round(end.pressurePa / flat.pressurePa);
  const knifeRatio = Math.round(sharp.pressurePa / blunt.pressurePa);
  const flatM2 = Number(flat.areaM2.toPrecision(3));
  const endM2 = Number(end.areaM2.toPrecision(3));
  return {
    weight: String(BRICK.weightN),
    flatCm2: String(flat.areaCm2),
    endCm2: String(end.areaCm2),
    flatM2: String(flatM2),
    endM2: String(endM2),
    flatM2Say: sayDecimal(flatM2),
    endM2Say: sayDecimal(endM2),
    flatPa: pa(flat.pressurePa),
    endPa: pa(end.pressurePa),
    flatPaSay: paSpoken(flat.pressurePa),
    endPaSay: paSpoken(end.pressurePa),
    ratio: String(ratio),
    ratioWord: words[ratio] ?? String(ratio),
    push: String(KNIFE.pushN),
    sharpMm: String(sharp.widthMm),
    sharpMmSay: "one tenth",
    sharpPa: pa(sharp.pressurePa),
    sharpPaSay: paSpoken(sharp.pressurePa),
    knifeRatio: String(knifeRatio),
    knifeRatioWord: words[knifeRatio] ?? String(knifeRatio),
    bagN: String(BAG.weightN),
    thinPa: pa(thin.pressurePa),
    widePa: pa(wide.pressurePa),
    thinPaSay: paSpoken(thin.pressurePa),
    widePaSay: paSpoken(wide.pressurePa),
    practiceN: String(PRACTICE.forceN),
    practiceM2: String(PRACTICE.areaM2),
    practiceM2Say: sayDecimal(PRACTICE.areaM2),
    practicePa: pa(PRACTICE.answerPa),
    practicePaSay: paSpoken(PRACTICE.answerPa),
  };
}

export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (!(k in values)) throw new Error(`Missing value for {{${k}}}`);
    return values[k];
  });
}

export const spokenText = (l: Line, values: Record<string, string>) => fill(l.say ?? l.text, values).replace(/\$[^$]*\$:?\s*/g, "");
export const lineKey = (beat: BeatId, index: number) => `${beat}-${index}`;

// ---------- timing: every line starts when the one before it has been spoken ----------

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

const LEAD_S = 0.6;
const GAP_S = 0.45;
const TAIL_S = 1.2;
/** Extra time to look at the question before the answer. */
const PAUSE_AFTER: Record<string, number> = { "try-0": 3 };

export const estimateSeconds = (say: string) => 0.4 + say.trim().split(/\s+/).length / 2.6;

export function planPressure(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
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
