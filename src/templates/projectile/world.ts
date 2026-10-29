import { LaunchComponents, stateAt } from "../../physics/projectile";
import { ProjectileParams, solve } from "./model";

/** Where the board sits on the frame. All values in frame pixels. */
export interface Layout {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  groundY: number;
  kanR: number;
  /** Multiplies label and HUD text sizes. */
  textScale: number;
}

export const LANDSCAPE: Layout = {
  width: 1920,
  height: 1080,
  left: 180,
  right: 1760,
  top: 150,
  groundY: 760,
  kanR: 40,
  textScale: 1,
};

/** 9:16 Short. The board sits in the middle third, clear of the Shorts UI. */
export const PORTRAIT: Layout = {
  width: 1080,
  height: 1920,
  left: 130,
  right: 900,
  top: 560,
  groundY: 1100,
  kanR: 44,
  textScale: 1.25,
};

/**
 * Safe area for text in a Short: YouTube does not publish exact sizes, so
 * these are common-practice margins (≈15% top, 20% bottom, 12% right, 5% left).
 */
export const SHORTS_SAFE = { left: 54, right: 950, top: 288, bottom: 1536 };

export interface World {
  layout: Layout;
  k: number;
  maxR: number;
  x: (xm: number) => number;
  y: (ym: number) => number;
}

/**
 * Metres-to-pixels mapping. One fixed scale for a whole video, chosen so
 * every launch angle that will appear fits, so distances stay comparable.
 */
export function makeWorld(p: ProjectileParams, extraThetas: number[], layout: Layout): World {
  let maxR = solve(p).range;
  let maxH = solve(p).maxHeight;
  for (const th of extraThetas) {
    const r = solve({ ...p, thetaDeg: th, trig: "exact" });
    maxR = Math.max(maxR, r.range);
    maxH = Math.max(maxH, r.maxHeight);
  }
  const k = Math.min(
    (layout.right - layout.left) / maxR,
    (layout.groundY - layout.kanR - layout.top) / maxH,
  );
  return {
    layout,
    k,
    maxR,
    x: (xm) => layout.left + xm * k,
    y: (ym) => layout.groundY - layout.kanR - ym * k,
  };
}

export function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

export function pathFor(c: LaunchComponents, world: World, tEnd: number, samples = 80): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const s = stateAt(c, (tEnd * i) / samples);
    d += `${i === 0 ? "M" : "L"} ${world.x(s.x).toFixed(1)} ${world.y(s.y).toFixed(1)} `;
  }
  return d;
}
