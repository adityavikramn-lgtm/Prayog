// Pressure = force ÷ area (Class 8). Every number on screen comes from here.
// Two independent routes for each answer: area in m² (SI), and area in cm² then × 10 000.

export const G = 10; // m/s², JEE/school convention

/** P = F / A with A in m². */
export const pressure = (forceN: number, areaM2: number) => forceN / areaM2;

/** Same answer by another route: area in cm², then 1 m² = 10 000 cm². */
export const pressureFromCm2 = (forceN: number, areaCm2: number) => (forceN / areaCm2) * 10_000;

const cm = (x: number) => x / 100;
const mm = (x: number) => x / 1000;

/** A 2 kg brick, 20 cm × 10 cm × 5 cm. */
export const BRICK = {
  massKg: 2,
  weightN: 2 * G,
  lengthCm: 20,
  widthCm: 10,
  heightCm: 5,
};

/** The brick on two of its faces: lying flat (20 × 10) and standing on its end (10 × 5). */
export const BRICK_FACES = [
  { id: "flat", label: "Lying flat", aCm: 20, bCm: 10 },
  { id: "end", label: "Standing up", aCm: 10, bCm: 5 },
].map((f) => {
  const areaCm2 = f.aCm * f.bCm;
  const areaM2 = cm(f.aCm) * cm(f.bCm);
  return { ...f, areaCm2, areaM2, pressurePa: pressure(BRICK.weightN, areaM2) };
});

/** Pushing a knife with 20 N. The edge is 10 cm long; sharp = 0.1 mm wide, blunt = 1 mm wide. */
export const KNIFE = {
  pushN: 20,
  lengthCm: 10,
  edges: [
    { id: "sharp", label: "Sharp edge", widthMm: 0.1 },
    { id: "blunt", label: "Blunt edge", widthMm: 1 },
  ].map((e) => {
    const areaM2 = cm(10) * mm(e.widthMm);
    return { ...e, areaM2, pressurePa: pressure(20, areaM2) };
  }),
};

/** A 5 kg school bag on two straps, each touching the shoulder over 10 cm; thin = 2 cm, wide = 5 cm. */
export const BAG = {
  massKg: 5,
  weightN: 5 * G,
  contactCm: 10,
  straps: [
    { id: "thin", label: "Thin straps", widthCm: 2 },
    { id: "wide", label: "Wide straps", widthCm: 5 },
  ].map((s) => {
    const areaM2 = 2 * cm(10) * cm(s.widthCm);
    return { ...s, areaM2, pressurePa: pressure(5 * G, areaM2) };
  }),
};

/** The practice question. */
export const PRACTICE = { forceN: 40, areaM2: 0.02, answerPa: pressure(40, 0.02) };

/** Whole-number pascals with thousands separators ("2,000,000"). */
export const pa = (x: number) => Math.round(x).toLocaleString("en-US");
/** Spoken form for the voice ("2 million", "12,500"). */
export const paSpoken = (x: number) => (x >= 1e6 && x % 1e6 === 0 ? `${x / 1e6} million` : Math.round(x).toLocaleString("en-US"));
