/**
 * Palette for scenes (SVG and KaTeX need literal colours).
 * Keep in sync with the CSS tokens in styles/global.css.
 *
 * Each quantity also has its own arrowhead, so colour is never the only cue:
 *   velocity      solid triangle   (components: dashed shaft, open head)
 *   acceleration  double chevron
 *   force         open triangle    (from Phase 4)
 *   displacement  dimension line with bar ends
 */
export const COLORS = {
  board: "#0f1915",
  boardRaised: "#16231e",
  boardLine: "#24362f",
  chalk: "#eeeee6",
  chalkDim: "#a9b4ae",
  velocity: "#56b4e9",
  acceleration: "#e69f00",
  force: "#d98cc0",
  displacement: "#f0e442",
  kan: "#7fe0c4",
} as const;
