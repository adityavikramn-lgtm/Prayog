// Analytic functions lesson: every function shown, every derivative, conjugate and MCQ answer is defined
// here and checked numerically (Cauchy–Riemann by finite differences, Laplace by second differences,
// claimed f(z) by complex arithmetic) in tests/complex.test.ts.

export interface C {
  re: number;
  im: number;
}
export const c = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
export const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
export const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const conj = (a: C): C => c(a.re, -a.im);
export const abs = (a: C) => Math.hypot(a.re, a.im);
export const arg = (a: C) => Math.atan2(a.im, a.re);
export const cexp = (a: C): C => c(Math.exp(a.re) * Math.cos(a.im), Math.exp(a.re) * Math.sin(a.im));
export const cpow = (a: C, n: number): C => {
  let r = c(1);
  for (let k = 0; k < n; k++) r = mul(r, a);
  return r;
};
export const clog = (a: C): C => c(Math.log(abs(a)), arg(a));
export const I = c(0, 1);

/** A function written both ways: as u(x, y) + i v(x, y) and (when it has one) as a formula in z. */
export interface Fn {
  id: string;
  tex: string; // how it is shown
  u: (x: number, y: number) => number;
  v: (x: number, y: number) => number;
  f?: (z: C) => C; // closed form in z, if analytic
}

// ---------- the functions used in the lesson ----------

export const FN: Record<string, Fn> = {
  z2: { id: "z2", tex: "z^2", u: (x, y) => x * x - y * y, v: (x, y) => 2 * x * y, f: (z) => mul(z, z) },
  ez: { id: "ez", tex: "e^z", u: (x, y) => Math.exp(x) * Math.cos(y), v: (x, y) => Math.exp(x) * Math.sin(y), f: cexp },
  conj: { id: "conj", tex: "\\bar z", u: (x) => x, v: (_x, y) => -y },
  abs2: { id: "abs2", tex: "|z|^2", u: (x, y) => x * x + y * y, v: () => 0 },
  // Model-question types
  xMinusIy2: { id: "xMinusIy2", tex: "(x - iy)^2", u: (x, y) => x * x - y * y, v: (x, y) => -2 * x * y },
  cubicMix: { id: "cubicMix", tex: "(x^3 + xy) + i(y^3 - 3x)", u: (x, y) => x ** 3 + x * y, v: (x, y) => y ** 3 - 3 * x },
  izMinusAbs2: { id: "izMinusAbs2", tex: "iz - |z|^2", u: (x, y) => -y - x * x - y * y, v: (x) => x },
  // Find-the-constants answers (a = 2, b = −1, c = −1, d = 2) and (a = b = −1)
  constQuad: { id: "constQuad", tex: "x^2 + 2xy - y^2 + i(-x^2 + 2xy + y^2)", u: (x, y) => x * x + 2 * x * y - y * y, v: (x, y) => -x * x + 2 * x * y + y * y, f: (z) => mul(c(1, -1), mul(z, z)) },
  constTrig: { id: "constTrig", tex: "\\cos x(\\cosh y - \\sinh y) + i\\sin x(\\cosh y - \\sinh y)", u: (x, y) => Math.cos(x) * (Math.cosh(y) - Math.sinh(y)), v: (x, y) => Math.sin(x) * (Math.cosh(y) - Math.sinh(y)), f: (z) => cexp(mul(I, z)) },
  // Harmonic-conjugate answers
  cubicHarm: { id: "cubicHarm", tex: "y^3 - 3x^2y", u: (x, y) => y ** 3 - 3 * x * x * y, v: (x, y) => x ** 3 - 3 * x * y * y, f: (z) => mul(I, cpow(z, 3)) },
  recip: { id: "recip", tex: "\\dfrac{x}{x^2+y^2}", u: (x, y) => x / (x * x + y * y), v: (x, y) => -y / (x * x + y * y), f: (z) => div(c(1), z) },
  zemz: { id: "zemz", tex: "e^{-x}(x\\cos y + y\\sin y)", u: (x, y) => Math.exp(-x) * (x * Math.cos(y) + y * Math.sin(y)), v: (x, y) => Math.exp(-x) * (y * Math.cos(y) - x * Math.sin(y)), f: (z) => mul(z, cexp(c(-z.re, -z.im))) },
  logr: { id: "logr", tex: "\\ln r", u: (x, y) => 0.5 * Math.log(x * x + y * y), v: (x, y) => Math.atan2(y, x), f: clog },
  zPlusInv: { id: "zPlusInv", tex: "\\left(r + \\tfrac1r\\right)\\cos\\theta", u: (x, y) => x + x / (x * x + y * y), v: (x, y) => y - y / (x * x + y * y), f: (z) => add(z, div(c(1), z)) },
};

// ---------- numerical checks (independent of any formula on screen) ----------

const H = 1e-5;
export const ux = (f: Fn, x: number, y: number) => (f.u(x + H, y) - f.u(x - H, y)) / (2 * H);
export const uy = (f: Fn, x: number, y: number) => (f.u(x, y + H) - f.u(x, y - H)) / (2 * H);
export const vx = (f: Fn, x: number, y: number) => (f.v(x + H, y) - f.v(x - H, y)) / (2 * H);
export const vy = (f: Fn, x: number, y: number) => (f.v(x, y + H) - f.v(x, y - H)) / (2 * H);

/** How far the Cauchy–Riemann equations are from holding at (x, y): |u_x − v_y| + |u_y + v_x|. */
export const crGap = (f: Fn, x: number, y: number) => Math.abs(ux(f, x, y) - vy(f, x, y)) + Math.abs(uy(f, x, y) + vx(f, x, y));

/** Laplacian of u by second differences (0 for a harmonic function). */
export const laplacian = (u: (x: number, y: number) => number, x: number, y: number, h = 1e-3) =>
  (u(x + h, y) + u(x - h, y) + u(x, y + h) + u(x, y - h) - 4 * u(x, y)) / (h * h);

/** Difference quotient [f(z0 + Δz) − f(z0)] / Δz along direction φ (the "approach from every direction" picture). */
export function quotient(f: Fn, z0: C, phi: number, h = 1e-4): C {
  const dz = c(h * Math.cos(phi), h * Math.sin(phi));
  const z1 = add(z0, dz);
  const df = c(f.u(z1.re, z1.im) - f.u(z0.re, z0.im), f.v(z1.re, z1.im) - f.v(z0.re, z0.im));
  return div(df, dz);
}

/** Points where a non-analytic function still satisfies Cauchy–Riemann (and so is differentiable). */
export const CR_POINTS = {
  xMinusIy2: [c(0, 0)], // u_x = v_y → x = 0; u_y = −v_x → y = 0
  // (x³ + xy) + i(y³ − 3x): x = 3 and 3x² + y = 3y² → 3y² − y − 27 = 0
  cubicMix: [c(3, (1 + Math.sqrt(325)) / 6), c(3, (1 - Math.sqrt(325)) / 6)],
  izMinusAbs2: [c(0, 0)],
};

// ---------- MCQs: each has its answer worked out here ----------

export interface Mcq {
  q: string; // caption / on-screen question (may hold $…$)
  say: string;
  options: string[]; // TeX allowed
  correct: number;
  why: string;
  whySay?: string;
}

export const MCQS: Mcq[] = [
  { q: "If $z = 3 + 4i$, what is $|z|$?", say: "If z equals 3 plus 4 i, what is the modulus of z?", options: ["5", "7", "25", "1"], correct: 0, why: "$|z| = \\sqrt{3^2 + 4^2} = 5$", whySay: "Modulus is the square root of 3 squared plus 4 squared, which is 5." },
  { q: "The conjugate of $2 - 5i$ is…", say: "The conjugate of 2 minus 5 i is?", options: ["2 + 5i", "-2 + 5i", "-2 - 5i", "5 - 2i"], correct: 0, why: "Change the sign of the imaginary part only.", whySay: "Just change the sign of the imaginary part: 2 plus 5 i." },
  { q: "Which pair are the Cauchy–Riemann equations?", say: "Which pair are the Cauchy Riemann equations?", options: ["u_x = v_y,\\ u_y = -v_x", "u_x = v_x,\\ u_y = v_y", "u_x = -v_y,\\ u_y = v_x", "u_x = u_y,\\ v_x = v_y"], correct: 0, why: "Same-letter-different: $u_x = v_y$, and $u_y = -v_x$ with a minus.", whySay: "u x equals v y, and u y equals minus v x." },
  { q: "$f(z) = \\bar z$ is…", say: "The function z bar is?", options: ["analytic everywhere", "differentiable only at 0", "differentiable nowhere", "analytic except at 0"], correct: 2, why: "$u_x = 1$ but $v_y = -1$: CR fails at every point.", whySay: "u x is 1 but v y is minus 1, so Cauchy Riemann fails everywhere." },
  { q: "$f(z) = |z|^2$ is differentiable…", say: "The function mod z squared is differentiable where?", options: ["everywhere", "only at z = 0", "nowhere", "only on the real axis"], correct: 1, why: "$u_x = 2x = v_y = 0$ and $u_y = 2y = -v_x = 0$ give only $x = y = 0$.", whySay: "Cauchy Riemann gives 2x equals 0 and 2y equals 0, so only at the origin." },
  { q: "The real part of $z^2$ is…", say: "The real part of z squared is?", options: ["x^2 - y^2", "x^2 + y^2", "2xy", "x^2"], correct: 0, why: "$(x + iy)^2 = x^2 - y^2 + 2ixy$", whySay: "x plus i y, squared, is x squared minus y squared, plus 2 i x y." },
  { q: "For analytic $f = u + iv$, $f'(z)$ equals…", say: "For an analytic function, f dash of z equals?", options: ["u_x + i v_x", "u_y + i v_y", "u_x - i v_x", "v_x + i u_x"], correct: 0, why: "Approach along the x-direction: $f' = u_x + i v_x$.", whySay: "Approaching along x gives u x plus i v x." },
  { q: "Which function is harmonic?", say: "Which of these functions is harmonic?", options: ["x^2 + y^2", "x^2 - y^2", "x^3", "xy^2"], correct: 1, why: "$u_{xx} + u_{yy} = 2 - 2 = 0$ only for $x^2 - y^2$.", whySay: "For x squared minus y squared, u x x plus u y y is 2 minus 2, which is zero." },
  { q: "A harmonic conjugate of $u = x^2 - y^2$ is…", say: "A harmonic conjugate of x squared minus y squared is?", options: ["2xy", "-2xy", "x^2 + y^2", "2x"], correct: 0, why: "$u + iv = z^2$ when $v = 2xy$.", whySay: "With v equals 2 x y, u plus i v is exactly z squared." },
  { q: "$x^2 + axy + by^2 + i(cx^2 + dxy + y^2)$ is analytic. Find $a$.", say: "This function is analytic. Find a.", options: ["2", "-2", "1", "0"], correct: 0, why: "$u_x = 2x + ay$ must equal $v_y = dx + 2y$, so $a = 2$ (and $d = 2$).", whySay: "u x is 2x plus a y, v y is d x plus 2 y. Matching gives a equals 2." },
  { q: "Cauchy–Riemann in polar form:", say: "Which is Cauchy Riemann in polar form?", options: ["u_r = \\tfrac1r v_\\theta", "u_r = r v_\\theta", "u_r = v_\\theta", "u_r = -\\tfrac1r v_\\theta"], correct: 0, why: "$u_r = \\frac1r v_\\theta$ and $v_r = -\\frac1r u_\\theta$.", whySay: "u r equals one over r times v theta, and v r equals minus one over r times u theta." },
  { q: "An analytic function with constant real part is…", say: "An analytic function whose real part is constant must be?", options: ["constant", "zero", "e^z", "not possible"], correct: 0, why: "$u_x = u_y = 0 \\Rightarrow v_x = v_y = 0$, so $f' = 0$.", whySay: "u x and u y are zero, so v x and v y are zero too. f dash is zero, so f is constant." },
  { q: "$f(z) = z^3$. Find $f'(i)$.", say: "f of z is z cubed. Find f dash at i.", options: ["-3", "3", "3i", "-3i"], correct: 0, why: "$f'(z) = 3z^2$, and $3i^2 = -3$.", whySay: "f dash is 3 z squared, and 3 i squared is minus 3." },
  { q: "Where is $(x - iy)^2$ differentiable?", say: "Where is x minus i y, the whole squared, differentiable?", options: ["only at z = 0", "everywhere", "nowhere", "on the line y = x"], correct: 0, why: "$u_x = 2x = v_y = -2x \\Rightarrow x = 0$; $u_y = -2y = -v_x = 2y \\Rightarrow y = 0$.", whySay: "Cauchy Riemann gives x equals zero and y equals zero. Only at the origin." },
  { q: "If $u = e^x\\cos y$, the analytic function is…", say: "If u is e to the x, cos y, the analytic function is?", options: ["e^z", "e^{-z}", "e^{iz}", "\\cos z"], correct: 0, why: "$e^z = e^x(\\cos y + i\\sin y)$: real part $e^x\\cos y$.", whySay: "e to the z is e to the x times cos y plus i sin y. Its real part is e to the x cos y." },
  { q: "Level curves $u = c_1$ and $v = c_2$ of an analytic function are…", say: "The level curves u equals c 1 and v equals c 2 of an analytic function are?", options: ["orthogonal", "parallel", "the same", "circles"], correct: 0, why: "$\\nabla u \\cdot \\nabla v = u_x v_x + u_y v_y = 0$ by CR.", whySay: "The dot product of their gradients is zero by Cauchy Riemann, so they cross at right angles." },
  { q: "True or false: the CR equations alone guarantee differentiability.", say: "True or false: the Cauchy Riemann equations alone guarantee differentiability.", options: ["False", "True"], correct: 0, why: "Also need the partial derivatives to be continuous.", whySay: "False. We also need the partial derivatives to be continuous." },
  { q: "$f(z) = \\dfrac1z$ is analytic…", say: "One over z is analytic where?", options: ["everywhere except z = 0", "everywhere", "only at z = 0", "nowhere"], correct: 0, why: "Its derivative $-1/z^2$ exists for every $z \\ne 0$.", whySay: "Its derivative, minus one over z squared, exists everywhere except zero." },
  { q: "Milne–Thomson method: $f'(z) =$", say: "In the Milne Thomson method, f dash of z equals?", options: ["u_x(z,0) - i\\,u_y(z,0)", "u_x(z,0) + i\\,u_y(z,0)", "u_y(z,0) - i\\,u_x(z,0)", "v_x(z,0) - i\\,v_y(z,0)"], correct: 0, why: "$f' = u_x + iv_x = u_x - iu_y$, then put $x = z,\\ y = 0$.", whySay: "f dash is u x plus i v x, which is u x minus i u y. Then put x equals z and y equals 0." },
  { q: "The harmonic conjugate of $u = \\ln r$ is…", say: "The harmonic conjugate of log r is?", options: ["\\theta", "-\\theta", "r", "\\ln\\theta"], correct: 0, why: "$\\ln z = \\ln r + i\\theta$", whySay: "Log z is log r plus i theta, so v is theta." },
];

/** Values the MCQ answers rely on, checked a second way in the tests. */
export const MCQ_FACTS = {
  absOf34: abs(c(3, 4)),
  dCubeAtI: (() => {
    const h = 1e-6;
    const f = (z: C) => cpow(z, 3);
    return div(sub(f(add(I, c(h))), f(I)), c(h));
  })(),
};
