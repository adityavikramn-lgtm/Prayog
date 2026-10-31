// Reads a typed or photographed physics question with Gemini (server-side only; the key never reaches
// the browser). Returns the question type and the numbers; the browser then solves and checks them.

import { AIResult, AI_JSON_SCHEMA, cleanParams, extractText, readerInstructions } from "../../../solver/ai";

const MAX_TEXT = 3000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
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
      if ((m[2].length * 3) / 4 > MAX_IMAGE_BYTES) return reply(400, { status: "bad_input", message: "That photo is too big. Please use one under 4 MB." });
      image = { mime: m[1], data: m[2] };
    }
  } catch {
    return reply(400, { status: "bad_input", message: "Could not read that request." });
  }
  if (!text.trim() && !image) return reply(400, { status: "bad_input", message: "Type a question or add a photo first." });

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  const input: object[] = [{ type: "text", text: `${readerInstructions()}\n\nStudent's question:\n${text.trim() || "(see the photo)"}` }];
  if (image) input.push({ type: "image", data: image.data, mime_type: image.mime });

  let raw: unknown;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input, response_format: { type: "text", mime_type: "application/json", schema: AI_JSON_SCHEMA } }),
    });
    if (res.status === 429) return reply(429, { status: "busy", message: "The free AI quota is used up for now. Please try later, or type the numbers below." });
    if (!res.ok) return reply(502, { status: "ai_error", message: `The AI service said ${res.status}. Please try again, or type the numbers below.` });
    raw = await res.json();
  } catch {
    return reply(502, { status: "ai_error", message: "Could not reach the AI service. Please try again, or type the numbers below." });
  }

  const out = extractText(raw);
  let parsed: AIResult;
  try {
    parsed = AIResult.parse(JSON.parse(out ?? ""));
  } catch {
    return reply(502, { status: "ai_error", message: "The AI's reply was not in the expected form. Please try again, or type the numbers below." });
  }

  if (parsed.kind === "supported" && parsed.template) {
    return reply(200, { status: "ok", template: parsed.template, params: cleanParams(parsed.template, parsed.params), asked: parsed.asked, question: parsed.question });
  }
  if (parsed.kind === "unsupported") return reply(200, { status: "unsupported", question: parsed.question, answer: parsed.answer_text });
  return reply(200, { status: "not_physics", question: parsed.question, message: "That does not look like a physics question." });
}
