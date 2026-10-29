import { DragSetup, totalWork } from "../../physics/hemisphere";

/** The worked example in the video: 2 kg, R = 1 m, μ = 0.5, g = 10 m/s² → 30 J. */
export const EXAMPLE: DragSetup = { m: 2, g: 10, R: 1, mu: 0.5 };

/** Common wrong answers, each tied to the mistake that produces it. */
export const MISTAKES = [
  {
    id: "no-friction",
    en: "Forgot friction: W = mgR",
    value: (s: DragSetup) => s.m * s.g * s.R,
  },
  {
    id: "n-equals-mg",
    en: "Took N = mg everywhere: W = mgR + μmg·(πR/2)",
    value: (s: DragSetup) => s.m * s.g * s.R + s.mu * s.m * s.g * ((Math.PI * s.R) / 2),
  },
  {
    id: "friction-only",
    en: "Counted only friction: W = μmgR",
    value: (s: DragSetup) => s.mu * s.m * s.g * s.R,
  },
] as const;

export const correctAnswer = totalWork;
