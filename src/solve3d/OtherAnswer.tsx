"use client";

// Answer for a question outside the six checked topics: the AI's step-by-step text, plus (when the
// situation is mechanics / fields) an independent simulation of the setup that measures the answer itself.

import dynamic from "next/dynamic";
import React, { useMemo } from "react";
import { RichText } from "../components/RichText";
import { simulate } from "../sandbox/sim";
import { SceneSpec } from "../sandbox/spec";
import { COLORS } from "../theme";

const SandboxViewer = dynamic(() => import("./SandboxViewer"), {
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center rounded-2xl border border-board-line text-chalk-dim sm:h-[520px]">Loading 3D…</div>,
});

export interface OtherAnswerProps {
  question: string;
  answer: string;
  answerValue: number | null;
  answerUnit: string;
  chapter: string;
  scene: SceneSpec | null;
}

/** "m/s", "m s^-1", "metre" … → a plain unit, so the AI's unit can be compared with the simulation's. */
function unitKey(u: string) {
  const s = u.toLowerCase().replace(/\s+/g, "").replace("metres", "m").replace("meters", "m").replace("metre", "m").replace("meter", "m").replace("seconds", "s").replace("second", "s").replace("sec", "s");
  if (["m/s", "ms^-1", "ms-1", "m.s^-1"].includes(s)) return "m/s";
  return s;
}

const show = (x: number) => {
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return x.toExponential(3);
  return String(Number(x.toPrecision(4)));
};

export default function OtherAnswer({ question, answer, answerValue, answerUnit, chapter, scene }: OtherAnswerProps) {
  const sim = useMemo(() => (scene ? simulate(scene) : null), [scene]);
  const measured = sim?.measured ?? null;
  const comparable = measured && answerValue !== null && Number.isFinite(answerValue) && unitKey(answerUnit) === unitKey(measured.unit);
  const diff = comparable ? Math.abs(measured!.value - answerValue!) / Math.max(Math.abs(measured!.value), Math.abs(answerValue!), 1e-12) : NaN;
  const agrees = comparable && diff <= 0.02;

  const badge = !scene
    ? { color: COLORS.acceleration, text: `Not verified: AI-only explanation. No animation for ${chapter || "this chapter"} yet; needs teacher review.` }
    : !comparable
      ? { color: COLORS.acceleration, text: "Not verified: the animation shows the situation, but it could not measure this answer. Needs teacher review." }
      : agrees
        ? { color: COLORS.kan, text: `✓ Simulation agrees: it measured ${show(measured!.value)} ${measured!.unit}, the answer says ${show(answerValue!)} ${answerUnit} (within ${(diff * 100).toFixed(1)} %).` }
        : { color: COLORS.force, text: `⚠ Simulation disagrees: it measured ${show(measured!.value)} ${measured!.unit}, but the answer says ${show(answerValue!)} ${answerUnit}. Needs teacher review.` };

  const lines = answer
    // One step per line even if the AI ran them together ("1. … 2. …"), and the answer on its own line.
    .replace(/\s+(?=\d{1,2}\.\s)/g, "\n")
    .replace(/\s*(Answer\s*:)/i, "\n$1")
    .split(/\n+/)
    .filter((l) => l.trim());

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: badge.color, color: badge.color }}>
        {badge.text}
      </div>
      <div className={`grid gap-5 ${scene ? "lg:grid-cols-[1.25fr_1fr]" : ""}`}>
        {scene && sim && (
          <div className="flex flex-col gap-2">
            <SandboxViewer scene={scene} sim={sim} />
            <div className="text-xs text-chalk-dim">
              The AI only described the situation ({scene.title || chapter}); the motion is computed step by step from the forces. {sim.events.slice(0, 2).join(" · ")}
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-board-line bg-board-raised p-4 sm:p-5">
          {chapter && <div className="text-xs font-bold uppercase tracking-wider text-chalk-dim">{chapter}</div>}
          <div className="mt-1 text-sm italic">{question}</div>
          <div className="mt-3 flex flex-col gap-2 text-base leading-relaxed">
            {lines.map((l, i) =>
              /^answer\s*:/i.test(l.trim()) ? (
                <div key={i} className="rounded-lg px-3 py-2 font-extrabold" style={{ background: `${COLORS.acceleration}22`, color: COLORS.displacement }}>
                  <RichText text={l.trim()} />
                </div>
              ) : (
                <div key={i} className="overflow-x-auto">
                  <RichText text={l.trim()} />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
