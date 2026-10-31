// The one place that talks to Gemini (server-side only). Used by /api/read and by the test script.

import { BUILD_JSON_SCHEMA, BuildReply, builderInstructions, sceneFromReply } from "../sandbox/builder";
import { SceneSpec } from "../sandbox/spec";
import { AIResult, AI_JSON_SCHEMA, extractText, fixLatexEscapes, readerInstructions } from "./ai";

type Fail = { ok: false; status: number; reason: "quota" | "http" | "network" | "shape"; detail?: string };

/** One structured call: returns the parsed JSON text, or why it failed. */
async function callJson(opts: { key: string; model: string; prompt: string; image?: { data: string; mime: string } | null; schema: object; timeoutMs?: number }): Promise<{ ok: true; json: unknown } | Fail> {
  const input: object[] = [{ type: "text", text: opts.prompt }];
  if (opts.image) input.push({ type: "image", data: opts.image.data, mime_type: opts.image.mime });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 45_000);
  let raw: unknown;
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "x-goog-api-key": opts.key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: opts.model, input, response_format: { type: "text", mime_type: "application/json", schema: opts.schema } }),
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
    return { ok: true, json: JSON.parse(fixLatexEscapes(text ?? "")) };
  } catch (e) {
    return { ok: false, status: 200, reason: "shape", detail: `${(e as Error).message.slice(0, 200)} | ${String(text).slice(0, 300)}` };
  }
}

export type ReadOutcome = { ok: true; result: AIResult } | Fail;

export async function readQuestion(opts: { key: string; model: string; text: string; image?: { data: string; mime: string } | null; timeoutMs?: number }): Promise<ReadOutcome> {
  const out = await callJson({ ...opts, prompt: `${readerInstructions()}\n\nStudent's question:\n${opts.text.trim() || "(see the photo)"}`, schema: AI_JSON_SCHEMA });
  if (!out.ok) return out;
  const parsed = AIResult.safeParse(out.json);
  return parsed.success ? { ok: true, result: parsed.data } : { ok: false, status: 200, reason: "shape", detail: parsed.error.issues[0]?.message };
}

export type BuildOutcome = { ok: true; scene: SceneSpec | null; chapter: string; error?: string } | Fail;

/** Builds a simulation scene from the question text alone (it never sees the AI's answer). */
export async function buildScene(opts: { key: string; model: string; question: string; timeoutMs?: number }): Promise<BuildOutcome> {
  const out = await callJson({ ...opts, prompt: `${builderInstructions()}\n\nQuestion:\n${opts.question}`, schema: BUILD_JSON_SCHEMA });
  if (!out.ok) return out;
  const parsed = BuildReply.safeParse(out.json);
  if (!parsed.success) return { ok: false, status: 200, reason: "shape", detail: parsed.error.issues[0]?.message };
  return { ok: true, ...sceneFromReply(parsed.data) };
}
