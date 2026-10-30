import { describe, expect, it } from "vitest";
import { COMPARE, EQUIVALENT, NOTES, SHADED, SUMS, WORD, add, equal, frac, show, simplify, value } from "../src/notes/fractions";

// Each answer is checked a second, independent way: with decimals.
const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 12);

describe("fractions worksheet: every answer in the answer key", () => {
  it("A. shaded parts: 3/8, 2/6 = 1/3, 5/10 = 1/2", () => {
    expect(SHADED.map((q) => show(q.simplest))).toEqual(["3/8", "1/3", "1/2"]);
    for (const q of SHADED) near(value(q.simplest), q.shaded / q.parts);
  });
  it("B. equivalent: 2/3 = 8/12, 3/5 = 12/20, 7/4 = 28/16", () => {
    expect(EQUIVALENT.map((q) => q.answer.n)).toEqual([8, 12, 28]);
    for (const q of EQUIVALENT) near(value(q.answer), value(q.f));
  });
  it("C. compare: 3/7 < 5/7, 2/3 > 3/5, 4/6 = 6/9", () => {
    expect(COMPARE.map((q) => q.answer)).toEqual(["<", ">", "="]);
    for (const q of COMPARE) {
      const dec = value(q.a) - value(q.b);
      expect(q.answer).toBe(Math.abs(dec) < 1e-12 ? "=" : dec < 0 ? "<" : ">");
    }
  });
  it("D. sums: 2/9 + 5/9 = 7/9, 1/4 + 2/3 = 11/12, 5/6 − 1/4 = 7/12", () => {
    expect(SUMS.map((q) => show(q.answer))).toEqual(["7/9", "11/12", "7/12"]);
    for (const q of SUMS) near(value(q.answer), q.op === "+" ? value(q.a) + value(q.b) : value(q.a) - value(q.b));
    for (const q of SUMS) expect(equal(q.raw, q.answer)).toBe(true);
  });
  it("E. pizza: 3/8 + 1/4 = 5/8 eaten, 3/8 left; ribbon: 3/4 − 1/3 = 5/12 m", () => {
    expect(show(WORD.pizza.eaten)).toBe("5/8");
    expect(show(WORD.pizza.left)).toBe("3/8");
    near(value(WORD.pizza.eaten) + value(WORD.pizza.left), 1);
    expect(show(WORD.ribbon.rest)).toBe("5/12");
    near(value(WORD.ribbon.rest), 0.75 - 1 / 3);
  });
});

describe("fractions notes: worked examples", () => {
  it("1/2 = 2/4 = 4/8; 18/24 = 3/4; 2/7 + 3/7 = 5/7; 1/2 + 1/3 = 5/6 (not 2/5)", () => {
    for (const f of NOTES.halfChain) near(value(f), 0.5);
    expect(show(NOTES.simplify18_24)).toBe("3/4");
    expect(show(NOTES.likeAdd)).toBe("5/7");
    expect(show(NOTES.unlikeAdd.answer)).toBe("5/6");
    expect(equal(NOTES.unlikeAdd.answer, NOTES.wrongAdd)).toBe(false);
  });
  it("3/4 > 5/7 (21 > 20); 7/4 = 1 3/4", () => {
    expect(NOTES.compareExample.answer).toBe(">");
    expect(NOTES.improper.mixed).toEqual({ whole: 1, rest: { n: 3, d: 4 } });
  });
  it("simplify and add behave", () => {
    expect(simplify(frac(-4, -8))).toEqual({ n: 1, d: 2 });
    expect(add(frac(1, 6), frac(1, 3))).toEqual({ n: 1, d: 2 });
  });
});
