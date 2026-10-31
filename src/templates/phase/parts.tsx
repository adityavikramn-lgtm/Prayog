// Drawing blocks for the phase-diagram lesson: diagram frames, curves, regions, and microstructures.
// Every curve is drawn from model.ts; every microstructure area matches the lever-rule fraction it shows.

import React from "react";
import { COLORS, SURFACE } from "../../theme";
import { sceneFont } from "../../sceneFont";
import { CU_NI, Eutectic, FE_C, FE_C_LINES, Line, Pt, smooth } from "./model";

/** One colour per phase, always with a label. */
export const PH = {
  L: "#ff9f43",
  a: "#4cc3ff",
  b: "#b79bff",
  g: "#4ef0c4",
  d: "#ffe24a",
  c: "#ff72b0",
  ferrite: "#e9eef8",
  cementite: "#7a3f74",
};

// ---------- frames ----------

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
  x0: number;
  x1: number;
  t0: number;
  t1: number;
}
export const sx = (f: Frame, c: number) => f.x + ((c - f.x0) / (f.x1 - f.x0)) * f.w;
export const sy = (f: Frame, T: number) => f.y + f.h - ((T - f.t0) / (f.t1 - f.t0)) * f.h;
export const pathOf = (f: Frame, pts: readonly Pt[]) => "M " + pts.map(([c, T]) => `${sx(f, c).toFixed(1)} ${sy(f, T).toFixed(1)}`).join(" L ");
export const polyOf = (f: Frame, pts: readonly Pt[]) => pts.map(([c, T]) => `${sx(f, c).toFixed(1)},${sy(f, T).toFixed(1)}`).join(" ");
const rev = (pts: readonly Pt[]) => [...pts].reverse();
const part = (line: Line, from: number, to: number) => smooth(line).filter(([x]) => x >= from - 1e-9 && x <= to + 1e-9);

export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>
    <defs>
      {(
        [
          ["aL", PH.a, PH.L],
          ["bL", PH.b, PH.L],
          ["ab", PH.a, PH.b],
          ["gL", PH.g, PH.L],
          ["ag", PH.a, PH.g],
          ["gc", PH.g, PH.c],
          ["ac", PH.a, PH.c],
          ["Lc", PH.L, PH.c],
          ["dL", PH.d, PH.L],
          ["dg", PH.d, PH.g],
        ] as const
      ).map(([id, c1, c2]) => (
        <pattern key={id} id={`hatch-${id}`} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={11} height={22} fill={c1} opacity={0.32} />
          <rect x={11} width={11} height={22} fill={c2} opacity={0.32} />
        </pattern>
      ))}
    </defs>
    {children}
  </svg>
);

export const T: React.FC<{
  x: number;
  y: number;
  color?: string;
  size?: number;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  children: React.ReactNode;
}> = ({ x, y, color = COLORS.chalk, size = 30, opacity = 1, anchor = "middle", weight = 700, children }) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} opacity={opacity} fontFamily={sceneFont}>
    {children}
  </text>
);

/** A label on a dark pill so it reads over hatching. Width is estimated from the text length. */
export const Tag: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; opacity?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  text,
  color = COLORS.chalk,
  size = 28,
  opacity = 1,
  anchor = "middle",
}) => {
  const w = text.length * size * 0.56 + 24;
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - size * 0.95} width={w} height={size * 1.35} rx={size * 0.4} fill="rgba(11,16,34,0.88)" stroke={color} strokeWidth={2} />
      <T x={left + w / 2} y={y} color={color} size={size}>
        {text}
      </T>
    </g>
  );
};

/** A line drawn on with progress p (0 → 1). */
export const Curve: React.FC<{ f: Frame; line: readonly Pt[]; p?: number; color?: string; width?: number; dash?: string; raw?: boolean; opacity?: number }> = ({
  f,
  line,
  p = 1,
  color = COLORS.chalk,
  width = 5,
  dash,
  raw,
  opacity = 1,
}) => {
  if (p <= 0) return null;
  const d = pathOf(f, raw ? line : smooth(line));
  if (dash) return <path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} opacity={opacity * Math.min(1, p * 3)} />;
  return <path d={d} stroke={color} strokeWidth={width} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeLinecap="round" opacity={opacity} />;
};

/** Clips children to the frame, so zoomed-in diagrams don't spill outside their axes. */
export const Clip: React.FC<{ f: Frame; children: React.ReactNode }> = ({ f, children }) => {
  const id = `clip-${Math.round(f.x)}-${Math.round(f.y)}-${Math.round(f.w)}-${Math.round(f.h)}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={f.x - 12} y={f.y - 12} width={f.w + 24} height={f.h + 12} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

export const Region: React.FC<{ f: Frame; pts: readonly Pt[]; fill: string; opacity: number }> = ({ f, pts, fill, opacity }) =>
  opacity > 0 ? <polygon points={polyOf(f, pts)} fill={fill} opacity={opacity} /> : null;

/** Axes with ticks; p draws the axes on. */
export const Axes: React.FC<{
  f: Frame;
  p: number;
  xTicks: number[];
  tTicks: number[];
  xLabel: string;
  tLabel?: string;
  fmtX?: (x: number) => string;
  fmtT?: (t: number) => string;
  ends?: [string, string];
  size?: number;
}> = ({ f, p, xTicks, tTicks, xLabel, tLabel = "Temperature (°C)", fmtX = String, fmtT = String, ends, size = 24 }) => {
  if (p <= 0) return null;
  const o = Math.min(1, p * 1.5);
  return (
    <g>
      <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="rgba(255,255,255,0.025)" opacity={o} />
      <path
        d={`M ${f.x} ${f.y} L ${f.x} ${f.y + f.h} L ${f.x + f.w} ${f.y + f.h}`}
        stroke={COLORS.chalkDim}
        strokeWidth={4}
        fill="none"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
      {xTicks.map((x) => (
        <g key={`x${x}`} opacity={o}>
          <line x1={sx(f, x)} x2={sx(f, x)} y1={f.y + f.h} y2={f.y + f.h + 10} stroke={COLORS.chalkDim} strokeWidth={3} />
          <T x={sx(f, x)} y={f.y + f.h + 12 + size} size={size} color={COLORS.chalkDim} weight={400}>
            {fmtX(x)}
          </T>
        </g>
      ))}
      {tTicks.map((t) => (
        <g key={`t${t}`} opacity={o}>
          <line x1={f.x - 10} x2={f.x} y1={sy(f, t)} y2={sy(f, t)} stroke={COLORS.chalkDim} strokeWidth={3} />
          <T x={f.x - 16} y={sy(f, t) + size * 0.35} size={size} color={COLORS.chalkDim} anchor="end" weight={400}>
            {fmtT(t)}
          </T>
        </g>
      ))}
      <T x={f.x + f.w / 2} y={f.y + f.h + 30 + size * 2} size={size + 2} color={COLORS.chalkDim} opacity={o}>
        {xLabel}
      </T>
      <text
        x={0}
        y={0}
        transform={`translate(${f.x - 30 - size * 2.6} ${f.y + f.h / 2}) rotate(-90)`}
        fill={COLORS.chalkDim}
        fontSize={size + 2}
        fontWeight={700}
        textAnchor="middle"
        opacity={o}
        fontFamily={sceneFont}
      >
        {tLabel}
      </text>
      {ends && (
        <g opacity={o}>
          <T x={f.x} y={f.y + f.h + 30 + size * 2} size={size + 4} color={COLORS.kan} anchor="middle">
            {ends[0]}
          </T>
          <T x={f.x + f.w} y={f.y + f.h + 30 + size * 2} size={size + 4} color={COLORS.kan} anchor="middle">
            {ends[1]}
          </T>
        </g>
      )}
    </g>
  );
};

export const Dot: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number; pulse?: number }> = ({ x, y, r = 11, color = COLORS.displacement, opacity = 1, pulse = 0 }) =>
  opacity > 0 ? (
    <g opacity={opacity}>
      {pulse > 0 && <circle cx={x} cy={y} r={r + 14 * pulse} fill="none" stroke={color} strokeWidth={3} opacity={1 - pulse} />}
      <circle cx={x} cy={y} r={r} fill={color} stroke={COLORS.board} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </g>
  ) : null;

/** A soft repeating pulse 0 → 1 (for "look here" rings). */
export const pulseAt = (local: number, start: number) => (local < start ? 0 : ((local - start) % 1.2) / 1.2);

// ---------- Cu–Ni ----------

export type Vis = Partial<Record<string, number>>;
const v = (vis: Vis, k: string, d = 1) => vis[k] ?? d;

export const cuNiRegions = (tMin: number, tMax: number) => ({
  L: [...smooth(CU_NI.liquidus), [100, tMax], [0, tMax]] as Pt[],
  aL: [...smooth(CU_NI.liquidus), ...rev(smooth(CU_NI.solidus))] as Pt[],
  a: [...smooth(CU_NI.solidus), [100, tMin], [0, tMin]] as Pt[],
});

export const CuNiDiagram: React.FC<{ f: Frame; vis?: Vis; size?: number; labels?: boolean; xTicks?: number[]; tTicks?: number[] }> = ({
  f,
  vis = {},
  size = 24,
  labels = true,
  xTicks = [0, 20, 40, 60, 80, 100],
  tTicks = [1100, 1200, 1300, 1400, 1500],
}) => {
  const r = cuNiRegions(f.t0, f.t1);
  const mid = (a: number, b: number) => (a + b) / 2;
  const lab = (x: number, T: number) => [Math.min(Math.max(sx(f, x), f.x + 60), f.x + f.w - 60), sy(f, T)] as const;
  const [lx, ly] = lab(mid(f.x0, f.x1) - (f.x1 - f.x0) * 0.2, f.t1 - (f.t1 - f.t0) * 0.1);
  const [ax, ay] = lab(f.x0 + (f.x1 - f.x0) * 0.8, f.t0 + (f.t1 - f.t0) * 0.25);
  return (
    <g>
      <Clip f={f}>
        <Region f={f} pts={r.L} fill={PH.L} opacity={0.18 * v(vis, "L")} />
        <Region f={f} pts={r.a} fill={PH.a} opacity={0.18 * v(vis, "a")} />
        <Region f={f} pts={r.aL} fill="url(#hatch-aL)" opacity={v(vis, "aL")} />
        <Curve f={f} line={CU_NI.liquidus} p={v(vis, "liq")} color={PH.L} />
        <Curve f={f} line={CU_NI.solidus} p={v(vis, "sol")} color={PH.a} />
      </Clip>
      <Axes f={f} p={v(vis, "axes")} xTicks={xTicks.filter((x) => x >= f.x0 && x <= f.x1)} tTicks={tTicks.filter((t) => t >= f.t0 && t <= f.t1)} xLabel="Composition (wt% Ni)" ends={f.x0 === 0 && f.x1 === 100 ? ["Cu", "Ni"] : undefined} size={size} />
      {labels && (
        <g>
          <Tag x={lx} y={ly} text="Liquid (L)" color={PH.L} size={size + 4} opacity={v(vis, "L")} />
          <Tag x={ax} y={ay} text="α (solid)" color={PH.a} size={size + 4} opacity={v(vis, "a")} />
          <Tag x={sx(f, 62)} y={sy(f, 1338)} text="α + L" color={COLORS.chalk} size={size + 2} opacity={v(vis, "aL") * (f.x1 >= 70 ? 1 : 0)} />
          <Tag x={sx(f, 35)} y={sy(f, 1385)} text="liquidus" color={PH.L} size={size} opacity={v(vis, "liqTag") * (f.x1 >= 70 ? 1 : 0)} />
          <Tag x={sx(f, 72)} y={sy(f, 1290)} text="solidus" color={PH.a} size={size} opacity={v(vis, "solTag") * (f.x1 >= 80 ? 1 : 0)} />
        </g>
      )}
      <Dot x={sx(f, 0)} y={sy(f, CU_NI.cuMelt)} opacity={v(vis, "melt") * (f.x0 === 0 && f.t0 <= CU_NI.cuMelt ? 1 : 0)} color={COLORS.chalk} r={9} />
      <Dot x={sx(f, 100)} y={sy(f, CU_NI.niMelt)} opacity={v(vis, "melt") * (f.x1 >= 100 ? 1 : 0)} color={COLORS.chalk} r={9} />
    </g>
  );
};

// ---------- binary eutectic (Cu–Ag, Pb–Sn) ----------

export const eutecticRegions = (e: Eutectic) => {
  const liqL = smooth(e.liqL);
  const liqR = smooth(e.liqR);
  const solA = smooth(e.solA);
  const solB = smooth(e.solB);
  const solvA = smooth(e.solvA);
  const solvB = smooth(e.solvB);
  return {
    L: [...liqL, ...liqR.slice(1), [100, e.tMax], [0, e.tMax]] as Pt[],
    aL: [...liqL, [e.alphaMax, e.eT], ...rev(solA)] as Pt[],
    bL: [...liqR, ...solB.slice(1)] as Pt[],
    a: [...solA, ...solvA.slice(1), [0, e.tMin]] as Pt[],
    b: [...solB, ...solvB.slice(1), [100, e.tMin]] as Pt[],
    ab: [[e.alphaMax, e.eT], [e.betaMin, e.eT], ...solvB.slice(1), ...rev(solvA).slice(0, -1)] as Pt[],
  };
};

export const EutecticDiagram: React.FC<{ f: Frame; e: Eutectic; vis?: Vis; size?: number; xTicks?: number[]; tTicks: number[]; labels?: boolean }> = ({
  f,
  e,
  vis = {},
  size = 24,
  xTicks = [0, 20, 40, 60, 80, 100],
  tTicks,
  labels = true,
}) => {
  const r = eutecticRegions(e);
  const span = e.tMax - e.tMin;
  return (
    <g>
      <Clip f={f}>
        <Region f={f} pts={r.L} fill={PH.L} opacity={0.18 * v(vis, "L")} />
        <Region f={f} pts={r.a} fill={PH.a} opacity={0.22 * v(vis, "a")} />
        <Region f={f} pts={r.b} fill={PH.b} opacity={0.22 * v(vis, "b")} />
        <Region f={f} pts={r.ab} fill="url(#hatch-ab)" opacity={v(vis, "ab")} />
        <Region f={f} pts={r.aL} fill="url(#hatch-aL)" opacity={v(vis, "aL")} />
        <Region f={f} pts={r.bL} fill="url(#hatch-bL)" opacity={v(vis, "bL")} />
      </Clip>
      <Axes f={f} p={v(vis, "axes")} xTicks={xTicks} tTicks={tTicks} xLabel={`Composition (wt% ${e.right})`} ends={[e.left, e.right]} size={size} />
      <Curve f={f} line={e.liqL} p={v(vis, "liq")} color={PH.L} />
      <Curve f={f} line={e.liqR} p={v(vis, "liq")} color={PH.L} />
      <Curve f={f} line={e.solA} p={v(vis, "solA")} color={PH.a} />
      <Curve f={f} line={e.solvA} p={v(vis, "solvA")} color={PH.a} width={v(vis, "solvGlow") > 0 ? 8 : 5} />
      <Curve f={f} line={e.solB} p={v(vis, "solB")} color={PH.b} />
      <Curve f={f} line={e.solvB} p={v(vis, "solvB")} color={PH.b} width={v(vis, "solvGlow") > 0 ? 8 : 5} />
      <Curve
        f={f}
        line={[
          [e.alphaMax, e.eT],
          [e.betaMin, e.eT],
        ]}
        p={v(vis, "iso")}
        color={COLORS.displacement}
        width={v(vis, "isoGlow") > 0 ? 9 : 5}
        raw
      />
      {labels && (
        <g>
          <Tag x={sx(f, 50)} y={sy(f, e.tMax - span * 0.1)} text="L" color={PH.L} size={size + 6} opacity={v(vis, "L")} />
          <Tag x={sx(f, 4) + 28} y={sy(f, e.tMin + span * 0.3)} text="α" color={PH.a} size={size + 6} opacity={v(vis, "a")} anchor="start" />
          <Tag x={sx(f, 98.5) - 28} y={sy(f, e.tMin + span * 0.3)} text="β" color={PH.b} size={size + 6} opacity={v(vis, "b")} anchor="end" />
          <Tag x={sx(f, 50)} y={sy(f, e.tMin + span * 0.25)} text="α + β" color={COLORS.chalk} size={size + 4} opacity={v(vis, "ab")} />
          <Tag x={sx(f, e.eC * 0.42)} y={sy(f, e.eT + span * 0.12)} text="α + L" color={COLORS.chalk} size={size + 2} opacity={v(vis, "aL")} />
          <Tag x={sx(f, (e.eC + 100) / 2 + 3)} y={sy(f, e.eT + span * 0.06)} text="β + L" color={COLORS.chalk} size={size + 2} opacity={v(vis, "bL")} />
        </g>
      )}
      <Dot x={sx(f, 0)} y={sy(f, e.meltA)} opacity={v(vis, "melt")} color={COLORS.chalk} r={9} />
      <Dot x={sx(f, 100)} y={sy(f, e.meltB)} opacity={v(vis, "melt")} color={COLORS.chalk} r={9} />
      <Dot x={sx(f, e.eC)} y={sy(f, e.eT)} opacity={v(vis, "E")} color={COLORS.displacement} r={12} pulse={v(vis, "Epulse") < 1 ? v(vis, "Epulse") : 0} />
    </g>
  );
};

// ---------- iron–iron carbide ----------

export const feRegions = () => {
  const F = FE_C;
  const L = FE_C_LINES;
  return {
    L: [...smooth(L.liquidus), ...smooth(L.liquidusFe3C).slice(1), [F.cementite, F.tMax], [0, F.tMax]] as Pt[],
    d: [[0, F.melt], [F.deltaMax, F.peritecticT], [0, F.gammaToDelta]] as Pt[],
    dL: [[0, F.melt], [F.periLiquid, F.peritecticT], [F.deltaMax, F.peritecticT]] as Pt[],
    dg: [[0, F.gammaToDelta], [F.deltaMax, F.peritecticT], [F.periGamma, F.peritecticT]] as Pt[],
    gL: [[F.periGamma, F.peritecticT], ...part(L.liquidus, F.periLiquid, F.eutectC), ...rev(smooth(L.gammaSolidus))] as Pt[],
    g: [[0, F.gammaToDelta], ...smooth(L.gammaSolidus), ...rev(smooth(L.acm)).slice(1), ...rev(smooth(L.a3)).slice(1)] as Pt[],
    ag: [...smooth(L.a3), ...rev(smooth(L.alphaGamma)).slice(0, -1)] as Pt[],
    a: [[0, F.alphaToGamma], ...smooth(L.alphaGamma).slice(1), ...smooth(L.alphaSolvus).slice(1), [0, F.tMin]] as Pt[],
    gc: [[F.gammaMax, F.eutectT], [F.cementite, F.eutectT], [F.cementite, F.eutectoidT], ...smooth(L.acm)] as Pt[],
    Lc: [...smooth(L.liquidusFe3C), [F.cementite, F.eutectT]] as Pt[],
    ac: [...smooth(L.alphaSolvus), [F.cementite, F.tMin], [F.cementite, F.eutectoidT]] as Pt[],
  };
};

export const FeCDiagram: React.FC<{ f: Frame; vis?: Vis; size?: number; xTicks?: number[]; tTicks?: number[]; labels?: boolean }> = ({
  f,
  vis = {},
  size = 24,
  xTicks = [0, 1, 2, 3, 4, 5, 6, 6.7],
  tTicks = [400, 600, 800, 1000, 1200, 1400, 1600],
  labels = true,
}) => {
  const F = FE_C;
  const L = FE_C_LINES;
  const r = feRegions();
  const inX = (x: number) => x >= f.x0 - 1e-9 && x <= f.x1 + 1e-9;
  const line = (pts: Line, key: string, color: string = COLORS.chalk, w = 4) => <Curve f={f} line={pts} p={v(vis, key)} color={color} width={w} />;
  const full = f.x1 > 5;
  return (
    <g>
      <defs>
        <clipPath id={`fe-clip-${f.x}-${f.y}`}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#fe-clip-${f.x}-${f.y})`}>
        <Region f={f} pts={r.L} fill={PH.L} opacity={0.16 * v(vis, "L")} />
        <Region f={f} pts={r.d} fill={PH.d} opacity={0.4 * v(vis, "d")} />
        <Region f={f} pts={r.dL} fill="url(#hatch-dL)" opacity={v(vis, "d")} />
        <Region f={f} pts={r.dg} fill="url(#hatch-dg)" opacity={v(vis, "d")} />
        <Region f={f} pts={r.gL} fill="url(#hatch-gL)" opacity={v(vis, "gL")} />
        <Region f={f} pts={r.g} fill={PH.g} opacity={0.2 * v(vis, "g") + 0.25 * v(vis, "gGlow", 0)} />
        <Region f={f} pts={r.ag} fill="url(#hatch-ag)" opacity={v(vis, "ag")} />
        <Region f={f} pts={r.a} fill={PH.a} opacity={0.35 * v(vis, "a") + 0.4 * v(vis, "aGlow", 0)} />
        <Region f={f} pts={r.gc} fill="url(#hatch-gc)" opacity={v(vis, "gc")} />
        <Region f={f} pts={r.Lc} fill="url(#hatch-Lc)" opacity={v(vis, "gc")} />
        <Region f={f} pts={r.ac} fill="url(#hatch-ac)" opacity={v(vis, "ac")} />
        {line(L.liquidus, "lines", PH.L)}
        {line(L.liquidusFe3C, "lines", PH.L)}
        {line(L.deltaSolidus, "lines")}
        {line(L.deltaSolvus, "lines")}
        {line(L.gammaDelta, "lines")}
        {line(L.gammaSolidus, "lines", PH.g)}
        {line(L.a3, "lines", PH.g)}
        {line(L.acm, "lines", PH.g)}
        {line(L.alphaGamma, "lines", PH.a)}
        {line(L.alphaSolvus, "lines", PH.a)}
        {line([[F.deltaMax, F.peritecticT], [F.periLiquid, F.peritecticT]], "lines")}
        <Curve f={f} line={[[F.gammaMax, F.eutectT], [F.cementite, F.eutectT]]} p={v(vis, "lines")} color={COLORS.displacement} width={v(vis, "eGlow", 0) > 0 ? 8 : 4} raw />
        <Curve f={f} line={[[F.alphaMax, F.eutectoidT], [F.cementite, F.eutectoidT]]} p={v(vis, "lines")} color={COLORS.displacement} width={v(vis, "edGlow", 0) > 0 ? 8 : 4} raw />
        <Curve f={f} line={[[F.cementite, F.tMin], [F.cementite, F.tMax]]} p={v(vis, "fe3c")} color={PH.c} width={7} raw />
      </g>
      <Axes
        f={f}
        p={v(vis, "axes")}
        xTicks={xTicks.filter(inX)}
        tTicks={tTicks.filter((t) => t >= f.t0 && t <= f.t1)}
        xLabel="Composition (wt% C)"
        fmtX={(x) => (x === 6.7 ? "6.70" : String(x))}
        size={size}
      />
      {labels && (
        <g>
          <Tag x={sx(f, full ? 3.6 : 1.3)} y={sy(f, 1480)} text="L" color={PH.L} size={size + 6} opacity={v(vis, "L") * (f.t1 > 1450 ? 1 : 0)} />
          <Tag x={sx(f, full ? 0.75 : 0.9)} y={sy(f, full ? 1030 : 920)} text="γ austenite" color={PH.g} size={size + 2} opacity={v(vis, "g")} />
          <Tag x={sx(f, full ? 3.2 : 1.5)} y={sy(f, 1260)} text="γ + L" color={COLORS.chalk} size={size} opacity={v(vis, "gL") * (f.t1 > 1250 ? 1 : 0)} />
          <Tag x={sx(f, full ? 4.2 : 1.45)} y={sy(f, full ? 950 : 860)} text="γ + Fe₃C" color={COLORS.chalk} size={size} opacity={v(vis, "gc") * (inX(1.45) ? 1 : 0)} />
          <Tag x={sx(f, full ? 3.6 : 0.95)} y={sy(f, full ? 560 : 620)} text="α + Fe₃C" color={COLORS.chalk} size={size} opacity={v(vis, "ac")} />
          <Tag x={sx(f, full ? 0.55 : 0.28)} y={sy(f, full ? 800 : 760)} text="α + γ" color={COLORS.chalk} size={size - 2} opacity={v(vis, "ag") * (full ? 0 : 1)} />
          <Tag x={sx(f, 6.2)} y={sy(f, 1180)} text="L + Fe₃C" color={COLORS.chalk} size={size - 4} opacity={v(vis, "gc") * (full ? 1 : 0)} />
          <Tag x={sx(f, 6.7) - 10} y={sy(f, 1000)} text="Fe₃C" color={PH.c} size={size + 2} opacity={v(vis, "fe3c") * (full ? 1 : 0)} anchor="end" />
        </g>
      )}
    </g>
  );
};

// ---------- microstructures ----------

/** Deterministic hash → [0, 1). */
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type P2 = [number, number];

/** Clips a convex polygon to the half-plane (p − m)·n ≤ 0 (Sutherland–Hodgman). */
function clipHalf(poly: P2[], m: P2, n: P2): P2[] {
  const side = (p: P2) => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1];
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa <= 0) out.push(a);
    if (sa * sb < 0) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

export interface Cell {
  seed: P2;
  poly: P2[];
  angle: number; // a random orientation for layers in this grain
}

/** Grains: Voronoi cells of seeded points inside a circle of radius r (centre 0, 0). */
export function grains(n: number, r: number, seed: number): Cell[] {
  const seeds: P2[] = [];
  let k = 0;
  while (seeds.length < n && k < n * 20) {
    const x = (hash(seed + k * 2) * 2 - 1) * r;
    const y = (hash(seed + k * 2 + 1) * 2 - 1) * r;
    k++;
    if (x * x + y * y > r * r * 0.92) continue;
    if (seeds.some(([a, b]) => (a - x) ** 2 + (b - y) ** 2 < ((r * 1.2) / Math.sqrt(n)) ** 2)) continue;
    seeds.push([x, y]);
  }
  const box: P2[] = [
    [-r * 1.5, -r * 1.5],
    [r * 1.5, -r * 1.5],
    [r * 1.5, r * 1.5],
    [-r * 1.5, r * 1.5],
  ];
  return seeds.map((s, i) => {
    let poly = box;
    seeds.forEach((o, j) => {
      if (j === i) return;
      poly = clipHalf(poly, [(s[0] + o[0]) / 2, (s[1] + o[1]) / 2], [o[0] - s[0], o[1] - s[1]]);
    });
    return { seed: s, poly, angle: hash(seed + 900 + i) * 180 };
  });
}

export const polyStr = (poly: P2[], cx = 0, cy = 0) => poly.map(([x, y]) => `${(x + cx).toFixed(1)},${(y + cy).toFixed(1)}`).join(" ");
/** The polygon shrunk towards its seed by factor s (area scales by s²). */
export const shrink = (c: Cell, s: number): P2[] => c.poly.map(([x, y]) => [c.seed[0] + s * (x - c.seed[0]), c.seed[1] + s * (y - c.seed[1])]);

/** Alternating layers (lamellae) clipped to a polygon. `share` = fraction of the first colour. */
export const Lamellae: React.FC<{ id: string; poly: P2[]; angle: number; spacing: number; share: number; c1: string; c2: string; reveal?: number }> = ({
  id,
  poly,
  angle,
  spacing,
  share,
  c1,
  c2,
  reveal = 1,
}) => {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const n = Math.ceil((2 * R) / spacing);
  return (
    <g>
      <clipPath id={id}>
        <polygon points={polyStr(poly)} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <polygon points={polyStr(poly)} fill={c1} />
        <g transform={`rotate(${angle} ${cx} ${cy})`}>
          {Array.from({ length: n }, (_, i) => {
            const y = cy - R + i * spacing;
            const grow = Math.max(0, Math.min(1, reveal * 1.4 - (i / n) * 0.4));
            return <rect key={i} x={cx - R} y={y} width={2 * R * grow} height={spacing * (1 - share)} fill={c2} />;
          })}
        </g>
      </g>
    </g>
  );
};

/** A round microscope view at (cx, cy), radius r. Children are drawn in coordinates centred on (0, 0). */
export const Scope: React.FC<{ id: string; cx: number; cy: number; r: number; label?: string; labelColor?: string; opacity?: number; children: React.ReactNode }> = ({
  id,
  cx,
  cy,
  r,
  label,
  labelColor = COLORS.chalk,
  opacity = 1,
  children,
}) =>
  opacity > 0 ? (
    <g opacity={opacity}>
      <clipPath id={id}>
        <circle cx={0} cy={0} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r + 10} fill={SURFACE} stroke={COLORS.boardLine} strokeWidth={6} />
      <g transform={`translate(${cx} ${cy})`}>
        <g clipPath={`url(#${id})`}>{children}</g>
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.chalkDim} strokeWidth={4} />
      {label && (
        <T x={cx} y={cy + r + 56} color={labelColor} size={34}>
          {label}
        </T>
      )}
    </g>
  ) : null;

/** A stacked fraction bar with labels, e.g. pearlite 0.51 | ferrite 0.49. Widths are the fractions. */
export const FractionBar: React.FC<{ x: number; y: number; w: number; parts: { label: string; value: number; color: string }[]; opacity?: number; grow?: number }> = ({
  x,
  y,
  w,
  parts,
  opacity = 1,
  grow = 1,
}) => {
  let acc = 0;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={44} rx={12} fill="rgba(255,255,255,0.07)" />
      {parts.map((p, i) => {
        const left = x + acc * w;
        acc += p.value;
        const width = p.value * w * grow;
        return (
          <g key={i}>
            <rect x={left} y={y} width={Math.max(0, width)} height={44} fill={p.color} opacity={0.85} rx={i === 0 ? 12 : 0} />
            <T x={left + (p.value * w) / 2} y={y + 86} color={p.color} size={28}>
              {p.label} {p.value.toFixed(2)}
            </T>
          </g>
        );
      })}
    </g>
  );
};

/** A small atom lattice: n × m circles; `kind(i, j)` picks a colour or null to skip. */
export const Lattice: React.FC<{
  x: number;
  y: number;
  n: number;
  m: number;
  step: number;
  r: number;
  kind: (i: number, j: number) => { color: string; r?: number } | null;
  opacity?: number;
  jiggle?: number;
  time?: number;
}> = ({ x, y, n, m, step, r, kind, opacity = 1, jiggle = 0, time = 0 }) => (
  <g opacity={opacity}>
    {Array.from({ length: n * m }, (_, k) => {
      const i = k % n;
      const j = Math.floor(k / n);
      const a = kind(i, j);
      if (!a) return null;
      const dx = jiggle * Math.sin(time * 9 + hash(k) * 6.28);
      const dy = jiggle * Math.cos(time * 8 + hash(k + 50) * 6.28);
      return <circle key={k} cx={x + i * step + dx} cy={y + j * step + dy} r={a.r ?? r} fill={a.color} stroke="rgba(0,0,0,0.35)" strokeWidth={2} />;
    })}
  </g>
);
