import { loadFont } from "@remotion/google-fonts/AtkinsonHyperlegible";

/** Atkinson Hyperlegible: designed for legibility, same family as the website. */
export const sceneFont = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;
