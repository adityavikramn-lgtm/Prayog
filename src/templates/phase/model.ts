// ASE102 Unit III: alloys and phase diagrams. Every number the lesson shows comes from here
// and is checked a second way in tests/phase.test.ts.
//
// Key points (melting points, eutectic/eutectoid points, solubility limits, worked-example
// compositions) are the textbook's values (Callister, Ch. 10). The curves between those points
// are a smooth approximation of the published diagrams, good for reading shapes, not for 3 s.f.
// Where the book's text gives no number (the δ corner of Fe–C), standard handbook values are used.

export type Pt = readonly [x: number, T: number];
export type Line = readonly Pt[];

// ---------- curves ----------

/** Uniform Catmull-Rom through the knots, sampled `n` times per segment. Passes through every knot. */
export function smooth(line: Line, n = 16): Pt[] {
  if (line.length < 3) return [...line];
  const out: Pt[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const p0 = line[Math.max(0, i - 1)];
    const p1 = line[i];
    const p2 = line[i + 1];
    const p3 = line[Math.min(line.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(line[line.length - 1]);
  return out;
}

/** Composition where a line crosses temperature T (first crossing along the line), or null. */
export function xAtT(line: Line, T: number): number | null {
  const pts = smooth(line);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, t1] = pts[i];
    const [x2, t2] = pts[i + 1];
    if (t1 === T) return x1;
    if ((t1 - T) * (t2 - T) < 0) return x1 + ((T - t1) / (t2 - t1)) * (x2 - x1);
  }
  const last = pts[pts.length - 1];
  return last[1] === T ? last[0] : null;
}

/** Temperature of a line at composition x (first crossing), or null. */
export function tAtX(line: Line, x: number): number | null {
  const pts = smooth(line);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, t1] = pts[i];
    const [x2, t2] = pts[i + 1];
    if (x1 === x) return t1;
    if ((x1 - x) * (x2 - x) < 0) return t1 + ((x - x1) / (x2 - x1)) * (t2 - t1);
  }
  const last = pts[pts.length - 1];
  return last[0] === x ? last[1] : null;
}

// ---------- the rules ----------

/** Lever rule: fractions of the two phases at the ends of a tie line (left end cA, right end cB). */
export function lever(c0: number, cA: number, cB: number): { wA: number; wB: number } {
  if (!(cA < c0 && c0 < cB)) throw new Error(`Alloy ${c0} is not between ${cA} and ${cB}`);
  return { wA: (cB - c0) / (cB - cA), wB: (c0 - cA) / (cB - cA) };
}

/** Gibbs phase rule P + F = C + N. N = 2 (T and P free) or 1 (pressure fixed at 1 atm). */
export const freedom = (components: number, phases: number, n: 1 | 2 = 1) => components + n - phases;

// ---------- 1. solubility limit (sugar in water) ----------

/** Book: 65 wt% sugar at 20 °C, 80 wt% at 100 °C; straight line between (the book's curve is nearly straight). */
export const SUGAR = { points: [[65, 20], [80, 100]] as Line, at20: 65, at100: 80 };
export const sugarLimit = (T: number) => 65 + ((T - 20) * (80 - 65)) / (100 - 20);

// ---------- 2. solid solutions (Hume-Rothery) ----------

export const CU_NI_ATOMS = { cuNm: 0.128, niNm: 0.125, cuEN: 1.9, niEN: 1.8, structure: "FCC" };
/** Size difference in % of the larger atom (book rule: under about 15 % for a lot of solubility). */
export const sizeDiffPct = (a: number, b: number) => (Math.abs(a - b) / Math.max(a, b)) * 100;

// ---------- 3. unary diagram of water (log pressure vs temperature) ----------

const R = 8.314;
export const WATER = { tripleK: 273.16, tripleAtm: 6.04e-3, boilK: 373.15, meltC: 0, boilC: 100 };
/** Liquid–vapour: Clausius–Clapeyron through the triple point and 100 °C at 1 atm (fitted latent heat). */
export const L_VAP = (R * Math.log(1 / WATER.tripleAtm)) / (1 / WATER.tripleK - 1 / WATER.boilK);
/** Solid–vapour: Clausius–Clapeyron through the triple point with ice's latent heat of sublimation (51 kJ/mol). */
export const L_SUB = 51_000;
export const vapourAtm = (K: number) => WATER.tripleAtm * Math.exp((-L_VAP / R) * (1 / K - 1 / WATER.tripleK));
export const sublimeAtm = (K: number) => WATER.tripleAtm * Math.exp((-L_SUB / R) * (1 / K - 1 / WATER.tripleK));
/** Solid–liquid: Clapeyron dP/dT = L/(T ΔV) with ice melting (6.01 kJ/mol, volume −1.63 cm³/mol): about −134 atm per K. */
export const MELT_SLOPE_ATM_PER_K = 6010 / (273.15 * -1.63e-6) / 101_325;
export const meltC = (atm: number) => (atm - 1) / MELT_SLOPE_ATM_PER_K; // °C on the ice–water line

// ---------- 4. Cu–Ni: binary isomorphous ----------

export const CU_NI = {
  cuMelt: 1085,
  niMelt: 1455,
  // Knots include the book's readings: tie line at 1250 °C (31.5 / 42.5), first solid 46 Ni at 1260 °C,
  // last liquid 24 Ni at 1220 °C for the 35 wt% Ni alloy.
  liquidus: [[0, 1085], [10, 1150], [17, 1190], [24, 1220], [31.5, 1250], [35, 1260], [45, 1291], [55, 1322], [65, 1352], [75, 1381], [87, 1415], [100, 1455]] as Line,
  solidus: [[0, 1085], [10, 1112], [20, 1155], [28, 1190], [35, 1220], [42.5, 1250], [46, 1260], [55, 1290], [65, 1325], [75, 1360], [87, 1405], [100, 1455]] as Line,
};

export const CU_NI_EX = (() => {
  const c0 = 35;
  const T = 1250;
  const cL = xAtT(CU_NI.liquidus, T)!;
  const cAlpha = xAtT(CU_NI.solidus, T)!;
  const { wA: wL, wB: wAlpha } = lever(c0, cL, cAlpha);
  return { c0, T, cL, cAlpha, wL, wAlpha };
})();

/** The 35 wt% Ni alloy cooling: liquidus 1260 °C (first solid 46 Ni), solidus 1220 °C (last liquid 24 Ni). */
export const CU_NI_COOL = { c0: 35, start: 1300, liqT: 1260, firstSolid: 46, solT: 1220, lastLiquid: 24, end: 1180 };

// ---------- 5. binary eutectic: Cu–Ag and Pb–Sn ----------

export interface Eutectic {
  name: string;
  left: string; // element at x = 0
  right: string; // element at x = 100 (x is wt% of this one)
  meltA: number;
  meltB: number;
  eT: number;
  eC: number;
  alphaMax: number;
  betaMin: number;
  tMin: number;
  tMax: number;
  liqL: Line;
  liqR: Line;
  solA: Line;
  solvA: Line;
  solB: Line;
  solvB: Line;
}

export const CU_AG: Eutectic = {
  name: "Copper–silver",
  left: "Cu",
  right: "Ag",
  meltA: 1085,
  meltB: 962,
  eT: 779,
  eC: 71.9,
  alphaMax: 8.0,
  betaMin: 91.2,
  tMin: 200,
  tMax: 1200,
  liqL: [[0, 1085], [25, 1020], [50, 935], [71.9, 779]],
  liqR: [[71.9, 779], [82, 852], [92, 920], [100, 962]],
  solA: [[0, 1085], [3, 1000], [6, 880], [8.0, 779]],
  solvA: [[8.0, 779], [5, 650], [3, 500], [1.5, 300], [1, 200]],
  solB: [[100, 962], [96, 900], [91.2, 779]],
  solvB: [[91.2, 779], [94, 600], [96, 400], [97, 200]],
};

export const PB_SN: Eutectic = {
  name: "Lead–tin",
  left: "Pb",
  right: "Sn",
  meltA: 327,
  meltB: 232,
  eT: 183,
  eC: 61.9,
  alphaMax: 18.3,
  betaMin: 97.8,
  tMin: 0,
  tMax: 350,
  liqL: [[0, 327], [20, 280], [40, 238], [61.9, 183]],
  liqR: [[61.9, 183], [75, 198], [90, 220], [100, 232]],
  solA: [[0, 327], [8, 280], [14, 230], [18.3, 183]],
  // Book: at 150 °C the α phase holds about 11 wt% Sn; near room temperature about 2 wt%.
  solvA: [[18.3, 183], [14.5, 165], [11, 150], [7, 110], [4, 60], [2, 0]],
  solB: [[100, 232], [99, 208], [97.8, 183]],
  // Book: β holds about 98 wt% Sn at 150 °C and about 99 wt% near room temperature.
  solvB: [[97.8, 183], [98, 150], [98.6, 80], [99, 0]],
};

/** Book Example 10.2: 40 wt% Sn at 150 °C → α (11 Sn) and β (98 Sn); fractions 0.67 and 0.33. */
export const PB_SN_EX = (() => {
  const c0 = 40;
  const T = 150;
  const cA = xAtT(PB_SN.solvA, T)!;
  const cB = xAtT(PB_SN.solvB, T)!;
  const { wA, wB } = lever(c0, cA, cB);
  return { c0, T, cA, cB, wA, wB };
})();

/** 40 wt% Sn just below 183 °C: primary α vs eutectic (lever between 18.3 and 61.9). */
export const PB_SN_MICRO = (() => {
  const c0 = 40;
  const { wA: primary, wB: eutectic } = lever(c0, PB_SN.alphaMax, PB_SN.eC);
  const { wA: alphaTotal, wB: betaTotal } = lever(c0, PB_SN.alphaMax, PB_SN.betaMin);
  return { c0, primary, eutectic, alphaTotal, betaTotal };
})();

/** Fractions inside the eutectic itself (61.9 wt% Sn → α 18.3 + β 97.8). */
export const EUTECTIC_SPLIT = lever(PB_SN.eC, PB_SN.alphaMax, PB_SN.betaMin);

// ---------- 6. invariant reactions (Cu–Zn examples from the book) ----------

export const CU_ZN = { eutectoidT: 560, eutectoidZn: 74, peritecticT: 598, peritecticZn: 78.6 };

// ---------- 7. iron–iron carbide ----------

export const FE_C = {
  // Pure iron
  alphaToGamma: 912,
  gammaToDelta: 1394,
  melt: 1538,
  // Solubility limits and invariant points (book values)
  alphaMax: 0.022,
  gammaMax: 2.14,
  cementite: 6.7,
  eutectoidT: 727,
  eutectoidC: 0.76,
  eutectT: 1147,
  eutectC: 4.3,
  peritecticT: 1493,
  // δ corner: standard handbook values (the book's text gives only 1493 °C)
  deltaMax: 0.09,
  periGamma: 0.17,
  periLiquid: 0.53,
  tMin: 400,
  tMax: 1600,
};
const F = FE_C;
export const FE_C_LINES = {
  liquidus: [[0, F.melt], [F.periLiquid, F.peritecticT], [2.0, 1385], [3.2, 1268], [F.eutectC, F.eutectT]] as Line,
  liquidusFe3C: [[F.eutectC, F.eutectT], [5.5, 1205], [F.cementite, 1252]] as Line,
  deltaSolidus: [[0, F.melt], [F.deltaMax, F.peritecticT]] as Line,
  deltaSolvus: [[0, F.gammaToDelta], [F.deltaMax, F.peritecticT]] as Line,
  gammaDelta: [[0, F.gammaToDelta], [F.periGamma, F.peritecticT]] as Line,
  gammaSolidus: [[F.periGamma, F.peritecticT], [1.0, 1385], [F.gammaMax, F.eutectT]] as Line,
  a3: [[0, F.alphaToGamma], [0.4, 800], [F.eutectoidC, F.eutectoidT]] as Line,
  acm: [[F.eutectoidC, F.eutectoidT], [1.4, 955], [F.gammaMax, F.eutectT]] as Line,
  alphaGamma: [[0, F.alphaToGamma], [F.alphaMax, F.eutectoidT]] as Line,
  alphaSolvus: [[F.alphaMax, F.eutectoidT], [0.012, 600], [0.006, F.tMin]] as Line,
};

/** Steels (below 2.14 wt% C) vs cast irons (2.14 to 6.70). */
export const isSteel = (c: number) => c < F.gammaMax;

/** A steel slowly cooled to just below 727 °C: what is inside, by the lever rule. */
export function steel(c0: number) {
  const total = lever(c0, F.alphaMax, F.cementite); // all ferrite vs all cementite
  if (c0 <= F.eutectoidC) {
    const { wA: proFerrite, wB: pearlite } = lever(c0, F.alphaMax, F.eutectoidC);
    return { c0, kind: "hypo" as const, pearlite, proeutectoid: proFerrite, ferrite: total.wA, cementite: total.wB };
  }
  const { wA: pearlite, wB: proCementite } = lever(c0, F.eutectoidC, F.cementite);
  return { c0, kind: "hyper" as const, pearlite, proeutectoid: proCementite, ferrite: total.wA, cementite: total.wB };
}
/** Pearlite itself (0.76 wt% C): ferrite and cementite layers. */
export const PEARLITE = lever(F.eutectoidC, F.alphaMax, F.cementite);
export const HYPO = steel(0.4);
export const HYPER = steel(1.2);

// ---------- 8. the quiz ----------

/** Quiz: a 0.60 wt% C steel just below 727 °C → how much pearlite? */
export const QUIZ = (() => {
  const c0 = 0.6;
  const s = steel(c0);
  return { c0, pearlite: s.pearlite, proFerrite: s.proeutectoid };
})();

// ---------- formatting ----------

/** Two decimals for fractions shown on screen (0.68), and a whole-number percent. */
export const f2 = (x: number) => x.toFixed(2);
export const pct = (x: number) => `${Math.round(x * 100)}%`;
