// Handwritten-style class notes: Motion in a Plane (Class 11 Physics · JEE Main/Advanced).
//   npm run notes:motion-plane
// Every worked number comes from src/notes/motionPlane.ts (checked by tests/motion-plane-notes.test.ts).
// Fonts load from public/fonts, so printing never depends on the network.
// Output: notes/motion-in-a-plane-class-notes.html and .pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { sig3 } from "../src/physics/format";
import { ANSWERS as A, EXAMPLES as E } from "../src/notes/motionPlane";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "motion-in-a-plane-class-notes";
const url = (p: string) => pathToFileURL(path.join(root, p)).href;
/** Exact form when the answer is a whole number (7, not 7.00), else 3 significant figures. */
const n = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : sig3(x));

// ---------- pen-and-paper helpers ----------

const fr = (top: string, bottom: string) => `<span class="frac"><span>${top}</span><span>${bottom}</span></span>`;
const vec = (s: string) => `<span class="vec">${s}</span>`;
const hat = (s: string) => `<span class="hat">${s}</span>`;
const hl = (s: string) => `<span class="hl">${s}</span>`;
const red = (s: string) => `<span class="red">${s}</span>`;
const sup = (s: string) => `<sup>${s}</sup>`;
const sub = (s: string) => `<sub>${s}</sub>`;
const sq = (s: string) => `√<span class="ov">${s}</span>`;
const H = (s: string) => `<h2>${s}</h2>`;
const h = (s: string) => `<h3>${s}</h3>`;
const p = (s: string) => `<p>${s}</p>`;
const pts = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const steps = (items: string[]) => `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
const formula = (s: string, note = "") => `<div class="formula">${s}${note ? `<div class="fnote">${note}</div>` : ""}</div>`;
const imp = (s: string) => `<div class="imp"><span class="star">★ IMP</span> ${s}</div>`;
const trick = (s: string) => `<div class="trick"><span class="tag">Shortcut</span> ${s}</div>`;
const careful = (s: string) => `<div class="careful"><span class="tag">Careful!</span> ${s}</div>`;
const ex = (s: string) => `<div class="ex"><span class="tag">e.g.</span> ${s}</div>`;
const fig = (svgStr: string, caption = "") => `<div class="fig">${svgStr}${caption ? `<div class="cap">${caption}</div>` : ""}</div>`;
const two = (a: string, b: string) => `<div class="two"><div>${a}</div><div>${b}</div></div>`;
let qn = 0;
const pyq = (tag: string, q: string, sol: string[], ans: string) => {
  qn++;
  return `<div class="solved"><div class="q"><b>Q${qn}.</b> <span class="ptag">${tag}</span> ${q}</div><div class="sol">Sol<sup>n</sup>:</div>${steps(sol)}<div class="ans">⇒ ${ans}</div></div>`;
};

const INK = "#1a3a8f";
const PEN_RED = "#c0392b";
const PEN_GRN = "#1d7a46";
const FONT = "Kalam, 'Comic Sans MS', cursive";

function line(x1: number, y1: number, x2: number, y2: number, c = INK, w = 2.4, dash = false): string {
  const d = dash ? 'stroke-dasharray="7 6"' : "";
  return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + 1.5} ${(y1 + y2) / 2 - 1.5} ${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" ${d}/>
    <path d="M${x1 + 0.8} ${y1 + 0.6} L${x2 - 0.6} ${y2 + 0.8}" stroke="${c}" stroke-width="${w * 0.45}" fill="none" stroke-linecap="round" opacity=".55" ${d}/>`;
}
function arrow(x1: number, y1: number, x2: number, y2: number, c = PEN_RED, label = "", lx = 0, ly = -12, size = 19): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (s: number) => x2 - 13 * Math.cos(a + s);
  const hy = (s: number) => y2 - 13 * Math.sin(a + s);
  return `${line(x1, y1, x2, y2, c)}${line(x2, y2, hx(0.45), hy(0.45), c)}${line(x2, y2, hx(-0.45), hy(-0.45), c)}${
    label ? `<text x="${(x1 + x2) / 2 + lx}" y="${(y1 + y2) / 2 + ly}" fill="${c}" font-size="${size}" text-anchor="middle" font-family="${FONT}">${svgSub(label)}</text>` : ""
  }`;
}
/** "v_b" → v with a small b below, inside SVG text. */
const svgSub = (s: string) => s.replace(/_([A-Za-z0-9,]+)/g, '<tspan baseline-shift="sub" font-size="72%">$1</tspan>');
/** "v_b" → v<sub>b</sub> in HTML text (run on whole pages; SVG labels are already converted). */
const subify = (html: string) => html.replace(/([A-Za-zθ])_\{?([A-Za-z0-9,]+)\}?/g, "$1<sub>$2</sub>");
const txt = (x: number, y: number, s: string, c = INK, size = 18, anchor = "middle") =>
  `<text x="${x}" y="${y}" fill="${c}" font-size="${size}" text-anchor="${anchor}" font-family="${FONT}">${svgSub(s)}</text>`;
const svg = (w: number, hgt: number, inner: string) => `<svg viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, c = PEN_GRN) => {
  const P = (a: number) => `${cx + r * Math.cos(a)} ${cy - r * Math.sin(a)}`;
  return `<path d="M${P(a0)} A${r} ${r} 0 0 0 ${P(a1)}" fill="none" stroke="${c}" stroke-width="2"/>`;
};
/** A parabola drawn from the real trajectory y = x tanθ − gx²/(2u²cos²θ), scaled into a box. */
function parabola(x0: number, y0: number, wpx: number, hpx: number, thetaDeg: number, c = INK) {
  const th = (thetaDeg * Math.PI) / 180;
  const Rr = Math.sin(2 * th);
  const Hh = Math.sin(th) ** 2 / 2;
  const ptsS: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = (Rr * i) / 60;
    const y = x * Math.tan(th) - (x * x) / (2 * Math.cos(th) ** 2);
    ptsS.push(`${x0 + (x / Rr) * wpx},${y0 - (y / Hh) * hpx}`);
  }
  return `<polyline points="${ptsS.join(" ")}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
}

// ---------- figures ----------

const figTriangle = svg(
  560,
  190,
  arrow(30, 140, 190, 140, INK, "A", 0, -10) + arrow(190, 140, 260, 40, PEN_RED, "B", 18, 0) + arrow(30, 140, 260, 40, PEN_GRN, "R = A + B", -20, -12) + txt(140, 180, "triangle law: tail of B on head of A", INK, 15) +
    arrow(330, 140, 480, 140, INK, "A", 20, 20) + arrow(330, 140, 390, 50, PEN_RED, "B", -16, 0) + line(390, 50, 540, 50, INK, 1.4, true) + line(480, 140, 540, 50, INK, 1.4, true) +
    arrow(330, 140, 540, 50, PEN_GRN, "R", 10, -10) + arc(330, 140, 34, 0, 0.98) + txt(354, 110, "θ", PEN_GRN, 17) + arc(330, 140, 52, 0, 0.405, INK) + txt(392, 135, "α", INK, 15) + txt(440, 180, "parallelogram law", INK, 15),
);

const figResolve = svg(
  320,
  195,
  line(60, 160, 300, 160, INK, 1.6) + line(70, 170, 70, 15, INK, 1.6) + arrow(70, 160, 250, 50, PEN_RED, "A", -6, -14) + line(250, 50, 250, 160, INK, 1.4, true) + line(70, 50, 250, 50, INK, 1.4, true) +
    arrow(70, 160, 250, 160, PEN_GRN, "A cosθ", 0, 24, 16) + arrow(70, 160, 70, 50, PEN_GRN, "A sinθ", -38, 0, 16) + arc(70, 160, 38, 0, 0.55) + txt(122, 148, "θ", PEN_GRN, 17) + txt(292, 182, "x", INK, 16) + txt(58, 22, "y", INK, 16),
);

const figProjectile = svg(
  600,
  230,
  line(20, 190, 590, 190, INK, 1.6) +
    parabola(50, 190, 480, 130, 50) +
    arrow(50, 190, 140, 82, PEN_RED, "u", -10, -6) + arc(50, 190, 40, 0, 0.87) + txt(100, 180, "θ", PEN_GRN, 18) +
    arrow(290, 60, 360, 60, PEN_RED, "", 0, 0) + txt(290, 40, "top: v = u cosθ, vᵧ = 0", PEN_GRN, 14) +
    line(290, 60, 290, 190, INK, 1.4, true) + txt(305, 130, "H", PEN_RED, 18, "start") +
    line(50, 210, 530, 210, INK, 1.4) + txt(290, 226, "R (range)", PEN_RED, 16) +
    arrow(470, 120, 500, 170, PEN_RED, "v", 18, 0, 16) + txt(530, 112, "a = g ↓ everywhere", INK, 14),
);

const figHorizontal = svg(
  300,
  240,
  `<path d="M20 40 L90 40 L90 200" fill="none" stroke="${INK}" stroke-width="2.4"/>` + line(90, 200, 290, 200, INK, 1.6) +
    `<path d="M90 40 Q 200 45 250 200" fill="none" stroke="${INK}" stroke-width="2.4" stroke-dasharray="2 0"/>` +
    arrow(90, 40, 150, 40, PEN_RED, "u", 0, -10, 16) + txt(70, 125, "h", PEN_RED, 18) + line(90, 212, 250, 212, INK, 1.4) + txt(170, 232, "x = u·T", PEN_RED, 14) +
    arrow(250, 200, 262, 160, PEN_GRN, "", 0, 0) + txt(272, 150, "v", PEN_GRN, 16),
);

const figIncline = svg(
  320,
  210,
  line(20, 190, 300, 190, INK, 1.6) + line(20, 190, 290, 34, INK, 2.4) + arc(20, 190, 50, 0, 0.52, INK) + txt(80, 182, "α", INK, 16) +
    arrow(20, 190, 90, 80, PEN_RED, "u", -10, -6) + arc(20, 190, 32, 0.52, 1.0) + txt(62, 158, "θ−α", PEN_GRN, 13) +
    `<path d="M20 190 Q 150 40 230 69" fill="none" stroke="${INK}" stroke-width="2.4" stroke-dasharray="6 5"/>` + txt(190, 130, "R (along incline)", PEN_RED, 14),
);

const figRiver = svg(
  580,
  200,
  line(20, 30, 270, 30, INK, 2) + line(20, 170, 270, 170, INK, 2) + arrow(170, 150, 240, 150, INK, "v_r", 0, -8, 15) +
    arrow(80, 170, 80, 30, PEN_RED, "v_b", -20, 0, 15) + arrow(80, 170, 160, 30, PEN_GRN, "", 0, 0) + txt(150, 22, "lands downstream", PEN_GRN, 13) + txt(145, 192, "① shortest TIME: head straight across", INK, 13) +
    line(310, 30, 560, 30, INK, 2) + line(310, 170, 560, 170, INK, 2) + arrow(320, 150, 390, 150, INK, "v_r", 0, -8, 15) +
    arrow(470, 170, 410, 32, PEN_RED, "v_b", -22, 0, 15) + arrow(470, 170, 470, 30, PEN_GRN, "", 0, 0) + arc(470, 170, 36, 1.57, 1.98) + txt(458, 122, "θ", PEN_GRN, 15) + txt(435, 192, "② shortest PATH: aim upstream", INK, 13),
);

const figRain = svg(
  300,
  210,
  arrow(110, 20, 110, 150, INK, "v_rain", 38, 0, 15) + arrow(110, 150, 50, 150, PEN_RED, "−v_man", 0, 22, 14) + arrow(110, 20, 50, 150, PEN_GRN, "", 0, 0) + txt(20, 90, "v_rel", PEN_GRN, 15, "start") +
    arc(110, 20, 46, -1.57, -2.0) + txt(98, 84, "θ", PEN_GRN, 15) +
    `<path d="M200 80 Q 240 40 280 80" fill="none" stroke="${PEN_RED}" stroke-width="2.4"/>` + line(240, 60, 258, 160, PEN_RED, 2) + txt(150, 202, "tilt the umbrella forward by θ", INK, 13),
);

const figCircle = svg(
  560,
  200,
  `<circle cx="110" cy="100" r="75" fill="none" stroke="${INK}" stroke-width="2.4"/>` + `<circle cx="110" cy="100" r="3" fill="${INK}"/>` +
    arrow(110, 100, 163, 47, INK, "r", -12, -2, 15) + arrow(163, 47, 213, 97, PEN_RED, "v", 14, -4, 16) + arrow(163, 47, 128, 82, PEN_GRN, "a_c", 22, 10, 14) + txt(110, 195, "uniform: |v| const, a ⟂ v", INK, 13) +
    `<circle cx="400" cy="100" r="75" fill="none" stroke="${INK}" stroke-width="2.4"/>` + `<circle cx="400" cy="100" r="3" fill="${INK}"/>` +
    arrow(453, 47, 503, 97, PEN_RED, "aₜ", 14, -4, 15) + arrow(453, 47, 418, 82, PEN_GRN, "a_c", 22, 10, 14) + arrow(453, 47, 468, 132, INK, "a", -10, 22, 16) + txt(400, 195, "non-uniform: a = √(a_c² + aₜ²)", INK, 13),
);

// ---------- pages ----------

const pages: string[] = [
  // 1 — title, map, scalars & vectors
  `<div class="title-block"><div class="date">Class 11 · Physics · Chapter 3</div>
    <h1>Motion in a Plane</h1><p class="topic">Vectors · velocity &amp; acceleration in 2D · relative velocity · projectile · circular motion</p><p class="by">Class notes, Adithya Vikram</p></div>` +
    H("Chapter map (everything in the syllabus)") +
    `<div class="sheet">
      <div>1. Scalars &amp; vectors, types</div><div>2. Adding &amp; subtracting vectors</div>
      <div>3. Resolution, unit vectors, components</div><div>4. Dot &amp; cross product</div>
      <div>5. Position, displacement, velocity, accel<sup>n</sup></div><div>6. Constant acceleration in a plane</div>
      <div>7. Relative velocity, rain–man</div><div>8. River–boat problems</div>
      <div>9. Projectile motion (ground to ground)</div><div>10. Projectile from a height, on an incline</div>
      <div>11. Uniform circular motion</div><div>12. Non-uniform circular, radius of curvature</div>
    </div>` +
    H("1. Scalars and vectors") +
    pts([
      `${hl("Scalar")}: only size (magnitude). e.g. mass, time, distance, speed, work, energy.`,
      `${hl("Vector")}: size ${red("+")} direction, and adds by the ${red("triangle law")}. e.g. displacement, velocity, acceleration, force.`,
      `Current has direction but is ${red("NOT")} a vector (it doesn't add by triangle law). Classic trap.`,
    ]) +
    h("Types of vectors") +
    pts([
      `${hl("Equal")}: same magnitude, same direction (can be at different places).`,
      `${hl("Negative")}: same magnitude, opposite direction. ${vec("A")} + (−${vec("A")}) = ${vec("0")}.`,
      `${hl("Zero / null")} ${vec("0")}: magnitude 0, direction not defined. e.g. displacement after a full round.`,
      `${hl("Unit vector")} ${hat("A")} = ${fr(vec("A"), "|A|")}: magnitude 1, only gives direction. ${hat("i")}, ${hat("j")}, ${hat("k")} along x, y, z.`,
      `${hl("Position vector")} ${vec("r")}: from origin to the point. ${hl("Displacement")} = ${vec("r")}${sub("2")} − ${vec("r")}${sub("1")}.`,
      `${hl("Collinear")} (parallel/antiparallel) and ${hl("coplanar")} (in one plane).`,
    ]),

  // 2 — addition & subtraction
  H("2. Adding vectors") +
    fig(figTriangle) +
    formula(`R = ${sq("A² + B² + 2AB cosθ")} &nbsp;&nbsp;&nbsp; tan α = ${fr("B sinθ", "A + B cosθ")}`, "θ = angle between A and B (tail to tail), α = angle of R from A") +
    h("Special cases (learn these!)") +
    `<table><tr><th>θ</th><th>R</th><th>meaning</th></tr>
      <tr><td>0°</td><td>A + B</td><td>maximum</td></tr>
      <tr><td>90°</td><td>${sq("A² + B²")}</td><td>perpendicular</td></tr>
      <tr><td>180°</td><td>|A − B|</td><td>minimum</td></tr></table>` +
    formula(`|A − B| ≤ R ≤ A + B`, "any third vector outside this range can never be the resultant") +
    trick(`Two ${red("equal")} vectors A at angle θ: R = ${hl("2A cos(θ/2)")}, and R bisects the angle. R = A when θ = 120°; R = A√2 at 90°; R = A√3 at 60°.`) +
    h("Subtraction") +
    p(`${vec("A")} − ${vec("B")} = ${vec("A")} + (−${vec("B")}). &nbsp; |${vec("A")} − ${vec("B")}| = ${sq("A² + B² − 2AB cosθ")}`) +
    pts([`Addition is commutative and associative; subtraction is ${red("not")} commutative.`, `Polygon law: many vectors head-to-tail; closing side (start → end) is the resultant. Closed polygon ⇒ resultant 0.`]),

  // 3 — resolution, unit vectors, components
  H("3. Resolution and components") +
    two(
      fig(figResolve) ,
      p(`Split ${vec("A")} along x and y:`) + formula(`Aₓ = A cosθ, &nbsp; Aᵧ = A sinθ`) + formula(`A = ${sq("Aₓ² + Aᵧ²")}, &nbsp; tanθ = ${fr("Aᵧ", "Aₓ")}`),
    ) +
    formula(`${vec("A")} = Aₓ${hat("i")} + Aᵧ${hat("j")} + A_z${hat("k")}, &nbsp;&nbsp; |A| = ${sq("Aₓ² + Aᵧ² + A_z²")}`) +
    p(`${hl("Direction cosines")}: cos α = ${fr("Aₓ", "A")}, cos β = ${fr("Aᵧ", "A")}, cos γ = ${fr("A_z", "A")} &nbsp;⇒&nbsp; cos²α + cos²β + cos²γ = 1`) +
    h("Adding by components (the fastest way)") +
    p(`${vec("A")} + ${vec("B")} = (Aₓ + Bₓ)${hat("i")} + (Aᵧ + Bᵧ)${hat("j")} + (A_z + B_z)${hat("k")}. Add i with i, j with j, k with k.`) +
    imp(`A vector can be resolved along ${red("any")} two directions, but components along ${red("perpendicular")} axes are the useful ones. Component along a direction = A cos(angle with that direction).`) +
    h("Multiplying by a number") +
    pts([`λ${vec("A")}: magnitude |λ|A; same direction if λ > 0, opposite if λ < 0.`, `Multiplying by a scalar with units (e.g. mass × velocity) gives a new physical quantity (momentum).`]) +
    trick(`To find a vector of magnitude k along ${vec("A")}: k ${hat("A")} = k ${fr(vec("A"), "|A|")}.`) +
    ex(`A 10 N force at 37° to the x-axis: Fₓ = 10 cos37° = 10 × ${fr("4", "5")} = ${n(E.force37.fx)} N, &nbsp; Fᵧ = 10 × ${fr("3", "5")} = ${n(E.force37.fy)} N.`) +
    ex(`${vec("A")} = 3${hat("i")} + 4${hat("j")}: |A| = ${sq("9 + 16")} = ${n(E.a34.mag)}, &nbsp; ${hat("A")} = ${fr(`3${hat("i")} + 4${hat("j")}`, "5")}, &nbsp; angle with x = tan⁻¹${fr("4", "3")} ≈ ${n(E.a34.angleDeg)}° (the 37–53 triangle!).`),

  // 4 — dot & cross
  H("4. Dot (scalar) product") +
    formula(`${vec("A")}·${vec("B")} = AB cosθ = AₓBₓ + AᵧBᵧ + A_z B_z`, "answer is a scalar") +
    pts([
      `${hat("i")}·${hat("i")} = ${hat("j")}·${hat("j")} = ${hat("k")}·${hat("k")} = 1, &nbsp; ${hat("i")}·${hat("j")} = 0 ...`,
      `Angle between: cosθ = ${fr(vec("A") + "·" + vec("B"), "AB")}. &nbsp; ${vec("A")} ⟂ ${vec("B")} ⇔ ${vec("A")}·${vec("B")} = 0.`,
      `Projection of ${vec("A")} on ${vec("B")} = ${fr(vec("A") + "·" + vec("B"), "B")}. &nbsp; Work W = ${vec("F")}·${vec("s")}.`,
      `Commutative: ${vec("A")}·${vec("B")} = ${vec("B")}·${vec("A")}.`,
    ]) +
    H("Cross (vector) product") +
    formula(`|${vec("A")} × ${vec("B")}| = AB sinθ, &nbsp; direction ⟂ to both (right-hand rule)`) +
    formula(`${vec("A")} × ${vec("B")} = (Aᵧ B_z − A_z Bᵧ)${hat("i")} − (Aₓ B_z − A_z Bₓ)${hat("j")} + (AₓBᵧ − AᵧBₓ)${hat("k")}`, "write as a 3×3 determinant with i, j, k on top") +
    pts([
      `${hat("i")}×${hat("j")} = ${hat("k")}, ${hat("j")}×${hat("k")} = ${hat("i")}, ${hat("k")}×${hat("i")} = ${hat("j")} (cyclic); reverse order ⇒ minus sign. ${hat("i")}×${hat("i")} = 0.`,
      `${red("Not")} commutative: ${vec("A")} × ${vec("B")} = −${vec("B")} × ${vec("A")}. &nbsp; Parallel vectors ⇒ cross = 0.`,
      `|${vec("A")} × ${vec("B")}| = area of the parallelogram; half of it = area of the triangle.`,
    ]) +
    trick(`Check your cross product: dot it with ${vec("A")} and with ${vec("B")}. Both must be 0. Also |A×B|² + (A·B)² = A²B².`) +
    careful(`NCERT keeps dot product in Work–Energy and cross product in Rotation, but JEE asks both with vectors, so learn them here.`) +
    ex(`Find λ so that (2${hat("i")} + λ${hat("j")}) ⟂ (3${hat("i")} − 6${hat("j")}): dot = 6 − 6λ = 0 ⇒ λ = ${n(E.lambda)}.`) +
    ex(`Area of the triangle formed by ${vec("A")} = 2${hat("i")} + 3${hat("j")} − ${hat("k")} and ${vec("B")} = ${hat("i")} − 2${hat("j")} + 2${hat("k")}: ½|${vec("A")} × ${vec("B")}| = ½${sq("90")} ≈ ${n(E.triArea)} unit².`) +
    trick(`Unit vector ⟂ to both ${vec("A")} and ${vec("B")}: ${hat("n")} = ± ${fr(vec("A") + " × " + vec("B"), "|A × B|")}.`),

  // 5 — kinematics in a plane
  H("5. Position, velocity, acceleration in a plane") +
    formula(`${vec("r")} = x${hat("i")} + y${hat("j")}, &nbsp; Δ${vec("r")} = Δx${hat("i")} + Δy${hat("j")}`) +
    pts([
      `Average velocity ${vec("v")}${sub("avg")} = ${fr("Δ" + vec("r"), "Δt")} (direction of displacement).`,
      `Instantaneous velocity ${vec("v")} = ${fr("d" + vec("r"), "dt")} = vₓ${hat("i")} + vᵧ${hat("j")}; vₓ = ${fr("dx", "dt")}, vᵧ = ${fr("dy", "dt")}.`,
      `${hl("Velocity is always along the tangent to the path.")} Its angle: tanθ = ${fr("vᵧ", "vₓ")}.`,
      `Acceleration ${vec("a")} = ${fr("d" + vec("v"), "dt")} = ${fr("d²" + vec("r"), "dt²")}. It can point anywhere, not only along ${vec("v")}.`,
      `Speed = |${vec("v")}| = ${sq("vₓ² + vᵧ²")}. Average speed (distance/time) ≥ |average velocity|.`,
    ]) +
    imp(`a ∥ v ⇒ speed changes, path straight. &nbsp; a ⟂ v ⇒ only direction changes (speed constant). &nbsp; In general a has both parts.`) +
    H("6. Constant acceleration in a plane") +
    formula(`${vec("v")} = ${vec("u")} + ${vec("a")}t, &nbsp;&nbsp; ${vec("r")} = ${vec("r")}${sub("0")} + ${vec("u")}t + ½${vec("a")}t²`) +
    p(`The ${red("x and y motions are independent")}. Use the 1-D equations separately:`) +
    formula(`x = uₓt + ½aₓt², &nbsp; y = uᵧt + ½aᵧt², &nbsp; vₓ² = uₓ² + 2aₓx ...`) +
    trick(`Given r(t) or x(t), y(t): differentiate once for v, twice for a. Eliminate t to get the path y(x).`) +
    ex(`x = 3t, y = 4t − 5t² (SI). Then vₓ = 3, vᵧ = 4 − 10t, so at t = 0 the speed is ${n(E.path.speed0)} m/s at ${n(E.path.angleDeg)}°; aₓ = 0, aᵧ = ${n(E.path.ay)} m/s². Put t = x/3: y = ${fr("4", "3")}x − ${fr("5", "9")}x², a parabola. It's just a projectile!`) +
    ex(`${vec("u")} = 2${hat("i")} m/s, ${vec("a")} = 2${hat("j")} m/s², t = 3 s: ${vec("v")} = ${n(E.constAcc.v[0])}${hat("i")} + ${n(E.constAcc.v[1])}${hat("j")} m/s, &nbsp; ${vec("r")} = ${n(E.constAcc.r[0])}${hat("i")} + ${n(E.constAcc.r[1])}${hat("j")} m (start at origin).`),

  // 6 — relative velocity, rain
  H("7. Relative velocity") +
    formula(`${vec("v")}${sub("AB")} = ${vec("v")}${sub("A")} − ${vec("v")}${sub("B")}`, "velocity of A as seen by B") +
    pts([`${vec("v")}${sub("BA")} = −${vec("v")}${sub("AB")}.`, `Same direction: |v${sub("AB")}| = v${sub("A")} − v${sub("B")}. Opposite: v${sub("A")} + v${sub("B")}. At angle θ: ${sq("v_A² + v_B² − 2v_A v_B cosθ")}.`]) +
    h("Rain–man problems") +
    two(
      fig(figRain),
      p(`Rain falls vertically at v${sub("r")}. You walk at v${sub("m")}. Rain relative to you:`) +
        formula(`${vec("v")}${sub("rm")} = ${vec("v")}${sub("r")} − ${vec("v")}${sub("m")}`) +
        formula(`tanθ = ${fr("v_m", "v_r")}`, "θ from the vertical, tilt umbrella forward") +
        p(`Rain seems to hit you at ${sq("v_r² + v_m²")}.`),
    ) +
    trick(`"Rain appears vertical" means the horizontal parts cancel: v${sub("rain,x")} = v${sub("man")}. Draw the velocity triangle, then just read off the angle.`) +
    careful(`Relative velocity is about what one observer ${red("sees")}. Always write v${sub("AB")} = v${sub("A")} − v${sub("B")} with signs/directions first, then put numbers.`) +
    ex(`Car A goes east at 20 m/s, car B goes north at 15 m/s. ${vec("v")}${sub("AB")} = 20${hat("i")} − 15${hat("j")}: |v${sub("AB")}| = ${sq("400 + 225")} = ${n(E.cars.rel)} m/s, at ${n(E.cars.southOfEastDeg)}° south of east. (B sees A moving away "south-east".)`) +
    trick(`Closest approach of two moving bodies: go to the frame of one of them. The other then moves in a straight line with v${sub("rel")}; the least distance is the perpendicular from the first body to that line.`),

  // 7 — river-boat
  H("8. River–boat problems") +
    fig(figRiver) +
    p(`River width d, flow v${sub("r")}, boat speed in still water v${sub("b")}, heading at θ with the straight-across line (upstream +).`) +
    formula(`time t = ${fr("d", "v_b cosθ")}, &nbsp; drift x = (v${sub("r")} − v${sub("b")} sinθ)·t`) +
    two(
      `<p>${hl("① Shortest time")}: head straight across (θ = 0).</p>` + formula(`t${sub("min")} = ${fr("d", "v_b")}, &nbsp; drift = ${fr("v_r d", "v_b")}`),
      `<p>${hl("② Shortest path")} (zero drift): aim upstream.</p>` + formula(`sinθ = ${fr("v_r", "v_b")}`) + formula(`t = ${fr("d", sq("v_b² − v_r²"))}`),
    ) +
    imp(`Zero drift is possible only if v${sub("b")} > v${sub("r")}. If v${sub("b")} < v${sub("r")}, the drift is least when sinθ = ${fr("v_b", "v_r")} (θ measured from the straight-across line, towards upstream).`) +
    trick(`Shortest time never depends on the river speed: the river only carries you sideways. Aim straight, multiply time by v${sub("r")} for the drift.`) +
    p(`Same idea for an aeroplane in wind: velocity relative to ground = velocity relative to air + wind velocity.`),

  // 8 — projectile basics
  H("9. Projectile motion (ground to ground)") +
    fig(figProjectile) +
    p(`Only gravity acts (no air resistance). ${hl("x: uniform motion")}, ${hl("y: uniformly accelerated (−g)")}. uₓ = u cosθ, uᵧ = u sinθ.`) +
    formula(`x = (u cosθ)t, &nbsp;&nbsp; y = (u sinθ)t − ½gt²`) +
    formula(`Trajectory: y = x tanθ − ${fr("g x²", "2u²cos²θ")} &nbsp;=&nbsp; x tanθ (1 − ${fr("x", "R")})`, "a parabola") +
    `<table><tr><th>Time of flight</th><th>Max height</th><th>Range</th></tr>
      <tr><td>T = ${fr("2u sinθ", "g")}</td><td>H = ${fr("u² sin²θ", "2g")}</td><td>R = ${fr("u² sin2θ", "g")}</td></tr></table>` +
    pts([
      `Velocity at time t: vₓ = u cosθ (constant), vᵧ = u sinθ − gt; v = ${sq("vₓ² + vᵧ²")}, tanφ = ${fr("vᵧ", "vₓ")}.`,
      `At the top: vᵧ = 0, v = u cosθ, ${vec("v")} ⟂ ${vec("g")}. Time to top = T/2.`,
      `Lands with the same speed u at angle θ below the horizontal.`,
    ]) +
    ex(`Path y = x − ${fr("x²", "20")} (SI, g = 10). Compare with y = x tanθ − ${fr("gx²", "2u²cos²θ")}: tanθ = 1 ⇒ θ = ${E.traj.thetaDeg}°; ${fr("10", "2u²(½)")} = ${fr("1", "20")} ⇒ u = ${sq("200")} ≈ ${n(E.traj.u)} m/s. Range (y = 0): R = ${n(E.traj.R)} m, &nbsp; H = R/4 = ${n(E.traj.H)} m.`),

  // 9 — projectile shortcuts
  H("Projectile: key results &amp; shortcuts") +
    pts([
      `${hl("Max range")} at θ = 45°: R${sub("max")} = ${fr("u²", "g")}; then H = ${fr("R_max", "4")}. e.g. u = 20 m/s: R${sub("max")} = ${n(E.max45.R)} m, H = ${n(E.max45.H)} m.`,
      `${hl("Complementary angles")} θ and 90° − θ give the ${red("same range")} (e.g. 15° &amp; 75° at 20 m/s: ${n(E.comp15)} m each).`,
      `For those two: H${sub("1")} + H${sub("2")} = ${fr("u²", "2g")}, &nbsp; R = 4${sq("H₁H₂")}, &nbsp; T${sub("1")}T${sub("2")} = ${fr("2R", "g")}.`,
      `${hl("H and R")}: ${fr("H", "R")} = ${fr("tanθ", "4")} ⇒ tanθ = ${fr("4H", "R")}. &nbsp; H = R ⇒ θ = tan⁻¹4. &nbsp; Also ${fr("H", "T²")} = ${fr("g", "8")}.`,
      `${hl("Reaches height h twice")} at t${sub("1")}, t${sub("2")}: t${sub("1")} + t${sub("2")} = T, &nbsp; t${sub("1")}t${sub("2")} = ${fr("2h", "g")}.`,
      `KE at the top = K cos²θ (K = initial KE). Momentum change from launch to landing = 2mu sinθ (downward).`,
      `${hl("Radius of curvature")} at the top: r = ${fr("(u cosθ)²", "g")}; at launch: r = ${fr("u²", "g cosθ")}.`,
      `Angle between ${vec("v")} and ${vec("a")}: 90° + θ at launch, 90° at top, 90° − θ at landing.`,
    ]) +
    trick(`For any "same u, two angles, same range" question: the angles add to 90°. Write R = 4√(H₁H₂) or T₁T₂ = 2R/g and you're done in one line.`) +
    careful(`These shortcuts need ${red("same launch and landing level")} and no air resistance. From a height or on an incline they change.`) +
    H("Must-know values") +
    `<table><tr><th>θ</th><th>0°</th><th>30°</th><th>37°</th><th>45°</th><th>53°</th><th>60°</th><th>90°</th></tr>
      <tr><td>sinθ</td><td>0</td><td>½</td><td>3/5</td><td>1/√2</td><td>4/5</td><td>√3/2</td><td>1</td></tr>
      <tr><td>cosθ</td><td>1</td><td>√3/2</td><td>4/5</td><td>1/√2</td><td>3/5</td><td>½</td><td>0</td></tr>
      <tr><td>tanθ</td><td>0</td><td>1/√3</td><td>3/4</td><td>1</td><td>4/3</td><td>√3</td><td>∞</td></tr></table>` +
    p(`<span class="note">37°/53° are the JEE convention (from the 3-4-5 triangle); g = 10 m/s² unless told otherwise.</span>`),

  // 10 — horizontal & incline
  H("10. Projectile from a height") +
    two(
      fig(figHorizontal),
      p(`${hl("Thrown horizontally")} with speed u from height h:`) + formula(`T = ${sq("2h/g")}, &nbsp; x = u${sq("2h/g")}`) + formula(`vᵧ = gT = ${sq("2gh")}, &nbsp; v = ${sq("u² + 2gh")}`) + p(`Path: y = ${fr("g x²", "2u²")} (measured down from the top).`),
    ) +
    p(`${hl("Thrown at θ from height h")}: use −h = (u sinθ)t − ½gt², solve the quadratic for t (take the + root), then x = (u cosθ)t.`) +
    imp(`Time of fall depends ${red("only on h")}, not on u. A ball dropped and a ball thrown horizontally from the same height land together.`) +
    H("Projectile on an inclined plane") +
    two(
      fig(figIncline),
      p(`Incline angle α, launched at θ to the ${red("horizontal")} (up the incline). Take axes along and ⟂ to the incline: g has parts g sinα (along) and g cosα (⟂).`) +
        formula(`T = ${fr("2u sin(θ − α)", "g cosα")}`) +
        formula(`R = ${fr("2u² sin(θ − α) cosθ", "g cos²α")}`),
    ) +
    formula(`R${sub("max, up")} = ${fr("u²", "g(1 + sinα)")} at θ = 45° + α/2; &nbsp; R${sub("max, down")} = ${fr("u²", "g(1 − sinα)")}`) +
    trick(`Hits the incline at right angles ⇔ the velocity along the incline is zero at landing: u cos(θ−α) = g sinα · T. Use the incline axes and it's 1-D.`),

  // 11 — circular motion
  H("11. Uniform circular motion") +
    fig(figCircle) +
    pts([
      `Angular displacement Δθ (rad), angular velocity ω = ${fr("dθ", "dt")}, &nbsp; ω = ${fr("2π", "T")} = 2πf.`,
      `Speed v = ωr (constant), but the velocity ${red("changes direction")} ⇒ there is an acceleration.`,
    ]) +
    formula(`a${sub("c")} = ${fr("v²", "r")} = ω²r = ${fr("4π²r", "T²")} &nbsp;&nbsp; (towards the centre)`) +
    imp(`In uniform circular motion speed is constant, but velocity and acceleration are ${red("not")} constant vectors (their directions keep turning). |a| stays the same.`) +
    pts([`${vec("v")} = ${vec("ω")} × ${vec("r")}; ${vec("v")} ⟂ ${vec("r")}, ${vec("a")} ∥ −${vec("r")}.`, `In one full turn: displacement = 0, average velocity = 0, distance = 2πr.`, `Over half a turn: |Δ${vec("v")}| = 2v; over angle θ: |Δ${vec("v")}| = 2v sin(θ/2).`]) +
    H("12. Non-uniform circular motion") +
    formula(`aₜ = ${fr("dv", "dt")} = αr (along v), &nbsp; a${sub("c")} = ${fr("v²", "r")}, &nbsp; a = ${sq("a_c² + aₜ²")}`, "angle of a with v: tanφ = a_c / aₜ") +
    p(`${hl("Radius of curvature")} of any path: r = ${fr("v²", "a⊥")} (a⊥ = part of a perpendicular to v). For y(x): r = ${fr(`(1 + y′²)${sup("3/2")}`, "|y″|")}.`) +
    trick(`Projectile at the top: a⊥ = g, v = u cosθ ⇒ r = u²cos²θ / g. Same rule works at any point of any curve.`),

  // 12 — formula sheet
  H("One-page formula sheet") +
    `<div class="sheet small">
      <div>R = √(A² + B² + 2AB cosθ)</div><div>tan α = B sinθ / (A + B cosθ)</div>
      <div>equal vectors: R = 2A cos(θ/2)</div><div>|A − B| ≤ R ≤ A + B</div>
      <div>Aₓ = A cosθ, Aᵧ = A sinθ</div><div>cos²α + cos²β + cos²γ = 1</div>
      <div>A·B = AB cosθ = ΣAᵢBᵢ</div><div>|A × B| = AB sinθ (area)</div>
      <div>v = dr/dt, a = dv/dt</div><div>v = u + at, r = r₀ + ut + ½at²</div>
      <div>v_AB = v_A − v_B</div><div>rain: tanθ = v_m / v_r</div>
      <div>river: t_min = d / v_b</div><div>drift (shortest time) = v_r d / v_b</div>
      <div>zero drift: sinθ = v_r / v_b</div><div>its time: t = d / √(v_b² − v_r²)</div>
      <div>v_b &lt; v_r: least drift at sinθ = v_b / v_r</div><div>closest approach: use the relative frame</div>
      <div>T = 2u sinθ / g</div><div>H = u² sin²θ / 2g</div>
      <div>R = u² sin2θ / g</div><div>R_max = u²/g at 45°, H = R/4</div>
      <div>y = x tanθ (1 − x/R)</div><div>tanθ = 4H / R</div>
      <div>θ, 90°−θ: R = 4√(H₁H₂)</div><div>T₁T₂ = 2R / g</div>
      <div>horizontal: T = √(2h/g)</div><div>v = √(u² + 2gh)</div>
      <div>incline: T = 2u sin(θ−α) / g cosα</div><div>R_max up = u² / g(1 + sinα)</div>
      <div>ω = 2π/T = 2πf, v = ωr</div><div>a_c = v²/r = ω²r</div>
      <div>a = √(a_c² + aₜ²)</div><div>r_curv = v² / a⊥ ; top: u²cos²θ / g</div>
    </div>` +
    H("Common mistakes") +
    pts([
      `Using θ = angle between ${red("head and tail")} instead of tail-to-tail in R = √(A² + B² + 2AB cosθ).`,
      `Forgetting that range formulas need launch and landing at the ${red("same level")}.`,
      `Taking velocity at the top as zero. Only vᵧ = 0; v = u cosθ.`,
      `Writing v${sub("AB")} = v${sub("B")} − v${sub("A")} (wrong order).`,
      `Saying "uniform circular motion has zero acceleration". It has v²/r towards the centre.`,
    ]),
];

// ---------- PYQ-pattern pages ----------

const D = "°";
const pyqs = [
  pyq("JEE Main pattern · vectors", `Two vectors of magnitude 3 and 5 make 60${D} with each other. Find the resultant and its angle with the first vector.`, [
    `R = √(9 + 25 + 2·3·5·cos60${D}) = √49 = ${hl(n(A.q1.R))}`,
    `tan α = 5 sin60${D} / (3 + 5 cos60${D}) = 4.33 / 5.5 ⇒ α ≈ ${n(A.q1.alphaDeg)}${D}`,
  ], `R = ${n(A.q1.R)}, α ≈ ${n(A.q1.alphaDeg)}${D}`),
  pyq("JEE Main pattern · equal vectors", `Two forces of equal magnitude F have a resultant of magnitude F. Find the angle between them.`, [`Equal vectors: R = 2F cos(θ/2) = F`, `cos(θ/2) = ½ ⇒ θ/2 = 60${D}`], `θ = ${n(A.q2.thetaDeg)}${D}`),
  pyq("JEE Main pattern · dot &amp; cross", `${vec("A")} = 2${hat("i")} + 3${hat("j")} − ${hat("k")}, ${vec("B")} = ${hat("i")} − 2${hat("j")} + 2${hat("k")}. Find ${vec("A")}·${vec("B")}, the angle between them, and ${vec("A")} × ${vec("B")}.`, [
    `A·B = 2 − 6 − 2 = ${A.q3.dot}; |A| = √14, |B| = 3`,
    `cosθ = −6 / (3√14) ⇒ θ ≈ ${n(A.q3.angleDeg)}${D}`,
    `A × B = (3·2 − (−1)(−2))${hat("i")} − (2·2 − (−1)(1))${hat("j")} + (2(−2) − 3·1)${hat("k")} = ${A.q3.cross[0]}${hat("i")} − ${-A.q3.cross[1]}${hat("j")} − ${-A.q3.cross[2]}${hat("k")}`,
    `Check: (A×B)·A = 8 − 15 + 7 = 0 ✓`,
  ], `A·B = ${A.q3.dot}, θ ≈ ${n(A.q3.angleDeg)}${D}, |A×B| = √90 ≈ ${n(A.q3.crossMag)}`),
  pyq("JEE Main pattern · calculus", `A particle moves with ${vec("r")} = 2t²${hat("i")} + (3t − t²)${hat("j")} m. Find its speed at t = 1 s and its acceleration.`, [
    `${vec("v")} = 4t${hat("i")} + (3 − 2t)${hat("j")} ⇒ at t = 1: 4${hat("i")} + ${hat("j")}`,
    `speed = √17 ≈ ${n(A.q4.speed)} m/s`,
    `${vec("a")} = 4${hat("i")} − 2${hat("j")} (constant), |a| = √20`,
  ], `${n(A.q4.speed)} m/s; a = 4${hat("i")} − 2${hat("j")}, |a| ≈ ${n(A.q4.accel)} m/s²`),
  pyq("JEE Main pattern · projectile", `A ball is thrown at 20 m/s at 30${D} above the horizontal (g = 10). Find T, H and R.`, [
    `uₓ = 20 cos30${D} = 17.3, uᵧ = 10 m/s`,
    `T = 2uᵧ/g = ${n(A.q5.T)} s; &nbsp; H = uᵧ²/2g = ${n(A.q5.H)} m`,
    `R = u² sin60${D} / g = 400(0.866)/10 = ${n(A.q5.R)} m`,
  ], `T = ${n(A.q5.T)} s, H = ${n(A.q5.H)} m, R = ${n(A.q5.R)} m`),
  pyq("JEE Main pattern · complementary angles", `Two balls are thrown with the same speed at 30${D} and 60${D} (u = 20 m/s). Their heights are H₁ and H₂. Show the range is 4√(H₁H₂).`, [
    `H₁ = ${n(A.q6.H1)} m, H₂ = ${n(A.q6.H2)} m`,
    `4√(H₁H₂) = 4√${n(A.q6.H1 * A.q6.H2)} = ${n(A.q6.R)} m = R for both ✓`,
    `Also H₁ + H₂ = ${n(A.q6.sumH)} m = u²/2g ✓`,
  ], `R = ${n(A.q6.R)} m`),
  pyq("JEE Main pattern · horizontal projection", `A ball is thrown horizontally at 10 m/s from a 45 m high cliff. Find the time, the distance from the foot, and the velocity on landing.`, [
    `T = √(2h/g) = √9 = ${n(A.q7.T)} s; x = uT = ${n(A.q7.x)} m`,
    `vᵧ = gT = 30 m/s, v = √(100 + 900) ≈ ${n(A.q7.speed)} m/s`,
    `angle below horizontal: tan⁻¹(30/10) ≈ ${n(A.q7.belowDeg)}${D}`,
  ], `${n(A.q7.T)} s, ${n(A.q7.x)} m, ${n(A.q7.speed)} m/s at ${n(A.q7.belowDeg)}${D} below horizontal`),
  pyq("JEE Main pattern · H vs R", `At what angle must a projectile be thrown so that its maximum height equals its range?`, [`H/R = tanθ/4 = 1`, `tanθ = 4`], `θ = tan⁻¹4 ≈ ${n(A.q8.thetaDeg)}${D}`),
  pyq("JEE Main pattern · river–boat", `A river is 100 m wide and flows at 3 m/s. A boat moves at 5 m/s in still water. (a) Least time to cross and the drift? (b) Direction and time to reach the point straight opposite?`, [
    `(a) head straight across: t = 100/5 = ${n(A.q9.tMin)} s; drift = 3 × 20 = ${n(A.q9.drift)} m`,
    `(b) sinθ = 3/5 ⇒ θ ≈ ${n(A.q9.upstreamDeg)}${D} upstream from straight-across`,
    `speed across = √(25 − 9) = 4 m/s ⇒ t = 100/4 = ${n(A.q9.tStraight)} s`,
  ], `(a) ${n(A.q9.tMin)} s, ${n(A.q9.drift)} m; (b) ${n(A.q9.upstreamDeg)}${D} upstream, ${n(A.q9.tStraight)} s`),
  pyq("JEE Main pattern · rain–man", `Rain falls vertically at 10 m/s. A man walks at 5 m/s. At what angle should he hold his umbrella?`, [`v_rain,man = v_rain − v_man`, `tanθ = 5/10 ⇒ θ ≈ ${n(A.q10.tiltDeg)}${D} from vertical, tilted forward`, `rain seen at √125 ≈ ${n(A.q10.relative)} m/s`], `${n(A.q10.tiltDeg)}${D} forward from vertical`),
  pyq("NCERT / JEE pattern · uniform circular", `A stone tied to a 0.5 m string is whirled at 2 revolutions per second. Find ω, v and the centripetal acceleration.`, [`ω = 2πf = 4π ≈ ${n(A.q11.w)} rad/s`, `v = ωr = 2π ≈ ${n(A.q11.v)} m/s`, `a = ω²r = 8π² ≈ ${n(A.q11.a)} m/s² (towards the centre)`], `ω ≈ ${n(A.q11.w)} rad/s, v ≈ ${n(A.q11.v)} m/s, a ≈ ${n(A.q11.a)} m/s²`),
  pyq("JEE Main pattern · non-uniform circular", `A particle on a circle of radius 2 m has speed 4 m/s, increasing at 3 m/s². Find its total acceleration.`, [`a_c = v²/r = 16/2 = ${n(A.q12.ac)} m/s²; aₜ = 3 m/s²`, `a = √(64 + 9) = √73 ≈ ${n(A.q12.a)} m/s²`, `angle with v: tan⁻¹(8/3) ≈ ${n(A.q12.angleWithVDeg)}${D}`], `${n(A.q12.a)} m/s² at ${n(A.q12.angleWithVDeg)}${D} to the velocity`),
  pyq("JEE Advanced pattern · incline", `A ball is thrown at 20 m/s at 75${D} to the horizontal, up an incline of 30${D}. Find the time of flight and the range along the incline. What angle would give the maximum range?`, [
    `T = 2u sin(θ − α)/(g cosα) = 2·20·sin45${D}/(10 cos30${D}) ≈ ${n(A.q13.T)} s`,
    `R = 2u² sin(θ−α) cosθ/(g cos²α) = 2·400·(0.707)(0.259)/(10·0.75) ≈ ${n(A.q13.R)} m`,
    `max range at θ = 45${D} + α/2 = ${n(A.q13.bestThetaDeg)}${D}: R_max = u²/g(1 + sinα) ≈ ${n(A.q13.Rmax)} m`,
  ], `T ≈ ${n(A.q13.T)} s, R ≈ ${n(A.q13.R)} m; best angle ${n(A.q13.bestThetaDeg)}${D}`),
  pyq("JEE Main pattern · speed at top", `The speed of a projectile at its highest point is half its launch speed. Find the launch angle and the ratio of KE at the top to the initial KE.`, [`u cosθ = u/2 ⇒ cosθ = ½`, `KE_top / KE = cos²θ = ¼`], `θ = ${n(A.q14.thetaDeg)}${D}, ratio ${A.q14.keRatio === 0.25 ? "1 : 4" : n(A.q14.keRatio)}`),
  pyq("JEE Advanced pattern · radius of curvature", `Find the radius of curvature of the path at the highest point for u = 20 m/s at 60${D}.`, [`At the top a⊥ = g and v = u cos60${D} = 10 m/s`, `r = v²/g = 100/10`], `r = ${n(A.q15.r)} m`),
];

pages.push(
  H("PYQ-pattern questions with solutions") + p(`<span class="note">Original questions written in the style of recurring JEE Main / Advanced and NCERT themes (not copied from papers). Every answer is computed and checked by code.</span>`) + pyqs.slice(0, 4).join(""),
  pyqs.slice(4, 8).join(""),
  pyqs.slice(8, 12).join(""),
  pyqs.slice(12).join("") +
    H("Last-minute checklist") +
    pts([
      `Resolve everything into x and y first. Most 2-D problems become two 1-D problems.`,
      `Projectile: horizontal velocity never changes; vertical is just free fall.`,
      `Same level? Use T, H, R formulas. Different level / incline? Use components or incline axes.`,
      `Relative velocity: draw the triangle v_AB = v_A − v_B before any numbers.`,
      `Circle: a_c = v²/r always; add aₜ if the speed changes.`,
    ]) +
    `<div class="end">— end of chapter: Motion in a Plane —</div>`,
);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Motion in a Plane: Class Notes</title>
<style>
  @font-face { font-family: Kalam; src: url("${url("public/fonts/kalam-400.woff2")}") format("woff2"); font-weight: 400; }
  @font-face { font-family: Kalam; src: url("${url("public/fonts/kalam-700.woff2")}") format("woff2"); font-weight: 700; }
  @font-face { font-family: Caveat; src: url("${url("public/fonts/caveat-var.woff2")}") format("woff2"); font-weight: 400 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Kalam, "Comic Sans MS", cursive; color: #1a3a8f; font-size: 13.2pt; line-height: 8mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative;
    padding: 12mm 12mm 10mm 28mm;
    background:
      linear-gradient(90deg, transparent 22mm, rgba(214,63,63,.55) 22mm, rgba(214,63,63,.55) 22.6mm, transparent 22.6mm),
      repeating-linear-gradient(180deg, #fffdf6 0, #fffdf6 calc(8mm - 0.3mm), #b9cbe6 calc(8mm - 0.3mm), #b9cbe6 8mm);
    background-color: #fffdf6;
  }
  .page:last-child { page-break-after: auto; }
  .pno { position: absolute; bottom: 5mm; right: 12mm; font-size: 11pt; color: #8a96b8; }
  h1 { font-family: Caveat, cursive; font-size: 40pt; line-height: 14mm; margin: 0; color: #111; }
  h2 { font-family: Caveat, cursive; font-size: 23pt; line-height: 10mm; margin: 1.5mm 0 0.5mm; color: #c0392b; display: table; border-bottom: 2.5px solid #c0392b; }
  h3 { font-size: 13.6pt; margin: 0; line-height: 8mm; color: #111; text-decoration: underline; text-underline-offset: 3px; }
  p { margin: 0; }
  ul, ol { margin: 0; padding-left: 6mm; }
  li { margin: 0; }
  .title-block { border-bottom: 2px dashed #8a96b8; margin-bottom: 1mm; }
  .date { color: #8a96b8; font-size: 11pt; text-align: right; }
  .topic { color: #1d7a46; font-weight: 700; }
  .by { color: #8a96b8; font-size: 11pt; }
  .note { color: #6a7090; font-size: 11pt; }
  .hl { background: linear-gradient(180deg, transparent 35%, rgba(255,235,59,.75) 35%, rgba(255,235,59,.75) 88%, transparent 88%); padding: 0 1mm; }
  .red { color: #c0392b; font-weight: 700; }
  .grn { color: #1d7a46; }
  .vec { position: relative; display: inline-block; font-style: italic; }
  .vec::after { content: "→"; position: absolute; left: 0; right: 0; top: -0.7em; text-align: center; font-size: .7em; line-height: 1; }
  .hat { position: relative; display: inline-block; font-weight: 700; }
  .hat::after { content: "^"; position: absolute; left: 0; right: 0; top: -0.55em; text-align: center; font-size: .8em; line-height: 1; }
  .ov { border-top: 1.6px solid currentColor; padding-top: 0.5px; }
  .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.12; font-size: .9em; margin: 0 1mm; }
  .frac > span:first-child { border-bottom: 1.8px solid currentColor; padding: 0 1mm; }
  .formula { border: 2.5px solid #1a3a8f; border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px; padding: 1.2mm 5mm; margin: 1.5mm 0; display: inline-block; color: #111; background: rgba(255,255,255,.6); line-height: 1.55; }
  .fnote { font-size: 10.5pt; color: #1d7a46; }
  .imp, .trick, .careful { margin: 1.5mm 0; padding: 0.8mm 3mm; line-height: 1.5; border-radius: 3mm; }
  .imp { border: 2px dashed #c0392b; color: #111; }
  .imp .star { color: #c0392b; font-weight: 700; }
  .trick { border-left: 4px solid #1d7a46; background: rgba(29,122,70,.08); }
  .careful { border-left: 4px solid #c0392b; background: rgba(192,57,43,.06); }
  .tag { font-weight: 700; color: #c0392b; }
  .trick .tag { color: #1d7a46; }
  .ex { margin: 1.5mm 0; padding: 0.8mm 3mm; line-height: 1.55; border-left: 4px solid #1a3a8f; background: rgba(26,58,143,.05); border-radius: 3mm; }
  .ex .tag { color: #1a3a8f; }
  .solved { margin: 1.5mm 0 3mm; padding: 1mm 3mm 1.5mm; border-left: 3px solid #1a3a8f; line-height: 1.55; break-inside: avoid; }
  .solved .q { color: #111; }
  .ptag { font-size: 10pt; color: #fff; background: #c0392b; border-radius: 2mm; padding: 0 1.5mm; }
  .solved .sol { color: #1d7a46; font-weight: 700; }
  .solved .ans { color: #111; font-weight: 700; }
  table { border-collapse: collapse; margin: 1.5mm 0; font-size: 12.4pt; line-height: 1.5; }
  th, td { border: 1.8px solid #1a3a8f; padding: 0.8mm 4mm; text-align: left; vertical-align: middle; }
  th { color: #c0392b; }
  .fig { margin: 1mm 0; text-align: center; }
  .fig svg { max-width: 100%; height: auto; }
  .cap { font-size: 11pt; color: #1d7a46; }
  .two { display: grid; grid-template-columns: auto 1fr; gap: 5mm; align-items: center; }
  .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6mm; border: 2.5px solid #c0392b; border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px; padding: 2mm 5mm; color: #111; line-height: 1.75; }
  .sheet.small { font-size: 12.2pt; }
  .end { text-align: center; color: #8a96b8; margin-top: 6mm; }
</style></head>
<body>
${pages.map((pg, i) => `<div class="page">${subify(pg)}<div class="pno">${i + 1}</div></div>`).join("\n")}
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, `${base}.html`);
fs.writeFileSync(htmlPath, html);

const chrome = path.join(root, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!fs.existsSync(chrome)) throw new Error("Headless Chrome not found. Render any video once to download it.");
const pdfPath = path.join(outDir, `${base}.pdf`);
const result = spawnSync(
  chrome,
  ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header", "--allow-file-access-from-files", "--virtual-time-budget=15000", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href],
  { stdio: "inherit" },
);
if (result.status !== 0 || !fs.existsSync(pdfPath)) throw new Error("Printing to PDF failed.");
console.log(`Motion in a Plane notes → ${path.relative(root, pdfPath)} (${pages.length} pages)`);
