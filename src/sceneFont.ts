import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Fonts are kept in public/fonts (see the README there), so a render never depends on reaching
// Google Fonts: on some networks that download fails part-way and frames fall back to another font.

const FACES = [
  { family: "Atkinson Hyperlegible", file: "fonts/atkinson-400.woff2", weight: "400" },
  { family: "Atkinson Hyperlegible", file: "fonts/atkinson-700.woff2", weight: "700" },
  { family: "Anton", file: "fonts/anton-400.woff2", weight: "400" },
];

if (typeof document !== "undefined" && typeof FontFace !== "undefined") {
  const handle = delayRender("Loading fonts from public/fonts");
  Promise.all(
    FACES.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format("woff2")`, { weight: f.weight, display: "block" });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
}

/** Atkinson Hyperlegible: designed for legibility, same family as the website. */
export const sceneFont = `"Atkinson Hyperlegible", "Segoe UI", sans-serif`;

/** Anton: tall, bold display face for the big kinetic words in Shorts. */
export const displayFont = `"Anton", Impact, sans-serif`;
