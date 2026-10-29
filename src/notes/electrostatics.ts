import { E_JEE, K_JEE, coulombForce, netForce, nullPointBetween } from "../physics/coulomb";

/**
 * Every number used in the "Electric charges and Coulomb's law" notes.
 * Worked examples are computed here and checked in tests/notes.test.ts,
 * so the PDF never shows a number that was typed by hand.
 */

const uC = 1e-6;
export const G = 6.67e-11; // N m²/kg²
export const ME = 9.1e-31; // kg, electron
export const MP = 1.67e-27; // kg, proton
export const EPS0 = 8.85e-12; // C²/(N m²)

/** E1: +3 µC and −2 µC, 30 cm apart in vacuum. */
export const ex1 = () => coulombForce(K_JEE, 3 * uC, -2 * uC, 0.3);
/** E2: the same pair inside a medium of dielectric constant K = 4. */
export const ex2 = () => ex1() / 4;
/** E3: number of extra electrons on a body with charge −3.2 µC. */
export const ex3 = () => (3.2 * uC) / E_JEE;
/** E4: electric force ÷ gravitational force between an electron and a proton (distance cancels). */
export const ex4 = () => (K_JEE * E_JEE * E_JEE) / (G * ME * MP);
/** E5: identical spheres +8 µC and −2 µC touch and are put back at the same distance. */
export const ex5 = () => {
  const shared = (8 + -2) / 2; // µC on each after touching
  const before = 8 * -2;
  const after = shared * shared;
  return { shared, ratio: after / Math.abs(before), attractiveBefore: before < 0, repulsiveAfter: after > 0 };
};
/** E6: A = +2 µC at x = 0, B = −1 µC at x = 10 cm, C = +4 µC at x = 30 cm. Net force on B (+x = towards C). */
export const ex6 = () => {
  const B = { q: -1 * uC, x: 0.1, y: 0 };
  const fromA = netForce(K_JEE, B, [{ q: 2 * uC, x: 0, y: 0 }]).fx;
  const fromC = netForce(K_JEE, B, [{ q: 4 * uC, x: 0.3, y: 0 }]).fx;
  return { fromA, fromC, net: fromA + fromC };
};
/** E7: four equal charges 1 µC on the corners of a 10 cm square. Net force on one corner. */
export const ex7 = () => {
  const q = 1 * uC;
  const a = 0.1;
  const target = { q, x: 0, y: 0 };
  const others = [
    { q, x: a, y: 0 },
    { q, x: 0, y: a },
    { q, x: a, y: a },
  ];
  const f = netForce(K_JEE, target, others);
  const unit = (K_JEE * q * q) / (a * a);
  return { unit, magnitude: Math.hypot(f.fx, f.fy), factor: Math.SQRT2 + 0.5 };
};
/** E8a: null point between +2 µC and +8 µC, 30 cm apart (distance from the 2 µC charge). */
export const ex8a = () => nullPointBetween(2 * uC, 8 * uC, 0.3);
/** E8b: +4 µC and −1 µC, 30 cm apart. The null point lies outside, beyond the smaller charge: x from the −1 µC charge. */
export const ex8b = () => {
  // 4/(0.3 + x)² = 1/x²  →  2x = 0.3 + x  →  x = 0.3
  const x = 0.3 / (Math.sqrt(4) - 1);
  const net = coulombForce(K_JEE, 1e-6, 4 * uC, 0.3 + x) - coulombForce(K_JEE, 1e-6, 1 * uC, x);
  return { x, net };
};
/** E9: q and 4q a distance d apart. A third charge Q placed between them so that all three are in equilibrium. */
export const ex9 = () => {
  const q = 1 * uC;
  const d = 0.3;
  const x = d / 3; // from q
  const Q = (-4 / 9) * q;
  const onQ = coulombForce(K_JEE, Q, q, x) - coulombForce(K_JEE, Q, 4 * q, d - x);
  const onq = coulombForce(K_JEE, q, Q, x) + coulombForce(K_JEE, q, 4 * q, d);
  return { x, Qover_q: Q / q, onQ, onq };
};
/** E10: two balls, 0.9 g each, charge 0.1 µC each, hang from one point and settle 10 cm apart. */
export const ex10 = () => {
  const m = 0.9e-3;
  const g = 10;
  const q = 0.1 * uC;
  const r = 0.1;
  const F = coulombForce(K_JEE, q, q, r);
  const tanTheta = F / (m * g);
  return { F, weight: m * g, tanTheta, thetaDeg: (Math.atan(tanTheta) * 180) / Math.PI };
};
/** E10b: balls of density ρ in a liquid of density σ keep the same angle when K = ρ/(ρ − σ). */
export const ex10b = (rho = 1600, sigma = 800) => rho / (rho - sigma);
/** E11: a charge Q is split into q and Q − q. Which q gives the biggest force at a fixed distance? */
export const ex11 = () => {
  let best = 0;
  let bestF = -1;
  for (let i = 1; i < 1000; i++) {
    const frac = i / 1000;
    const F = frac * (1 - frac);
    if (F > bestF) {
      bestF = F;
      best = frac;
    }
  }
  return best; // as a fraction of Q
};

/** k from ε₀: 1/(4πε₀). */
export const kFromEps0 = () => 1 / (4 * Math.PI * EPS0);
