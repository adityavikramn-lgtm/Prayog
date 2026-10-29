import { Easing, interpolate } from "remotion";
import { ProjectileParams, solve } from "./model";

/** Seconds of video for each beat. */
export const PRE_LAUNCH_S = 1.2;
export const LANDING_S = 2.6;
export const SWEEP_S = 10;
const MIN_FLIGHT_S = 2.5;
const MAX_FLIGHT_S = 8;

export interface Timeline {
  launchAt: number;
  landAt: number;
  sweepAt: number;
  end: number;
  /** Simulated seconds per video second. 1 = real time. Shown on screen when ≠ 1. */
  rate: number;
  timeOfFlight: number;
}

/**
 * Very short or very long flights are slowed down or sped up so they stay
 * watchable. The rate is constant during the flight (no easing on physics)
 * and is always shown on screen when it isn't 1×.
 */
export function buildTimeline(p: ProjectileParams, includeSweep: boolean): Timeline {
  const T = solve(p).timeOfFlight;
  const flightS = Math.min(MAX_FLIGHT_S, Math.max(MIN_FLIGHT_S, T));
  const launchAt = PRE_LAUNCH_S;
  const landAt = launchAt + flightS;
  const sweepAt = landAt + LANDING_S;
  return {
    launchAt,
    landAt,
    sweepAt,
    end: includeSweep ? sweepAt + SWEEP_S : sweepAt,
    rate: T / flightS,
    timeOfFlight: T,
  };
}

export function physicsTime(tl: Timeline, videoTime: number): number {
  const t = (videoTime - tl.launchAt) * tl.rate;
  return Math.min(tl.timeOfFlight, Math.max(0, t));
}

export function durationInFrames(p: ProjectileParams, includeSweep: boolean, fps: number): number {
  return Math.ceil(buildTimeline(p, includeSweep).end * fps);
}

export type SweepStage = "grab" | "drag" | "max" | "pair";

/**
 * The signature move: Kan pulls θ out of R = u² sin 2θ / g and drags it.
 * θ is a parameter being changed by hand, so easing it is fine; each
 * trajectory drawn for a θ is still computed exactly.
 */
export function sweepAt(local: number, theta0: number): { theta: number; stage: SweepStage; grab: number } {
  const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const theta =
    local < 1
      ? theta0
      : local < 3
        ? interpolate(local, [1, 3], [theta0, 75], ease)
        : local < 5.2
          ? interpolate(local, [3, 5.2], [75, 15], ease)
          : interpolate(local, [5.2, 6.8], [15, 45], ease);
  const stage: SweepStage = local < 1 ? "grab" : local < 6.8 ? "drag" : local < 8.2 ? "max" : "pair";
  const grab = interpolate(local, [0.2, 0.9], [0, 1], { ...ease, easing: Easing.out(Easing.back(1.6)) });
  return { theta, stage, grab };
}

/** The complementary pair shown at the end: θ₀ and 90° − θ₀ (30°/60° if θ₀ ≈ 45°). */
export function complementaryPair(theta0: number): [number, number] {
  const a = Math.abs(theta0 - 45) < 3 ? 30 : theta0;
  return [Math.min(a, 90 - a), Math.max(a, 90 - a)];
}
