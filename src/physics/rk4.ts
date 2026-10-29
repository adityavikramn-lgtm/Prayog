/**
 * Classic 4th-order Runge–Kutta integrator for systems dy/dt = f(t, y).
 * Generic on purpose: it knows nothing about projectiles, so it is an
 * independent check on the closed-form solvers.
 */
export type State = readonly number[];
export type Derivative = (t: number, y: State) => number[];

const addScaled = (y: State, k: State, h: number): number[] =>
  y.map((yi, i) => yi + h * k[i]);

export function rk4Step(f: Derivative, t: number, y: State, dt: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + dt / 2, addScaled(y, k1, dt / 2));
  const k3 = f(t + dt / 2, addScaled(y, k2, dt / 2));
  const k4 = f(t + dt, addScaled(y, k3, dt));
  return y.map(
    (yi, i) => yi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]),
  );
}

/**
 * Locates the moment inside one step [t, t + dt] where event(y) crosses zero.
 * It re-integrates from the start of the step with shorter steps and bisects,
 * so it never assumes a formula for the motion.
 */
export function locateEvent(
  f: Derivative,
  t: number,
  y: State,
  dt: number,
  event: (y: State) => number,
  tolerance = 1e-12,
): { t: number; y: number[] } {
  const startSign = Math.sign(event(y));
  let lo = 0;
  let hi = dt;
  for (let i = 0; i < 200 && hi - lo > tolerance; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(event(rk4Step(f, t, y, mid))) === startSign) lo = mid;
    else hi = mid;
  }
  const h = (lo + hi) / 2;
  return { t: t + h, y: rk4Step(f, t, y, h) };
}
