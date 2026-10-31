// What the AI reader is allowed to return, and the instructions it gets. The AI only READS the question:
// it picks a question type and pulls out the numbers. It never gives the answer for a supported type;
// the solver does. Everything it returns is validated with zod before use.

import { z } from "zod";
import { TEMPLATES } from "./index";

export const PARAM_KEYS = ["u", "angleDeg", "h", "g", "m", "mu", "muS", "L", "r", "v", "k", "A", "amplitudeDeg"] as const;

export const AIResult = z.object({
  kind: z.enum(["supported", "unsupported", "not_physics"]),
  template: z.string().default(""),
  params: z.record(z.string(), z.number().nullable()).default({}),
  asked: z.array(z.string()).default([]),
  question: z.string().max(4000).default(""),
  answer_text: z.string().max(6000).default(""),
});
export type AIResult = z.infer<typeof AIResult>;

/** JSON schema sent to Gemini so it answers in exactly this shape. */
export const AI_JSON_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["supported", "unsupported", "not_physics"] },
    template: { type: "string", enum: ["", ...TEMPLATES.map((t) => t.id)] },
    params: { type: "object", properties: Object.fromEntries(PARAM_KEYS.map((k) => [k, { type: "number" }])) },
    asked: { type: "array", items: { type: "string" } },
    question: { type: "string" },
    answer_text: { type: "string" },
  },
  required: ["kind", "template", "params", "asked", "question", "answer_text"],
};

export function readerInstructions(): string {
  const types = TEMPLATES.map((t) => {
    const shape = (t.schema as z.ZodObject<z.ZodRawShape>).shape;
    const fields = Object.entries(shape)
      .map(([k, s]) => `${k}: ${(s as z.ZodType).description ?? ""}`)
      .join("; ");
    return `- "${t.id}": ${t.about}\n  numbers: ${fields}`;
  }).join("\n");
  return `You read physics questions for a student app. You do NOT solve supported questions; a checked solver does that.

Supported question types:
${types}

Rules:
1. Copy the question you read (text or photo) into "question", cleaned up, in English.
2. If it matches one supported type, set kind = "supported", template = its id, and fill "params" with ONLY the numbers the question gives, converted to SI units (cm → m, km/h → m/s by ×5/18, g → kg). Angles stay in degrees: projectile angle is above the horizontal; incline angle is the slope angle; banked angle is the banking angle; conical angle is from the vertical; pendulum amplitudeDeg is the swing angle. If g is not given, use 10. Leave a number out if the question does not give it (do not guess). In "asked", list what the question wants in plain words.
3. If it is physics but not one of these types, set kind = "unsupported", template = "", and in "answer_text" give a short, careful step-by-step solution in plain text (no LaTeX). Say clearly if anything is uncertain.
4. If it is not a physics question, set kind = "not_physics" and leave the rest empty.
5. Never put a final answer for a supported question anywhere.`;
}

/** Keeps only finite numbers for keys the template knows. */
export function cleanParams(templateId: string, params: Record<string, number | null>) {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return {};
  const keys = new Set(t.fields.map((f) => f.key));
  return Object.fromEntries(Object.entries(params).filter(([k, v]) => keys.has(k) && typeof v === "number" && Number.isFinite(v))) as Record<string, number>;
}

/** Finds the generated text in a Gemini interactions (or older generateContent) response. */
export function extractText(body: unknown): string | null {
  const b = body as Record<string, unknown>;
  if (typeof b?.output_text === "string") return b.output_text;
  const texts: string[] = [];
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    if (Array.isArray(x)) return x.forEach(walk);
    const o = x as Record<string, unknown>;
    if (typeof o.text === "string" && (o.type === "text" || o.type === undefined)) texts.push(o.text);
    for (const k of ["steps", "outputs", "content", "candidates", "parts"]) if (k in o) walk(o[k]);
  };
  walk(b);
  return texts.length ? texts.join("") : null;
}
