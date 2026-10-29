"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useState } from "react";
import { Tex } from "../../components/Tex";
import { sig3 } from "../../physics/format";
import { COLORS } from "../../theme";
import { G_PRESETS, solve } from "./model";
import { ProjectileSceneProps, defaultSceneProps } from "./Scene";
import { simulateProjectile } from "./simulate";

// The scene loads fonts in the browser, so it is only rendered on the client.
const LabPlayer = dynamic(() => import("./LabPlayer"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse bg-board-raised" />,
});

const THETA_MIN = 5;
const THETA_MAX = 85;
const TOLERANCE = 1e-3; // 0.1 %

export const ProjectileLab: React.FC = () => {
  const [props, setProps] = useState<ProjectileSceneProps>(defaultSceneProps);
  const set = <K extends keyof ProjectileSceneProps>(key: K, value: ProjectileSceneProps[K]) =>
    setProps((p) => ({ ...p, [key]: value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-board-line">
        <LabPlayer props={props} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-xl border border-board-line bg-board-raised p-5">
          <h2 className="text-xl font-bold">Launch</h2>
          <Slider label="Speed u" unit="m/s" min={5} max={60} step={1} value={props.u} onChange={(v) => set("u", v)} color={COLORS.velocity} />
          <Slider label="Angle θ" unit="°" min={THETA_MIN} max={THETA_MAX} step={1} value={props.thetaDeg} onChange={(v) => set("thetaDeg", v)} color={COLORS.kan} />
          <Slider label="Gravity g" unit="m/s²" min={0.5} max={30} step={0.01} value={props.g} onChange={(v) => set("g", v)} color={COLORS.acceleration} />
          <div className="flex flex-wrap gap-2">
            {G_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set("g", p.g)}
                aria-pressed={props.g === p.g}
                className="rounded-lg border border-board-line px-3 py-2 text-base aria-pressed:border-acceleration aria-pressed:text-acceleration"
              >
                {p.label} <span className="text-chalk-dim">{p.g}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-chalk-dim">Moon and Mars values are rounded to 3 significant figures.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Toggle label="Vectors" checked={props.showVectors} onChange={(v) => set("showVectors", v)} />
            <Toggle label="Equations" checked={props.showEquations} onChange={(v) => set("showEquations", v)} />
            <Toggle label="Trail" checked={props.showTrail} onChange={(v) => set("showTrail", v)} />
            <Toggle label="θ sweep" checked={props.includeSweep} onChange={(v) => set("includeSweep", v)} />
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <DragFormula u={props.u} g={props.g} theta={props.thetaDeg} onTheta={(v) => set("thetaDeg", v)} />
          <CheckCard props={props} />
        </div>
      </div>
    </div>
  );
};

const Slider: React.FC<{
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  color: string;
  onChange: (v: number) => void;
}> = ({ label, unit, min, max, step, value, color, onChange }) => (
  <label className="flex flex-col gap-2">
    <span className="flex justify-between text-lg">
      <span>{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>
        {value} {unit}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 w-full cursor-pointer"
      style={{ accentColor: color }}
    />
  </label>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2 text-lg">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#7fe0c4]" />
    {label}
  </label>
);

/** R = u² sin 2θ / g with a θ you can grab and drag (or focus and use the arrow keys). */
const DragFormula: React.FC<{ u: number; g: number; theta: number; onTheta: (v: number) => void }> = ({
  u,
  g,
  theta,
  onTheta,
}) => {
  const drag = useRef<{ x: number; theta: number } | null>(null);
  const clamp = (v: number) => Math.min(THETA_MAX, Math.max(THETA_MIN, Math.round(v)));
  const range = solve({ u, g, thetaDeg: theta, trig: "exact" }).range;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-board-line bg-board-raised p-5">
      <h2 className="text-xl font-bold">Grab θ and drag it</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl">
        <Tex tex="R =" />
        <div className="inline-flex flex-col items-center">
          <div className="flex items-baseline">
            <Tex tex="u^{2}\sin 2" />
            <span
          role="slider"
          tabIndex={0}
          aria-label="Launch angle θ"
          aria-valuemin={THETA_MIN}
          aria-valuemax={THETA_MAX}
          aria-valuenow={theta}
          aria-valuetext={`${theta} degrees`}
          className="ml-1 cursor-ew-resize touch-none select-none rounded-md px-1 outline-offset-4 ring-2 ring-[#7fe0c4]/60"
          style={{ color: COLORS.kan }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, theta };
          }}
          onPointerMove={(e) => {
            if (drag.current) onTheta(clamp(drag.current.theta + (e.clientX - drag.current.x) / 4));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onTheta(clamp(theta + 1));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onTheta(clamp(theta - 1));
          }}
        >
          <Tex tex="\theta" />
            </span>
          </div>
          <div className="my-1 h-0.5 self-stretch bg-chalk" />
          <Tex tex="g" />
        </div>
        <Tex
          tex={`= \\dfrac{(${sig3(u)})^{2}\\sin(2 \\times ${theta}^\\circ)}{${sig3(g)}} = ${sig3(range)}\\,\\text{m}`}
        />
      </div>
      <p className="text-base text-chalk-dim">
        Drag θ left or right, or click it and use the arrow keys. The animation above updates too.
      </p>
    </section>
  );
};

/** Live proof: the closed-form answer next to an independent RK4 measurement. */
const CheckCard: React.FC<{ props: ProjectileSceneProps }> = ({ props }) => {
  const rows = useMemo(() => {
    const exact = solve(props);
    const sim = simulateProjectile(exact.components);
    return [
      { name: "Range R", unit: "m", exact: exact.range, sim: sim.range },
      { name: "Max height H", unit: "m", exact: exact.maxHeight, sim: sim.maxHeight },
      { name: "Time of flight T", unit: "s", exact: exact.timeOfFlight, sim: sim.timeOfFlight },
    ].map((r) => ({ ...r, rel: Math.abs(r.sim - r.exact) / Math.abs(r.exact) }));
  }, [props]);
  const worst = Math.max(...rows.map((r) => r.rel));
  const agree = worst < TOLERANCE;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-board-line bg-board-raised p-5">
      <h2 className="text-xl font-bold">Formula vs simulation</h2>
      <table className="w-full text-left text-base tabular-nums">
        <thead className="text-chalk-dim">
          <tr>
            <th className="py-1 font-normal">Quantity</th>
            <th className="py-1 font-normal">Formula</th>
            <th className="py-1 font-normal">RK4 (dt = 1 ms)</th>
            <th className="py-1 font-normal">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-board-line">
              <td className="py-2">{r.name}</td>
              <td className="py-2">{sig3(r.exact)} {r.unit}</td>
              <td className="py-2">{sig3(r.sim)} {r.unit}</td>
              <td className="py-2">{(r.rel * 100).toExponential(1)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-base" style={{ color: agree ? COLORS.kan : COLORS.force }}>
        {agree
          ? `Agree within 0.1% (largest difference ${(worst * 100).toExponential(1)} %), computed just now in your browser.`
          : "The formula and the simulation disagree: needs teacher review."}
      </p>
    </section>
  );
};
