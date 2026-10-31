// Sends real questions through the AI reader and the solver, and prints what came back.
//   npx tsx scripts/read-test.mts [model]       (uses GEMINI_API_KEY from .env.local; costs free-tier quota)
import { config } from "dotenv";
import { paramsFromGiven } from "../src/solver/ai";
import { readQuestion } from "../src/solver/gemini";
import { TemplateId, solveTemplate } from "../src/solver";

config({ path: ".env.local", quiet: true });
const key = process.env.GEMINI_API_KEY?.trim() ?? "";
if (!key) throw new Error("Add GEMINI_API_KEY to .env.local first.");
const model = process.argv[2] ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

const QUESTIONS: [string, string, Record<string, number>][] = [
  ["A ball is thrown at 20 m/s at 37 degrees above the horizontal. Find its range.", "projectile", { u: 20, angleDeg: 37 }],
  ["A stone is thrown horizontally at 15 m/s from the top of a 45 m high tower. How far from the base does it land?", "projectile", { u: 15, angleDeg: 0, h: 45 }],
  ["A 5 kg block is pushed up a 30 degree incline with speed 10 m/s. Coefficient of friction is 0.2. How far up does it go?", "incline", { m: 5, angleDeg: 30, mu: 0.2, u: 10 }],
  ["A car goes round a curve of radius 200 m banked at 15 degrees. Find the speed at which no friction is needed.", "banked", { r: 200, angleDeg: 15 }],
  ["A 200 g mass hangs from a spring of force constant 80 N/m and oscillates with amplitude 5 cm. Find the maximum speed.", "spring", { m: 0.2, k: 80, A: 0.05 }],
  ["A bob of mass 100 g tied to a 50 cm string moves in a horizontal circle with the string making 60° with the vertical. Find the tension.", "conical", { m: 0.1, L: 0.5, angleDeg: 60 }],
  ["Two charges of 2 microcoulomb and 3 microcoulomb are 30 cm apart. Find the force between them.", "unsupported", {}],
  ["What is the capital of France?", "not_physics", {}],
];

async function main() {
let pass = 0;
for (const [q, expectT, expectP] of QUESTIONS) {
  const t0 = Date.now();
  const out = await readQuestion({ key, model, text: q });
  const ms = Date.now() - t0;
  if (!out.ok) {
    console.log(`✗ ${q}\n   ${out.reason} ${out.status} ${out.detail ?? ""}`);
    continue;
  }
  const r = out.result;
  const got = r.kind === "supported" ? r.template : r.kind;
  const params = r.kind === "supported" ? paramsFromGiven(r.template, r.given) : {};
  const missing = Object.entries(expectP).filter(([k, v]) => Math.abs((params[k] ?? NaN) - v) > 1e-9).map(([k, v]) => `${k}=${v} (got ${params[k]})`);
  let solved = "";
  if (r.kind === "supported") {
    try {
      const s = solveTemplate(r.template as TemplateId, params);
      solved = `verified=${s.verified}`;
    } catch (e) {
      solved = `solver: ${(e as Error).message}`;
    }
  }
  const ok = got === expectT && missing.length === 0;
  if (ok) pass++;
  console.log(`${ok ? "✓" : "✗"} [${ms} ms] ${got} ${JSON.stringify(params)} ${solved}${missing.length ? `\n   missing/wrong: ${missing.join(", ")}` : ""}${r.kind === "unsupported" ? `\n   ${r.answer_text.slice(0, 400).replace(/\n/g, "\n   ")}` : ""}`);
}
console.log(`\n${pass}/${QUESTIONS.length} read correctly with ${model}`);
}
void main();
