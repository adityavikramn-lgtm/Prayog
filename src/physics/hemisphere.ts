/**
 * A small block dragged slowly up the outside of a fixed rough hemisphere
 * (radius R, friction coefficient μ) by a string that stays tangent to the surface.
 *
 * φ = angle of the block's radius line above the horizontal: φ = 0 at the ground,
 * φ = π/2 at the top. "Slowly" means the forces balance at every point
 * (no change in kinetic energy, no centripetal term). SI units.
 */
export interface DragSetup {
  m: number; // kg
  g: number; // m/s²
  R: number; // m
  mu: number;
}

export interface ForcesAt {
  normal: number; // N = mg sin φ
  friction: number; // f = μN, opposes the motion (down the slope)
  gravityAlong: number; // mg cos φ, the part of gravity pulling back down the surface
  tension: number; // T = mg cos φ + μ mg sin φ
}

export function forcesAt({ m, g, mu }: DragSetup, phi: number): ForcesAt {
  const normal = m * g * Math.sin(phi);
  const friction = mu * normal;
  const gravityAlong = m * g * Math.cos(phi);
  return { normal, friction, gravityAlong, tension: gravityAlong + friction };
}

/**
 * Work done by the man from the ground (φ = 0) up to angle φ, in closed form:
 * W(φ) = mgR sin φ + μ mgR (1 − cos φ). At the top this is mgR(1 + μ).
 */
export function workUpTo({ m, g, R, mu }: DragSetup, phi: number) {
  const againstGravity = m * g * R * Math.sin(phi);
  const againstFriction = mu * m * g * R * (1 - Math.cos(phi));
  return { againstGravity, againstFriction, total: againstGravity + againstFriction };
}

export function totalWork(s: DragSetup): number {
  return s.m * s.g * s.R * (1 + s.mu);
}

/** Block position (centre of the hemisphere at the origin, y up). */
export function positionAt({ R }: DragSetup, phi: number): { x: number; y: number } {
  return { x: -R * Math.cos(phi), y: R * Math.sin(phi) };
}
