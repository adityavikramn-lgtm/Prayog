// What the AI reader is allowed to return, and the instructions it gets. The AI only READS the question:
// it picks a question type and pulls out the numbers. It never gives the answer for a supported type;
// the solver does. Everything it returns is validated with zod before use.

import { z } from "zod";
import { TEMPLATES } from "./index";

export const PARAM_KEYS = ["u", "angleDeg", "h", "g", "m", "mu", "muS", "L", "r", "v", "k", "A", "amplitudeDeg"] as const;

/** One number read from the question, with the words it came from (so it is grounded in the text). */
export const Given = z.object({ name: z.string(), value: z.number(), from_text: z.string().default("") });

export const AIResult = z.object({
  kind: z.enum(["supported", "unsupported", "not_physics"]),
  template: z.string().default(""),
  given: z.array(Given).default([]),
  asked: z.array(z.string()).default([]),
  question: z.string().max(4000).default(""),
  answer_text: z.string().max(6000).default(""),
  /** For other topics: the main final number in SI base units (m, s, m/s, N, J …), so a simulation can check it. */
  answer_value: z.number().nullable().default(null),
  answer_unit: z.string().max(20).default(""),
});
export type AIResult = z.infer<typeof AIResult>;

/** JSON schema sent to Gemini so it answers in exactly this shape. */
export const AI_JSON_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["supported", "unsupported", "not_physics"] },
    template: { type: "string", enum: ["", ...TEMPLATES.map((t) => t.id)] },
    given: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string", enum: [...PARAM_KEYS] }, value: { type: "number" }, from_text: { type: "string" } },
        required: ["name", "value", "from_text"],
      },
    },
    asked: { type: "array", items: { type: "string" } },
    question: { type: "string" },
    answer_text: { type: "string" },
    answer_value: { type: "number" },
    answer_unit: { type: "string" },
  },
  required: ["kind", "template", "given", "asked", "question", "answer_text"],
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

Supported question types (id: what it covers, then the number names it uses):
${types}

How to answer:
1. "question": the question you read (typed or from the photo), cleaned up, in English.
2. If it matches a supported type: kind = "supported", template = its id.
   "given" = EVERY number the question states that matches one of that type's number names. One item per number:
   name (exact name from the list), value (converted to SI units), from_text (the exact words it came from).
   Read the question word by word and do not skip any number: speeds, angles, heights, masses, friction (μ), radii, lengths, spring constants.
   Unit conversions: cm → m (÷100), km/h → m/s (×5/18), g (grams) → kg (÷1000), microcoulomb etc. are not used here.
   Words that mean a number: "horizontally" = angleDeg 0 for a projectile; "dropped" or "released from rest" from a height = u 0 and angleDeg 0 for a projectile; "smooth" or "frictionless" = mu 0; "from rest" = u 0 on an incline.
   Angles stay in degrees: projectile angle above the horizontal (negative if thrown downward); incline slope angle; banking angle; conical angle from the vertical; pendulum swing angle.
   Heights: a tower, cliff, building or table height is h for a projectile.
   If g is not stated, add g = 10 with from_text "not given, JEE value".
   NEVER put the quantity the question asks for into "given" (for example, if it asks for the speed, do not give v).
   "asked" = what the question wants, in plain words.
3. If it is physics but none of these types: kind = "unsupported", template = "", given = []. In "answer_text" write a clear, careful step-by-step solution for a student:
   number each step on its own line; write maths in LaTeX between $ signs (for example $F = \\dfrac{kq_1q_2}{r^2}$); use JEE values (g = 10 m/s², k = 9 × 10^9 N m²/C², sin 37° = 3/5); end with a line starting "Answer:". If anything is uncertain, say so.
   Also put the main final number in "answer_value", converted to SI base units (m, s, m/s, kg, N, J, C, T …), and that unit in "answer_unit" (for example 0.6 and "m", not 60 and "cm").
4. If it is not a physics question: kind = "not_physics", everything else empty.
5. Never put a final answer for a supported question anywhere.`;
}


/** Turns the "given" list into solver numbers: only names the template knows, only finite values. */
export function paramsFromGiven(templateId: string, given: { name: string; value: number }[]) {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return {};
  const keys = new Set(t.fields.map((f) => f.key));
  const out: Record<string, number> = {};
  for (const g of given) if (keys.has(g.name) && Number.isFinite(g.value)) out[g.name] = g.value;
  // A banked-road speed of 0 is never a real given: it means the AI put the asked speed in. Drop it.
  if (templateId === "banked" && out.v === 0) delete out.v;
  return out;
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

const LATEX = "text|textbf|frac|dfrac|tfrac|times|theta|tan|tau|beta|rho|right|rightarrow|Rightarrow|neq|nabla|vec|sqrt|cdot|alpha|mu|omega|Omega|pi|Delta|delta|lambda|sigma|phi|implies|left|quad|circ|approx|infty|sin|cos|log|ln|mathrm|hat|dot|ddot|over|le|ge|leq|geq|pm|epsilon|varepsilon|eta|gamma|kappa|partial|int|sum|propto|degree|boxed";
const BS = String.fromCharCode(92); // one backslash, spelled out so no tool or escape step can change it
const LONE_LATEX_BACKSLASH = new RegExp(`(?<!${BS}${BS})${BS}${BS}(?=(?:${LATEX})(?![A-Za-z]))`, "g");
/**
 * Models often write LaTeX inside JSON with a single backslash (\text), which JSON reads as an escape
 * (\t = tab, \f, \b, \r, \n …). Double any lone backslash that starts a known LaTeX command so it survives.
 */
export function fixLatexEscapes(raw: string): string {
  return raw.replace(LONE_LATEX_BACKSLASH, BS + BS);
}
