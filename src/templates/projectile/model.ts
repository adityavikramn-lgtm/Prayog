import { z } from "zod";
import {
  LaunchComponents,
  ProjectileResults,
  solveProjectile,
} from "../../physics/projectile";

/**
 * "exact": true sine/cosine. "jee": the JEE convention sin 37° = 3/5,
 * cos 37° = 4/5 (and the reverse for 53°); other angles use true values.
 */
export const TrigConvention = z.enum(["exact", "jee"]);
export type TrigConvention = z.infer<typeof TrigConvention>;

export const ProjectileParams = z.object({
  u: z.number().min(1).max(100), // launch speed, m/s
  thetaDeg: z.number().gt(0).lt(90), // launch angle above horizontal, degrees
  g: z.number().min(0.5).max(30), // m/s²
  trig: TrigConvention,
});
export type ProjectileParams = z.infer<typeof ProjectileParams>;

export const G_PRESETS = [
  { id: "earth-jee", label: "Earth (JEE)", g: 10, note: "JEE convention" },
  { id: "earth-real", label: "Earth (real)", g: 9.8, note: "Real world" },
  { id: "moon", label: "Moon", g: 1.62, note: "3 s.f." },
  { id: "mars", label: "Mars", g: 3.71, note: "3 s.f." },
] as const;

export function gLabelFor(g: number): string {
  const preset = G_PRESETS.find((p) => p.g === g);
  return preset ? preset.label : "Custom g";
}

const JEE_TRIG: Record<number, { sin: number; cos: number }> = {
  37: { sin: 3 / 5, cos: 4 / 5 },
  53: { sin: 4 / 5, cos: 3 / 5 },
};

export function launchComponents(p: ProjectileParams): LaunchComponents {
  const jee = p.trig === "jee" ? JEE_TRIG[p.thetaDeg] : undefined;
  const rad = (p.thetaDeg * Math.PI) / 180;
  const sin = jee ? jee.sin : Math.sin(rad);
  const cos = jee ? jee.cos : Math.cos(rad);
  return { ux: p.u * cos, uy: p.u * sin, g: p.g };
}

export function solve(p: ProjectileParams): ProjectileResults & {
  components: LaunchComponents;
} {
  const components = launchComponents(p);
  return { ...solveProjectile(components), components };
}
