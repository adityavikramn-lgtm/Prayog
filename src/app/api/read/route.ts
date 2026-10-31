// Reads a typed or photographed physics question with Gemini (server-side only; the key never reaches
// the browser). Returns the question type and the numbers; the browser then solves and checks them.

import { paramsFromGiven } from "../../../solver/ai";
import { buildScene, readQuestion } from "../../../solver/gemini";
import { tidyScene } from "../../../sandbox/sim";

// Reading a photo can take several seconds; give the hosting platform room (the AI call itself times out at 45 s).
export const maxDuration = 60;

const MAX_TEXT = 3000;
// Vercel accepts request bodies up to about 4.5 MB; photos are shrunk in the browser well below this.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Gentle limits so one visitor cannot use up the shared free quota. Per server instance (best effort).
const PER_IP = { max: 15, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();
function allowed(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < PER_IP.windowMs);
  if (recent.length >= PER_IP.max) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

const reply = (status: number, body: object) => Response.json(body, { status });

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return reply(503, { status: "no_key", message: "AI reading is not switched on yet. Pick the topic and type the numbers below instead." });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) return reply(429, { status: "busy", message: "Too many questions in a short time. Please wait a few minutes, or type the numbers below." });

  let text = "";
  let image: { data: string; mime: string } | null = null;
  try {
    const body = (await request.json()) as { text?: unknown; image?: unknown };
    text = typeof body.text === "string" ? body.text.slice(0, MAX_TEXT) : "";
    if (typeof body.image === "string" && body.image.startsWith("data:")) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(body.image);
      if (!m || !IMAGE_TYPES.includes(m[1])) return reply(400, { status: "bad_input", message: "Please upload a JPG, PNG or WebP photo." });
      if ((m[2].length * 3) / 4 > MAX_IMAGE_BYTES) return reply(400, { status: "bad_input", message: "That photo is too big. Please use one under 3 MB." });
      image = { mime: m[1], data: m[2] };
    }
  } catch {
    return reply(400, { status: "bad_input", message: "Could not read that request." });
  }
  if (!text.trim() && !image) return reply(400, { status: "bad_input", message: "Type a question or add a photo first." });

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  const out = await readQuestion({ key, model, text, image });
  if (!out.ok) {
    if (process.env.NODE_ENV !== "production") console.warn("[api/read]", out.reason, out.status, out.detail ?? "");
    if (out.reason === "quota") return reply(429, { status: "busy", message: "The free AI quota is used up for now. Please try later, or type the numbers below." });
    return reply(502, { status: "ai_error", message: "The AI could not read that one. Please try again, or pick the topic and type the numbers below." });
  }
  const parsed = out.result;
  if (parsed.kind === "supported" && parsed.template) {
    const params = paramsFromGiven(parsed.template, parsed.given);
    const given = parsed.given.filter((g) => g.name in params).map((g) => ({ name: g.name, value: g.value, from: g.from_text }));
    return reply(200, { status: "ok", template: parsed.template, params, given, asked: parsed.asked, question: parsed.question });
  }
  if (parsed.kind === "unsupported") {
    // Second, independent call: describe the situation as a simulation (it never sees the answer above).
    let scene = null;
    let chapter = "";
    const built = await buildScene({ key, model, question: parsed.question || text });
    if (built.ok) {
      chapter = built.chapter;
      if (built.scene) {
        try {
          scene = tidyScene(built.scene); // also proves it runs before we send it to the browser
        } catch {
          scene = null;
        }
      }
    } else if (process.env.NODE_ENV !== "production") console.warn("[api/read] scene", built.reason, built.detail ?? "");
    return reply(200, {
      status: "unsupported",
      question: parsed.question,
      answer: parsed.answer_text,
      answerValue: parsed.answer_value,
      answerUnit: parsed.answer_unit,
      chapter,
      scene,
    });
  }
  return reply(200, { status: "not_physics", question: parsed.question, message: "That does not look like a physics question. Try a physics question, or pick a topic below." });
}
