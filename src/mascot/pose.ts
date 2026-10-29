import type { KanArms, KanExpression } from "./Kan";

export interface KanPose {
  expression: KanExpression;
  arms: KanArms;
  squash: number;
  squashOrigin: "center" | "bottom";
}

/**
 * Kan's mood follows the physics:
 * calm at rest → excited at launch → floating (calm, arms out) near the top
 * where v_y ≈ 0 → scared when falling fast → squash + dizzy on landing → proud.
 * Squash and stretch only deform Kan's body; its position always comes from
 * the solver.
 */
export function poseFromPhysics({
  videoTime,
  launchAt,
  landAt,
  vy,
  uy,
}: {
  videoTime: number;
  launchAt: number;
  landAt: number;
  vy: number;
  uy: number;
}): KanPose {
  const crouch = 0.45;
  if (videoTime < launchAt - crouch) {
    return { expression: "calm", arms: "none", squash: 1, squashOrigin: "bottom" };
  }
  if (videoTime < launchAt) {
    const p = (videoTime - (launchAt - crouch)) / crouch;
    return { expression: "excited", arms: "none", squash: 1 + 0.25 * p, squashOrigin: "bottom" };
  }
  if (videoTime < landAt) {
    const sinceLaunch = videoTime - launchAt;
    const squash = 1 - 0.18 * Math.exp(-sinceLaunch / 0.12);
    const ratio = vy / uy;
    if (Math.abs(ratio) < 0.2) return { expression: "calm", arms: "out", squash, squashOrigin: "center" };
    if (ratio > 0) return { expression: "excited", arms: "none", squash, squashOrigin: "center" };
    if (ratio < -0.55) return { expression: "scared", arms: "none", squash, squashOrigin: "center" };
    return { expression: "calm", arms: "none", squash, squashOrigin: "center" };
  }
  const sinceLand = videoTime - landAt;
  const squash = 1 + 0.4 * Math.exp(-sinceLand / 0.2) * Math.cos((2 * Math.PI * sinceLand) / 0.4);
  return {
    expression: sinceLand < 1.3 ? "dizzy" : "proud",
    arms: "none",
    squash,
    squashOrigin: "bottom",
  };
}
