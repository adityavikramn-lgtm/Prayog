import { describe, expect, it } from "vitest";
import {
  CU_AG,
  CU_NI,
  CU_NI_ATOMS,
  CU_NI_COOL,
  CU_NI_EX,
  EUTECTIC_SPLIT,
  Eutectic,
  FE_C,
  FE_C_LINES,
  HYPER,
  HYPO,
  L_VAP,
  MELT_SLOPE_ATM_PER_K,
  PB_SN,
  PB_SN_EX,
  PB_SN_MICRO,
  PEARLITE,
  QUIZ,
  SUGAR,
  WATER,
  freedom,
  isSteel,
  lever,
  sizeDiffPct,
  smooth,
  steel,
  sublimeAtm,
  sugarLimit,
  tAtX,
  vapourAtm,
  xAtT,
} from "../src/templates/phase/model";
import { grains, shrink } from "../src/templates/phase/parts";
import { BEATS, PAUSE_AFTER, fill, planPhase, scriptValues, spokenText } from "../src/templates/phase/script";

/** Second route for the lever rule: solve the two balance equations (total mass and solute mass) directly. */
function massBalance(c0: number, cA: number, cB: number) {
  // wA + wB = 1 and wA·cA + wB·cB = c0, solved by Cramer's rule.
  const det = 1 * cB - 1 * cA;
  return { wA: (1 * cB - c0 * 1) / det, wB: (1 * c0 - cA * 1) / det };
}

const area = (poly: [number, number][]) => Math.abs(poly.reduce((s, [x, y], i) => s + x * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * y, 0)) / 2;

describe("lever rule", () => {
  it("matches the mass balance for 200 random tie lines", () => {
    for (let k = 0; k < 200; k++) {
      const cA = Math.sin(k * 12.9898) * 20 + 30;
      const cB = cA + 1 + Math.abs(Math.sin(k * 78.233)) * 50;
      const c0 = cA + (cB - cA) * (0.05 + 0.9 * Math.abs(Math.sin(k * 3.1)));
      const a = lever(c0, cA, cB);
      const b = massBalance(c0, cA, cB);
      expect(a.wA).toBeCloseTo(b.wA, 12);
      expect(a.wB).toBeCloseTo(b.wB, 12);
      expect(a.wA * cA + a.wB * cB).toBeCloseTo(c0, 10);
    }
  });
  it("refuses an alloy outside its tie line", () => {
    expect(() => lever(50, 10, 40)).toThrow();
  });
});

describe("Cu–Ni (book example 10.1 and the cooling path)", () => {
  it("tie line at 1250 °C reads 31.5 and 42.5 wt% Ni; fractions 0.68 and 0.32", () => {
    expect(CU_NI_EX.cL).toBeCloseTo(31.5, 9);
    expect(CU_NI_EX.cAlpha).toBeCloseTo(42.5, 9);
    expect(CU_NI_EX.wL.toFixed(2)).toBe("0.68");
    expect(CU_NI_EX.wAlpha.toFixed(2)).toBe("0.32");
    expect(CU_NI_EX.wL + CU_NI_EX.wAlpha).toBeCloseTo(1, 12);
  });
  it("35 wt% Ni: liquidus 1260 °C (first solid 46 Ni), solidus 1220 °C (last liquid 24 Ni)", () => {
    expect(tAtX(CU_NI.liquidus, CU_NI_COOL.c0)).toBeCloseTo(CU_NI_COOL.liqT, 6);
    expect(tAtX(CU_NI.solidus, CU_NI_COOL.c0)).toBeCloseTo(CU_NI_COOL.solT, 6);
    expect(xAtT(CU_NI.solidus, CU_NI_COOL.liqT)).toBeCloseTo(CU_NI_COOL.firstSolid, 6);
    expect(xAtT(CU_NI.liquidus, CU_NI_COOL.solT)).toBeCloseTo(CU_NI_COOL.lastLiquid, 6);
  });
  it("liquidus is above the solidus everywhere between the pure metals, and they meet at both melting points", () => {
    for (let x = 1; x < 100; x += 0.5) expect(tAtX(CU_NI.liquidus, x)!).toBeGreaterThan(tAtX(CU_NI.solidus, x)!);
    expect(tAtX(CU_NI.liquidus, 0)).toBe(1085);
    expect(tAtX(CU_NI.solidus, 100)).toBe(1455);
  });
  it("Cu and Ni pass the Hume-Rothery size rule (under 15 %)", () => {
    expect(sizeDiffPct(CU_NI_ATOMS.cuNm, CU_NI_ATOMS.niNm)).toBeLessThan(15);
  });
});

describe("binary eutectic diagrams join up", () => {
  const check = (e: Eutectic) => {
    const end = (l: readonly (readonly [number, number])[]) => l[l.length - 1];
    expect(end(e.liqL)).toEqual([e.eC, e.eT]);
    expect(e.liqR[0]).toEqual([e.eC, e.eT]);
    expect(end(e.solA)).toEqual([e.alphaMax, e.eT]);
    expect(e.solvA[0]).toEqual([e.alphaMax, e.eT]);
    expect(end(e.solB)).toEqual([e.betaMin, e.eT]);
    expect(e.solvB[0]).toEqual([e.betaMin, e.eT]);
    expect(e.eT).toBeLessThan(Math.min(e.meltA, e.meltB));
    // solubility in each solid falls as it cools (solvus moves towards the pure metal)
    const a = smooth(e.solvA);
    for (let i = 1; i < a.length; i++) expect(a[i][0]).toBeLessThanOrEqual(a[i - 1][0] + 1e-9);
  };
  it("Cu–Ag: eutectic 779 °C at 71.9 wt% Ag, α ≤ 8.0, β ≥ 91.2", () => {
    check(CU_AG);
    expect([CU_AG.eT, CU_AG.eC, CU_AG.alphaMax, CU_AG.betaMin]).toEqual([779, 71.9, 8.0, 91.2]);
  });
  it("Pb–Sn: eutectic 183 °C at 61.9 wt% Sn, α ≤ 18.3, β ≥ 97.8", () => {
    check(PB_SN);
    expect([PB_SN.eT, PB_SN.eC, PB_SN.alphaMax, PB_SN.betaMin]).toEqual([183, 61.9, 18.3, 97.8]);
  });
});

describe("Pb–Sn worked numbers", () => {
  it("book example 10.2: 40 wt% Sn at 150 °C → α 11, β 98, fractions 0.67 / 0.33", () => {
    expect(PB_SN_EX.cA).toBeCloseTo(11, 9);
    expect(PB_SN_EX.cB).toBeCloseTo(98, 9);
    expect(PB_SN_EX.wA.toFixed(2)).toBe("0.67");
    expect(PB_SN_EX.wB.toFixed(2)).toBe("0.33");
    const mb = massBalance(40, 11, 98);
    expect(PB_SN_EX.wA).toBeCloseTo(mb.wA, 12);
  });
  it("40 wt% Sn just below 183 °C: primary α 0.50, eutectic 0.50; total α and β by tin balance", () => {
    expect(PB_SN_MICRO.primary.toFixed(2)).toBe("0.50");
    expect(PB_SN_MICRO.eutectic.toFixed(2)).toBe("0.50");
    // tin balance: primary α (18.3) + eutectic (61.9) must hold 40 wt% Sn overall
    expect(PB_SN_MICRO.primary * 18.3 + PB_SN_MICRO.eutectic * 61.9).toBeCloseTo(40, 9);
    // total α = primary α + α inside the eutectic
    expect(PB_SN_MICRO.alphaTotal).toBeCloseTo(PB_SN_MICRO.primary + PB_SN_MICRO.eutectic * EUTECTIC_SPLIT.wA, 12);
  });
});

describe("iron–iron carbide", () => {
  const F = FE_C;
  const L = FE_C_LINES;
  const ends = (l: readonly (readonly [number, number])[]) => [l[0], l[l.length - 1]];
  it("lines meet at the book's invariant points", () => {
    expect(ends(L.a3)[1]).toEqual([0.76, 727]);
    expect(ends(L.acm)).toEqual([
      [0.76, 727],
      [2.14, 1147],
    ]);
    expect(ends(L.liquidus)[1]).toEqual([4.3, 1147]);
    expect(ends(L.gammaSolidus)[1]).toEqual([2.14, 1147]);
    expect(ends(L.alphaGamma)).toEqual([
      [0, 912],
      [0.022, 727],
    ]);
    expect(L.gammaDelta[0]).toEqual([0, 1394]);
    expect(L.liquidus[0]).toEqual([0, 1538]);
  });
  it("pearlite is 0.89 ferrite and 0.11 cementite (lever and carbon balance)", () => {
    expect(PEARLITE.wA.toFixed(2)).toBe("0.89");
    expect(PEARLITE.wB.toFixed(2)).toBe("0.11");
    expect(PEARLITE.wA * F.alphaMax + PEARLITE.wB * F.cementite).toBeCloseTo(F.eutectoidC, 12);
  });
  it("0.40 wt% C: pearlite 0.51, proeutectoid ferrite 0.49; total ferrite 0.94", () => {
    expect(HYPO.pearlite.toFixed(2)).toBe("0.51");
    expect(HYPO.proeutectoid.toFixed(2)).toBe("0.49");
    // carbon balance: pro-ferrite (0.022) + pearlite (0.76) holds 0.40
    expect(HYPO.proeutectoid * F.alphaMax + HYPO.pearlite * F.eutectoidC).toBeCloseTo(0.4, 12);
    // total ferrite = pro-ferrite + ferrite inside pearlite
    expect(HYPO.ferrite).toBeCloseTo(HYPO.proeutectoid + HYPO.pearlite * PEARLITE.wA, 12);
  });
  it("1.20 wt% C: pearlite 0.93, proeutectoid cementite 0.07", () => {
    expect(HYPER.pearlite.toFixed(2)).toBe("0.93");
    expect(HYPER.proeutectoid.toFixed(2)).toBe("0.07");
    expect(HYPER.proeutectoid * F.cementite + HYPER.pearlite * F.eutectoidC).toBeCloseTo(1.2, 12);
    expect(HYPER.cementite).toBeCloseTo(HYPER.proeutectoid + HYPER.pearlite * PEARLITE.wB, 12);
  });
  it("quiz: 0.60 wt% C gives 0.78 pearlite", () => {
    expect(QUIZ.pearlite.toFixed(2)).toBe("0.78");
    expect(steel(0.6).pearlite).toBeCloseTo(massBalance(0.6, F.alphaMax, F.eutectoidC).wB, 12);
  });
  it("steel below 2.14 wt% C, cast iron above", () => {
    expect(isSteel(2.0)).toBe(true);
    expect(isSteel(3.0)).toBe(false);
  });
});

describe("Gibbs phase rule", () => {
  it("F = C + N − P for every case on screen", () => {
    expect(freedom(2, 1)).toBe(2); // liquid Cu–Ni
    expect(freedom(2, 2)).toBe(1); // α + L
    expect(freedom(2, 3)).toBe(0); // eutectic point
    expect(freedom(1, 3, 2)).toBe(0); // water triple point
  });
});

describe("water (unary diagram) and sugar", () => {
  it("vapour curve passes the triple point and 1 atm at 100 °C; latent heat is physical (~43 kJ/mol)", () => {
    expect(vapourAtm(WATER.tripleK)).toBeCloseTo(WATER.tripleAtm, 12);
    expect(vapourAtm(WATER.boilK)).toBeCloseTo(1, 9);
    expect(L_VAP / 1000).toBeGreaterThan(40);
    expect(L_VAP / 1000).toBeLessThan(46);
  });
  it("ice line leans left (about −134 atm per K) and sublimation meets the triple point", () => {
    expect(MELT_SLOPE_ATM_PER_K).toBeLessThan(-120);
    expect(MELT_SLOPE_ATM_PER_K).toBeGreaterThan(-150);
    expect(sublimeAtm(WATER.tripleK)).toBeCloseTo(WATER.tripleAtm, 12);
  });
  it("sugar: 65 wt% at 20 °C and 80 wt% at 100 °C", () => {
    expect(sugarLimit(20)).toBe(SUGAR.at20);
    expect(sugarLimit(100)).toBe(SUGAR.at100);
  });
});

describe("microstructure drawings show the right amounts", () => {
  it("a grain shrunk by √w keeps exactly the fraction w of its area", () => {
    const cells = grains(9, 240, 21);
    expect(cells.length).toBeGreaterThan(5);
    for (const w of [0.32, 0.51, 0.93]) for (const c of cells) expect(area(shrink(c, Math.sqrt(w))) / area(c.poly)).toBeCloseTo(w, 9);
  });
});

describe("script", () => {
  const values = scriptValues();
  it("every placeholder is filled and every line can be spoken", () => {
    for (const b of BEATS)
      for (const l of b.lines) {
        expect(() => fill(l.text, values)).not.toThrow();
        const said = spokenText(l, values);
        expect(said, said).not.toMatch(/[0-9$°%α-ωΑ-Ω→−÷=_\\{}]/);
      }
  });
  it("numbers on screen come from the model", () => {
    expect(values.wL).toBe(CU_NI_EX.wL.toFixed(2));
    expect(values.hypoP).toBe(HYPO.pearlite.toFixed(2));
    expect(values.hyperC).toBe(HYPER.proeutectoid.toFixed(2));
    expect(values.quizP).toBe(QUIZ.pearlite.toFixed(2));
    expect(values.pbWa).toBe(PB_SN_EX.wA.toFixed(2));
  });
  it("covers every Unit III syllabus topic", () => {
    const all = BEATS.flatMap((b) => [b.chapter, ...b.lines.map((l) => l.text)])
      .join(" ")
      .toLowerCase();
    for (const topic of ["solubility limit", "solid solution", "substitutional", "interstitial", "phase", "unary", "lever rule", "gibbs", "eutectic", "eutectoid", "peritectic", "iron", "isomorphous", "copper–nickel", "silver", "lead–tin"])
      expect(all, topic).toContain(topic);
  });
  it("runs 15–30 minutes without a voice, with pauses only on known lines", () => {
    const m = planPhase().seconds / 60;
    expect(m).toBeGreaterThan(15);
    expect(m).toBeLessThan(30);
    const keys = new Set(BEATS.flatMap((b) => b.lines.map((_, i) => `${b.id}-${i}`)));
    for (const k of Object.keys(PAUSE_AFTER)) expect(keys.has(k), k).toBe(true);
  });
});
