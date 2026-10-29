import { LaunchComponents } from "../../physics/projectile";
import { Derivative, State, locateEvent, rk4Step } from "../../physics/rk4";

export interface MeasuredResults {
  timeOfFlight: number;
  timeToApex: number;
  maxHeight: number;
  range: number;
  steps: number;
  dt: number;
}

/**
 * Throws the particle numerically: RK4 with a fixed time step, using only
 * Newton's second law (a = (0, -g)). The landing and the top point are
 * *measured* by detecting when y and v_y cross zero, never taken from formulas.
 */
export function simulateProjectile(
  { ux, uy, g }: LaunchComponents,
  dt = 1e-3,
): MeasuredResults {
  // State = [x, y, v_x, v_y]
  const f: Derivative = (_t, s) => [s[2], s[3], 0, -g];
  const maxSteps = 10_000_000;

  let t = 0;
  let s: State = [0, 0, ux, uy];
  let apex: { t: number; y: number[] } | undefined;

  for (let step = 1; step <= maxSteps; step++) {
    const next = rk4Step(f, t, s, dt);
    if (!apex && next[3] <= 0) {
      apex = locateEvent(f, t, s, dt, (st) => st[3]);
    }
    if (next[1] <= 0) {
      const landing = locateEvent(f, t, s, dt, (st) => st[1]);
      const top = apex ?? landing;
      return {
        timeOfFlight: landing.t,
        timeToApex: top.t,
        maxHeight: top.y[1],
        range: landing.y[0],
        steps: step,
        dt,
      };
    }
    t += dt;
    s = next;
  }
  throw new Error("Simulation did not land within the step limit");
}
