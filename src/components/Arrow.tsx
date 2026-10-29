import React from "react";
import { COLORS } from "../theme";

export type ArrowHead = "triangle" | "open" | "double-chevron" | "bars";

export interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  head: ArrowHead;
  width?: number;
  dashed?: boolean;
  /** Main letter and optional subscript, e.g. { text: "v", sub: "x" }. */
  label?: { text: string; sub?: string };
  /** Where the label sits: past the tip, or beside the middle of the shaft. */
  labelAt?: "tip" | "middle";
  labelOffset?: { x: number; y: number };
  fontSize?: number;
}

/** An SVG vector arrow. Each quantity uses its own head style (see theme.ts). */
export const Arrow: React.FC<ArrowProps> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  head,
  width = 5,
  dashed = false,
  label,
  labelAt = "tip",
  labelOffset = { x: 0, y: 0 },
  fontSize = 32,
}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const ux = dx / length;
  const uy = dy / length;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const headLen = head === "bars" ? 0 : Math.min(22, length * 0.45);
  const shaftEnd = head === "triangle" ? headLen * 0.8 : 0;

  const labelPos =
    labelAt === "tip"
      ? { x: x2 + ux * 26, y: y2 + uy * 26 }
      : { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - ux * shaftEnd}
        y2={y2 - uy * shaftEnd}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${width * 2.2} ${width * 1.8}` : undefined}
      />
      <g transform={`translate(${x2} ${y2}) rotate(${angle})`} stroke={color} fill="none" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
        {head === "triangle" && (
          <path d={`M 0 0 L ${-headLen} ${-headLen * 0.5} L ${-headLen} ${headLen * 0.5} Z`} fill={color} />
        )}
        {head === "open" && <path d={`M ${-headLen} ${-headLen * 0.5} L 0 0 L ${-headLen} ${headLen * 0.5}`} />}
        {head === "double-chevron" && (
          <>
            <path d={`M ${-headLen * 0.8} ${-headLen * 0.5} L 0 0 L ${-headLen * 0.8} ${headLen * 0.5}`} />
            <path d={`M ${-headLen * 1.4} ${-headLen * 0.5} L ${-headLen * 0.6} 0 L ${-headLen * 1.4} ${headLen * 0.5}`} />
          </>
        )}
        {head === "bars" && <line x1={0} y1={-14} x2={0} y2={14} />}
      </g>
      {head === "bars" && (
        <g transform={`translate(${x1} ${y1}) rotate(${angle})`} stroke={color} strokeWidth={width} strokeLinecap="round">
          <line x1={0} y1={-14} x2={0} y2={14} />
        </g>
      )}
      {label && (
        <text
          x={labelPos.x + labelOffset.x}
          y={labelPos.y + labelOffset.y}
          fill={color}
          fontSize={fontSize}
          fontStyle="italic"
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
          stroke={COLORS.board}
          strokeWidth={7}
          paintOrder="stroke"
        >
          {label.text}
          {label.sub && (
            <tspan fontSize={fontSize * 0.68} dy={fontSize * 0.25}>
              {label.sub}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
};
