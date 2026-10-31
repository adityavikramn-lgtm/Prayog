// Instructions and reply format for the AI "scene builder": it turns a question into objects, forces and
// fields for the simulator. It never sees the AI's answer, so the simulation is an independent check.

import { z } from "zod";
import { MEASURE_KINDS, SceneSpec } from "./spec";

const vec = { type: "array", items: { type: "number" } };

/** What Gemini returns (flat and fully required, which models follow more reliably than optional fields). */
export const BUILD_JSON_SCHEMA = {
  type: "object",
  properties: {
    animatable: { type: "boolean" },
    chapter: { type: "string" },
    title: { type: "string" },
    g: { type: "number" },
    E: vec,
    B: vec,
    coulomb: { type: "boolean" },
    gravitation: { type: "boolean" },
    drag: { type: "number" },
    hasGround: { type: "boolean" },
    groundY: { type: "number" },
    restitution: { type: "number" },
    collisions: { type: "boolean" },
    groundFriction: { type: "number" },
    bodies: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, label: { type: "string" }, mass: { type: "number" }, charge: { type: "number" }, radius: { type: "number" }, position: vec, velocity: vec, fixed: { type: "boolean" } },
        required: ["id", "label", "mass", "charge", "radius", "position", "velocity", "fixed"],
      },
    },
    springs: {
      type: "array",
      items: { type: "object", properties: { a: { type: "string" }, anchor: vec, b: { type: "string" }, k: { type: "number" }, restLength: { type: "number" } }, required: ["a", "anchor", "b", "k", "restLength"] },
    },
    duration: { type: "number" },
    measure_kind: { type: "string", enum: ["none", ...MEASURE_KINDS] },
    measure_body: { type: "string" },
    measure_body2: { type: "string" },
  },
  required: ["animatable", "chapter", "title", "g", "E", "B", "coulomb", "gravitation", "drag", "hasGround", "groundY", "restitution", "collisions", "groundFriction", "bodies", "springs", "duration", "measure_kind", "measure_body", "measure_body2"],
};

export const BuildReply = z.object({
  animatable: z.boolean(),
  chapter: z.string().default(""),
  title: z.string().default(""),
  g: z.number().default(10),
  E: z.array(z.number()).default([0, 0, 0]),
  B: z.array(z.number()).default([0, 0, 0]),
  coulomb: z.boolean().default(false),
  gravitation: z.boolean().default(false),
  drag: z.number().default(0),
  hasGround: z.boolean().default(false),
  groundY: z.number().default(0),
  restitution: z.number().default(0),
  collisions: z.boolean().default(false),
  groundFriction: z.number().default(0),
  bodies: z.array(z.unknown()).default([]),
  springs: z.array(z.unknown()).default([]),
  duration: z.number().default(1),
  measure_kind: z.string().default("none"),
  measure_body: z.string().default(""),
  measure_body2: z.string().default(""),
});

/** Turns the model's flat reply into a validated SceneSpec (or null if it is not animatable / not valid). */
export function sceneFromReply(r: z.infer<typeof BuildReply>): { scene: SceneSpec | null; chapter: string; error?: string } {
  if (!r.animatable) return { scene: null, chapter: r.chapter };
  const parsed = SceneSpec.safeParse({
    title: r.title,
    g: r.g,
    E: r.E,
    B: r.B,
    coulomb: r.coulomb,
    gravitation: r.gravitation,
    drag: r.drag,
    groundY: r.hasGround ? r.groundY : null,
    restitution: Math.min(1, Math.max(0, r.restitution)),
    collisions: r.collisions,
    groundFriction: r.groundFriction,
    bodies: r.bodies,
    springs: (r.springs as { a: string; anchor?: number[] }[]).map((s) => (s.a === "anchor" ? s : { ...s, anchor: undefined })),
    duration: r.duration,
    measure: r.measure_kind && r.measure_kind !== "none" ? { kind: r.measure_kind, body: r.measure_body, body2: r.measure_body2 } : null,
  });
  if (!parsed.success) return { scene: null, chapter: r.chapter, error: parsed.error.issues[0]?.message };
  const s = parsed.data;
  // Every id a spring or measurement refers to must exist.
  const ids = new Set(s.bodies.map((b) => b.id));
  if (s.springs.some((sp) => !ids.has(sp.b) || (sp.a !== "anchor" && !ids.has(sp.a)))) return { scene: null, chapter: r.chapter, error: "spring refers to an unknown body" };
  if (s.measure && !ids.has(s.measure.body)) s.measure = null;
  return { scene: s, chapter: r.chapter };
}

export function builderInstructions(): string {
  return `You set up a physics SIMULATION for a student's question. A computer will simulate exactly what you describe, step by step, and measure the answer from the motion. Do NOT solve the question; just describe the starting situation faithfully.

The simulator can do: point bodies (spheres) with mass, charge, position, velocity; uniform gravity g (pulling in −y); uniform electric field E (V/m) and magnetic field B (T) acting on charges (F = qE + q v × B); Coulomb force between charges (k = 9×10^9); Newton gravitation between bodies (for planets, satellites); springs (to a fixed anchor point or between two bodies, Hooke's law with rest length); linear air drag; a flat ground at y = groundY (bodies land on it; restitution e for bounces; groundFriction μ for sliding on a horizontal table); sphere-sphere collisions with restitution e.

It CANNOT do: ropes/pulleys, inclined surfaces, rigid-body rotation, fluids, light/optics, circuits, heat, waves, modern physics. For those set animatable = false and fill only "chapter". Also set animatable = false if the question has no motion to show.

Rules (SI units everywhere, metres, seconds, kg, coulombs):
- g = 10 unless the question gives another value (JEE convention).
- A body resting on the ground or a table has position y = groundY exactly (not its radius above it).
- Dropped objects: velocity [0, 0, 0] at the given height.
- Bounces: restitution = e, and to ask "how high after the first bounce" use measure_kind = "bounce_height".
- Axes: x to the right, y UP, z towards the viewer. Put the main motion in the x–y plane.
- Projectiles: start at x = 0; launch height = the y position; set hasGround = true, groundY = 0, restitution = 0 (lands and stops). Velocity = [u cos θ, u sin θ, 0] (JEE: sin 37° = 0.6, cos 37° = 0.8; sin 53° = 0.8; else exact).
- Horizontal table / ice with friction: body at y = 0 with hasGround = true, groundY = 0, groundFriction = μ, velocity horizontal.
- No gravity in space, between charges, for satellites, or for motion on a smooth horizontal table: g = 0 (and for the table, hasGround = false).
- Charges in fields: g = 0 unless the question includes gravity. Put B along z ([0,0,B]) so the circle is in the x–y plane.
- Satellites/planets: the planet is a fixed body at the origin with its real mass and radius; gravitation = true; g = 0.
- Collisions: collisions = true; give each body a sensible radius (e.g. 0.1 m) and place them apart with the given velocities; restitution = e (1 elastic, 0 perfectly inelastic).
- Springs: a = "anchor" with an anchor point, or a = another body id; anchor must always be given (use [0,0,0] when a is a body).
  Example, a block moving at u towards a spring fixed to a wall: spring rest length 1, anchor (the wall) at [1, 0, 0], block at [0, 0, 0] (just touching the free end) with velocity [u, 0, 0], g = 0 (smooth floor), measure_kind = "max_compression". For a mass hanging or oscillating on a spring, put the mass at rest length + the given stretch from the anchor.
- duration: long enough to show the asked event (e.g. until landing plus 10 %, 1.5 periods of an oscillation or orbit, until bodies have collided and separated). Never zero.
- measure_kind: the one measurement that answers the question (range, time_of_flight, max_height, speed_at_ground, period, radius_of_path, final_velocity_x, min_distance, max_compression, time_to_stop, distance_travelled, max_speed, final_speed, max_displacement, bounce_height), measure_body = the body it is about, measure_body2 = the other body for min_distance. Use "none" if no measurement fits.
- Labels: short names a student understands ("ball", "electron", "satellite").
- chapter: the textbook chapter name.`;
}
