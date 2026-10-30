// Class 6–8 material packs (notes + worksheet + answer key), printed by scripts/middle-notes.mts.
// Every numerical answer is computed here and checked a second way in tests/middle-notes.test.ts.

// ---------- Class 6 · Measurement of length ----------

export const UNIT = { mmPerCm: 10, cmPerM: 100, mPerKm: 1000 };

export type Conv = { q: string; value: number; from: "mm" | "cm" | "m" | "km"; to: "mm" | "cm" | "m" | "km" };
const inMm: Record<Conv["from"], number> = { mm: 1, cm: 10, m: 1000, km: 1_000_000 };
/** Convert by going through millimetres (the worksheet's working shows the direct factor). */
export const convert = (value: number, from: Conv["from"], to: Conv["to"]) => Math.round(((value * inMm[from]) / inMm[to]) * 1e9) / 1e9;

export const CONVERSIONS: (Conv & { answer: number })[] = (
  [
  { q: "2.5 m = ___ cm", value: 2.5, from: "m", to: "cm" },
  { q: "340 cm = ___ m", value: 340, from: "cm", to: "m" },
  { q: "4.2 cm = ___ mm", value: 4.2, from: "cm", to: "mm" },
  { q: "3 km = ___ m", value: 3, from: "km", to: "m" },
  { q: "1500 m = ___ km", value: 1500, from: "m", to: "km" },
  { q: "75 mm = ___ cm", value: 75, from: "mm", to: "cm" },
  ] as Conv[]
).map((c) => ({ ...c, answer: convert(c.value, c.from, c.to) }));

/** Broken-ruler readings: start and end marks (cm); length = end − start. */
export const BROKEN = [
  { what: "a pencil", start: 2.0, end: 9.5 },
  { what: "a leaf", start: 1.5, end: 10.0 },
].map((b) => ({ ...b, length: Math.round((b.end - b.start) * 1e9) / 1e9 }));

/** Handspans across one board. */
export const BOARD_M = 3.2;
export const HANDSPANS = [
  { name: "Meena", cm: 16 },
  { name: "Ravi", cm: 20 },
].map((h) => ({ ...h, spans: (BOARD_M * 100) / h.cm }));

/** Laps of a 400 m track. */
export const LAPS = { lapM: 400, laps: 5, totalM: 400 * 5, totalKm: (400 * 5) / 1000 };

// ---------- Class 8 · Friction ----------

export interface FrictionBox {
  startN: number; // largest friction while still: you need more than this to start it
  slideN: number; // friction while sliding
}
/** What happens when you push with `push` newtons on a box at rest. */
export function pushResult(b: FrictionBox, push: number) {
  if (push <= b.startN) return { moves: false, friction: push, net: 0 };
  return { moves: true, friction: b.slideN, net: push - b.slideN };
}

export const FRICTION_Q = {
  box: { startN: 80, slideN: 50 } as FrictionBox,
  pushes: [70, 90] as const,
};
export const FRICTION_ANSWERS = {
  push70: pushResult(FRICTION_Q.box, 70),
  push90: pushResult(FRICTION_Q.box, 90),
  steady: FRICTION_Q.box.slideN,
};

/** The worked example from the Short: 20 kg box, 100 N to start, 60 N to keep moving. */
export const SHORT_EXAMPLE = { kg: 20, weightN: 200, startN: 100, slideN: 60, kickNet: 40, kickAccel: 40 / 20 };
