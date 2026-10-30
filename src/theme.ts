/**
 * Palette for scenes (SVG and KaTeX need literal colours).
 * Keep in sync with the CSS tokens in styles/global.css.
 *
 * "Night studio": a deep navy board with bright, high-contrast accents, chosen to
 * look professional and grab attention on a phone. It is our own look, not any
 * company's brand colours.
 *
 * Each quantity also has its own arrowhead, so colour is never the only cue:
 *   velocity      solid triangle   (components: dashed shaft, open head)
 *   acceleration  double chevron
 *   force         open triangle
 *   displacement  dimension line with bar ends
 */
export const COLORS = {
  board: "#0b1022",
  boardRaised: "#151d3a",
  boardLine: "#2a3560",
  chalk: "#f5f7ff",
  chalkDim: "#a3aed0",
  velocity: "#4cc3ff",
  acceleration: "#ffb21f",
  force: "#ff72b0",
  displacement: "#ffe24a",
  kan: "#4ef0c4",
} as const;

/** Caption and card surfaces (slightly see-through so the grid shows behind). */
export const SURFACE = "rgba(18, 26, 56, 0.92)";
