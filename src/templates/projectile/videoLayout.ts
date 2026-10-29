/** Placement of text blocks per format. For 9:16 everything sits inside SHORTS_SAFE (checked in tests). */
export const BOXES = {
  short: {
    hud: { left: 70, top: 300 },
    card: { left: 70, right: 1080 - 930, top: 362 },
    /** The reveal's formula card sits higher, above the 60° path; the clock hides meanwhile. */
    revealCardTop: 300,
    caption: { left: 70, right: 1080 - 930, bottom: 1920 - 1520 },
    topRight: { right: 1080 - 930, top: 380 },
    captionFont: 50,
    cardFont: 58,
  },
  explainer: {
    hud: { left: 60, top: 44 },
    card: { right: 60, top: 40 },
    caption: { left: 160, right: 160, bottom: 36 },
    topRight: { right: 60, top: 44 },
    captionFont: 46,
    cardFont: 50,
  },
} as const;
