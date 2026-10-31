"use client";

// 3D scenes for the student solver. Every position is computed from the same solver/motion functions
// that produce the answer, at time t (seconds of real physics). Nothing is hand-keyed.

import { Line } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { BankedParams, ConicalParams, bankedForces, bankedSpeeds, conicalMotion } from "../solver/circular";
import { fmt, trig } from "../solver/common";
import { InclineParams, inclineMotion } from "../solver/incline";
import { ProjectileParams, projectileMotion } from "../solver/projectile";
import { PendulumParams, SpringParams, pendulumMotion, pendulumPath, springMotion } from "../solver/shm";

export const QC = { v: COLORS.velocity, a: COLORS.acceleration, F: COLORS.force, s: COLORS.displacement, kan: COLORS.kan };

// ---------- shared pieces ----------

const UP = new THREE.Vector3(0, 1, 0);

/**
 * An arrow from `from` along `vec`. Each quantity has its own head, so colour is never the only cue:
 * velocity = solid cone, acceleration = double cone, force = open (wire) cone.
 */
export const Arrow3: React.FC<{ from: THREE.Vector3; vec: THREE.Vector3; color: string; kind: "v" | "a" | "F"; label?: string; dashed?: boolean; width?: number }> = ({
  from,
  vec,
  color,
  kind,
  label,
  dashed,
  width = 0.06,
}) => {
  const len = vec.length();
  if (len < 1e-4) return null;
  const dir = vec.clone().normalize();
  const head = Math.min(0.45, len * 0.35);
  const shaft = len - head;
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir);
  const mid = from.clone().add(dir.clone().multiplyScalar(shaft / 2));
  const tip = from.clone().add(vec);
  const headPos = from.clone().add(dir.clone().multiplyScalar(shaft + head / 2));
  return (
    <group>
      {dashed ? (
        <Line points={[from, from.clone().add(dir.clone().multiplyScalar(shaft))]} color={color} lineWidth={3} dashed dashSize={0.15} gapSize={0.1} />
      ) : (
        <mesh position={mid} quaternion={quat} renderOrder={5}>
          <cylinderGeometry args={[width, width, shaft, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} depthTest={false} transparent />
        </mesh>
      )}
      <mesh position={headPos} quaternion={quat} renderOrder={5}>
        <coneGeometry args={[width * 3, head, 18, 1, kind === "F"]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} wireframe={kind === "F"} side={THREE.DoubleSide} depthTest={false} transparent />
      </mesh>
      {kind === "a" && (
        <mesh position={headPos.clone().sub(dir.clone().multiplyScalar(head * 0.6))} quaternion={quat}>
          <coneGeometry args={[width * 2.6, head * 0.8, 18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} depthTest={false} transparent />
        </mesh>
      )}
      {label && (
        <TextSprite text={label} at={tip.clone().add(dir.clone().multiplyScalar(0.4))} color={color} size={0.42} />
      )}
    </group>
  );
};

/**
 * A text label drawn into a small canvas and shown on a sprite (always faces the camera).
 * Labels are fixed strings; numbers that change every frame are shown in the on-screen panel instead.
 */
export const TextSprite: React.FC<{ text: string; at: THREE.Vector3; color?: string; size?: number; boxed?: boolean }> = ({ text, at, color = COLORS.chalk, size = 0.5, boxed }) => {
  const made = useMemo(() => {
    const px = 64;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = `800 ${px}px "Atkinson Hyperlegible", "Segoe UI", sans-serif`;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + (boxed ? px : px * 0.4);
    c.width = w;
    c.height = Math.round(px * 1.5);
    ctx.font = font;
    if (boxed) {
      ctx.fillStyle = "rgba(11,16,34,0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(2, 2, c.width - 4, c.height - 4, 18);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, aspect: c.width / c.height };
  }, [text, color, boxed]);
  useEffect(() => () => made.tex.dispose(), [made]);
  return (
    <sprite position={at} scale={[size * made.aspect, size, 1]} renderOrder={10}>
      <spriteMaterial map={made.tex} transparent depthTest={false} />
    </sprite>
  );
};

export const Label3: React.FC<{ at: THREE.Vector3; color?: string; children: string }> = ({ at, color = COLORS.chalk, children }) => <TextSprite text={children} at={at} color={color} size={0.5} boxed />;

const Ground: React.FC<{ size: number; y?: number; cx?: number }> = ({ size, y = 0, cx = 0 }) => (
  <group position={[cx, y, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size * 0.6]} />
      <meshStandardMaterial color="#121a3a" />
    </mesh>
    <gridHelper args={[size, Math.round(size), "#2a3560", "#1b2448"]} position={[0, 0.002, 0]} scale={[1, 1, 0.6]} />
  </group>
);

const v3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

/** Arrow length (world units) for a vector quantity, so the biggest one in a scene is about `max` long. */
const scaler = (biggest: number, max: number) => (x: number) => (biggest > 0 ? (x / biggest) * max : 0);

export interface SceneInfo {
  /** Seconds of physics shown before the loop restarts. */
  duration: number;
  /** Where the camera looks and how far back it sits. */
  target: [number, number, number];
  distance: number;
  /** Optional camera position (otherwise: up and to the side of the target). */
  camera?: [number, number, number];
}

// ---------- projectile ----------

export function projectileInfo(p: ProjectileParams): SceneInfo {
  const m = projectileMotion(p);
  const R = m.ux * m.T;
  const H = p.h + Math.max(0, m.uy) ** 2 / (2 * p.g);
  const size = Math.max(R, H, 1);
  const k = 10 / size;
  return { duration: m.T + 1.2, target: [(R * k) / 2, (H * k) / 2, 0], distance: 16 };
}

export const ProjectileScene: React.FC<{ p: ProjectileParams; t: number }> = ({ p, t }) => {
  const m = projectileMotion(p);
  const R = m.ux * m.T;
  const H = p.h + Math.max(0, m.uy) ** 2 / (2 * p.g);
  const k = 10 / Math.max(R, H, 1); // world units per metre
  const tt = Math.min(t, m.T);
  const s = m.at(tt);
  const path = useMemo(() => Array.from({ length: 121 }, (_, i) => m.at((i / 120) * m.T)).map((q) => v3(q.x * k, q.y * k)), [m, k]);
  const done = path.slice(0, Math.max(2, Math.round((tt / m.T) * 120) + 1));
  const ball = v3(s.x * k, s.y * k);
  const vs = scaler(Math.hypot(m.ux, m.uy) + p.g * m.T, 3.2);
  const tApex = m.uy > 0 ? m.uy / p.g : 0;
  return (
    <group>
      <Ground size={Math.max(24, R * k + 8)} cx={(R * k) / 2} />
      {p.h > 0 && (
        <mesh position={[-1, (p.h * k) / 2, 0]}>
          <boxGeometry args={[2, p.h * k, 3]} />
          <meshStandardMaterial color="#3a4675" />
        </mesh>
      )}
      <Line points={path} color={COLORS.chalkDim} lineWidth={1.5} dashed dashSize={0.2} gapSize={0.15} />
      <Line points={done} color={QC.s} lineWidth={4} />
      <mesh position={ball} castShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#f5f7ff" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[ball.x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.45} />
      </mesh>
      {t < m.T && (
        <>
          <Arrow3 from={ball} vec={v3(vs(s.vx), vs(s.vy))} color={QC.v} kind="v" label="v" />
          <Arrow3 from={ball} vec={v3(vs(s.vx), 0)} color={QC.v} kind="v" dashed label="vx" width={0.035} />
          <Arrow3 from={ball} vec={v3(0, vs(s.vy))} color={QC.v} kind="v" dashed label="vy" width={0.035} />
          <Arrow3 from={ball.clone().add(v3(0.6, 0))} vec={v3(0, -1.4)} color={QC.a} kind="a" label="g" />
        </>
      )}
      {m.uy > 0 && t >= tApex && <Label3 at={v3(m.at(tApex).x * k, H * k + 0.7)} color={QC.s}>{`H = ${fmt(H)} m`}</Label3>}
      {t >= m.T && <Label3 at={v3((R * k) / 2, -0.6)} color={QC.s}>{`R = ${fmt(R)} m`}</Label3>}
    </group>
  );
};

// ---------- incline ----------

export function inclineInfo(p: InclineParams): SceneInfo {
  const mo = inclineMotion(p);
  return { duration: Math.min(mo.end, 20) + 1.2, target: [0, 2, 0], distance: 15 };
}

export const InclineScene: React.FC<{ p: InclineParams; t: number }> = ({ p, t }) => {
  const { sin, cos } = trig(p.angleDeg);
  const mo = inclineMotion(p);
  const track = mo.mode === "up" ? Math.max(mo.s1 ?? 1, 0.5) * 1.15 : p.L * 1.15;
  const k = 10 / track; // world units per metre along the slope
  const Lw = track * k;
  const base = Lw * cos;
  const height = Lw * sin;
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-base / 2, 0);
    sh.lineTo(base / 2, 0);
    sh.lineTo(-base / 2, height);
    sh.closePath();
    return sh;
  }, [base, height]);
  const down = v3(cos, -sin); // unit vector down the slope
  const normal = v3(sin, cos); // out of the slope
  // Distance from the top of the slope to the block (world units).
  const st = mo.at(Math.min(t, mo.end));
  const fromTop = mo.mode === "release" ? 0.08 * Lw - st.s * k : Lw * 0.92 - st.s * k;
  const top = v3(-base / 2, height);
  const half = 0.45;
  const centre = top.clone().add(down.clone().multiplyScalar(fromTop)).add(normal.clone().multiplyScalar(half));
  const angle = -Math.atan2(sin, cos);
  const W = p.m * p.g;
  const N = W * cos;
  const fs = scaler(W, 2.4);
  const movingDown = st.v < -1e-9;
  const movingUp = st.v > 1e-9;
  const fric = movingDown ? p.mu * N : movingUp ? p.mu * N : mo.slides ? 0 : W * sin;
  const fricDir = movingUp ? down.clone() : down.clone().multiplyScalar(-1);
  const vs = scaler(Math.max(p.u, mo.aDown * (mo.tL ?? 0), 1), 2.4);
  return (
    <group>
      <Ground size={30} y={-0.01} />
      <mesh>
        <extrudeGeometry args={[shape, { depth: 3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#3a4675" transparent opacity={0.8} />
      </mesh>
      <group position={[centre.x, centre.y, 1.5]} rotation={[0, 0, angle]}>
        <mesh castShadow>
          <boxGeometry args={[1.3, half * 2, 1.2]} />
          <meshStandardMaterial color="#d98c4a" />
        </mesh>
      </group>
      <group position={[0, 0, 1.5]}>
        <Arrow3 from={centre} vec={v3(0, -fs(W))} color={QC.F} kind="F" label="mg" />
        <Arrow3 from={centre} vec={normal.clone().multiplyScalar(fs(N))} color={QC.F} kind="F" label="N" />
        {fric > 1e-9 && <Arrow3 from={centre} vec={fricDir.clone().multiplyScalar(fs(fric))} color={QC.F} kind="F" label="f" />}
        {Math.abs(st.v) > 1e-9 && <Arrow3 from={centre.clone().add(normal.clone().multiplyScalar(0.9))} vec={down.clone().multiplyScalar(vs(-st.v))} color={QC.v} kind="v" label="v" />}
      </group>
      <Label3 at={v3(base / 2 - 1.4, 0.5, 1.6)} color={COLORS.chalkDim}>{`θ = ${p.angleDeg}°`}</Label3>
    </group>
  );
};

// ---------- banked road ----------

export function bankedSpeed(p: BankedParams) {
  const sp = bankedSpeeds(p);
  if (p.v !== undefined && p.v > 0) return p.v;
  if (p.angleDeg > 0) return sp.vIdeal;
  return Number.isFinite(sp.vMax) ? sp.vMax * 0.8 : 10;
}

export function bankedInfo(p: BankedParams): SceneInfo {
  const v = bankedSpeed(p);
  return { duration: (2 * Math.PI * p.r) / Math.max(v, 0.1), target: [4, 0, 0], distance: 14, camera: [17, 6.5, 9] };
}

export const BankedScene: React.FC<{ p: BankedParams; t: number }> = ({ p, t }) => {
  const { sin, cos, tan } = trig(p.angleDeg);
  const R = 8; // world radius of the lane
  const width = 4;
  const v = bankedSpeed(p);
  const phi = (v / p.r) * t; // angle travelled (rad)
  const lathe = useMemo(() => {
    const pts = [new THREE.Vector2(R - (width / 2) * cos, -(width / 2) * sin), new THREE.Vector2(R + (width / 2) * cos, (width / 2) * sin)];
    return new THREE.LatheGeometry(pts, 96);
  }, [cos, sin]);
  const pos = v3(R * Math.cos(phi), 0.5, -R * Math.sin(phi));
  const inward = v3(-Math.cos(phi), 0, Math.sin(phi));
  const nDir = inward.clone().multiplyScalar(sin).add(v3(0, cos, 0)); // out of the road surface
  const downSlope = inward.clone().multiplyScalar(cos).add(v3(0, -sin, 0));
  const { N, f } = bankedForces(p, v);
  const W = p.m * p.g;
  const fs = scaler(Math.max(W, N), 3);
  const centri = (p.m * v * v) / p.r;
  return (
    <group>
      <mesh geometry={lathe}>
        <meshStandardMaterial color="#3a4675" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#121a3a" />
      </mesh>
      {/* Yaw with the circle, then lean into the bank (tilt about the car's own forward axis). */}
      <group position={pos} rotation={[0, phi, Math.atan(tan)]}>
        <mesh>
          <boxGeometry args={[1.3, 0.7, 2.6]} />
          <meshStandardMaterial color="#e5484d" />
        </mesh>
        <mesh position={[0, 0.55, -0.2]}>
          <boxGeometry args={[1.1, 0.45, 1.3]} />
          <meshStandardMaterial color="#ff8a8f" />
        </mesh>
      </group>
      <Arrow3 from={pos} vec={v3(0, -fs(W))} color={QC.F} kind="F" label="mg" />
      <Arrow3 from={pos} vec={nDir.clone().multiplyScalar(fs(N))} color={QC.F} kind="F" label="N" />
      {Math.abs(f) > 1e-6 && <Arrow3 from={pos} vec={downSlope.clone().multiplyScalar(fs(f))} color={QC.F} kind="F" label="f" />}
      <Arrow3 from={pos.clone().add(v3(0, 1.2, 0))} vec={inward.clone().multiplyScalar(fs(centri))} color={QC.a} kind="a" label="towards centre" />
      <Label3 at={v3(0, 2.5, 0)} color={COLORS.chalkDim}>{`v = ${fmt(v)} m/s · r = ${p.r} m · θ = ${p.angleDeg}°`}</Label3>
    </group>
  );
};

// ---------- conical pendulum ----------

export function conicalInfo(p: ConicalParams): SceneInfo {
  return { duration: conicalMotion(p).period * 3, target: [0, -2, 0], distance: 14 };
}

export const ConicalScene: React.FC<{ p: ConicalParams; t: number }> = ({ p, t }) => {
  const mo = conicalMotion(p);
  const k = 6 / p.L;
  const r = mo.radius * k;
  const depth = mo.depth * k;
  const phi = mo.omega * t;
  const bob = v3(r * Math.cos(phi), -depth, -r * Math.sin(phi));
  const pivot = v3(0, 0, 0);
  const circle = useMemo(() => Array.from({ length: 97 }, (_, i) => v3(r * Math.cos((i / 96) * 2 * Math.PI), -depth, -r * Math.sin((i / 96) * 2 * Math.PI))), [r, depth]);
  const W = p.m * p.g;
  const T = W / trig(p.angleDeg).cos;
  const fs = scaler(T, 2.6);
  const toPivot = pivot.clone().sub(bob).normalize();
  const inward = v3(-Math.cos(phi), 0, Math.sin(phi));
  const vdir = v3(-Math.sin(phi), 0, -Math.cos(phi));
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.4, 0.3, 2.4]} />
        <meshStandardMaterial color="#3a4675" />
      </mesh>
      <Line points={[pivot, bob]} color={COLORS.chalk} lineWidth={2.5} />
      <Line points={[pivot, v3(0, -depth - 1, 0)]} color={COLORS.chalkDim} lineWidth={1} dashed dashSize={0.2} gapSize={0.15} />
      <Line points={circle} color={QC.s} lineWidth={2} dashed dashSize={0.25} gapSize={0.15} />
      <mesh position={bob}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#f5f7ff" />
      </mesh>
      <Arrow3 from={bob} vec={toPivot.clone().multiplyScalar(fs(T))} color={QC.F} kind="F" label="T" />
      <Arrow3 from={bob} vec={v3(0, -fs(W))} color={QC.F} kind="F" label="mg" />
      <Arrow3 from={bob} vec={inward.clone().multiplyScalar(1.6)} color={QC.a} kind="a" label="a (centre)" />
      <Arrow3 from={bob} vec={vdir.clone().multiplyScalar(1.6)} color={QC.v} kind="v" label="v" />
      <Label3 at={v3(0, 1.2, 0)} color={COLORS.chalkDim}>{`L = ${p.L} m · θ = ${p.angleDeg}° · one circle in ${fmt(mo.period)} s`}</Label3>
    </group>
  );
};

// ---------- spring ----------

export function springInfo(p: SpringParams): SceneInfo {
  return { duration: springMotion(p).period * 3, target: [3, 1, 0], distance: 12 };
}

export const SpringScene: React.FC<{ p: SpringParams; t: number }> = ({ p, t }) => {
  const mo = springMotion(p);
  const s = mo.at(t);
  const k = 2.2 / p.A; // amplitude drawn as 2.2 world units
  const eq = 5; // equilibrium position of the block's left face
  const x = s.x * k;
  const left = 0;
  const right = eq + x;
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 12;
    for (let i = 0; i <= 240; i++) {
      const u = i / 240;
      pts.push(v3(left + u * (right - left), 0.7 + 0.35 * Math.sin(u * turns * 2 * Math.PI), 0.35 * Math.cos(u * turns * 2 * Math.PI)));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [right]);
  const vs = scaler(p.A * mo.omega, 2);
  const F = -p.k * s.x;
  const fs = scaler(p.k * p.A, 2);
  const block = v3(right + 0.7, 0.7);
  return (
    <group>
      <Ground size={20} cx={4} />
      <mesh position={[-0.2, 1.2, 0]}>
        <boxGeometry args={[0.4, 2.4, 2.4]} />
        <meshStandardMaterial color="#3a4675" />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 400, 0.05, 8, false]} />
        <meshStandardMaterial color="#c9d2e3" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={block}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#d98c4a" />
      </mesh>
      <Line points={[v3(eq + 0.7, 0.01, -1.5), v3(eq + 0.7, 0.01, 1.5)]} color={QC.s} lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />
      <Label3 at={v3(eq + 0.7, -0.4, 1.6)} color={QC.s}>x = 0</Label3>
      <Arrow3 from={block.clone().add(v3(0, 1.1))} vec={v3(vs(s.v), 0)} color={QC.v} kind="v" label="v" />
      <Arrow3 from={block.clone().add(v3(0, -0.2, 0.9))} vec={v3(fs(F), 0)} color={QC.F} kind="F" label="F = −kx" />
    </group>
  );
};

export const EnergyBars: React.FC<{ ke: number; pe: number; total: number }> = ({ ke, pe, total }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120, background: "rgba(11,16,34,0.85)", padding: 10, borderRadius: 12, border: `1px solid ${COLORS.boardLine}` }}>
    {[
      { name: "KE", v: ke, c: QC.v },
      { name: "PE", v: pe, c: QC.kan },
      { name: "Total", v: total, c: COLORS.chalk },
    ].map((b) => (
      <div key={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ width: 26, height: 90, display: "flex", alignItems: "flex-end", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>
          <div style={{ width: "100%", height: `${(Math.max(0, b.v) / total) * 100}%`, background: b.c, borderRadius: 6 }} />
        </div>
        <div style={{ color: b.c, fontSize: 12, fontWeight: 800 }}>{b.name}</div>
      </div>
    ))}
  </div>
);

// ---------- pendulum ----------

export function pendulumInfo(p: PendulumParams): SceneInfo {
  return { duration: pendulumMotion(p).exact * 3, target: [0, -3, 0], distance: 13 };
}

export const PendulumScene: React.FC<{ p: PendulumParams; t: number }> = ({ p, t }) => {
  const mo = pendulumMotion(p);
  const path = useMemo(() => pendulumPath(p, mo.exact * 3 + 1), [p, mo.exact]);
  const i = Math.min(path.angles.length - 2, Math.floor(t / path.dt));
  const th = path.angles[i];
  const w = (path.angles[i + 1] - path.angles[i - 1 < 0 ? 0 : i - 1]) / (path.dt * (i === 0 ? 1 : 2));
  const Lw = 6;
  const bob = v3(Lw * Math.sin(th), -Lw * Math.cos(th));
  const arc = useMemo(() => Array.from({ length: 41 }, (_, j) => {
    const a = -mo.th0 + (j / 40) * 2 * mo.th0;
    return v3(Lw * Math.sin(a), -Lw * Math.cos(a));
  }), [mo.th0]);
  const vmax = Math.sqrt(2 * p.g * p.L * (1 - Math.cos(mo.th0)));
  const vs = scaler(vmax, 2);
  const speed = w * p.L;
  const tangent = v3(Math.cos(th), Math.sin(th));
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3, 0.3, 1.6]} />
        <meshStandardMaterial color="#3a4675" />
      </mesh>
      <Line points={[v3(0, 0), bob]} color={COLORS.chalk} lineWidth={2.5} />
      <Line points={[v3(0, 0), v3(0, -Lw - 0.8)]} color={COLORS.chalkDim} lineWidth={1} dashed dashSize={0.2} gapSize={0.15} />
      <Line points={arc} color={QC.s} lineWidth={2} dashed dashSize={0.2} gapSize={0.12} />
      <mesh position={bob}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#f5f7ff" />
      </mesh>
      <Arrow3 from={bob} vec={tangent.clone().multiplyScalar(vs(speed))} color={QC.v} kind="v" label="v" />
      <Arrow3 from={bob} vec={v3(0, -1.5)} color={QC.F} kind="F" label="mg" />
      <Label3 at={v3(0, 1.1)} color={COLORS.chalkDim}>{`L = ${p.L} m · swing ${p.amplitudeDeg}°`}</Label3>
    </group>
  );
};

// ---------- on-screen readout (numbers that change every frame) ----------

export interface Hud {
  rows: { label: string; value: string; color?: string }[];
  energy?: { ke: number; pe: number; total: number };
}

export function hudFor(id: string, p: Record<string, number>, t: number): Hud {
  switch (id) {
    case "projectile": {
      const m = projectileMotion(p as ProjectileParams);
      const s = m.at(Math.min(t, m.T));
      return { rows: [{ label: "t", value: `${Math.min(t, m.T).toFixed(2)} s` }, { label: "x", value: `${s.x.toFixed(2)} m`, color: QC.s }, { label: "y", value: `${s.y.toFixed(2)} m`, color: QC.s }, { label: "speed", value: `${Math.hypot(s.vx, s.vy).toFixed(2)} m/s`, color: QC.v }] };
    }
    case "incline": {
      const mo = inclineMotion(p as InclineParams);
      const st = mo.at(Math.min(t, mo.end));
      return { rows: [{ label: "t", value: `${Math.min(t, mo.end).toFixed(2)} s` }, { label: "moved", value: `${Math.abs(st.s).toFixed(2)} m`, color: QC.s }, { label: "speed", value: `${Math.abs(st.v).toFixed(2)} m/s`, color: QC.v }] };
    }
    case "banked": {
      const bp = p as BankedParams;
      const v = bankedSpeed(bp);
      const { N, f } = bankedForces(bp, v);
      return { rows: [{ label: "speed", value: `${v.toFixed(2)} m/s`, color: QC.v }, { label: "N", value: `${N.toFixed(0)} N`, color: QC.F }, { label: "friction", value: `${Math.abs(f).toFixed(0)} N`, color: QC.F }, { label: "laps", value: ((v * t) / (2 * Math.PI * bp.r)).toFixed(2) }] };
    }
    case "conical": {
      const mo = conicalMotion(p as ConicalParams);
      return { rows: [{ label: "t", value: `${t.toFixed(2)} s` }, { label: "circles", value: (t / mo.period).toFixed(2) }, { label: "speed", value: `${(mo.omega * mo.radius).toFixed(2)} m/s`, color: QC.v }] };
    }
    case "spring": {
      const sp = p as SpringParams;
      const s = springMotion(sp).at(t);
      const E = 0.5 * sp.k * sp.A * sp.A;
      const ke = 0.5 * sp.m * s.v * s.v;
      return { rows: [{ label: "x", value: `${(s.x * 100).toFixed(1)} cm`, color: QC.s }, { label: "v", value: `${s.v.toFixed(2)} m/s`, color: QC.v }], energy: { ke, pe: E - ke, total: E } };
    }
    case "pendulum": {
      const pp = p as PendulumParams;
      const mo = pendulumMotion(pp);
      const path = pendulumPath(pp, Math.min(t, mo.exact * 3) + 0.01, 1 / 240);
      const th = path.angles[path.angles.length - 1];
      const E = pp.g * pp.L * (1 - Math.cos(mo.th0)); // per kg
      const pe = pp.g * pp.L * (1 - Math.cos(th));
      return { rows: [{ label: "θ", value: `${((th * 180) / Math.PI).toFixed(1)}°` }, { label: "speed", value: `${Math.sqrt(Math.max(0, 2 * (E - pe))).toFixed(2)} m/s`, color: QC.v }], energy: { ke: E - pe, pe, total: E } };
    }
  }
  return { rows: [] };
}
