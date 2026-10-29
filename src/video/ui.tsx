import React from "react";
import { Easing, interpolate } from "remotion";
import { RichText } from "../components/RichText";
import { COLORS } from "../theme";

// Text boxes shared by every video. These are UI, so easing is fine here.

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 over `length` seconds from `start`. */
export const fade = (t: number, start: number, length = 0.25) =>
  interpolate(t, [start, start + length], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

/** 1 → 0 over `length` seconds ending at `end`. */
export const fadeOut = (t: number, end: number, length = 0.3) =>
  interpolate(t, [end - length, end], [1, 0], CLAMP);

export interface Cue {
  at: number;
  text: string;
}

/** Shows the latest cue that has started, sliding in gently. */
export const Captions: React.FC<{
  cues: Cue[];
  local: number;
  box: React.CSSProperties;
  fontSize: number;
}> = ({ cues, local, box, fontSize }) => {
  const started = cues.filter((c) => c.at <= local);
  const active = started[started.length - 1];
  if (!active) return null;
  const o = fade(local, active.at);
  return (
    <div style={{ position: "absolute", ...box, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          opacity: o,
          translate: `0 ${(1 - o) * 16}px`,
          fontSize,
          lineHeight: 1.25,
          fontWeight: 700,
          textAlign: "center",
          padding: "12px 24px",
          borderRadius: 18,
          background: "rgba(22, 35, 30, 0.94)",
          border: `2px solid ${COLORS.boardLine}`,
        }}
      >
        <RichText text={active.text} />
      </div>
    </div>
  );
};

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
      scale: String(0.94 + 0.06 * opacity),
      padding: "22px 30px",
      borderRadius: 22,
      background: COLORS.boardRaised,
      border: `2px solid ${COLORS.boardLine}`,
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
