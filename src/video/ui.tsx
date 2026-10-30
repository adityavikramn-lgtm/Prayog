import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { RichText } from "../components/RichText";
import { Tex } from "../components/Tex";
import { COLORS, SURFACE } from "../theme";

// Text boxes and backgrounds shared by every video. These are UI, so easing is fine here.

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 over `length` seconds from `start`. */
export const fade = (t: number, start: number, length = 0.25) =>
  interpolate(t, [start, start + length], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

/** 1 → 0 over `length` seconds ending at `end`. */
export const fadeOut = (t: number, end: number, length = 0.3) =>
  interpolate(t, [end - length, end], [1, 0], CLAMP);

/**
 * A faint grid that drifts slowly upwards, plus a vignette, behind every video.
 * Put it first inside the composition's root so everything draws on top.
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const step = 96;
  const off = (frame * 0.5) % step;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="backdrop-glow" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#18245a" stopOpacity="0.55" />
          <stop offset="100%" stopColor={COLORS.board} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="backdrop-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill="url(#backdrop-glow)" />
      {Array.from({ length: Math.ceil(width / step) + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={height} stroke="rgba(160,180,255,0.07)" strokeWidth={2} />
      ))}
      {Array.from({ length: Math.ceil(height / step) + 2 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * step - off} x2={width} y2={i * step - off} stroke="rgba(160,180,255,0.07)" strokeWidth={2} />
      ))}
      <rect width={width} height={height} fill="url(#backdrop-vignette)" />
    </svg>
  );
};

export interface Cue {
  at: number;
  text: string;
  /** How long the line is spoken (seconds). Defaults to the gap until the next line. */
  dur?: number;
}

/** Caption text split into words, keeping each $…$ maths chunk as one piece. */
function tokens(text: string): { text: string; math: boolean }[] {
  return text
    .split(/(\$[^$]+\$)/)
    .filter(Boolean)
    .flatMap((part): { text: string; math: boolean }[] =>
      part.startsWith("$") && part.endsWith("$") && part.length > 1
        ? [{ text: part.slice(1, -1), math: true }]
        : part.split(/\s+/).filter(Boolean).map((w) => ({ text: w, math: false })),
    );
}

/**
 * Karaoke captions: the whole line stays readable, and the word being spoken
 * lights up and pops, moving along with the voice.
 */
export const Captions: React.FC<{
  cues: Cue[];
  local: number;
  box: React.CSSProperties;
  fontSize: number;
}> = ({ cues, local, box, fontSize }) => {
  const started = cues.map((c, i) => ({ c, i })).filter(({ c }) => c.at <= local);
  const last = started[started.length - 1];
  if (!last) return null;
  const { c: active, i } = last;
  const next = cues[i + 1];
  const dur = active.dur ?? (next ? next.at - active.at : 4);
  const o = fade(local, active.at);
  const words = tokens(active.text);
  // Spread the words over the spoken time (longer words take a little longer).
  const weights = words.map((w) => 0.8 + Math.min(w.text.length, 12) * 0.12);
  const total = weights.reduce((a, b) => a + b, 0);
  const progress = Math.max(0, Math.min(0.999, (local - active.at) / Math.max(0.5, dur * 0.95)));
  let acc = 0;
  let current = 0;
  for (let k = 0; k < words.length; k++) {
    if (progress * total >= acc) current = k;
    acc += weights[k];
  }
  const done = local - active.at > dur;
  return (
    <div style={{ position: "absolute", ...box, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          opacity: o,
          translate: `0 ${(1 - o) * 20}px`,
          scale: String(0.96 + 0.04 * o),
          fontSize,
          lineHeight: 1.3,
          fontWeight: 800,
          textAlign: "center",
          padding: "14px 28px",
          borderRadius: 22,
          background: SURFACE,
          border: `2px solid ${COLORS.boardLine}`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: "0.42em",
        }}
      >
        {words.map((w, k) => {
          const isNow = k === current && !done;
          const spoken = done || k < current;
          const color = isNow ? COLORS.displacement : spoken ? COLORS.chalk : "rgba(245,247,255,0.55)";
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                color,
                scale: isNow ? "1.04" : "1",
                textShadow: isNow ? `0 0 18px ${COLORS.displacement}88` : "none",
              }}
            >
              {w.math ? <Tex tex={w.text} /> : w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Plain (non-karaoke) rich text, still exported for callers that want it. */
export const StaticCaption: React.FC<{ text: string }> = ({ text }) => <RichText text={text} />;

export const Card: React.FC<{
  opacity: number;
  style: React.CSSProperties;
  fontSize: number;
  children: React.ReactNode;
}> = ({ opacity, style, fontSize, children }) => (
  <div
    style={{
      position: "absolute",
      opacity,
      scale: String(0.9 + 0.1 * opacity),
      padding: "22px 30px",
      borderRadius: 24,
      background: SURFACE,
      border: `2px solid ${COLORS.boardLine}`,
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      fontSize,
      fontWeight: 700,
      lineHeight: 1.25,
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </div>
);
