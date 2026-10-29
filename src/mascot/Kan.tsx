import React from "react";

export type KanExpression = "calm" | "excited" | "scared" | "dizzy" | "proud";
export type KanArms = "none" | "up" | "out";

export interface KanProps {
  /** Body radius in pixels. */
  radius: number;
  expression: KanExpression;
  /** Direction the eyes look, in screen coordinates (y down). Any length. */
  look?: { x: number; y: number };
  /** 1 = round. > 1 squashes (wider, shorter); < 1 stretches. Area is kept. */
  squash?: number;
  /** Where the squash pivots: the body centre, or the point touching the ground. */
  squashOrigin?: "center" | "bottom";
  arms?: KanArms;
  /** Seconds; drives the orbiting dot and dizzy stars. Pure function of time. */
  time?: number;
  /** Electric charge sign shown as a badge (a symbol, so it never relies on colour). */
  badge?: "+" | "−";
}

const INK = "#14211c";
const BODY_LIGHT = "#ffffff";
const BODY_DARK = "#d8ddd2";
const ACCENT = "#7fe0c4"; // Kan's own mint, not used by any physical quantity
const CHEEK = "#ff9f8f";

/**
 * Kan (कण, "particle"): a round particle with big eyes, an orbiting dot,
 * and arms that appear only when it holds something.
 * Drawn in a 200×200 box centred on the particle's position.
 */
export const Kan: React.FC<KanProps> = ({
  radius,
  expression,
  look = { x: 1, y: 0 },
  squash = 1,
  squashOrigin = "center",
  arms = "none",
  time = 0,
  badge,
}) => {
  const size = (radius / 60) * 200;
  const len = Math.hypot(look.x, look.y) || 1;
  const lx = (look.x / len) * 7;
  const ly = (look.y / len) * 6;
  const sx = squash;
  const sy = 1 / squash;
  const pivotY = squashOrigin === "bottom" ? 60 : 0;
  const orbit = time * 2.4;
  const dotX = Math.cos(orbit) * 92;
  const dotY = Math.sin(orbit) * 24;
  const dotInFront = Math.sin(orbit) > 0;
  const tilt = expression === "proud" ? -8 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ overflow: "visible", display: "block" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="kan-body" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={BODY_LIGHT} />
          <stop offset="100%" stopColor={BODY_DARK} />
        </radialGradient>
      </defs>
      <g
        transform={`translate(0 ${pivotY}) scale(${sx} ${sy}) translate(0 ${-pivotY}) rotate(${tilt})`}
      >
        <g transform="rotate(-18)">
          <ellipse rx={92} ry={24} fill="none" stroke={ACCENT} strokeOpacity={0.55} strokeWidth={3} />
          {!dotInFront && <circle cx={dotX} cy={dotY} r={7} fill={ACCENT} />}
        </g>
        <Arms arms={arms} />
        <circle r={60} fill="url(#kan-body)" />
        <Cheeks expression={expression} />
        <Eyes expression={expression} lx={lx} ly={ly} time={time} />
        <Brows expression={expression} />
        <Mouth expression={expression} />
        {expression === "scared" && (
          <path d="M 50 -48 q 8 12 0 18 q -8 -6 0 -18 z" fill="#bfe6ff" />
        )}
        {expression === "dizzy" && <DizzyStars time={time} />}
        <g transform="rotate(-18)">
          {dotInFront && <circle cx={dotX} cy={dotY} r={7} fill={ACCENT} />}
        </g>
        {badge && (
          <g transform="translate(44 -48)">
            <circle r={22} fill={INK} stroke={BODY_LIGHT} strokeWidth={4} />
            <path
              d={badge === "+" ? "M -11 0 H 11 M 0 -11 V 11" : "M -11 0 H 11"}
              stroke={BODY_LIGHT}
              strokeWidth={6}
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

const Arms: React.FC<{ arms: KanArms }> = ({ arms }) => {
  if (arms === "none") return null;
  const hands =
    arms === "up"
      ? [
          { from: [-50, -20], to: [-34, -98] },
          { from: [50, -20], to: [34, -98] },
        ]
      : [
          { from: [-56, 6], to: [-98, -14] },
          { from: [56, 6], to: [98, -14] },
        ];
  return (
    <g stroke={BODY_LIGHT} strokeWidth={8} strokeLinecap="round" fill={BODY_LIGHT}>
      {hands.map(({ from, to }, i) => (
        <g key={i}>
          <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
          <circle cx={to[0]} cy={to[1]} r={8} stroke="none" />
        </g>
      ))}
    </g>
  );
};

const Cheeks: React.FC<{ expression: KanExpression }> = ({ expression }) => {
  const opacity = expression === "scared" ? 0.15 : expression === "excited" ? 0.55 : 0.35;
  return (
    <g fill={CHEEK} opacity={opacity}>
      <ellipse cx={-38} cy={16} rx={10} ry={6} />
      <ellipse cx={38} cy={16} rx={10} ry={6} />
    </g>
  );
};

const EYE_X = 22;
const EYE_Y = -10;

const Eyes: React.FC<{ expression: KanExpression; lx: number; ly: number; time: number }> = ({
  expression,
  lx,
  ly,
  time,
}) => {
  return (
    <g>
      {[-1, 1].map((side) => {
        const cx = side * EYE_X;
        switch (expression) {
          case "calm":
            return (
              <g key={side}>
                <path
                  d={`M ${cx - 13} ${EYE_Y} a 13 14 0 0 0 26 0 z`}
                  transform={`translate(${lx * 0.6} ${ly * 0.4})`}
                  fill={INK}
                />
                <line x1={cx - 15} y1={EYE_Y} x2={cx + 15} y2={EYE_Y} stroke={INK} strokeWidth={4} strokeLinecap="round" />
              </g>
            );
          case "excited":
            return (
              <g key={side} transform={`translate(${lx} ${ly})`}>
                <ellipse cx={cx} cy={EYE_Y} rx={14} ry={19} fill={INK} />
                <circle cx={cx + 5} cy={EYE_Y - 7} r={5} fill="#fff" />
                <circle cx={cx - 4} cy={EYE_Y + 6} r={2.5} fill="#fff" />
              </g>
            );
          case "scared":
            return (
              <g key={side}>
                <ellipse cx={cx} cy={EYE_Y} rx={16} ry={20} fill="#fff" stroke={INK} strokeWidth={4} />
                <circle cx={cx + lx * 0.9} cy={EYE_Y + ly * 0.9} r={5} fill={INK} />
              </g>
            );
          case "dizzy": {
            const spin = time * 360 * 1.5 * side;
            return (
              <path
                key={side}
                d="M 0 0 m -2 0 a 2 2 0 1 1 4 0 a 5 5 0 1 1 -10 0 a 8 8 0 1 1 16 0 a 11 11 0 1 1 -22 0"
                transform={`translate(${cx} ${EYE_Y}) rotate(${spin})`}
                fill="none"
                stroke={INK}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            );
          }
          case "proud":
            return (
              <path
                key={side}
                d={`M ${cx - 13} ${EYE_Y + 4} q 13 -16 26 0`}
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
        }
      })}
    </g>
  );
};

const Brows: React.FC<{ expression: KanExpression }> = ({ expression }) => {
  const common = { fill: "none", stroke: INK, strokeWidth: 4, strokeLinecap: "round" as const };
  switch (expression) {
    case "excited":
      return (
        <g {...common}>
          <path d="M -34 -38 q 12 -8 24 0" />
          <path d="M 10 -38 q 12 -8 24 0" />
        </g>
      );
    case "scared":
      return (
        <g {...common}>
          <path d="M -36 -36 L -10 -44" />
          <path d="M 36 -36 L 10 -44" />
        </g>
      );
    case "proud":
      return (
        <g {...common}>
          <path d="M -34 -32 q 12 -4 24 0" />
          <path d="M 10 -36 q 12 -8 24 -2" />
        </g>
      );
    default:
      return null;
  }
};

const Mouth: React.FC<{ expression: KanExpression }> = ({ expression }) => {
  switch (expression) {
    case "calm":
      return <path d="M -10 22 q 10 8 20 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case "excited":
      return (
        <g>
          <path d="M -16 18 q 16 26 32 0 z" fill={INK} />
          <path d="M -7 29 q 7 -6 14 0 q -7 6 -14 0 z" fill={CHEEK} />
        </g>
      );
    case "scared":
      return <ellipse cx={0} cy={28} rx={8} ry={10} fill={INK} />;
    case "dizzy":
      return (
        <path d="M -16 26 q 5 -6 10 0 t 10 0 t 10 0 t 10 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      );
    case "proud":
      return <path d="M -12 22 q 14 12 26 -4" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />;
  }
};

const DizzyStars: React.FC<{ time: number }> = ({ time }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const a = time * 3 + (i * 2 * Math.PI) / 3;
      return (
        <path
          key={i}
          d="M 0 -8 L 2.4 -2.4 L 8 0 L 2.4 2.4 L 0 8 L -2.4 2.4 L -8 0 L -2.4 -2.4 Z"
          transform={`translate(${Math.cos(a) * 50} ${-74 + Math.sin(a) * 10})`}
          fill="#f6f1c9"
        />
      );
    })}
  </g>
);
