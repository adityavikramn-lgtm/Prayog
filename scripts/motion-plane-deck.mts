// Teacher-ready PowerPoint deck: Motion in a Plane (Class 11 Physics · JEE), about a 60-minute live class.
//   npm run deck:motion-plane
// Every number on a slide comes from src/notes/motionPlane.ts (checked by tests). Speaker notes on every
// slide tell the teacher what to say, what to ask, and how long to spend.
// Output: notes/motion-in-a-plane-teacher-deck.pptx

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import PptxGenJS from "pptxgenjs";
import { sig3 } from "../src/physics/format";
import { ANSWERS as A, EXAMPLES as E, circle, horizontal, projectile } from "../src/notes/motionPlane";

const require = createRequire(import.meta.url);
const root = process.cwd();
const out = path.join(root, "notes", "motion-in-a-plane-teacher-deck.pptx");
const n = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : sig3(x));

// Physics colours, same meaning as in the videos (velocity blue, acceleration orange, force pink, displacement amber).
const THEME = {
  name: "Motion in a Plane",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14213D",
    lt1: "FFFFFF",
    dk2: "0B1022",
    lt2: "EEF2FA",
    accent1: "1F6FE0", // velocity
    accent2: "E8811A", // acceleration
    accent3: "D93D73", // force
    accent4: "C98A00", // displacement
    accent5: "1F9D6B", // correct / checks
    accent6: "4EF0C4", // brand mint (on dark only)
    hlink: "1F6FE0",
    folHlink: "6D3FC0",
  },
};
const HEX = THEME.colors;

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.33" × 7.5"
pres.author = "Adithya Vikram";
pres.title = "Motion in a Plane: teacher deck";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- layouts ----------

pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.2, w: 11.7, h: 1.5, fontFace: THEME.headFontFace, fontSize: 54, bold: true, color: C.background1, valign: "middle", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.75, w: 11.7, h: 0.9, fontFace: THEME.bodyFontFace, fontSize: 22, color: C.accent6, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.text1, valign: "middle" }, text: "" } },
    { text: { text: "Motion in a Plane · Class 11 Physics", options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: "8A93AD", fontFace: THEME.bodyFontFace } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "8A93AD", align: "right" },
});
pres.defineSlideMaster({
  title: "DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.background1, valign: "middle" }, text: "" } },
    { text: { text: "Motion in a Plane · Class 11 Physics", options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: "7F8AB0", fontFace: THEME.bodyFontFace } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "7F8AB0", align: "right" },
});

// ---------- drawing helpers ----------

type Slide = ReturnType<typeof pres.addSlide>;
let objId = 0;
const id = (s: string) => `${s}-${++objId}`;

function card(s: Slide, x: number, y: number, w: number, h: number, fill: string, opts: { line?: string; shadow?: boolean } = {}) {
  s.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: fill },
    line: opts.line ? { color: opts.line, width: 1.5 } : { type: "none" },
    shadow: opts.shadow === false ? undefined : { type: "outer", color: "0B1022", opacity: 0.12, blur: 6, offset: 2, angle: 90 },
    objectName: id("card"),
  });
}
/** "v_AB" → "v" + subscript "AB" (as text runs), so formulas read properly. */
function rich(t: string): string | PptxGenJS.TextProps[] {
  if (!t.includes("_")) return t;
  const runs: PptxGenJS.TextProps[] = [];
  let last = 0;
  for (const m of t.matchAll(/([A-Za-zθωα])_([A-Za-z0-9]+)/g)) {
    runs.push({ text: t.slice(last, m.index! + 1) });
    runs.push({ text: m[2], options: { subscript: true } });
    last = m.index! + m[0].length;
  }
  runs.push({ text: t.slice(last) });
  return runs.filter((r) => r.text);
}
function text(s: Slide, t: string | PptxGenJS.TextProps[], x: number, y: number, w: number, h: number, o: PptxGenJS.TextPropsOptions = {}) {
  if (typeof t === "string") t = rich(t);
  else t = t.flatMap((r) => (r.text?.includes("_") ? (rich(r.text) as PptxGenJS.TextProps[]).map((q) => ({ text: q.text, options: { ...r.options, ...q.options } })) : [r]));
  s.addText(t, { x, y, w, h, isTextBox: true, fontSize: 16, color: C.text1, valign: "top", margin: 0.05, objectName: id("text"), ...o });
}
function arrow(s: Slide, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  s.addShape(pres.ShapeType.line, {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.max(Math.abs(x2 - x1), 0.001),
    h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1,
    flipV: y2 < y1,
    line: { color, width, endArrowType: "triangle" },
    objectName: id("arrow"),
  });
}
function line(s: Slide, x1: number, y1: number, x2: number, y2: number, color: string, width = 1.5, dash?: "dash" | "sysDot") {
  s.addShape(pres.ShapeType.line, {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.max(Math.abs(x2 - x1), 0.001),
    h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1,
    flipV: y2 < y1,
    line: { color, width, dashType: dash },
    objectName: id("line"),
  });
}
function dot(s: Slide, x: number, y: number, r: number, color: string) {
  s.addShape(pres.ShapeType.ellipse, { x: x - r, y: y - r, w: 2 * r, h: 2 * r, fill: { color }, line: { type: "none" }, objectName: id("dot") });
}
/** A numbered circle: the deck's motif for steps and items. */
function badge(s: Slide, label: string, x: number, y: number, color: string, size = 0.5) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color }, line: { type: "none" }, objectName: id("badge") });
  text(s, label, x, y, size, size, { align: "center", valign: "middle", fontSize: size > 0.45 ? 18 : 14, bold: true, color: C.background1, margin: 0 });
}
/** The real trajectory y = x tanθ − gx²/(2u²cos²θ), scaled to fit the box (top-left x, y; width, height in inches). */
function trajectory(s: Slide, x: number, y: number, w: number, h: number, thetaDeg: number, color: string) {
  const th = (thetaDeg * Math.PI) / 180;
  const R = Math.sin(2 * th);
  const H = Math.sin(th) ** 2 / 2;
  const points = Array.from({ length: 41 }, (_, i) => {
    const xx = (R * i) / 40;
    const yy = xx * Math.tan(th) - (xx * xx) / (2 * Math.cos(th) ** 2);
    return { x: (xx / R) * w, y: h - (yy / H) * h };
  });
  s.addShape(("custGeom" as PptxGenJS.ShapeType), { x, y, w, h, points, line: { color, width: 3 }, fill: { color: "FFFFFF", transparency: 100 }, objectName: id("trajectory") });
}

/** Table rows with plain strings turned into cells. */
const rows = (r: (string | PptxGenJS.TableCell)[][]): PptxGenJS.TableRow[] => r.map((row) => row.map((c) => (typeof c === "string" ? { text: rich(c) } : c)));

// ---------- slides ----------

// 1. Title
pres.addSection({ title: "Start" });
{
  const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Start" });
  s.addText("Motion in a Plane", { placeholder: "title" });
  s.addText("Class 11 Physics · Chapter 3 · a 60-minute live class, ready to teach", { placeholder: "body" });
  trajectory(s, 7.6, 0.6, 5.0, 1.5, 55, HEX.accent6);
  dot(s, 7.6, 2.1, 0.08, HEX.accent6);
  text(s, "Vectors · relative velocity · projectiles · circular motion", 0.8, 4.6, 11, 0.5, { fontSize: 18, color: "B9C2DE" });
  text(s, "Prepared by Adithya Vikram · every number checked by code", 0.8, 6.6, 11, 0.4, { fontSize: 12, color: "7F8AB0" });
  s.addNotes(
    "Welcome the class. Today: how things move in two directions at once.\n" +
      "Big promise: by the end, students can solve any projectile, river-boat or circular motion question by splitting it into x and y.\n" +
      "Time: 1 minute.",
  );
}

// 2. Roadmap
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Start" });
  s.addText("Today's route", { placeholder: "title" });
  const stops = [
    ["Vectors", "add, split, multiply", HEX.accent1],
    ["2D motion", "x and y are independent", HEX.accent2],
    ["Relative velocity", "rain, rivers, cars", HEX.accent3],
    ["Projectiles", "T, H, R and shortcuts", HEX.accent4],
    ["Circular motion", "why speed ≠ velocity", HEX.accent5],
    ["Quiz + recap", "4 quick questions", HEX.dk1],
  ] as const;
  line(s, 1.1, 3.05, 12.2, 3.05, "C9D2E8", 3);
  stops.forEach(([t, sub, col], i) => {
    const x = 0.75 + i * 2.05;
    badge(s, String(i + 1), x + 0.55, 2.75, col, 0.6);
    text(s, t, x, 3.6, 1.9, 0.45, { fontSize: 18, bold: true, align: "center", color: col });
    text(s, sub, x, 4.05, 1.9, 0.8, { fontSize: 14, align: "center", color: "4A5578" });
  });
  card(s, 0.6, 5.2, 12.1, 1.4, HEX.lt2, { shadow: false });
  text(s, [
    { text: "By the end you can: ", options: { bold: true } },
    { text: "split any 2-D motion into two 1-D motions, find T, H and R in seconds, solve river and rain questions with one triangle, and explain why circular motion has acceleration." },
  ], 0.9, 5.35, 11.5, 1.1, { fontSize: 16 });
  s.addNotes("Show the route so students know where we're going. Ask: 'Which of these have you already seen in Class 9?' (straight-line motion).\nTime: 1 minute.");
}

// 3. Hook
pres.addSection({ title: "Hook" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Hook" });
  s.addText("Quick poll: which lands first?", { placeholder: "title" });
  // cliff + two paths, drawn to scale from the real equations (h = 20 m, u = 10 m/s)
  const h = horizontal(10, 20);
  line(s, 0.9, 2.0, 2.6, 2.0, "B9C2DE", 3);
  line(s, 2.6, 2.0, 2.6, 6.3, "B9C2DE", 3);
  line(s, 2.6, 6.3, 7.6, 6.3, "B9C2DE", 3);
  arrow(s, 2.6, 2.05, 2.6, 6.2, HEX.accent6, 2.5);
  const pts = Array.from({ length: 31 }, (_, i) => {
    const t = (h.T * i) / 30;
    return { x: ((10 * t) / h.x) * 4.0, y: ((0.5 * 10 * t * t) / 20) * 4.3 };
  });
  s.addShape(("custGeom" as PptxGenJS.ShapeType), { x: 2.6, y: 2.0, w: 4.0, h: 4.3, points: pts, line: { color: "F2C94C", width: 3, dashType: "dash" }, fill: { color: "FFFFFF", transparency: 100 }, objectName: id("hook-path") });
  text(s, "Ball A: just dropped", 0.6, 1.4, 3.2, 0.4, { fontSize: 16, color: HEX.accent6, bold: true });
  text(s, "Ball B: thrown sideways at 10 m/s", 3.4, 1.4, 4.4, 0.4, { fontSize: 16, color: "F2C94C", bold: true });
  const opts = [
    ["A", "Ball A lands first"],
    ["B", "Ball B lands first"],
    ["C", "Both land together"],
  ];
  opts.forEach(([k, t], i) => {
    card(s, 8.3, 1.9 + i * 1.35, 4.4, 1.05, "1A2348", { shadow: false });
    badge(s, k, 8.5, 2.15 + i * 1.35, i === 2 ? HEX.accent5 : "4A5578", 0.55);
    text(s, t, 9.25, 2.12 + i * 1.35, 3.3, 0.6, { fontSize: 20, color: C.background1, valign: "middle" });
  });
  text(s, "Vote now. We'll prove the answer on the projectile slide.", 8.3, 6.0, 4.4, 0.6, { fontSize: 14, color: "B9C2DE", italic: true });
  s.addNotes(
    `Ask everyone to vote (chat or hands). Most students say A.\nDon't reveal yet. Answer: C, both land after ${n(h.T)} s, because falling depends only on the vertical motion.\n` +
      "We come back to this on the projectile slide. Time: 2 minutes.",
  );
}

// 4. Scalars vs vectors
pres.addSection({ title: "Vectors" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Vectors" });
  s.addText("Scalar or vector?", { placeholder: "title" });
  card(s, 0.6, 1.5, 5.8, 3.6, HEX.lt2, { shadow: false });
  card(s, 6.9, 1.5, 5.8, 3.6, "E7F0FF", { shadow: false });
  text(s, "Scalar", 0.9, 1.7, 5, 0.6, { fontSize: 26, bold: true, fontFace: THEME.headFontFace });
  text(s, "Only size", 0.9, 2.3, 5, 0.4, { fontSize: 16, color: "4A5578" });
  text(s, [
    { text: "mass, time, distance", options: { bullet: true, breakLine: true } },
    { text: "speed, work, energy", options: { bullet: true, breakLine: true } },
    { text: "adds like normal numbers: 3 kg + 4 kg = 7 kg", options: { bullet: true } },
  ], 0.9, 2.85, 5.3, 2.0, { fontSize: 17, paraSpaceAfter: 6 });
  text(s, "Vector", 7.2, 1.7, 5, 0.6, { fontSize: 26, bold: true, fontFace: THEME.headFontFace, color: HEX.accent1 });
  text(s, "Size + direction, and adds by the triangle law", 7.2, 2.3, 5.3, 0.4, { fontSize: 16, color: "4A5578" });
  text(s, [
    { text: "displacement, velocity", options: { bullet: true, breakLine: true } },
    { text: "acceleration, force", options: { bullet: true, breakLine: true } },
    { text: "3 m + 4 m can be anything from 1 m to 7 m!", options: { bullet: true } },
  ], 7.2, 2.85, 5.3, 2.0, { fontSize: 17, paraSpaceAfter: 6 });
  card(s, 0.6, 5.45, 12.1, 1.15, "FFF4E5", { shadow: false });
  badge(s, "!", 0.85, 5.75, HEX.accent2, 0.5);
  text(s, [
    { text: "Trap: ", options: { bold: true, color: HEX.accent2 } },
    { text: "electric current has a direction but is NOT a vector. It doesn't add by the triangle law." },
  ], 1.55, 5.7, 11, 0.7, { fontSize: 17, valign: "middle" });
  s.addNotes(
    "Ask: 'I walk 3 m east then 4 m north. How far am I from the start?' Let them think: 5 m, not 7 m. That's why we need vectors.\n" +
      "Mention the current trap; it's a favourite in MCQs. Time: 3 minutes.",
  );
}

// 5. Adding vectors
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Vectors" });
  s.addText("Adding two vectors", { placeholder: "title" });
  // parallelogram drawn to scale for |A| = 3, |B| = 5 at 60° (k = 0.62 in per unit)
  const k = 0.62;
  const ox = 1.0;
  const oy = 5.6;
  const bx = 5 * Math.cos(Math.PI / 3) * k;
  const by = 5 * Math.sin(Math.PI / 3) * k;
  line(s, ox + bx, oy - by, ox + bx + 3 * k, oy - by, "9AA6C6", 1.5, "dash");
  line(s, ox + 3 * k, oy, ox + 3 * k + bx, oy - by, "9AA6C6", 1.5, "dash");
  arrow(s, ox, oy, ox + 3 * k, oy, HEX.accent1, 4);
  arrow(s, ox, oy, ox + bx, oy - by, HEX.accent3, 4);
  arrow(s, ox, oy, ox + 3 * k + bx, oy - by, HEX.accent5, 4);
  text(s, "A = 3", ox + 0.5, oy + 0.1, 1.2, 0.4, { fontSize: 16, bold: true, color: HEX.accent1 });
  text(s, "B = 5", ox + bx * 0.5 - 1.15, oy - by * 0.5 - 0.3, 1.0, 0.4, { fontSize: 16, bold: true, color: HEX.accent3 });
  text(s, `R = ${n(A.q1.R)}`, ox + 3 * k + bx + 0.1, oy - by - 0.15, 1.4, 0.4, { fontSize: 16, bold: true, color: HEX.accent5 });
  text(s, "60°", ox + 0.5, oy - 0.42, 0.7, 0.4, { fontSize: 14, color: "4A5578" });
  card(s, 6.4, 1.5, 6.3, 1.6, HEX.lt2, { shadow: false });
  text(s, "R = √(A² + B² + 2AB cosθ)", 6.7, 1.65, 5.8, 0.6, { fontSize: 24, bold: true, fontFace: "Cambria Math" });
  text(s, "tan α = B sinθ / (A + B cosθ)     (θ = angle between the tails)", 6.7, 2.3, 5.8, 0.6, { fontSize: 15, color: "4A5578" });
  s.addTable(
    rows([
      [
        { text: "θ", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
        { text: "R", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
        { text: "meaning", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
      ],
      ["0°", "A + B", "largest"],
      ["90°", "√(A² + B²)", "at right angles"],
      ["180°", "|A − B|", "smallest"],
    ]),
    { x: 6.4, y: 3.35, w: 6.3, colW: [1.3, 2.4, 2.6], fontSize: 16, border: { type: "solid", color: "C9D2E8", pt: 1 }, rowH: 0.42, fontFace: THEME.bodyFontFace, color: HEX.dk1 },
  );
  card(s, 6.4, 5.35, 6.3, 1.25, "E8F6EF", { shadow: false });
  text(s, [
    { text: "Shortcut: ", options: { bold: true, color: HEX.accent5 } },
    { text: "two equal vectors at θ give R = 2A cos(θ/2). So R = A exactly when θ = 120°." },
  ], 6.65, 5.5, 5.9, 1.0, { fontSize: 16 });
  s.addNotes(
    `Draw the parallelogram live. Example on screen: 3 and 5 at 60° give R = √(9 + 25 + 15) = ${n(A.q1.R)}, at about ${n(A.q1.alphaDeg)}° from A.\n` +
      "Ask: 'What's the biggest and smallest R you can get from 3 and 5?' (8 and 2). Time: 5 minutes.",
  );
}

// 6. Resolution
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Vectors" });
  s.addText("Splitting a vector into x and y", { placeholder: "title" });
  const ox = 1.2;
  const oy = 5.9;
  const L = 4.2;
  const th = (37 * Math.PI) / 180;
  line(s, ox - 0.2, oy, ox + L + 0.6, oy, "9AA6C6", 1.5);
  line(s, ox, oy + 0.2, ox, oy - 3.3, "9AA6C6", 1.5);
  line(s, ox + L * Math.cos(th), oy, ox + L * Math.cos(th), oy - L * Math.sin(th), "9AA6C6", 1.5, "dash");
  arrow(s, ox, oy, ox + L * Math.cos(th), oy - L * Math.sin(th), HEX.accent3, 4);
  arrow(s, ox, oy, ox + L * Math.cos(th), oy, HEX.accent1, 4);
  arrow(s, ox, oy, ox, oy - L * Math.sin(th), HEX.accent5, 4);
  text(s, "F = 10 N", ox + 1.2, oy - 2.4, 1.6, 0.4, { fontSize: 16, bold: true, color: HEX.accent3 });
  text(s, `Fₓ = F cos37° = ${n(E.force37.fx)} N`, ox + 0.6, oy + 0.1, 3.4, 0.4, { fontSize: 16, bold: true, color: HEX.accent1 });
  text(s, `Fᵧ = ${n(E.force37.fy)} N`, ox - 1.1, oy - 1.6, 1.1, 0.8, { fontSize: 16, bold: true, color: HEX.accent5 });
  text(s, "37°", ox + 0.75, oy - 0.45, 0.6, 0.4, { fontSize: 14, color: "4A5578" });
  const rows: [string, string][] = [
    ["Components", "Aₓ = A cosθ,  Aᵧ = A sinθ"],
    ["Back again", "A = √(Aₓ² + Aᵧ²),  tanθ = Aᵧ / Aₓ"],
    ["Unit vectors", "A = Aₓ î + Aᵧ ĵ + A_z k̂"],
    ["Adding", "add î with î, ĵ with ĵ, k̂ with k̂"],
  ];
  rows.forEach(([h, b], i) => {
    card(s, 6.9, 1.5 + i * 1.12, 5.8, 0.95, i % 2 ? "FFFFFF" : HEX.lt2, { shadow: false, line: "DDE3F0" });
    badge(s, String(i + 1), 7.1, 1.72 + i * 1.12, HEX.accent1, 0.5);
    text(s, h, 7.75, 1.58 + i * 1.12, 4.8, 0.35, { fontSize: 14, bold: true, color: "4A5578" });
    text(s, b, 7.75, 1.9 + i * 1.12, 4.8, 0.45, { fontSize: 17, fontFace: "Cambria Math" });
  });
  text(s, "JEE convention: sin37° = 3/5, cos37° = 4/5", 6.9, 6.1, 5.8, 0.4, { fontSize: 14, italic: true, color: "4A5578" });
  s.addNotes(
    "This is the most useful skill in the chapter. Every 2-D problem becomes two 1-D problems after this step.\n" +
      `Example: 10 N at 37° gives ${n(E.force37.fx)} N and ${n(E.force37.fy)} N. Ask a student to check: √(64 + 36) = 10.\nTime: 5 minutes.`,
  );
}

// 7. Dot & cross
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Vectors" });
  s.addText("Two ways to multiply vectors", { placeholder: "title" });
  const col = (x: number, title: string, color: string, formula: string, facts: string[], use: string, ex: string) => {
    card(s, x, 1.5, 5.85, 5.1, HEX.lt2, { shadow: false });
    text(s, title, x + 0.3, 1.7, 5.3, 0.55, { fontSize: 24, bold: true, color, fontFace: THEME.headFontFace });
    text(s, formula, x + 0.3, 2.35, 5.3, 0.55, { fontSize: 20, fontFace: "Cambria Math", bold: true });
    text(
      s,
      facts.map((f, i) => ({ text: f, options: { bullet: true, breakLine: i < facts.length - 1 } })),
      x + 0.3,
      3.05,
      5.3,
      2.4,
      { fontSize: 16, paraSpaceAfter: 6 },
    );
    text(s, ex, x + 0.3, 4.4, 5.3, 1.0, { fontSize: 15, italic: true, color: color });
    card(s, x + 0.3, 5.55, 5.25, 0.8, "FFFFFF", { shadow: false, line: "DDE3F0" });
    text(s, use, x + 0.5, 5.65, 4.9, 0.6, { fontSize: 15, color: "4A5578", valign: "middle" });
  };
  col(0.6, "Dot product → a number", HEX.accent1, "A·B = AB cosθ = AₓBₓ + AᵧBᵧ + A_z B_z", [
    "î·î = 1,  î·ĵ = 0",
    "A·B = 0  ⇔  A ⟂ B",
    "angle: cosθ = A·B / (AB)",
  ], "Used for: work W = F·s, projection of one vector on another", `e.g. (2î + 3ĵ − k̂)·(î − 2ĵ + 2k̂) = 2 − 6 − 2 = ${A.q3.dot}`);
  col(6.85, "Cross product → a vector", HEX.accent3, "|A × B| = AB sinθ", [
    "î × ĵ = k̂ (cyclic); reverse order ⇒ minus",
    "A × B = −B × A",
    "|A × B| = area of the parallelogram",
  ], "Used for: torque τ = r × F, angular momentum, area", `e.g. same two vectors: A × B = ${A.q3.cross[0]}î − ${-A.q3.cross[1]}ĵ − ${-A.q3.cross[2]}k̂ (check: ⟂ to both)`);
  s.addNotes(
    `Live check: (2î + 3ĵ − k̂)·(î − 2ĵ + 2k̂) = ${A.q3.dot}, and the cross product is ${A.q3.cross[0]}î − ${-A.q3.cross[1]}ĵ − ${-A.q3.cross[2]}k̂.\n` +
      "Tip for students: check a cross product by dotting it with both vectors; both answers must be 0.\n" +
      "NCERT puts these in later chapters, but JEE asks them here. Time: 5 minutes.",
  );
}

// 8. Independence of x and y
pres.addSection({ title: "Motion in 2D" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Motion in 2D" });
  s.addText("The one big idea: x and y don't affect each other", { placeholder: "title" });
  card(s, 0.6, 1.5, 6.0, 4.9, HEX.lt2, { shadow: false });
  text(s, "Constant acceleration in a plane", 0.9, 1.7, 5.5, 0.45, { fontSize: 18, bold: true });
  text(s, "v = u + a t", 0.9, 2.3, 5.5, 0.55, { fontSize: 26, fontFace: "Cambria Math", bold: true, color: HEX.accent1 });
  text(s, "r = r₀ + u t + ½ a t²", 0.9, 2.9, 5.5, 0.55, { fontSize: 26, fontFace: "Cambria Math", bold: true, color: HEX.accent4 });
  text(s, [
    { text: "x:  x = uₓt + ½aₓt²", options: { breakLine: true } },
    { text: "y:  y = uᵧt + ½aᵧt²", options: { breakLine: true } },
    { text: "Solve each line like Class 9 motion. Time t is the only link." },
  ], 0.9, 3.7, 5.5, 2.4, { fontSize: 18, paraSpaceAfter: 8 });
  const steps = [
    ["Split", "u and a into x and y parts"],
    ["Solve", "each direction on its own"],
    ["Join", "using the same time t"],
  ];
  steps.forEach(([h, b], i) => {
    const y = 1.6 + i * 1.6;
    badge(s, String(i + 1), 7.1, y + 0.2, HEX.accent2, 0.7);
    text(s, h, 8.05, y + 0.05, 4.5, 0.5, { fontSize: 22, bold: true, color: HEX.accent2 });
    text(s, b, 8.05, y + 0.55, 4.5, 0.5, { fontSize: 17, color: "4A5578" });
    if (i < 2) arrow(s, 7.45, y + 0.95, 7.45, y + 1.75, "C9D2E8", 2);
  });
  text(s, `Example: x = 3t, y = 4t − 5t² is just a projectile with u = ${n(E.path.speed0)} m/s at ${n(E.path.angleDeg)}°.`, 6.9, 6.25, 5.9, 0.6, { fontSize: 14, italic: true, color: "4A5578" });
  s.addNotes(
    "Spend time here; it unlocks the whole chapter. Say it three times: horizontal and vertical motions are independent, time links them.\n" +
      "Ask: 'In a projectile, does gravity change the horizontal speed?' (No.) Time: 4 minutes.",
  );
}

// 9. Relative velocity
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Motion in 2D" });
  s.addText("Relative velocity: what you see from where you are", { placeholder: "title" });
  card(s, 0.6, 1.5, 4.0, 1.2, "E7F0FF", { shadow: false });
  text(s, "v_AB = v_A − v_B", 0.8, 1.65, 3.6, 0.55, { fontSize: 26, bold: true, fontFace: "Cambria Math", color: HEX.accent1 });
  text(s, "velocity of A, seen by B", 0.8, 2.2, 3.6, 0.4, { fontSize: 14, color: "4A5578" });
  // rain triangle (to scale for rain 10 m/s, man 5 m/s)
  const k = 0.3;
  const x0 = 2.6;
  const y0 = 3.1;
  arrow(s, x0, y0, x0, y0 + 10 * k, HEX.accent1, 3.5);
  arrow(s, x0, y0 + 10 * k, x0 - 5 * k, y0 + 10 * k, HEX.accent3, 3.5);
  arrow(s, x0, y0, x0 - 5 * k, y0 + 10 * k, HEX.accent5, 3.5);
  text(s, "rain 10 m/s", x0 + 0.1, y0 + 1.2, 1.6, 0.4, { fontSize: 14, color: HEX.accent1, bold: true });
  text(s, "−v_man", x0 - 1.0, y0 + 10 * k - 0.45, 1.0, 0.4, { fontSize: 14, color: HEX.accent3, bold: true });
  text(s, "rain as seen", x0 - 2.0, y0 + 1.0, 1.3, 0.6, { fontSize: 14, color: HEX.accent5, bold: true });
  text(s, `Umbrella tilt: tan⁻¹(5/10) ≈ ${n(A.q10.tiltDeg)}° forward`, 0.6, 6.4, 4.4, 0.4, { fontSize: 14, bold: true });
  // river table
  s.addTable(
    rows([
      [
        { text: "River–boat", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
        { text: "Aim", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
        { text: "Result", options: { bold: true, color: C.background1, fill: { color: HEX.dk1 } } },
      ],
      ["Shortest time", "straight across", "t = d / v_b,  drift = v_r d / v_b"],
      ["Shortest path", "upstream, sinθ = v_r / v_b", "t = d / √(v_b² − v_r²)"],
      ["Boat slower (v_b < v_r)", "upstream, sinθ = v_b / v_r", "least drift (can't reach opposite)"],
    ]),
    { x: 5.2, y: 1.5, w: 7.5, colW: [2.1, 2.5, 2.9], fontSize: 14, border: { type: "solid", color: "C9D2E8", pt: 1 }, rowH: 0.62, fontFace: THEME.bodyFontFace, color: HEX.dk1, valign: "middle" },
  );
  card(s, 5.2, 4.3, 7.5, 2.3, HEX.lt2, { shadow: false });
  text(s, "Live example", 5.45, 4.42, 7, 0.4, { fontSize: 16, bold: true, color: HEX.accent2 });
  text(s, [
    { text: `River 100 m wide, flow 3 m/s, boat 5 m/s.`, options: { breakLine: true } },
    { text: `Shortest time: ${n(A.q9.tMin)} s, landing ${n(A.q9.drift)} m downstream.`, options: { breakLine: true } },
    { text: `Straight across: aim ${n(A.q9.upstreamDeg)}° upstream, takes ${n(A.q9.tStraight)} s.` },
  ], 5.45, 4.85, 7, 1.6, { fontSize: 17, paraSpaceAfter: 4 });
  s.addNotes(
    "Rain: ask a student who's walked in rain with an umbrella which way they tilt it. Physics agrees with experience.\n" +
      "River: the river only carries the boat sideways, it never changes the crossing time if you aim straight.\nTime: 7 minutes.",
  );
}

// 10. Projectile
pres.addSection({ title: "Projectiles" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Projectiles" });
  s.addText("Projectile motion", { placeholder: "title" });
  const p = projectile(20, 30);
  trajectory(s, 0.9, 2.2, 6.2, 2.6, 30, HEX.accent1);
  line(s, 0.6, 4.8, 7.4, 4.8, "9AA6C6", 2);
  arrow(s, 0.9, 4.8, 2.4, 3.95, HEX.accent3, 3.5);
  line(s, 4.0, 2.2, 4.0, 4.8, "9AA6C6", 1.5, "dash");
  arrow(s, 4.0, 2.2, 5.0, 2.2, HEX.accent1, 3);
  arrow(s, 6.0, 3.1, 6.0, 3.9, HEX.accent2, 3);
  text(s, "u", 1.35, 3.55, 0.4, 0.4, { fontSize: 18, bold: true, color: HEX.accent3 });
  text(s, "H", 4.1, 3.3, 0.5, 0.4, { fontSize: 18, bold: true, color: HEX.accent4 });
  text(s, "top: v = u cosθ", 3.4, 1.65, 2.6, 0.4, { fontSize: 14, bold: true, color: HEX.accent1 });
  text(s, "g", 6.2, 3.3, 0.4, 0.4, { fontSize: 18, bold: true, color: HEX.accent2 });
  text(s, "R", 3.9, 4.9, 0.5, 0.4, { fontSize: 18, bold: true, color: HEX.accent4 });
  text(s, "x: uniform (u cosθ)    y: free fall (−g)", 0.6, 5.5, 6.8, 0.45, { fontSize: 16, bold: true });
  text(s, `On screen: u = 20 m/s at 30° → T = ${n(p.T)} s, H = ${n(p.H)} m, R = ${n(p.R)} m`, 0.6, 6.0, 6.8, 0.6, { fontSize: 14, italic: true, color: "4A5578" });
  const f: [string, string, string][] = [
    ["Time of flight", "T = 2u sinθ / g", HEX.accent2],
    ["Max height", "H = u² sin²θ / 2g", HEX.accent4],
    ["Range", "R = u² sin2θ / g", HEX.accent1],
    ["Path", "y = x tanθ − gx² / (2u²cos²θ)", HEX.accent3],
  ];
  f.forEach(([h, b, col], i) => {
    card(s, 7.9, 1.5 + i * 1.12, 4.8, 0.98, HEX.lt2, { shadow: false });
    text(s, h, 8.15, 1.56 + i * 1.12, 4.4, 0.35, { fontSize: 14, bold: true, color: col });
    text(s, b, 8.15, 1.88 + i * 1.12, 4.4, 0.5, { fontSize: 18, bold: true, fontFace: "Cambria Math" });
  });
  card(s, 7.9, 6.65 - 0.55, 4.8, 0.5, "E8F6EF", { shadow: false });
  text(s, "Poll answer: C. Falling time depends only on height.", 8.05, 6.12, 4.6, 0.45, { fontSize: 13, bold: true, color: HEX.accent5, valign: "middle" });
  s.addNotes(
    `Derive T first from the vertical motion (up and back down), then R = (u cosθ)·T. Numbers on screen: T = ${n(p.T)} s, H = ${n(p.H)} m, R = ${n(p.R)} m.\n` +
      "Now reveal the poll: Ball B's sideways speed doesn't change its vertical fall, so both land together.\nTime: 8 minutes.",
  );
}

// 11. Shortcuts
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Projectiles" });
  s.addText("Projectile shortcuts that save time in JEE", { placeholder: "title" });
  const m = E.max45;
  const tiles: [string, string, string][] = [
    ["45°", "gives the maximum range", `R_max = u²/g; then H = R/4 (20 m/s → ${n(m.R)} m)`],
    ["θ & 90°−θ", "give the same range", `20 m/s at 15° and 75°: ${n(E.comp15)} m each`],
    ["4H/R", "= tanθ", `H = R when θ = tan⁻¹4 ≈ ${n(A.q8.thetaDeg)}°`],
    ["u cosθ", "speed at the top", "vertical velocity is zero there, not the speed"],
    ["4√(H₁H₂)", "= R for complementary angles", "also T₁T₂ = 2R/g"],
    ["g/8", "= H / T²", "quick check for any projectile"],
  ];
  tiles.forEach(([big, small, ex], i) => {
    const x = 0.6 + (i % 3) * 4.1;
    const y = 1.5 + Math.floor(i / 3) * 2.6;
    card(s, x, y, 3.85, 2.35, i % 2 ? "FFFFFF" : HEX.lt2, { line: "DDE3F0" });
    text(s, big, x + 0.25, y + 0.2, 3.4, 0.75, { fontSize: 36, bold: true, color: [HEX.accent1, HEX.accent2, HEX.accent3, HEX.accent4, HEX.accent5, HEX.accent1][i], fontFace: THEME.headFontFace });
    text(s, small, x + 0.25, y + 0.95, 3.4, 0.4, { fontSize: 16, bold: true });
    text(s, ex, x + 0.25, y + 1.4, 3.4, 0.8, { fontSize: 14, color: "4A5578" });
  });
  text(s, "All need: same launch and landing level, no air resistance.", 0.6, 6.6, 12, 0.35, { fontSize: 13, italic: true, color: HEX.accent3 });
  s.addNotes(
    "Give students 30 seconds per tile to write it down. Ask them to prove one (e.g. 45° from sin2θ = 1) at home.\n" +
      "Remind: these only work ground-to-ground. From a cliff or on an incline, go back to components.\nTime: 5 minutes.",
  );
}

// 12. Horizontal + incline
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Projectiles" });
  s.addText("Projectiles from a height and on a slope", { placeholder: "title" });
  card(s, 0.6, 1.5, 5.9, 5.1, HEX.lt2, { shadow: false });
  text(s, "Thrown horizontally from height h", 0.9, 1.7, 5.4, 0.45, { fontSize: 20, bold: true, color: HEX.accent1 });
  text(s, [
    { text: "T = √(2h/g)   (doesn't depend on u!)", options: { breakLine: true } },
    { text: "x = u √(2h/g)", options: { breakLine: true } },
    { text: "v at the ground = √(u² + 2gh)" },
  ], 0.9, 2.3, 5.4, 1.6, { fontSize: 18, fontFace: "Cambria Math", paraSpaceAfter: 6 });
  card(s, 0.9, 4.2, 5.3, 2.1, "FFFFFF", { shadow: false, line: "DDE3F0" });
  text(s, "Example", 1.1, 4.3, 5, 0.35, { fontSize: 14, bold: true, color: HEX.accent2 });
  text(s, `10 m/s from a 45 m cliff: lands after ${n(A.q7.T)} s, ${n(A.q7.x)} m away, at ${n(A.q7.speed)} m/s, ${n(A.q7.belowDeg)}° below the horizontal.`, 1.1, 4.7, 5, 1.4, { fontSize: 16 });
  card(s, 6.85, 1.5, 5.85, 5.1, "E7F0FF", { shadow: false });
  text(s, "Up an incline of angle α (θ from horizontal)", 7.15, 1.7, 5.4, 0.45, { fontSize: 20, bold: true, color: HEX.accent3 });
  text(s, [
    { text: "T = 2u sin(θ − α) / (g cosα)", options: { breakLine: true } },
    { text: "R = 2u² sin(θ − α) cosθ / (g cos²α)", options: { breakLine: true } },
    { text: "R_max = u² / g(1 + sinα) at θ = 45° + α/2" },
  ], 7.15, 2.3, 5.4, 1.9, { fontSize: 17, fontFace: "Cambria Math", paraSpaceAfter: 6 });
  card(s, 7.15, 4.2, 5.25, 2.1, "FFFFFF", { shadow: false, line: "DDE3F0" });
  text(s, "Trick", 7.35, 4.3, 5, 0.35, { fontSize: 14, bold: true, color: HEX.accent5 });
  text(s, "Tilt your axes along the slope. Then g has two parts: g sinα along it and g cosα across it, and it's 1-D again.", 7.35, 4.7, 4.9, 1.4, { fontSize: 16 });
  s.addNotes(
    `Incline example for practice: 20 m/s at 75° up a 30° slope gives T ≈ ${n(A.q13.T)} s and R ≈ ${n(A.q13.R)} m; the best angle would be ${n(A.q13.bestThetaDeg)}°.\n` +
      "JEE Main mostly asks the horizontal case; the incline is JEE Advanced. Time: 5 minutes.",
  );
}

// 13. Circular motion
pres.addSection({ title: "Circular motion" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Circular motion" });
  s.addText("Circular motion: constant speed, changing velocity", { placeholder: "title" });
  const cx = 3.0;
  const cy = 4.1;
  const r = 2.0;
  s.addShape(pres.ShapeType.ellipse, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color: "FFFFFF", transparency: 100 }, line: { color: HEX.dk1, width: 2.5 }, objectName: id("orbit") });
  dot(s, cx, cy, 0.06, HEX.dk1);
  const a = Math.PI / 4;
  const px = cx + r * Math.cos(a);
  const py = cy - r * Math.sin(a);
  line(s, cx, cy, px, py, "9AA6C6", 1.5, "dash");
  arrow(s, px, py, px + 1.2 * Math.sin(a), py + 1.2 * Math.cos(a), HEX.accent1, 4);
  arrow(s, px, py, px - 0.9 * Math.cos(a), py + 0.9 * Math.sin(a), HEX.accent2, 4);
  dot(s, px, py, 0.12, HEX.accent3);
  text(s, "v (along the tangent)", px - 0.55, py + 0.95, 1.9, 0.4, { fontSize: 14, bold: true, color: HEX.accent1 });
  text(s, "a (to the centre)", cx - 0.6, cy - 0.85, 2.2, 0.4, { fontSize: 14, bold: true, color: HEX.accent2 });
  const facts: [string, string, string][] = [
    ["ω = 2π / T = 2πf", "angular speed (rad/s)", HEX.accent1],
    ["v = ω r", "speed along the circle", HEX.accent1],
    ["a = v² / r = ω² r", "centripetal, always to the centre", HEX.accent2],
    ["a = √(a_c² + aₜ²)", "if the speed is also changing", HEX.accent3],
  ];
  facts.forEach(([f, sub, col], i) => {
    card(s, 6.6, 1.5 + i * 1.12, 6.1, 0.95, i % 2 ? "FFFFFF" : HEX.lt2, { shadow: false, line: "DDE3F0" });
    text(s, f, 6.85, 1.55 + i * 1.12, 3.4, 0.85, { fontSize: 20, bold: true, fontFace: "Cambria Math", color: col, valign: "middle" });
    text(s, sub, 10.2, 1.55 + i * 1.12, 2.4, 0.85, { fontSize: 14, color: "4A5578", valign: "middle" });
  });
  card(s, 6.6, 6.05, 6.1, 0.6, "FFF4E5", { shadow: false });
  text(s, `Stone on 0.5 m string, 2 rev/s: v ≈ ${n(A.q11.v)} m/s, a ≈ ${n(A.q11.a)} m/s²`, 6.8, 6.1, 5.8, 0.5, { fontSize: 15, bold: true, valign: "middle" });
  s.addNotes(
    "Key misconception: 'constant speed means no acceleration'. Ask the class; many will agree. Then show the velocity arrow turning.\n" +
      `Example: 2 m radius, 4 m/s, speeding up at 3 m/s² gives a_c = ${n(A.q12.ac)}, total a ≈ ${n(A.q12.a)} m/s².\nTime: 6 minutes.`,
  );
}

// 14. Mistakes
pres.addSection({ title: "Wrap-up" });
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Wrap-up" });
  s.addText("Five mistakes students make (and the fix)", { placeholder: "title" });
  const items: [string, string][] = [
    ["Velocity at the top of a projectile is zero", "Only the vertical part is zero. v = u cosθ."],
    ["Using range formulas from a cliff", "They need the same launch and landing level. Use components."],
    ["v_AB = v_B − v_A", "Order matters: v_AB = v_A − v_B (A as seen by B)."],
    ["Uniform circular motion has no acceleration", "It has v²/r towards the centre at every instant."],
    ["θ measured head-to-tail in R = √(A² + B² + 2AB cosθ)", "θ is the angle between the tails."],
  ];
  items.forEach(([bad, fix], i) => {
    const y = 1.45 + i * 1.05;
    card(s, 0.6, y, 12.1, 0.9, i % 2 ? "FFFFFF" : HEX.lt2, { shadow: false, line: "DDE3F0" });
    badge(s, "✗", 0.8, y + 0.2, HEX.accent3, 0.5);
    text(s, bad, 1.5, y + 0.1, 5.2, 0.7, { fontSize: 16, valign: "middle" });
    badge(s, "✓", 6.85, y + 0.2, HEX.accent5, 0.5);
    text(s, fix, 7.55, y + 0.1, 5.0, 0.7, { fontSize: 16, valign: "middle", bold: true });
  });
  s.addNotes("Read each mistake aloud and ask: 'Who has made this one?' Honest hands build trust. Time: 3 minutes.");
}

// 15. Quiz
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
  s.addText("Quick quiz: 60 seconds each", { placeholder: "title" });
  const hz = horizontal(10, 20);
  const cq = circle(1, 1 / Math.PI); // ω = 2 rad/s on a 1 m circle
  const qs: [string, string, string[]][] = [
    ["Same speed. 20° gives range R. Which other angle gives the same R?", "(c) 70°", ["45°", "60°", "70°", "80°"]],
    ["Thrown sideways at 10 m/s from 20 m. Time to land and distance?", `(b) ${n(hz.T)} s, ${n(hz.x)} m`, ["1 s, 10 m", `${n(hz.T)} s, ${n(hz.x)} m`, `${n(hz.T)} s, 10 m`, "4 s, 40 m"]],
    ["A = 3î + 4ĵ, B = 4î − 3ĵ. Angle between them?", "(c) 90° (A·B = 12 − 12 = 0)", ["0°", "45°", "90°", "180°"]],
    ["Stone on a 1 m string at ω = 2 rad/s. Centripetal acceleration?", `(b) ${n(cq.a)} m/s²`, ["2 m/s²", `${n(cq.a)} m/s²`, "8 m/s²", "1 m/s²"]],
  ];
  qs.forEach(([q, , opts], i) => {
    const x = 0.6 + (i % 2) * 6.15;
    const y = 1.5 + Math.floor(i / 2) * 2.6;
    card(s, x, y, 5.95, 2.35, "1A2348", { shadow: false });
    badge(s, `Q${i + 1}`, x + 0.25, y + 0.25, HEX.accent5, 0.65);
    text(s, q, x + 1.1, y + 0.2, 4.6, 0.95, { fontSize: 17, color: C.background1 });
    opts.forEach((o, k) => text(s, `(${"abcd"[k]}) ${o}`, x + 1.1 + (k % 2) * 2.3, y + 1.25 + Math.floor(k / 2) * 0.48, 2.25, 0.42, { fontSize: 16, color: "D8DEF0" }));
  });
  s.addNotes(
    "Answers (computed and checked):\n" +
      qs.map(([, a], i) => `Q${i + 1}: ${a}`).join("\n") +
      "\nAsk for answers in the chat before revealing. Time: 5 minutes.",
  );
}

// 16. Recap
{
  const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Wrap-up" });
  s.addText("Recap in 30 seconds", { placeholder: "title" });
  s.addText("Split into x and y · time links them · gravity only acts on y · circles always accelerate", { placeholder: "body" });
  const hw = [
    "Homework: derive R_max = u²/g and show H = R/4 at 45°",
    "Try: a boat at 4 m/s in a 3 m/s river, 60 m wide. Shortest time and drift?",
    "Bring one real-life projectile you saw today",
  ];
  hw.forEach((t, i) => {
    badge(s, String(i + 1), 0.8, 5.2 + i * 0.6, "1F9D6B", 0.42);
    text(s, t, 1.4, 5.17 + i * 0.6, 11, 0.5, { fontSize: 16, color: "D8DEF0", valign: "middle" });
  });
  const hwRiver = { t: 60 / 4, drift: (3 * 60) / 4 };
  s.addNotes(
    `Homework answer for the teacher: shortest time = 60 / 4 = ${n(hwRiver.t)} s, drift = 3 × 15 = ${n(hwRiver.drift)} m.\n` +
      "End by asking each student for one thing they learned in one line. Time: 2 minutes.",
  );
}

async function main() {
  await pres.writeFile({ fileName: out });
  // Writes THEME's colours into the file's theme (pptxgenjs can't). Set PPTX_SKILL_DIR to the pptx skill folder
  // and NODE_PATH to this project's node_modules so it finds pptxgenjs.
  const themer = process.env.PPTX_SKILL_DIR && path.join(process.env.PPTX_SKILL_DIR, "scripts", "apply_theme.js");
  if (themer && fs.existsSync(themer)) await require(themer).applyTheme(out, THEME);
  else console.warn("Theme colours not applied (set PPTX_SKILL_DIR). Scheme colours will use Office defaults.");
  console.log(`Teacher deck → ${path.relative(root, out)}`);
}
void main();
