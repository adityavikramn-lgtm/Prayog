/**
 * Closed-form projectile motion: launch and landing at the same height,
 * no air resistance, uniform gravity g pointing down. SI units.
 *
 * Everything works on launch components (u_x, u_y) so a question that uses
 * the JEE convention (e.g. sin 37° = 3/5) gives the solver and the simulation
 * exactly the same inputs.
 */
export interface LaunchComponents {
  ux: number; // m/s
  uy: number; // m/s, must be > 0
  g: number; // m/s², must be > 0
}

export interface ProjectileResults {
  timeOfFlight: number; // s, T = 2u_y / g
  timeToApex: number; // s, u_y / g
  maxHeight: number; // m, H = u_y² / 2g
  range: number; // m, R = u_x T = 2u_x u_y / g  (= u² sin 2θ / g)
}

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function solveProjectile({ ux, uy, g }: LaunchComponents): ProjectileResults {
  const timeOfFlight = (2 * uy) / g;
  return {
    timeOfFlight,
    timeToApex: uy / g,
    maxHeight: (uy * uy) / (2 * g),
    range: ux * timeOfFlight,
  };
}

export function stateAt({ ux, uy, g }: LaunchComponents, t: number): ProjectileState {
  return {
    x: ux * t,
    y: uy * t - 0.5 * g * t * t,
    vx: ux,
    vy: uy - g * t,
  };
}
