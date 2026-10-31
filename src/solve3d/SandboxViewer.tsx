"use client";

// 3D playback of any simulated scene. Positions come straight from the simulator's frames.

import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SimResult, simulate } from "../sandbox/sim";
import { SceneSpec } from "../sandbox/spec";
import { COLORS } from "../theme";
import { Arrow3, QC, TextSprite } from "./Scenes";

const v3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
const BODY_COLORS = ["#f5f7ff", "#ffb21f", "#4ef0c4", "#b79bff", "#ff8a8f", "#7fb6ff", "#e3b341", "#9aa6c0"];

/** Playback seconds for a run of `D` physics seconds: real time when it is a few seconds long, otherwise squeezed or stretched. */
export function playbackSeconds(D: number) {
  if (D >= 3 && D <= 15) return D;
  return D < 3 ? Math.min(6, Math.max(3, D * 4)) : 12;
}

export default function SandboxViewer({ scene, sim: given }: { scene: SceneSpec; sim?: SimResult }) {
  const own = useMemo(() => (given ? null : simulate(scene)), [scene, given]);
  const sim = given ?? own!;
  const D = scene.duration;
  const P = playbackSeconds(D);
  const [t, setT] = useState(0); // physics time
  const [playing, setPlaying] = useState(true);
  const last = useRef<number | null>(null);

  useEffect(() => {
    setT(0);
    setPlaying(true);
  }, [sim]);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const dt = Math.min(0.1, (now - last.current) / 1000) * (D / P);
        setT((x) => (x + dt > D * 1.08 ? 0 : x + dt));
      }
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, D, P]);

  // Frame at time t (frames are evenly spaced in time).
  const frames = sim.frames;
  const fi = Math.min(frames.length - 1, Math.round((Math.min(t, D) / D) * (frames.length - 1)));
  const frame = frames[fi];

  const { min, max } = sim.bounds;
  const centre: [number, number, number] = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 1e-6);
  // Everything is drawn in "scene units" = metres × k so the view is about 10 units across whatever the real size.
  const k = 10 / size;
  const toW = (p: readonly number[]) => v3([(p[0] - centre[0]) * k, (p[1] - centre[1]) * k, (p[2] - centre[2]) * k]);
  const groundW = scene.groundY !== null ? (scene.groundY - centre[1]) * k : null;
  const maxSpeed = Math.max(1e-12, ...frames.flatMap((f) => f.vel.map((v) => Math.hypot(v[0], v[1], v[2]))));
  // Recomputed every render (cheap: ~1200 points per body); keeps the trail in the same coordinates as the bodies.
  const trails = scene.bodies.map((_, b) => frames.map((f) => toW(f.pos[b])));
  const main = scene.measure ? scene.bodies.findIndex((b) => b.id === scene.measure!.body) : 0;
  const mainV = frame.vel[Math.max(0, main)];
  const timeScale = D / P;

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-board-line sm:h-[520px]" style={{ background: "radial-gradient(circle at 50% 30%, #18245a, #0b1022 70%)" }}>
      <Canvas camera={{ position: [3, 4, 15], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[8, 14, 10]} intensity={1.4} />
        {groundW !== null && (
          <group position={[0, groundW, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[16, 10]} />
              <meshStandardMaterial color="#121a3a" />
            </mesh>
            <gridHelper args={[16, 16, "#2a3560", "#1b2448"]} position={[0, 0.002, 0]} />
          </group>
        )}
        {scene.springs.map((s, i) => {
          const bIdx = scene.bodies.findIndex((b) => b.id === s.b);
          const aIdx = scene.bodies.findIndex((b) => b.id === s.a);
          if (bIdx < 0) return null;
          const A = s.a === "anchor" ? toW(s.anchor ?? [0, 0, 0]) : toW(frame.pos[aIdx]);
          const B = toW(frame.pos[bIdx]);
          const pts: THREE.Vector3[] = [];
          const d = B.clone().sub(A);
          const perp = new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(0.25);
          for (let j = 0; j <= 40; j++) pts.push(A.clone().add(d.clone().multiplyScalar(j / 40)).add(perp.clone().multiplyScalar(j === 0 || j === 40 ? 0 : j % 2 ? 1 : -1)));
          return <Line key={i} points={pts} color="#c9d2e3" lineWidth={2.5} />;
        })}
        {scene.bodies.map((b, i) => {
          const p = toW(frame.pos[i]);
          // Planets and other fixed bodies at true size (at least visible); moving bodies as clear dots.
          const r = b.fixed ? Math.max(b.radius * k, 0.25) : Math.min(0.4, Math.max(b.radius * k, 0.15));
          const color = b.charge > 0 ? COLORS.force : b.charge < 0 ? COLORS.velocity : BODY_COLORS[i % BODY_COLORS.length];
          const v = frame.vel[i];
          const sp = Math.hypot(v[0], v[1], v[2]);
          const vk = (1.8 / maxSpeed) * sp;
          return (
            <group key={b.id}>
              {!b.fixed && trails[i].length > 1 && <Line points={trails[i].slice(0, fi + 1).length > 1 ? trails[i].slice(0, fi + 1) : [p, p]} color={QC.s} lineWidth={3} />}
              <mesh position={p}>
                <sphereGeometry args={[r, 32, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
              </mesh>
              <TextSprite text={`${b.label || b.id}${b.charge ? (b.charge > 0 ? " (+)" : " (−)") : ""}`} at={p.clone().add(new THREE.Vector3(0, r + 0.45, 0))} color={COLORS.chalk} size={0.42} boxed />
              {!b.fixed && sp > 1e-9 && <Arrow3 from={p} vec={new THREE.Vector3(v[0], v[1], v[2]).normalize().multiplyScalar(Math.max(0.3, vk))} color={QC.v} kind="v" label="v" />}
            </group>
          );
        })}
        {scene.g > 0 && <Arrow3 from={new THREE.Vector3(5.5, 4, 0)} vec={new THREE.Vector3(0, -1.4, 0)} color={QC.a} kind="a" label="g" />}
        {(scene.E[0] || scene.E[1] || scene.E[2]) && <Arrow3 from={new THREE.Vector3(-5.5, 4, 0)} vec={v3(scene.E).normalize().multiplyScalar(1.6)} color={COLORS.displacement} kind="F" label="E field" />}
        {(scene.B[0] || scene.B[1] || scene.B[2]) && <Arrow3 from={new THREE.Vector3(-5.5, -3, 0)} vec={v3(scene.B).normalize().multiplyScalar(1.6)} color={COLORS.kan} kind="F" label="B field" />}
        <OrbitControls target={[0, 0, 0]} enableDamping makeDefault />
      </Canvas>
      <div className="pointer-events-none absolute right-3 top-3 rounded-xl border border-board-line bg-[rgba(11,16,34,0.85)] px-3 py-2 text-sm tabular-nums">
        <div className="flex justify-between gap-4">
          <span className="text-chalk-dim">t</span>
          <b>{fmtT(Math.min(t, D))}</b>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-chalk-dim">speed</span>
          <b style={{ color: QC.v }}>{fmtNum(Math.hypot(mainV[0], mainV[1], mainV[2]))} m/s</b>
        </div>
        {Math.abs(timeScale - 1) > 0.05 && <div className="text-xs text-chalk-dim">{timeScale > 1 ? `sped up ${fmtNum(timeScale)}×` : `slowed down ${fmtNum(1 / timeScale)}×`}</div>}
      </div>
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
          max={D}
          step={D / 1000}
          value={Math.min(t, D)}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          className="min-w-[120px] flex-1 accent-[#4ef0c4]"
        />
      </div>
    </div>
  );
}

function fmtNum(x: number) {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return x.toExponential(2);
  return String(Number(x.toPrecision(3)));
}
function fmtT(s: number) {
  if (s >= 86400 * 2) return `${fmtNum(s / 86400)} days`;
  if (s >= 7200) return `${fmtNum(s / 3600)} h`;
  return `${fmtNum(s)} s`;
}
