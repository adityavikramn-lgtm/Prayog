// Live check of "any question": reader answer vs. an independent simulation of the AI-built scene.
//   npx tsx scripts/scene-test.mts       (uses GEMINI_API_KEY from .env.local; costs free-tier quota)
import { config } from "dotenv";
import { simulate } from "../src/sandbox/sim";
import { buildScene, readQuestion } from "../src/solver/gemini";

config({ path: ".env.local", quiet: true });
const key = process.env.GEMINI_API_KEY?.trim() ?? "";
const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

const QUESTIONS: [string, number | null][] = [
  ["A stone is dropped from the top of an 80 m tall building. How long does it take to reach the ground?", 4],
  ["A proton moving at 1.0 × 10^6 m/s enters a uniform magnetic field of 0.1 T at right angles to the field. Find the radius of its path. (m = 1.67 × 10^-27 kg, q = 1.6 × 10^-19 C)", 0.104],
  ["A 2 kg ball moving at 6 m/s collides head-on elastically with a stationary 4 kg ball. Find the velocity of the 4 kg ball after the collision.", 4],
  ["A satellite orbits the Earth at a height of 600 km. Find its time period. (M = 6 × 10^24 kg, R = 6400 km, G = 6.67 × 10^-11)", 5817],
  ["A block slides on a rough horizontal floor with initial speed 8 m/s. If μ = 0.4, how far does it slide before stopping? (g = 10)", 8],
  ["A 1 kg block moving at 2 m/s on a smooth floor hits a horizontal spring of force constant 100 N/m. Find the maximum compression of the spring.", 0.2],
  ["A ball is dropped from 5 m onto the floor and the coefficient of restitution is 0.5. How high does it rise after the first bounce?", 1.25],
  ["An object is placed 30 cm in front of a convex lens of focal length 20 cm. Find the image distance.", null],
];

async function main() {
  for (const [q, book] of QUESTIONS) {
    const t0 = Date.now();
    const r = await readQuestion({ key, model, text: q });
    if (!r.ok) {
      console.log(`✗ read failed: ${r.reason} ${r.detail ?? ""}\n  ${q}`);
      continue;
    }
    const b = await buildScene({ key, model, question: r.result.question || q });
    const ms = Date.now() - t0;
    if (!b.ok) {
      console.log(`✗ build failed: ${b.reason} ${b.detail ?? ""}\n  ${q}`);
      continue;
    }
    let measured = "no scene";
    if (b.scene) {
      const s = simulate(b.scene);
      measured = s.measured ? `${s.measured.value.toPrecision(4)} ${s.measured.unit} (${b.scene.measure?.kind})` : `no measurement (${b.scene.measure?.kind ?? "none"})`;
    }
    console.log(`[${ms} ms] ${q.slice(0, 70)}…\n   kind=${r.result.kind} chapter=${b.chapter}\n   AI answer: ${r.result.answer_value} ${r.result.answer_unit} | simulation: ${measured} | book: ${book ?? "-"}${b.error ? ` | scene error: ${b.error}` : ""}`);
  }
}
void main();
