"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../theme";
import { BankedParams, ConicalParams } from "../solver/circular";
import { TemplateId } from "../solver";
import { InclineParams } from "../solver/incline";
import { ProjectileParams } from "../solver/projectile";
import { PendulumParams, SpringParams } from "../solver/shm";
import {
  BankedScene,
  ConicalScene,
  EnergyBars,
  InclineScene,
  PendulumScene,
  ProjectileScene,
  QC,
  SceneInfo,
  SpringScene,
  bankedInfo,
  conicalInfo,
  hudFor,
  inclineInfo,
  pendulumInfo,
  projectileInfo,
  springInfo,
} from "./Scenes";

type P = Record<string, number>;

function info(id: TemplateId, p: P): SceneInfo {
  switch (id) {
    case "projectile":
      return projectileInfo(p as ProjectileParams);
    case "incline":
      return inclineInfo(p as InclineParams);
    case "banked":
      return bankedInfo(p as BankedParams);
    case "conical":
      return conicalInfo(p as ConicalParams);
    case "spring":
      return springInfo(p as SpringParams);
    case "pendulum":
      return pendulumInfo(p as PendulumParams);
  }
}

const SceneFor: React.FC<{ id: TemplateId; p: P; t: number }> = ({ id, p, t }) => {
  switch (id) {
    case "projectile":
      return <ProjectileScene p={p as ProjectileParams} t={t} />;
    case "incline":
      return <InclineScene p={p as InclineParams} t={t} />;
    case "banked":
      return <BankedScene p={p as BankedParams} t={t} />;
    case "conical":
      return <ConicalScene p={p as ConicalParams} t={t} />;
    case "spring":
      return <SpringScene p={p as SpringParams} t={t} />;
    case "pendulum":
      return <PendulumScene p={p as PendulumParams} t={t} />;
  }
};

const SPEEDS = [0.25, 0.5, 1, 2];

/** 3D view of one solved question. Time runs at real physics speed × the chosen speed, and loops. */
export default function Viewer({ id, params }: { id: TemplateId; params: P }) {
  const sc = info(id, params);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const last = useRef<number | null>(null);
  const key = `${id}:${JSON.stringify(params)}`;

  useEffect(() => {
    setT(0);
    setPlaying(true);
  }, [key]);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const dt = Math.min(0.1, (now - last.current) / 1000);
        setT((x) => {
          const nx = x + dt * speed;
          return nx > sc.duration ? 0 : nx;
        });
      }
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, sc.duration]);

  const [tx, ty, tz] = sc.target;
  // Phones are tall and narrow: step the camera back so the whole scene fits.
  const [narrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const back = narrow ? 1.7 : 1;
  const camPos: [number, number, number] = sc.camera ? [tx + (sc.camera[0] - tx) * back, ty + (sc.camera[1] - ty) * back, tz + (sc.camera[2] - tz) * back] : [tx + sc.distance * 0.35 * back, ty + sc.distance * 0.35 * back, tz + sc.distance * back];
  const hud = hudFor(id, params, t);
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-board-line sm:h-[560px]" style={{ background: "radial-gradient(circle at 50% 30%, #18245a, #0b1022 70%)" }}>
      <Canvas key={key} shadows camera={{ position: camPos, fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[8, 14, 10]} intensity={1.4} castShadow />
        <pointLight position={[-8, 6, -6]} intensity={30} color="#7aa2ff" />
        <SceneFor id={id} p={params} t={t} />
        <OrbitControls target={[tx, ty, tz]} enableDamping makeDefault />
      </Canvas>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm">
        <button className="rounded-lg bg-white/10 px-3 py-2 font-bold hover:bg-white/20" onClick={() => setPlaying((x) => !x)}>
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button className="rounded-lg bg-white/10 px-3 py-2 font-bold hover:bg-white/20" onClick={() => setT(0)}>
          ↺ Restart
        </button>
        <input
          aria-label="Time"
          type="range"
          min={0}
          max={sc.duration}
          step={0.01}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          className="min-w-[120px] flex-1 accent-[#4ef0c4]"
        />
        <span className="w-20 text-right tabular-nums text-chalk-dim">{t.toFixed(2)} s</span>
        {SPEEDS.map((s) => (
          <button key={s} className={`rounded-lg px-2.5 py-2 font-bold ${s === speed ? "bg-[#4ef0c4] text-board" : "bg-white/10 hover:bg-white/20"}`} onClick={() => setSpeed(s)}>
            {s}×
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-xs font-bold">
        <span style={{ color: QC.v }}>▲ velocity</span>
        <span style={{ color: QC.a }}>▲▲ acceleration</span>
        <span style={{ color: QC.F }}>△ force</span>
        <span style={{ color: QC.s }}>— path</span>
        <span style={{ color: COLORS.chalkDim }}>· drag to rotate, scroll to zoom</span>
      </div>
      <div className="pointer-events-none absolute right-3 top-10 flex flex-col items-end gap-2">
        <div className="rounded-xl border border-board-line bg-[rgba(11,16,34,0.85)] px-3 py-2 text-sm tabular-nums">
          {hud.rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4">
              <span className="text-chalk-dim">{r.label}</span>
              <b style={{ color: r.color ?? COLORS.chalk }}>{r.value}</b>
            </div>
          ))}
        </div>
        {hud.energy && <EnergyBars ke={hud.energy.ke} pe={hud.energy.pe} total={hud.energy.total} />}
      </div>
    </div>
  );
}
