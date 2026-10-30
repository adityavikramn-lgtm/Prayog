// Two Class 6–8 Science Shorts (9:16), built on the same engine as the Motion in a Plane Shorts:
//   "measure"  (Class 6 · measurement of length): two people measure one table in handspans and disagree.
//   "friction" (Class 8 · friction): a box needs 100 N to start moving but only 60 N to keep moving.
// Every number on screen comes from here; tests/middle-shorts.test.ts checks it.

import { PlaneLine } from "./plane";

export const G = 10; // m/s²

// ---------- Class 6: measuring with handspans ----------

export const TABLE_M = 1.6; // the table is 1.6 m long
export const SPANS = {
  riya: { name: "Riya", cm: 20 },
  arjun: { name: "Arjun", cm: 16 },
};
export const spansFor = (cm: number) => (TABLE_M * 100) / cm; // 8 and 10

// ---------- Class 8: static vs sliding friction ----------

export const BOX = { kg: 20, staticMaxN: 100, slidingN: 60 }; // weight 200 N
export const weightN = BOX.kg * G;

/**
 * The push, step by step (seconds of physics time):
 *   0 → RAMP:    push grows steadily from 0 to 100 N; friction matches it exactly; the box stays still.
 *   RAMP → KICK: push stays at 100 N; sliding friction is only 60 N, so the box speeds up (a = 40/20 = 2 m/s²).
 *   after KICK:  push drops to 60 N = sliding friction; the box keeps moving at a steady speed.
 */
export const RAMP = 2.5;
export const KICK = 0.6;

export function pushAt(t: number): number {
  if (t <= RAMP) return (BOX.staticMaxN * Math.max(0, t)) / RAMP;
  if (t <= RAMP + KICK) return BOX.staticMaxN;
  return BOX.slidingN;
}
/** Friction from the floor (it opposes the push). */
export function frictionAt(t: number): number {
  return t <= RAMP ? pushAt(t) : BOX.slidingN;
}
export const kickAccel = (BOX.staticMaxN - BOX.slidingN) / BOX.kg; // 2 m/s²
export const cruiseSpeed = kickAccel * KICK; // 1.2 m/s
/** Box position (m) along the floor. */
export function boxX(t: number): number {
  if (t <= RAMP) return 0;
  const k = Math.min(t - RAMP, KICK);
  const x1 = 0.5 * kickAccel * k * k;
  return t <= RAMP + KICK ? x1 : x1 + cruiseSpeed * (t - RAMP - KICK);
}

// ---------- scripts ----------

export type MeasureVisual = "table" | "riya" | "arjun" | "question" | "hands" | "trust" | "metre" | "answer" | "same" | "try";
export type FrictionVisual = "box" | "why" | "setup" | "soft" | "watch" | "keep" | "rule" | "bumps" | "numbers" | "tip";

export const MEASURE_LINES: PlaneLine<MeasureVisual>[] = [
  { say: "How long is this table? Let's measure it with our hands.", visual: "table", accent: ["hands"] },
  { say: `Riya measures it. ${spansFor(SPANS.riya.cm)} handspans.`, voice: "Riya measures it. Eight handspans.", visual: "riya", accent: [String(spansFor(SPANS.riya.cm))] },
  { say: `Arjun measures the same table. He gets ${spansFor(SPANS.arjun.cm)}!`, voice: "Arjun measures the same table. He gets ten!", visual: "arjun", accent: [String(spansFor(SPANS.arjun.cm))] },
  { say: "So who measured it wrong?", visual: "question", accent: ["wrong"], echo: ["wrong"] },
  { say: "Neither of them! Arjun's hand is just smaller than Riya's.", visual: "hands", accent: ["neither", "smaller"] },
  { say: "Everyone's hand is a different size. So a handspan can't be trusted.", visual: "trust", accent: ["different"] },
  { say: "That's why the whole world agreed on one standard unit: the metre.", visual: "metre", accent: ["standard", "metre"] },
  {
    say: `Now everyone gets the same answer. ${TABLE_M} metres.`,
    voice: "Now everyone gets the same answer. One point six metres.",
    visual: "answer",
    accent: [String(TABLE_M), "metres"],
  },
  { say: "Same table. Same unit. Same answer.", visual: "same", accent: ["same"], echo: ["same"] },
  { say: "Try it: measure your desk with your hand, then with a ruler.", visual: "try", accent: ["try", "ruler"] },
];

export const FRICTION_LINES: PlaneLine<FrictionVisual>[] = [
  { say: "Ever tried pushing a heavy box across the floor?", visual: "box", accent: ["heavy"] },
  { say: "The first push always feels the hardest. Why?", visual: "why", accent: ["first", "hardest"], echo: ["why"] },
  { say: `Let's push a ${BOX.kg} kilogram box and watch the forces.`, voice: "Let's push a twenty kilogram box and watch the forces.", visual: "setup", accent: ["forces"] },
  { say: "Push gently. It doesn't move. Friction pushes back just as hard.", visual: "soft", accent: ["friction"] },
  {
    say: `Push harder and harder. At ${BOX.staticMaxN} newtons, it finally slides!`,
    voice: "Push harder and harder. At a hundred newtons, it finally slides!",
    visual: "watch",
    accent: ["slides"],
  },
  { say: `Now, to keep it moving, you only need ${BOX.slidingN} newtons.`, voice: "Now, to keep it moving, you only need sixty newtons.", visual: "keep", accent: [String(BOX.slidingN), "newtons"] },
  { say: "Friction that holds things still is stronger than friction while sliding.", visual: "rule", accent: ["stronger"] },
  { say: "When the box is still, the tiny bumps on both surfaces lock together.", visual: "bumps", accent: ["lock"] },
  { say: "Once it's sliding, they don't get time to lock. So it's easier.", visual: "bumps", accent: ["easier"] },
  { say: "So push hard once to start it. Then it gets easier. Save this!", visual: "tip", accent: ["once", "save"] },
];
