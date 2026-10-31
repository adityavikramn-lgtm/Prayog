// The "scene" the AI writes for any mechanics / electricity question. The AI only DESCRIBES the setup
// (objects, their starting state, the forces and fields). The simulator (sim.ts) works out the motion,
// and measures the asked quantity itself, so the AI's answer can be checked against it.

import { z } from "zod";

const Vec = z.array(z.number()).length(3);

export const BodySpec = z.object({
  id: z.string().min(1).max(20),
  label: z.string().max(40).default(""),
  mass: z.number().positive().max(1e31),
  charge: z.number().min(-1).max(1).default(0), // coulombs
  radius: z.number().positive().max(1e9).default(0.1), // m, for drawing and collisions
  position: Vec,
  velocity: Vec,
  fixed: z.boolean().default(false),
});

export const SpringSpec = z.object({
  a: z.string(), // body id, or "anchor"
  anchor: Vec.optional(), // used when a = "anchor"
  b: z.string(),
  k: z.number().positive().max(1e9),
  restLength: z.number().min(0).max(1e6),
});

export const MEASURE_KINDS = [
  "max_height", // highest y reached by a body
  "range", // horizontal distance from start when it lands on the ground
  "time_to_ground", // time when it first lands on the ground
  "time_of_flight", // same as time_to_ground
  "speed_at_ground", // speed just before landing
  "max_speed", // largest speed during the run
  "final_speed", // speed at the end of the run
  "final_velocity_x", // x-velocity at the end (after collisions)
  "period", // time for one full oscillation / revolution (returns to start)
  "min_distance", // closest approach between body and body2
  "max_compression", // largest shortening of the first spring
  "max_displacement", // largest distance from the start position
  "bounce_height", // highest point reached after the first bounce on the ground
  "radius_of_path", // radius of a circular path (e.g. charge in a magnetic field)
  "time_to_stop", // time until speed first drops to (almost) zero
  "distance_travelled", // total path length during the run
] as const;

export const MeasureSpec = z.object({
  kind: z.enum(MEASURE_KINDS),
  body: z.string(),
  body2: z.string().default(""),
});

export const SceneSpec = z.object({
  title: z.string().max(80).default(""),
  /** Uniform gravity pulling in −y (m/s²). 0 for space / horizontal-table problems. */
  g: z.number().min(0).max(1000).default(10),
  /** Uniform electric field (V/m) and magnetic field (T). */
  E: Vec.default([0, 0, 0]),
  B: Vec.default([0, 0, 0]),
  /** Pairwise forces between bodies. */
  coulomb: z.boolean().default(false),
  gravitation: z.boolean().default(false),
  /** Linear drag coefficient b (F = −b v) on every moving body, 0 for none. */
  drag: z.number().min(0).max(1e6).default(0),
  /** Flat ground at y = groundY that bodies land on (null = no ground). */
  groundY: z.number().nullable().default(null),
  /** Coefficient of restitution for bounces (ground and body–body). 1 = elastic, 0 = sticks. Landing ends the motion of that body when there is no bounce. */
  restitution: z.number().min(0).max(1).default(0),
  collisions: z.boolean().default(false),
  /** Kinetic friction coefficient with the ground for sliding bodies (horizontal table problems). */
  groundFriction: z.number().min(0).max(5).default(0),
  bodies: z.array(BodySpec).min(1).max(8),
  springs: z.array(SpringSpec).max(6).default([]),
  /** How long to simulate (s). */
  duration: z.number().positive().max(1e10),
  measure: MeasureSpec.nullable().default(null),
});
export type SceneSpec = z.infer<typeof SceneSpec>;
export type BodySpec = z.infer<typeof BodySpec>;
export type MeasureSpec = z.infer<typeof MeasureSpec>;

/** JSON schema for Gemini (same shape as SceneSpec). */
const vecSchema = { type: "array", items: { type: "number" } };
export const SCENE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    g: { type: "number" },
    E: vecSchema,
    B: vecSchema,
    coulomb: { type: "boolean" },
    gravitation: { type: "boolean" },
    drag: { type: "number" },
    groundY: { type: "number", nullable: true },
    restitution: { type: "number" },
    collisions: { type: "boolean" },
    groundFriction: { type: "number" },
    bodies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          mass: { type: "number" },
          charge: { type: "number" },
          radius: { type: "number" },
          position: vecSchema,
          velocity: vecSchema,
          fixed: { type: "boolean" },
        },
        required: ["id", "label", "mass", "charge", "radius", "position", "velocity", "fixed"],
      },
    },
    springs: {
      type: "array",
      items: {
        type: "object",
        properties: { a: { type: "string" }, anchor: vecSchema, b: { type: "string" }, k: { type: "number" }, restLength: { type: "number" } },
        required: ["a", "b", "k", "restLength"],
      },
    },
    duration: { type: "number" },
    measure: {
      type: "object",
      nullable: true,
      properties: { kind: { type: "string", enum: [...MEASURE_KINDS] }, body: { type: "string" }, body2: { type: "string" } },
      required: ["kind", "body"],
    },
  },
  required: ["g", "bodies", "duration"],
};
