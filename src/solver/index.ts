// The list of question types the solver can check. The AI reader may only pick from these; anything
// else is answered honestly as "not verified".

import { z } from "zod";
import { BankedParams, ConicalParams, bankedExample, conicalExample, solveBanked, solveConical } from "./circular";
import { Solution, isVerified } from "./common";
import { InclineParams, inclineExample, solveIncline } from "./incline";
import { ProjectileParams, projectileExample, solveProjectile } from "./projectile";
import { PendulumParams, SpringParams, pendulumExample, solvePendulum, solveSpring, springExample } from "./shm";

export type TemplateId = "projectile" | "incline" | "banked" | "conical" | "spring" | "pendulum";

export interface Field {
  key: string;
  label: string;
  unit: string;
  step?: number;
  optional?: boolean;
}

export interface Template {
  id: TemplateId;
  group: "Projectile motion" | "Inclined plane" | "Circular motion" | "SHM";
  title: string;
  /** One-line description the AI reader also sees. */
  about: string;
  schema: z.ZodType;
  example: Record<string, number>;
  exampleQuestion: string;
  fields: Field[];
  solve: (p: never) => Solution;
}

export const TEMPLATES: Template[] = [
  {
    id: "projectile",
    group: "Projectile motion",
    title: "Projectile",
    about: "A ball thrown with speed u at angle θ, from ground level or from a height h (cliff, tower, table). Asks for time of flight, range, max height, landing speed.",
    schema: ProjectileParams,
    example: projectileExample,
    exampleQuestion: "A ball is thrown at 20 m/s at 37° above the horizontal. Find its range, maximum height and time of flight. (g = 10 m/s²)",
    fields: [
      { key: "u", label: "Launch speed u", unit: "m/s" },
      { key: "angleDeg", label: "Angle θ", unit: "°" },
      { key: "h", label: "Launch height h", unit: "m" },
      { key: "g", label: "g", unit: "m/s²" },
    ],
    solve: solveProjectile as (p: never) => Solution,
  },
  {
    id: "incline",
    group: "Inclined plane",
    title: "Block on an incline",
    about: "A block on a rough or smooth incline, released from rest (does it slide, acceleration, time and speed over a distance L) or pushed up the slope with speed u (how far it goes, does it come back).",
    schema: InclineParams,
    example: inclineExample,
    exampleQuestion: "A 2 kg block is released on a 37° incline with μ = 0.5. Find its acceleration and the time to slide 5 m. (g = 10 m/s²)",
    fields: [
      { key: "m", label: "Mass m", unit: "kg" },
      { key: "angleDeg", label: "Angle θ", unit: "°" },
      { key: "mu", label: "Friction μ (kinetic)", unit: "" },
      { key: "muS", label: "Static μs (optional)", unit: "", optional: true },
      { key: "L", label: "Distance L", unit: "m" },
      { key: "u", label: "Push up the slope u (0 = from rest)", unit: "m/s" },
      { key: "g", label: "g", unit: "m/s²" },
    ],
    solve: solveIncline as (p: never) => Solution,
  },
  {
    id: "banked",
    group: "Circular motion",
    title: "Car on a banked road",
    about: "A car turning on a circular road of radius r, banked at angle θ (0 for flat), with friction μ. Asks for the ideal speed, max and min safe speed, or the friction needed at a given speed v.",
    schema: BankedParams,
    example: bankedExample,
    exampleQuestion: "A road of radius 100 m is banked at 37°. If μ = 0.25, find the maximum and minimum safe speeds. (g = 10 m/s²)",
    fields: [
      { key: "r", label: "Radius r", unit: "m" },
      { key: "angleDeg", label: "Banking angle θ", unit: "°" },
      { key: "mu", label: "Friction μ", unit: "" },
      { key: "m", label: "Mass m", unit: "kg" },
      { key: "v", label: "Speed v (optional)", unit: "m/s", optional: true },
      { key: "g", label: "g", unit: "m/s²" },
    ],
    solve: solveBanked as (p: never) => Solution,
  },
  {
    id: "conical",
    group: "Circular motion",
    title: "Conical pendulum",
    about: "A bob on a string of length L moving in a horizontal circle, string at angle θ from the vertical. Asks for tension, angular speed, period, speed.",
    schema: ConicalParams,
    example: conicalExample,
    exampleQuestion: "A 0.5 kg bob on a 1 m string moves in a horizontal circle with the string at 37° to the vertical. Find the tension and the time period. (g = 10 m/s²)",
    fields: [
      { key: "L", label: "String length L", unit: "m" },
      { key: "angleDeg", label: "Angle from vertical θ", unit: "°" },
      { key: "m", label: "Mass m", unit: "kg" },
      { key: "g", label: "g", unit: "m/s²" },
    ],
    solve: solveConical as (p: never) => Solution,
  },
  {
    id: "spring",
    group: "SHM",
    title: "Mass on a spring",
    about: "A mass m on a spring of constant k oscillating with amplitude A. Asks for period, frequency, max speed, max acceleration, energy.",
    schema: SpringParams,
    example: springExample,
    exampleQuestion: "A 0.5 kg mass on a spring of k = 50 N/m oscillates with amplitude 10 cm. Find the period and the maximum speed.",
    fields: [
      { key: "m", label: "Mass m", unit: "kg" },
      { key: "k", label: "Spring constant k", unit: "N/m" },
      { key: "A", label: "Amplitude A", unit: "m" },
    ],
    solve: solveSpring as (p: never) => Solution,
  },
  {
    id: "pendulum",
    group: "SHM",
    title: "Simple pendulum",
    about: "A simple pendulum of length L swinging with a given amplitude. Asks for period, frequency, speed at the bottom.",
    schema: PendulumParams,
    example: pendulumExample,
    exampleQuestion: "Find the time period of a simple pendulum of length 1 m. (g = 10 m/s²)",
    fields: [
      { key: "L", label: "Length L", unit: "m" },
      { key: "amplitudeDeg", label: "Swing angle", unit: "°" },
      { key: "g", label: "g", unit: "m/s²" },
    ],
    solve: solvePendulum as (p: never) => Solution,
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

export interface Solved {
  template: Template;
  params: Record<string, number>;
  solution: Solution;
  verified: boolean;
}

/** Validates the numbers (zod), solves, and runs the simulation check. Throws a plain-English error on bad input. */
export function solveTemplate(id: TemplateId, raw: Record<string, unknown>): Solved {
  const template = templateById(id);
  if (!template) throw new Error(`Unknown question type: ${id}`);
  const parsed = template.schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = template.fields.find((f) => f.key === issue.path[0]);
    throw new Error(`${field?.label ?? String(issue.path[0])}: ${issue.message}`);
  }
  const params = parsed.data as Record<string, number>;
  const solution = template.solve(params as never);
  return { template, params, solution, verified: isVerified(solution) };
}
