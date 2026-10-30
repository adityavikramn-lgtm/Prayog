// Class 6–7 fractions: the maths behind the notes + worksheet PDF (scripts/fractions-notes.mts).
// Every answer printed in the answer key is computed here and checked by tests/fractions.test.ts.

export interface Frac {
  n: number;
  d: number;
}

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

export function simplify(f: Frac): Frac {
  if (f.d === 0) throw new Error("denominator 0");
  const g = gcd(f.n, f.d) || 1;
  const s = f.d < 0 ? -1 : 1;
  return { n: (s * f.n) / g, d: (s * f.d) / g };
}

export const frac = (n: number, d: number): Frac => ({ n, d });
export const add = (a: Frac, b: Frac) => simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const sub = (a: Frac, b: Frac) => simplify({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
export const value = (f: Frac) => f.n / f.d;
export const equal = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;
/** -1, 0 or 1, by cross-multiplying (no decimals). */
export const compare = (a: Frac, b: Frac) => Math.sign(a.n * b.d - b.n * a.d);
export const sign = (c: number) => (c < 0 ? "<" : c > 0 ? ">" : "=");

/** Same fraction with a new denominator (must be a multiple). */
export function scaleTo(f: Frac, d: number): Frac {
  if (d % f.d !== 0) throw new Error(`${d} is not a multiple of ${f.d}`);
  return { n: (f.n * d) / f.d, d };
}

/** "7/4" → "1 3/4" style mixed number, or null if it is less than one whole. */
export function mixed(f: Frac): { whole: number; rest: Frac } | null {
  const s = simplify(f);
  if (s.n < s.d) return null;
  return { whole: Math.floor(s.n / s.d), rest: { n: s.n % s.d, d: s.d } };
}

export const show = (f: Frac) => `${f.n}/${f.d}`;

// ---------- the worksheet: questions + computed answers ----------

/** A. What fraction is shaded? (parts shaded out of parts) */
export const SHADED = [
  { shaded: 3, parts: 8 },
  { shaded: 2, parts: 6 },
  { shaded: 5, parts: 10 },
].map((q) => ({ ...q, answer: frac(q.shaded, q.parts), simplest: simplify(frac(q.shaded, q.parts)) }));

/** B. Fill the box to make equivalent fractions. */
export const EQUIVALENT = [
  { f: frac(2, 3), d: 12 },
  { f: frac(3, 5), d: 20 },
  { f: frac(7, 4), d: 16 },
].map((q) => ({ ...q, answer: scaleTo(q.f, q.d) }));

/** C. Put <, > or = between the fractions. */
export const COMPARE = [
  [frac(3, 7), frac(5, 7)],
  [frac(2, 3), frac(3, 5)],
  [frac(4, 6), frac(6, 9)],
].map(([a, b]) => ({ a, b, answer: sign(compare(a, b)), crossA: a.n * b.d, crossB: b.n * a.d }));

/** D. Add or subtract; write in simplest form. */
export const SUMS = [
  { a: frac(2, 9), b: frac(5, 9), op: "+" as const },
  { a: frac(1, 4), b: frac(2, 3), op: "+" as const },
  { a: frac(5, 6), b: frac(1, 4), op: "−" as const },
].map((q) => {
  const L = lcm(q.a.d, q.b.d);
  const A = scaleTo(q.a, L);
  const B = scaleTo(q.b, L);
  const answer = q.op === "+" ? add(q.a, q.b) : sub(q.a, q.b);
  return { ...q, lcd: L, A, B, raw: { n: q.op === "+" ? A.n + B.n : A.n - B.n, d: L }, answer };
});

/** E. Word problems. */
export const WORD = {
  pizza: (() => {
    // Riya eats 3/8 of a pizza, her brother eats 1/4. How much is eaten? How much is left?
    const eaten = add(frac(3, 8), frac(1, 4));
    return { riya: frac(3, 8), brother: frac(1, 4), eaten, left: sub(frac(1, 1), eaten) };
  })(),
  ribbon: (() => {
    // A ribbon is 3/4 m long. 1/3 m is cut off. How long is the rest?
    const rest = sub(frac(3, 4), frac(1, 3));
    return { length: frac(3, 4), cut: frac(1, 3), rest };
  })(),
};

/** The worked examples in the notes. */
export const NOTES = {
  halfChain: [frac(1, 2), frac(2, 4), frac(4, 8)],
  simplify18_24: simplify(frac(18, 24)),
  likeAdd: add(frac(2, 7), frac(3, 7)),
  unlikeAdd: { a: frac(1, 2), b: frac(1, 3), lcd: lcm(2, 3), answer: add(frac(1, 2), frac(1, 3)) },
  wrongAdd: frac(2, 5), // the classic mistake: 1/2 + 1/3 "=" 2/5
  compareExample: { a: frac(3, 4), b: frac(5, 7), crossA: 3 * 7, crossB: 5 * 4, answer: sign(compare(frac(3, 4), frac(5, 7))) },
  improper: { f: frac(7, 4), mixed: mixed(frac(7, 4)) },
};
