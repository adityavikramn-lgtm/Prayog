import { DragSetup } from "../../physics/hemisphere";

/**
 * Independent check of the man's work, done numerically and without the
 * closed-form answer. The block is moved in many tiny steps along the arc.
 * At each step it takes the forces from Newton's laws in the slow limit
 * (balance along the radius and along the surface), finds the tension, and
 * adds T·ds. It also adds up gravity's work and friction's work separately
 * from the actual displacement vector, so the energy books can be checked.
 */
export function simulateDrag(s: DragSetup, steps = 20000) {
  const { m, g, R, mu } = s;
  const dphi = Math.PI / 2 / steps;
  let byMan = 0;
  let byGravity = 0;
  let byFriction = 0;
  let x = -R; // start on the ground at the left edge
  let y = 0;
  for (let i = 0; i < steps; i++) {
    const phi = (i + 0.5) * dphi; // midpoint of the step
    // Unit vectors at the block: outward radial r = (−cos φ, sin φ) and up the
    // surface t = (sin φ, cos φ). Only their y-parts matter for the weight (0, −mg).
    const ry = Math.sin(phi);
    const ty = Math.cos(phi);
    const weightRadial = -m * g * ry;
    const weightAlong = -m * g * ty;
    // Radial balance: N + weightRadial = 0. Friction opposes motion.
    const N = -weightRadial;
    const f = mu * N;
    // Along-surface balance: T + weightAlong − f = 0.
    const T = f - weightAlong;
    // Actual displacement over this step, from the end points of the arc.
    const nx = -R * Math.cos((i + 1) * dphi);
    const ny = R * Math.sin((i + 1) * dphi);
    const dx = nx - x;
    const dy = ny - y;
    const ds = Math.hypot(dx, dy);
    byMan += T * ds;
    byGravity += -m * g * dy;
    byFriction += -f * ds;
    x = nx;
    y = ny;
  }
  return { byMan, byGravity, byFriction, end: { x, y } };
}
