"use client";

import "katex/dist/katex.min.css";
import dynamic from "next/dynamic";
import React, { useMemo, useRef, useState } from "react";
import { Tex } from "../components/Tex";
import { TEMPLATES, TemplateId, solveTemplate } from "../solver";
import { fmt, relDiff } from "../solver/common";
import { COLORS } from "../theme";
import { SceneSpec } from "../sandbox/spec";
import OtherAnswer from "./OtherAnswer";

const Viewer = dynamic(() => import("./Viewer"), {
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center rounded-2xl border border-board-line text-chalk-dim sm:h-[560px]">Loading 3D…</div>,
});

/** One-tap examples, so a first-time student sees what the platform does. */
const TRY = [
  { label: "🏀 Throw a ball", question: "A ball is thrown at 20 m/s at 37° above the horizontal. Find its range, maximum height and time of flight." },
  { label: "🏢 From a tower", question: "A stone is thrown horizontally at 15 m/s from the top of a 45 m high tower. How far from the base does it land?" },
  { label: "🎱 Collision", question: "A 2 kg ball moving at 6 m/s collides head-on elastically with a stationary 4 kg ball. Find the velocity of the 4 kg ball after the collision." },
  { label: "🧲 Proton in a magnet", question: "A proton moving at 1.0 × 10^6 m/s enters a uniform magnetic field of 0.1 T at right angles. Find the radius of its path. (m = 1.67 × 10^-27 kg, q = 1.6 × 10^-19 C)" },
  { label: "🛰 Satellite", question: "A satellite orbits the Earth at a height of 600 km. Find its time period. (M = 6 × 10^24 kg, R = 6400 km, G = 6.67 × 10^-11)" },
  { label: "🚗 Banked road", question: "A road of radius 100 m is banked at 37°. If μ = 0.25, find the maximum and minimum safe speeds." },
];

type Values = Record<string, string>;
const toValues = (p: Record<string, number>) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)]));

/** Shrinks a photo in the browser (longest side 1600 px, JPEG) so it uploads fast and stays under the size limit. */
async function photoToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Read =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "ok"; question: string; asked: string[]; given: { name: string; value: number; from: string }[] }
  | { kind: "unsupported"; question: string; answer: string; answerValue: number | null; answerUnit: string; chapter: string; scene: SceneSpec | null }
  | { kind: "message"; text: string };

export default function SolveApp() {
  const [id, setId] = useState<TemplateId>("projectile");
  const [values, setValues] = useState<Values>(toValues(TEMPLATES[0].example));
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [read, setRead] = useState<Read>({ kind: "idle" });
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const readRef = useRef<HTMLDivElement>(null);
  const reveal = () => setTimeout(() => readRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const template = TEMPLATES.find((t) => t.id === id)!;

  const result = useMemo(() => {
    const raw: Record<string, number> = {};
    for (const f of template.fields) {
      const s = values[f.key];
      if (s !== undefined && s.trim() !== "") raw[f.key] = Number(s);
    }
    try {
      return { ok: true as const, ...solveTemplate(id, raw) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [id, values, template]);

  const pick = (tid: TemplateId) => {
    const t = TEMPLATES.find((x) => x.id === tid)!;
    setId(tid);
    setValues(toValues(t.example));
    setRead({ kind: "idle" });
  };

  async function ask(question?: string) {
    const q = question ?? text;
    if (question !== undefined) {
      setText(question);
      setPhoto(null);
    }
    setRead({ kind: "busy" });
    try {
      const res = await fetch("/api/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: q, image: question !== undefined ? null : photo }) });
      const body = await res.json();
      if (body.status === "ok" && TEMPLATES.some((t) => t.id === body.template)) {
        setId(body.template);
        setValues(toValues(body.params));
        setRead({ kind: "ok", question: body.question, asked: body.asked ?? [], given: body.given ?? [] });
        reveal();
      } else if (body.status === "unsupported") {
        const sc = body.scene ? SceneSpec.safeParse(body.scene) : null;
        setRead({ kind: "unsupported", question: body.question, answer: body.answer ?? "", answerValue: typeof body.answerValue === "number" ? body.answerValue : null, answerUnit: body.answerUnit ?? "", chapter: body.chapter ?? "", scene: sc?.success ? sc.data : null });
        reveal();
      } else setRead({ kind: "message", text: body.message ?? "Something went wrong. Please type the numbers below." });
    } catch {
      setRead({ kind: "message", text: "Could not reach the server. Please type the numbers below." });
    }
  }

  const groups = [...new Set(TEMPLATES.map((t) => t.group))];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <div className="text-sm font-extrabold tracking-[0.2em]" style={{ color: COLORS.kan }}>
          PRAYOG · PHYSICS IN 3D
        </div>
        <h1 className="text-3xl font-extrabold sm:text-5xl">Ask a physics question. Watch it happen.</h1>
        <p className="max-w-3xl text-chalk-dim">
          Type or snap your question. AI only reads it; every number in the answer is computed by code and checked by a step-by-step simulation, and the 3D scene runs on those same numbers.
        </p>
      </header>

      {/* Ask */}
      <section className="rounded-2xl border border-board-line bg-board-raised p-4 sm:p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && (text.trim() || photo)) void ask();
          }}
          rows={3}
          placeholder={template.exampleQuestion}
          className="w-full resize-y rounded-xl border border-board-line bg-board p-3 text-lg outline-none focus:border-[#4ef0c4]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={() => void ask()} disabled={read.kind === "busy" || (!text.trim() && !photo)} className="rounded-xl px-5 py-2.5 font-extrabold text-board disabled:opacity-40" style={{ background: COLORS.kan }}>
            {read.kind === "busy" ? "Reading… (5–15 s)" : "Read my question"}
          </button>
          <button onClick={() => cameraRef.current?.click()} className="rounded-xl bg-white/10 px-4 py-2.5 font-bold hover:bg-white/20">
            📷 Take a photo
          </button>
          <button onClick={() => galleryRef.current?.click()} className="rounded-xl bg-white/10 px-4 py-2.5 font-bold hover:bg-white/20">
            🖼 Upload image
          </button>
          {[cameraRef, galleryRef].map((ref, i) => (
            <input
              key={i}
              ref={ref}
              type="file"
              accept="image/*"
              capture={i === 0 ? "environment" : undefined}
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(await photoToDataUrl(f));
                e.target.value = "";
              }}
            />
          ))}
          {photo && (
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Your question" className="h-12 rounded-lg border border-board-line" />
              <button className="text-sm text-chalk-dim underline" onClick={() => setPhoto(null)}>
                remove
              </button>
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-chalk-dim">Try one:</span>
          {TRY.map((t) => (
            <button
              key={t.label}
              disabled={read.kind === "busy"}
              onClick={() => void ask(t.question)}
              className="rounded-full border border-board-line bg-board px-3 py-1.5 font-bold hover:border-[#4ef0c4] disabled:opacity-40"
            >
              {t.label}
            </button>
          ))}
        </div>
        <div ref={readRef} className="scroll-mt-4" />
        {read.kind === "ok" && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border p-3 text-sm sm:p-4" style={{ borderColor: COLORS.kan }}>
            <div>
              <b style={{ color: COLORS.kan }}>Read as: {template.title}.</b> <span className="italic">{read.question}</span>
            </div>
            {read.given.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {read.given.map((g) => (
                  <span key={g.name} className="rounded-lg border border-board-line bg-board px-2 py-1">
                    <b>{template.fields.find((f) => f.key === g.name)?.label ?? g.name} = {g.value}</b>
                    <span className="text-chalk-dim"> from “{g.from}”</span>
                  </span>
                ))}
              </div>
            )}
            {read.asked.length > 0 && <div className="text-chalk-dim">You asked: {read.asked.join(" · ")}</div>}
            <div className="text-chalk-dim">Check these numbers. If one is wrong, change it below; the answer and the 3D update instantly.</div>
          </div>
        )}
        {read.kind === "message" && <div className="mt-3 rounded-xl border border-board-line p-3 text-sm text-chalk-dim">{read.text}</div>}
        {read.kind === "unsupported" && <OtherAnswer {...read} />}
      </section>

      {/* Topic + numbers */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <div key={g} className="flex flex-wrap items-center gap-2 rounded-xl border border-board-line px-2 py-1.5">
              <span className="px-1 text-xs font-bold uppercase tracking-wider text-chalk-dim">{g}</span>
              {TEMPLATES.filter((t) => t.group === g).map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${t.id === id ? "text-board" : "bg-white/5 hover:bg-white/15"}`}
                  style={t.id === id ? { background: COLORS.kan } : undefined}
                >
                  {t.title}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {template.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm">
              <span className="text-chalk-dim">
                {f.label}
                {f.unit && ` (${f.unit})`}
              </span>
              <input
                inputMode="decimal"
                value={values[f.key] ?? ""}
                placeholder={f.optional ? "optional" : ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [f.key]: e.target.value }));
                  if (read.kind === "unsupported") setRead({ kind: "idle" });
                }}
                className="w-36 rounded-lg border border-board-line bg-board px-3 py-2 text-lg tabular-nums outline-none focus:border-[#4ef0c4]"
              />
            </label>
          ))}
        </div>
      </section>

      {read.kind === "unsupported" ? (
        <div className="rounded-xl border border-board-line p-4 text-sm text-chalk-dim">
          3D scenes are available for the topics above. Pick one to try a question that the 3D solver can check.
        </div>
      ) : !result.ok ? (
        <div className="rounded-xl border p-4" style={{ borderColor: COLORS.force }}>
          <b style={{ color: COLORS.force }}>Check the numbers:</b> {result.error}
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Viewer id={id} params={result.params} />
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: result.verified ? COLORS.kan : COLORS.acceleration, color: result.verified ? COLORS.kan : COLORS.acceleration }}>
              {result.verified ? "✓ Checked: formula = step-by-step simulation (to 0.1 %)" : "Needs teacher review: the formula and the simulation disagree"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {result.solution.quantities.map((qq) => (
                <div key={qq.key} className="rounded-xl border border-board-line bg-board-raised p-3">
                  <div className="text-xs text-chalk-dim">{qq.label}</div>
                  <div className="text-2xl font-extrabold" style={{ color: COLORS.displacement }}>
                    <Tex tex={`${qq.symbol} = ${fmt(qq.value)}${qq.unit === "°" ? "^\\circ" : `\\ \\text{${qq.unit}}`}`} />
                  </div>
                </div>
              ))}
            </div>
            {result.solution.notes.map((n) => (
              <div key={n} className="text-sm text-chalk-dim">
                ℹ {n}
              </div>
            ))}
          </div>
        </section>
      )}

      {result.ok && read.kind !== "unsupported" && (
        <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-2xl border border-board-line bg-board-raised p-5">
            <h2 className="mb-3 text-xl font-extrabold">Step by step</h2>
            <ol className="flex flex-col gap-4">
              {result.solution.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-board" style={{ background: COLORS.kan }}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span>{s.text}</span>
                    {s.tex && (
                      <span className="overflow-x-auto text-lg">
                        <Tex tex={s.tex} />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <details className="rounded-2xl border border-board-line bg-board-raised p-5" open>
            <summary className="cursor-pointer text-xl font-extrabold">How we checked it</summary>
            <p className="mt-2 text-sm text-chalk-dim">Each answer is worked out twice: once with the formula, once by a separate step-by-step simulation of the forces. They must agree.</p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-chalk-dim">
                <tr>
                  <td>Quantity</td>
                  <td className="text-right">Formula</td>
                  <td className="text-right">Simulation</td>
                  <td className="text-right">Diff</td>
                </tr>
              </thead>
              <tbody>
                {result.solution.checks.map((c) => (
                  <tr key={c.label} className="border-t border-board-line">
                    <td className="py-1.5 pr-2">{c.label}</td>
                    <td className="text-right tabular-nums">{c.formula.toPrecision(6)}</td>
                    <td className="text-right tabular-nums">{c.simulation.toPrecision(6)}</td>
                    <td className="text-right tabular-nums" style={{ color: relDiff(c.formula, c.simulation) < 1e-3 ? COLORS.kan : COLORS.force }}>
                      {(relDiff(c.formula, c.simulation) * 100).toExponential(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      )}

      <footer className="pb-8 pt-2 text-center text-xs text-chalk-dim">Prayog Studio · AI reads, code solves · made by Adithya Vikram</footer>
    </main>
  );
}
