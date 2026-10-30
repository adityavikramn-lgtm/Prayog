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
      { text: "A sharp knife cuts an apple easily." },
      { text: "A blunt knife only squashes it." },
      { text: "You push with the same force. So what is different?" },
    ],
  },
  {
    id: "brick",
    chapter: "The brick test",
    lines: [
      { text: "Let's test this with a brick. It weighs {{weight}} N.", say: "Let's test this with a brick. It weighs {{weight}} newtons." },
      {
        text: "Lay it flat. Its weight spreads over {{flatCm2}} cm².",
        say: "Lay it flat. Its weight spreads over {{flatCm2}} square centimetres.",
      },
      {
        text: "Now stand it up. Same weight, but now it touches only {{endCm2}} cm².",
        say: "Now stand it up. Same weight, but now it touches only {{endCm2}} square centimetres.",
      },
      { text: "So each small bit of ground gets {{ratio}} times more push.", say: "So each small bit of ground gets {{ratioWord}} times more push." },
    ],
  },
  {
    id: "formula",
    chapter: "The rule",
    lines: [
      { text: "The push on each small bit of area is called pressure." },
      { text: "Force is how hard you push. Area is how much surface it touches." },
      { text: "$P = \\dfrac{F}{A}$: pressure is force divided by area.", say: "Pressure is force divided by area." },
      {
        text: "We measure pressure in pascals (Pa). 1 Pa is 1 N on 1 m².",
        say: "We measure pressure in pascals. One pascal is one newton on one square metre.",
      },
    ],
  },
  {
    id: "numbers",
    chapter: "Check with numbers",
    lines: [
      {
        text: "Lying flat: {{weight}} N ÷ {{flatM2}} m² = {{flatPa}} Pa.",
        say: "Lying flat: {{weight}} newtons divided by {{flatM2Say}} square metres is {{flatPaSay}} pascals.",
      },
      {
        text: "Standing up: {{weight}} N ÷ {{endM2}} m² = {{endPa}} Pa. That's {{ratio}} times more.",
        say: "Standing up: {{weight}} newtons divided by {{endM2Say}} square metres is {{endPaSay}} pascals. That's {{ratioWord}} times more.",
      },
    ],
  },
  {
    id: "knife",
    chapter: "Back to the knife",
    lines: [
      { text: "Now back to the knife. You push with {{push}} N.", say: "Now back to the knife. You push with {{push}} newtons." },
      {
        text: "A sharp edge is very thin: only {{sharpMm}} mm. So the pressure is huge: {{sharpPa}} Pa.",
        say: "A sharp edge is very thin, only {{sharpMmSay}} of a millimetre. So the pressure is huge: {{sharpPaSay}} pascals.",
      },
      {
        text: "A blunt edge is {{knifeRatio}} times wider. So the pressure is {{knifeRatio}} times less. That's not enough to cut.",
        say: "A blunt edge is {{knifeRatioWord}} times wider. So the pressure is {{knifeRatioWord}} times less. That's not enough to cut.",
      },
    ],
  },
  {
    id: "bag",
    chapter: "The opposite trick",
    lines: [
      { text: "Sometimes we want less pressure. Think of your school bag." },
      {
        text: "A {{bagN}} N bag with thin straps presses on your shoulders with {{thinPa}} Pa.",
        say: "A {{bagN}} newton bag with thin straps presses on your shoulders with {{thinPaSay}} pascals.",
      },
      {
        text: "Wide straps spread the weight: only {{widePa}} Pa. That's why they hurt less.",
        say: "Wide straps spread the weight. Only {{widePaSay}} pascals. That's why they hurt less.",
      },
    ],
  },
  {
    id: "try",
    chapter: "Your turn",
    lines: [
      {
        text: "Your turn: {{practiceN}} N on {{practiceM2}} m². Pause the video and try it.",
        say: "Your turn. {{practiceN}} newtons on {{practiceM2Say}} square metres. Pause the video and try it.",
      },
      { text: "Answer: {{practicePa}} Pa.", say: "The answer is {{practicePaSay}} pascals." },
    ],
  },
  {
    id: "recap",
    chapter: "Remember",
    lines: [
      { text: "Small area means big pressure. Big area means small pressure." },
      { text: "$P = \\dfrac{F}{A}$, measured in pascals.", say: "Pressure is force divided by area. We measure it in pascals." },
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
