import React from "react";
import { Audio } from "@remotion/media";
import { Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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

/** A thin bar across the top that fills as the video plays, with section marks and the current chapter. */
export const Progress: React.FC<{ sections: { from: number; label: string }[]; total: number }> = ({ sections, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;
  const i = Math.max(0, sections.findLastIndex((s) => s.from <= now));
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 8, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            width: `${Math.min(1, now / total) * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.kan}, ${COLORS.displacement})`,
            boxShadow: `0 0 14px ${COLORS.kan}`,
          }}
        />
      </div>
      {sections.slice(1).map((s) => (
        <div key={s.from} style={{ position: "absolute", top: 0, left: `${(s.from / total) * 100}%`, width: 3, height: 8, background: COLORS.board }} />
      ))}
      <div style={{ position: "absolute", right: 60, top: 36, fontSize: 26, fontWeight: 700, letterSpacing: 2, color: COLORS.chalkDim, textTransform: "uppercase" }}>
        <span style={{ color: COLORS.kan }}>{String(i + 1).padStart(2, "0")}</span> / {String(sections.length).padStart(2, "0")} · {sections[i].label}
      </div>
    </>
  );
};

/** Wraps a section: a quick zoom punch-in and a soft flash when it starts (`local` = seconds into the section). */
export const PunchIn: React.FC<{ local: number; children: React.ReactNode }> = ({ local, children }) => {
  const punch = interpolate(local, [0, 0.35], [1.04, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(local, [0, 0.2], [0.1, 0], CLAMP);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, scale: String(punch) }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </>
  );
};

/** The section name, big, sliding in at the top-left for the first few seconds of a section. */
export const ChapterTitle: React.FC<{ local: number; index: number; label: string; hold?: number }> = ({ local, index, label, hold = 3 }) => {
  const inP = interpolate(local, [0.1, 0.55], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(local, [hold, hold + 0.4], [1, 0], CLAMP);
  const o = Math.min(inP, outP);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 104, display: "flex", alignItems: "center", gap: 22, opacity: o, translate: `${(1 - inP) * -60}px 0` }}>
      <div style={{ width: 10, height: 64, borderRadius: 5, background: COLORS.kan, boxShadow: `0 0 22px ${COLORS.kan}88` }} />
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: COLORS.kan }}>PART {String(index + 1).padStart(2, "0")}</div>
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05 }}>{label}</div>
      </div>
    </div>
  );
};

/** A sound effect from public/sfx, starting `at` seconds into the current sequence. */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume = 0.4 }) => {
  const { fps } = useVideoConfig();
  if (at < 0) return null;
  return (
    <Sequence from={Math.round(at * fps)} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};
export type SfxName = "whoosh" | "pop" | "ding" | "tick" | "success" | "thud" | "swish" | "sparkle";

/** 0 → 1 with a little overshoot: for cards and labels popping in (UI only, never physical objects). */
export const popIn = (t: number, start: number, length = 0.45) =>
  interpolate(t, [start, start + length], [0, 1], { ...CLAMP, easing: Easing.out(Easing.back(1.8)) });

/** Small deterministic hash → [0, 1), so the confetti is the same on every render. */
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A confetti burst from (x, y) at time `at` (seconds into the sequence). Decoration only. */
export const Confetti: React.FC<{ local: number; at: number; x: number; y: number; count?: number }> = ({ local, at, x, y, count = 120 }) => {
  const { width, height } = useVideoConfig();
  const s = local - at;
  if (s < 0 || s > 2.6) return null;
  const colors = [COLORS.kan, COLORS.displacement, COLORS.force, COLORS.velocity, "#b79bff", "#ffffff"];
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = -Math.PI / 2 + (hash(i) - 0.5) * Math.PI * 1.3;
        const v = 700 + hash(i + 99) * 900;
        const px = x + Math.cos(a) * v * s;
        const py = y + Math.sin(a) * v * s + 0.5 * 1400 * s * s;
        const spin = (hash(i + 7) - 0.5) * 1440 * s;
        const o = interpolate(s, [1.8, 2.6], [1, 0], CLAMP);
        return (
          <rect
            key={i}
            x={px - 11}
            y={py - 6}
            width={22}
            height={12}
            rx={3}
            fill={colors[i % colors.length]}
            opacity={o}
            transform={`rotate(${spin} ${px} ${py})`}
          />
        );
      })}
    </svg>
  );
};
