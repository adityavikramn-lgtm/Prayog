// Projectile from a height h (h = 0: ground to ground). No air resistance. SI units.

import { z } from "zod";
import { locateEvent, rk4Step } from "../physics/rk4";
import { Solution, fmt, q, trig } from "./common";

export const ProjectileParams = z.object({
  u: z.number().min(0).max(2000).describe("launch speed, m/s (0 = dropped from rest)"),
  angleDeg: z.number().min(-89).max(90).describe("launch angle above the horizontal, degrees (negative = thrown downward)"),
  h: z.number().min(0).max(10000).default(0).describe("launch height above the landing ground, m"),
  g: z.number().positive().max(100).default(10),
});
export type ProjectileParams = z.infer<typeof ProjectileParams>;

export const projectileExample: ProjectileParams = { u: 20, angleDeg: 37, h: 0, g: 10 };

export function projectileMotion(p: ProjectileParams) {
  const { sin, cos } = trig(p.angleDeg);
  const ux = p.u * cos;
  const uy = p.u * sin;
  const T = (uy + Math.sqrt(uy * uy + 2 * p.g * p.h)) / p.g;
  const at = (t: number) => ({ x: ux * t, y: p.h + uy * t - 0.5 * p.g * t * t, vx: ux, vy: uy - p.g * t });
  return { ux, uy, T, at };
}

export function solveProjectile(p: ProjectileParams): Solution {
  const { sin, cos, jee } = trig(p.angleDeg);
  const { ux, uy, T } = projectileMotion(p);
  if (!(T > 0)) throw new Error("The ball never leaves the ground: give it a height or an upward angle.");
  const tApex = uy > 0 ? uy / p.g : 0;
  const H = p.h + (uy > 0 ? (uy * uy) / (2 * p.g) : 0);
  const R = ux * T;
  const vyEnd = uy - p.g * T;
  const vEnd = Math.hypot(ux, vyEnd);
  const impactDeg = (Math.atan2(-vyEnd, ux) * 180) / Math.PI;

  // Independent check: integrate the equations of motion step by step until the ball reaches y = 0.
  const f = (_t: number, y: readonly number[]) => [y[2], y[3], 0, -p.g];
  let y: number[] = [0, p.h, ux, uy];
  let t = 0;
  let yMax = p.h;
  const dt = Math.max(1e-4, T / 4000);
  for (let i = 0; i < 1e6; i++) {
    const next = rk4Step(f, t, y, dt);
    if (y[3] > 0 && next[3] <= 0) {
      const apex = locateEvent(f, t, y, dt, (s) => s[3]);
      yMax = Math.max(yMax, apex.y[1]);
    }
    if (t > 0 && next[1] < 0) {
      const hit = locateEvent(f, t, y, dt, (s) => s[1]);
      t = hit.t;
      y = hit.y;
      break;
    }
    y = next;
    t += dt;
  }

  const steps = [
    {
      text: `Split the launch velocity into parts${jee ? " (JEE values: sin 37° = 3/5, cos 37° = 4/5)" : ""}.`,
      tex: `u_x = u\\cos\\theta = ${fmt(p.u)}\\times${fmt(cos)} = ${fmt(ux)}\\ \\text{m/s},\\quad u_y = u\\sin\\theta = ${fmt(p.u)}\\times${fmt(sin)} = ${fmt(uy)}\\ \\text{m/s}`,
    },
    { text: "Sideways there is no force, so the horizontal speed never changes. Up–down, gravity pulls with g." },
    p.h > 0
      ? {
          text: `It starts ${fmt(p.h)} m up and lands when y = 0: solve the quadratic and keep the positive root.`,
          tex: `0 = ${fmt(p.h)} + ${fmt(uy)}\\,t - \\tfrac12(${fmt(p.g)})t^2 \\Rightarrow T = \\dfrac{u_y + \\sqrt{u_y^2 + 2gh}}{g} = ${fmt(T)}\\ \\text{s}`,
        }
      : { text: "Time of flight: up and back down to the same level.", tex: `T = \\dfrac{2u_y}{g} = \\dfrac{2\\times${fmt(uy)}}{${fmt(p.g)}} = ${fmt(T)}\\ \\text{s}` },
    { text: "Range: horizontal speed × time in the air.", tex: `R = u_x T = ${fmt(ux)}\\times${fmt(T)} = ${fmt(R)}\\ \\text{m}` },
    uy > 0
      ? { text: "Highest point: vertical speed becomes zero.", tex: `H = h + \\dfrac{u_y^2}{2g} = ${fmt(p.h)} + \\dfrac{${fmt(uy)}^2}{2\\times${fmt(p.g)}} = ${fmt(H)}\\ \\text{m}` }
      : { text: "It is thrown flat or downward, so the highest point is the launch point.", tex: `H = h = ${fmt(H)}\\ \\text{m}` },
    { text: "Landing speed: combine the parts (or use energy).", tex: `v = \\sqrt{u_x^2 + v_y^2} = \\sqrt{u^2 + 2gh} = ${fmt(vEnd)}\\ \\text{m/s}` },
  ];

  return {
    quantities: [
      q("T", "Time of flight", "T", T, "s"),
      q("R", "Horizontal range", "R", R, "m"),
      q("H", "Maximum height (above ground)", "H", H, "m"),
      q("tApex", "Time to top", "t_{top}", tApex, "s"),
      q("vEnd", "Speed on landing", "v", vEnd, "m/s"),
      q("impact", "Landing angle below horizontal", "\\phi", impactDeg, "°"),
    ],
    steps,
    checks: [
      { label: "Time of flight", formula: T, simulation: t },
      { label: "Range", formula: R, simulation: y[0] },
      { label: "Maximum height", formula: H, simulation: yMax },
      { label: "Landing speed", formula: vEnd, simulation: Math.hypot(y[2], y[3]) },
    ],
    notes: jee ? ["Uses the JEE convention sin 37° = 3/5."] : [],
  };
}
