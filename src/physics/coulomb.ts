/**
 * Electrostatics of point charges in vacuum. SI units.
 * JEE convention: k = 1/(4πε₀) = 9 × 10⁹ N·m²/C², e = 1.6 × 10⁻¹⁹ C
 * (precise values: 8.99 × 10⁹ and 1.602 × 10⁻¹⁹).
 */
export const K_JEE = 9e9;
export const E_JEE = 1.6e-19;

export interface PointCharge {
  q: number; // C
  x: number; // m
  y: number; // m
}

/** Coulomb's law. Positive = repulsion, negative = attraction. */
export function coulombForce(k: number, q1: number, q2: number, r: number): number {
  return (k * q1 * q2) / (r * r);
}

/** Net force on `target` from every source charge (superposition). */
export function netForce(k: number, target: PointCharge, sources: PointCharge[]): { fx: number; fy: number } {
  let fx = 0;
  let fy = 0;
  for (const s of sources) {
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const r = Math.hypot(dx, dy);
    const f = coulombForce(k, target.q, s.q, r); // along the line from s to target
    fx += (f * dx) / r;
    fy += (f * dy) / r;
  }
  return { fx, fy };
}

/**
 * Two charges released from rest at separation r0, free to move along their line.
 * Energy and momentum conservation give both speeds when they are r apart.
 */
export function releaseSpeeds({
  k,
  q1,
  q2,
  m1,
  m2,
  r0,
  r,
}: {
  k: number;
  q1: number;
  q2: number;
  m1: number;
  m2: number;
  r0: number;
  r: number;
}): { v1: number; v2: number; kineticEnergy: number } {
  const kineticEnergy = k * q1 * q2 * (1 / r0 - 1 / r); // loss of potential energy
  const v1 = Math.sqrt((2 * kineticEnergy * m2) / (m1 * (m1 + m2)));
  return { v1, v2: (m1 * v1) / m2, kineticEnergy };
}

/**
 * The point between two like charges where a test charge feels no net force.
 * Measured from q1, on the segment of length d: x = d·√q1 / (√q1 + √q2).
 */
export function nullPointBetween(q1: number, q2: number, d: number): number {
  const a = Math.sqrt(Math.abs(q1));
  const b = Math.sqrt(Math.abs(q2));
  return (d * a) / (a + b);
}
