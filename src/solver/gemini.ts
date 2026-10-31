// The one place that talks to Gemini (server-side only). Used by /api/read and by the test script.

import { AIResult, AI_JSON_SCHEMA, extractText, fixLatexEscapes, readerInstructions } from "./ai";

export type ReadOutcome =
  | { ok: true; result: AIResult }
  | { ok: false; status: number; reason: "quota" | "http" | "network" | "shape"; detail?: string };

export async function readQuestion(opts: { key: string; model: string; text: string; image?: { data: string; mime: string } | null; timeoutMs?: number }): Promise<ReadOutcome> {
  const input: object[] = [{ type: "text", text: `${readerInstructions()}\n\nStudent's question:\n${opts.text.trim() || "(see the photo)"}` }];
  if (opts.image) input.push({ type: "image", data: opts.image.data, mime_type: opts.image.mime });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45_000);
  let raw: unknown;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "x-goog-api-key": opts.key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: opts.model, input, response_format: { type: "text", mime_type: "application/json", schema: AI_JSON_SCHEMA } }),
    });
    if (res.status === 429) return { ok: false, status: 429, reason: "quota" };
    if (!res.ok) return { ok: false, status: res.status, reason: "http", detail: (await res.text()).slice(0, 300) };
    raw = await res.json();
  } catch (e) {
    return { ok: false, status: 0, reason: "network", detail: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
  const text = extractText(raw);
  try {
    return { ok: true, result: AIResult.parse(JSON.parse(fixLatexEscapes(text ?? ""))) };
  } catch (e) {
    return { ok: false, status: 200, reason: "shape", detail: `${(e as Error).message.slice(0, 200)} | ${String(text).slice(0, 300)}` };
  }
}
