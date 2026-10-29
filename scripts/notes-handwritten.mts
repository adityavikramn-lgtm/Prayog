// Builds handwritten-style class notes (notebook look) for Electric Charges & Coulomb's Law.
//   npm run notes:handwritten
// Every worked number comes from src/notes/electrostatics.ts (checked by tests/notes.test.ts).
// Output: notes/electric-charges-class-notes.html and .pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { sig3 } from "../src/physics/format";
import { ex1, ex10, ex10b, ex2, ex3, ex4, ex5, ex6, ex7, ex8a, ex8b, ex9 } from "../src/notes/electrostatics";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "electric-charges-class-notes";

// ---------- pen-and-paper helpers ----------

/** Fraction written the way you'd write it by hand: top, a line, bottom. */
/** A letter with a small arrow over it (vector), drawn with CSS so any font works. */
const vec = (s: string) => `<span class="vec">${s}</span>`;
const fr = (top: string, bottom: string) => `<span class="frac"><span>${top}</span><span>${bottom}</span></span>`;
const hl = (s: string) => `<span class="hl">${s}</span>`; // yellow highlighter
const red = (s: string) => `<span class="red">${s}</span>`;
const grn = (s: string) => `<span class="grn">${s}</span>`;
const H = (s: string) => `<h2>${s}</h2>`;
const h = (s: string) => `<h3>${s}</h3>`;
const p = (s: string) => `<p>${s}</p>`;
const pts = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const steps = (items: string[]) => `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
const formula = (s: string, note = "") => `<div class="formula">${s}${note ? `<div class="fnote">${note}</div>` : ""}</div>`;
const imp = (s: string) => `<div class="imp"><span class="star">★ IMP</span> ${s}</div>`;
const trick = (s: string) => `<div class="trick"><span class="tag">Trick</span> ${s}</div>`;
const careful = (s: string) => `<div class="careful"><span class="tag">Careful!</span> ${s}</div>`;
let qn = 0;
const solved = (q: string, sol: string[], ans: string) => {
  qn++;
  return `<div class="solved"><div class="q"><b>Q${qn}.</b> ${q}</div><div class="sol">Sol<sup>n</sup>:</div>${steps(sol)}<div class="ans">⇒ ${ans}</div></div>`;
};
const fig = (svg: string, caption = "") => `<div class="fig">${svg}${caption ? `<div class="cap">${caption}</div>` : ""}</div>`;

const μC = "µC";
const sup = (s: string) => `<sup>${s}</sup>`;
const sub = (s: string) => `<sub>${s}</sub>`;
const q1 = `q${sub("1")}`;
const q2 = `q${sub("2")}`;
const e0 = `ε${sub("0")}`;

// ---------- hand-drawn looking diagrams ----------
// Each stroke is drawn twice with a tiny, fixed offset, like going over a pen line.

const INK = "#1a3a8f";
const PEN_RED = "#c0392b";
const PEN_GRN = "#1d7a46";
const FONT = "Kalam, 'Comic Sans MS', cursive";

function line(x1: number, y1: number, x2: number, y2: number, c = INK, w = 2.4, dash = false): string {
  const d = dash ? 'stroke-dasharray="7 6"' : "";
  return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + 1.5} ${(y1 + y2) / 2 - 1.5} ${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" ${d}/>
    <path d="M${x1 + 0.8} ${y1 + 0.6} L${x2 - 0.6} ${y2 + 0.8}" stroke="${c}" stroke-width="${w * 0.45}" fill="none" stroke-linecap="round" opacity=".55" ${d}/>`;
}
function arrow(x1: number, y1: number, x2: number, y2: number, c = PEN_RED, label = "", lx = 0, ly = -12): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (s: number) => x2 - 13 * Math.cos(a + s);
  const hy = (s: number) => y2 - 13 * Math.sin(a + s);
  return `${line(x1, y1, x2, y2, c)}${line(x2, y2, hx(0.45), hy(0.45), c)}${line(x2, y2, hx(-0.45), hy(-0.45), c)}${
    label ? `<text x="${(x1 + x2) / 2 + lx}" y="${(y1 + y2) / 2 + ly}" fill="${c}" font-size="19" text-anchor="middle" font-family="${FONT}">${label}</text>` : ""
  }`;
}
function blob(x: number, y: number, sign: "+" | "−", r = 17, label = ""): string {
  const c = sign === "+" ? PEN_RED : INK;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="2.4"/>
    <circle cx="${x + 0.8}" cy="${y - 0.6}" r="${r - 0.6}" fill="none" stroke="${c}" stroke-width="1" opacity=".5"/>
    <text x="${x}" y="${y + 8}" text-anchor="middle" font-size="24" font-weight="700" fill="${c}" font-family="${FONT}">${sign}</text>
    ${label ? `<text x="${x}" y="${y + r + 22}" text-anchor="middle" font-size="18" fill="${INK}" font-family="${FONT}">${label}</text>` : ""}`;
}
const txt = (x: number, y: number, s: string, c = INK, size = 18, anchor = "middle") =>
  `<text x="${x}" y="${y}" fill="${c}" font-size="${size}" text-anchor="${anchor}" font-family="${FONT}">${s}</text>`;
const svg = (w: number, hgt: number, inner: string) => `<svg viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const figRepel = svg(
  600,
  120,
  blob(90, 45, "+") + blob(220, 45, "+") + arrow(70, 45, 20, 45) + arrow(240, 45, 290, 45) + txt(155, 108, "like → repel") +
    blob(390, 45, "+") + blob(520, 45, "−") + arrow(410, 45, 448, 45) + arrow(500, 45, 462, 45) + txt(455, 108, "unlike → attract"),
);

const figInduction = svg(
  640,
  170,
  `<rect x="20" y="62" width="50" height="16" rx="4" fill="none" stroke="${PEN_RED}" stroke-width="2"/>` + txt(45, 75, "+ + +", PEN_RED, 13) +
    `<circle cx="125" cy="70" r="36" fill="none" stroke="${INK}" stroke-width="2.2"/>` + txt(105, 65, "− −", INK, 18) + txt(145, 65, "+ +", PEN_RED, 18) + txt(115, 135, "(1) rod near", INK, 16) +
    arrow(175, 70, 225, 70, INK) +
    `<rect x="235" y="62" width="50" height="16" rx="4" fill="none" stroke="${PEN_RED}" stroke-width="2"/>` + txt(260, 75, "+ + +", PEN_RED, 13) +
    `<circle cx="340" cy="70" r="36" fill="none" stroke="${INK}" stroke-width="2.2"/>` + txt(320, 65, "− −", INK, 18) +
    line(376, 70, 400, 70) + line(400, 70, 400, 120) + line(388, 120, 412, 120) + line(392, 127, 408, 127) + txt(335, 135, "(2) earth it", INK, 16) +
    arrow(425, 70, 470, 70, INK) +
    `<circle cx="540" cy="70" r="36" fill="none" stroke="${INK}" stroke-width="2.2"/>` + txt(540, 48, "−", INK, 18) + txt(518, 80, "−", INK, 18) + txt(562, 80, "−", INK, 18) + txt(540, 102, "−", INK, 18) +
    txt(540, 135, "(3) remove earth, then rod", INK, 16) + txt(540, 158, "⇒ sphere is −ve", PEN_GRN, 16),
);

const figCoulomb = svg(
  560,
  120,
  blob(130, 45, "+", 17, "q₁") + blob(430, 45, "+", 17, "q₂") + arrow(110, 45, 40, 45, PEN_RED, "F") + arrow(450, 45, 520, 45, PEN_RED, "F") +
    line(130, 92, 430, 92, PEN_GRN, 1.8) + line(130, 84, 130, 100, PEN_GRN, 1.8) + line(430, 84, 430, 100, PEN_GRN, 1.8) + txt(280, 112, "r", PEN_GRN, 20),
);

const figLine = svg(
  620,
  130,
  line(30, 55, 600, 55, "#8a96b8", 1.4, true) + blob(70, 55, "+", 16, `A (+2${μC})`) + blob(230, 55, "−", 16, `B (−1${μC})`) + blob(550, 55, "+", 16, `C (+4${μC})`) +
    arrow(230, 22, 150, 22, PEN_RED, "1.8 N") + arrow(230, 22, 275, 22, PEN_RED, "0.9 N", 8) + txt(150, 122, "10 cm", PEN_GRN, 16) + txt(390, 122, "20 cm", PEN_GRN, 16),
);

const figSquare = svg(
  420,
  300,
  line(80, 60, 260, 60, "#8a96b8", 1.4, true) + line(260, 60, 260, 240, "#8a96b8", 1.4, true) + line(260, 240, 80, 240, "#8a96b8", 1.4, true) + line(80, 240, 80, 60, "#8a96b8", 1.4, true) +
    blob(80, 60, "+", 14) + blob(260, 60, "+", 14) + blob(80, 240, "+", 14) + blob(260, 240, "+", 14) +
    arrow(260, 240, 330, 240, PEN_RED, "F₁", 0, -10) + arrow(260, 240, 260, 295, PEN_RED) + arrow(260, 240, 320, 290, PEN_GRN) + txt(170, 40, "side a", PEN_GRN, 17) + txt(355, 290, "net", PEN_GRN, 17),
);

const figNull = svg(
  640,
  200,
  txt(20, 22, "like charges → null pt. in between, near smaller", INK, 17, "start") + line(30, 65, 610, 65, "#8a96b8", 1.4, true) +
    blob(70, 65, "+", 15, `+2${μC}`) + blob(570, 65, "+", 15, `+8${μC}`) + `<circle cx="230" cy="65" r="6" fill="${PEN_GRN}"/>` + txt(230, 48, "F = 0", PEN_GRN, 16) +
    txt(20, 130, "unlike charges → null pt. outside, beyond smaller", INK, 17, "start") + line(30, 170, 610, 170, "#8a96b8", 1.4, true) +
    blob(90, 170, "+", 15, `+4${μC}`) + blob(330, 170, "−", 15, `−1${μC}`) + `<circle cx="570" cy="170" r="6" fill="${PEN_GRN}"/>` + txt(570, 153, "F = 0", PEN_GRN, 16),
);

const figBalls = svg(
  380,
  250,
  line(140, 20, 240, 20, INK, 3) + line(190, 20, 125, 175) + line(190, 20, 255, 175) + line(190, 20, 190, 200, "#8a96b8", 1.2, true) + txt(203, 78, "θ", PEN_RED, 20) +
    blob(125, 175, "+", 13) + blob(255, 175, "+", 13) + arrow(255, 175, 330, 175, PEN_RED, "F", 0, -10) + arrow(255, 175, 255, 240, PEN_RED, "mg", 28, 10) + arrow(255, 175, 228, 110, PEN_GRN, "T", 18, 0),
);

// ---------- numbers ----------

const n = {
  e1: sig3(Math.abs(ex1())),
  e2: sig3(Math.abs(ex2())),
  e4: (ex4() / 1e39).toFixed(2),
  e5: ex5(),
  e6: ex6(),
  e7: ex7(),
  e8a: sig3(ex8a() * 100),
  e8b: sig3(ex8b().x * 100),
  e9: ex9(),
  e10: ex10(),
  e10b: sig3(ex10b()),
};
const e3 = ex3(); // 2e13

// ---------- the notes ----------

const pages = [
  // Page 1
  `<div class="title-block">
     <div class="date">Date: ____ / ____ / ________</div>
     <div class="topic">Electrostatics · Lecture 1</div>
     <h1>Electric Charge &amp; Coulomb's Law</h1>
     <div class="by">class notes · Adithya Vikram</div>
   </div>` +
    H("1. Electric charge") +
    pts([
      `Charge = basic property of matter (like mass). It's what causes ${hl("electric force")}.`,
      `Only ${hl("2 types")}: positive (+) and negative (−). Names given by Franklin, just labels.`,
      `SI unit → ${red("coulomb (C)")}. Small units: 1 ${μC} = 10${sup("−6")} C, 1 nC = 10${sup("−9")} C.`,
    ]) +
    fig(figRepel, "the golden rule ↑") +
    h("Where does charge come from?") +
    pts([
      `atom = nucleus (protons +, neutrons 0) + electrons (−)`,
      `e = 1.6 × 10${sup("−19")} C (charge of electron is −e, proton is +e)`,
      `m${sub("e")} = 9.1 × 10${sup("−31")} kg, m${sub("p")} = 1.67 × 10${sup("−27")} kg`,
      `gains e⁻ → ${hl("−ve")} &nbsp;&nbsp; loses e⁻ → ${hl("+ve")} &nbsp;(only electrons move!)`,
    ]) +
    careful(`+ve body has ${red("LOST electrons")}. It did not gain protons.`),

  // Page 2
  H("2. Properties of charge") +
    h("(a) Additive → it's a scalar") +
    p(`Total charge = algebraic sum. e.g. +3 C, −5 C, +1 C → total = ${red("−1 C")}`) +
    h("(b) Quantised") +
    formula(`q = ± n e &nbsp;&nbsp;&nbsp; (n = 1, 2, 3, …)`, "you can never have 'half an electron' of charge") +
    solved(
      `A body has charge −3.2 ${μC}. How many extra electrons?`,
      [`n = q / e`, `n = ${fr(`3.2 × 10${sup("−6")}`, `1.6 × 10${sup("−19")}`)}`, `= 2 × 10${sup("−6 + 19")} = 2 × 10${sup("13")}`],
      `${hl(`n = ${(e3 / 1e13).toFixed(0)} × 10${sup("13")} electrons`)}`,
    ) +
    h("(c) Conserved") +
    p(`Charge can't be created or destroyed, only ${hl("transferred")}. Glass + silk: glass loses exactly as many e⁻ as silk gains.`) +
    h("(d) Invariant") +
    p(`Charge doesn't change with speed (mass does at very high speed).`) +
    `<table><tr><th>Charge</th><th>Mass</th></tr>
      <tr><td>+, − or 0</td><td>always +</td></tr>
      <tr><td>quantised (n e)</td><td>not like that</td></tr>
      <tr><td>same at any speed</td><td>changes near speed of light</td></tr>
      <tr><td>like repel, unlike attract</td><td>always attract</td></tr></table>`,

  // Page 3
  H("3. Conductors vs insulators") +
    pts([
      `${hl("Conductors")}: free electrons → charge moves easily. Metals, human body, earth.`,
      `${hl("Insulators")}: electrons tightly bound → charge stays where you put it. Glass, plastic, rubber, silk.`,
      `${hl("Earthing")}: connect to Earth. Earth is huge, so it can give/take any charge.`,
    ]) +
    imp(`Charge given to a conductor spreads on its ${red("outer surface")}.`) +
    H("4. Ways of charging") +
    h("(i) Friction") +
    pts([`glass + silk → glass ${red("+")}, silk −`, `ebonite + fur → ebonite −, fur ${red("+")}`, `both get ${hl("equal & opposite")} charge`]) +
    h("(ii) Conduction (touching)") +
    p(`charged body touches neutral one → neutral one gets ${hl("same sign")} charge.`) +
    h("(iii) Induction (no touching!)") +
    fig(figInduction) +
    imp(`Induction gives ${red("OPPOSITE")} sign, and the rod loses nothing.`) +
    careful(`Remove earth FIRST, then the rod. Otherwise the e⁻ go back to earth → neutral.`),

  // Page 4
  H("5. Coulomb's law (1785)") +
    p(`Force between 2 ${hl("point charges")}:`) +
    pts([`∝ product of charges (${q1}${q2})`, `∝ 1 / r${sup("2")} (inverse square)`, `acts along the line joining them`]) +
    fig(figCoulomb) +
    formula(
      `F = k ${fr(`${q1} ${q2}`, `r${sup("2")}`)} &nbsp;&nbsp;&nbsp; k = ${fr("1", `4π${e0}`)} = 9 × 10${sup("9")} N m${sup("2")}/C${sup("2")}`,
      `${e0} = 8.85 × 10${sup("−12")} C${sup("2")}/N m${sup("2")} (permittivity of free space)`,
    ) +
    pts([
      `double one charge → F doubles`,
      `double r → F becomes ${red("¼")} (NOT ½!)`,
      `put signs in: answer + → repulsion, − → attraction`,
      `valid for point charges at rest (electro-${hl("statics")})`,
    ]) +
    h("Vector form") +
    formula(`${vec("F")}${sub("21")} = k ${fr(`${q1}${q2}`, `r${sup("3")}`)} ${vec("r")}${sub("12")}`, `force on 2 due to 1; ${vec("r")}${sub("12")} points from 1 to 2. And ${vec("F")}${sub("12")} = − ${vec("F")}${sub("21")}`) +
    solved(
      `Force between +3 ${μC} and −2 ${μC}, 30 cm apart (vacuum)?`,
      [
        `q${sub("1")} = 3×10${sup("−6")}, q${sub("2")} = 2×10${sup("−6")}, r = 0.3 m`,
        `F = ${fr(`9×10${sup("9")} × 3×10${sup("−6")} × 2×10${sup("−6")}`, `(0.3)${sup("2")}`)}`,
        `= ${fr(`54 × 10${sup("−3")}`, "0.09")} = 0.6 N`,
        `opposite signs → attraction`,
      ],
      `${hl(`F = ${n.e1} N (attractive)`)}`,
    ),

  // Page 5
  H("6. In a medium") +
    formula(`F${sub("medium")} = ${fr(`F${sub("vacuum")}`, "K")} &nbsp;&nbsp;&nbsp; ε = K ${e0}`, "K = dielectric constant (relative permittivity)") +
    pts([`vacuum K = 1, air ≈ 1, water ≈ 80, metal → ∞`]) +
    p(`Same charges as above, now in a liquid with K = 4 → F = 0.6 / 4 = ${hl(`${n.e2} N`)}`) +
    H("7. Electric vs gravity") +
    `<table><tr><th>Electric</th><th>Gravitational</th></tr>
      <tr><td>F = k q${sub("1")}q${sub("2")}/r${sup("2")}</td><td>F = G m${sub("1")}m${sub("2")}/r${sup("2")}</td></tr>
      <tr><td>attract or repel</td><td>only attract</td></tr>
      <tr><td>depends on medium</td><td>doesn't</td></tr>
      <tr><td>very strong</td><td>very weak</td></tr></table>` +
    solved(
      `Ratio F${sub("e")}/F${sub("g")} for an electron and a proton?`,
      [`r${sup("2")} cancels! ratio = ${fr(`k e${sup("2")}`, `G m${sub("e")} m${sub("p")}`)}`, `= ${fr(`(9×10${sup("9")})(1.6×10${sup("−19")})${sup("2")}`, `(6.67×10${sup("−11")})(9.1×10${sup("−31")})(1.67×10${sup("−27")})`)}`],
      `${hl(`≈ ${n.e4} × 10${sup("39")}`)} &nbsp;→ electric force is HUGE`,
    ) +
    trick(`Gravity rules space because big bodies are almost neutral; their electric forces cancel.`),

  // Page 6
  H("8. Superposition") +
    p(`Each pair acts ${hl("independently")}. Net force = ${red("vector sum")}:`) +
    formula(`${vec("F")}${sub("net")} = ${vec("F")}${sub("1")} + ${vec("F")}${sub("2")} + ${vec("F")}${sub("3")} + …`) +
    p(`<b>Method:</b> (1) size of each force by Coulomb &nbsp;(2) direction: away if like, towards if unlike &nbsp;(3) add as vectors`) +
    fig(figLine) +
    solved(
      `A = +2 ${μC} (x = 0), B = −1 ${μC} (x = 10 cm), C = +4 ${μC} (x = 30 cm). Net force on B?`,
      [`from A: ${fr(`9×10${sup("9")}×2×10${sup("−6")}×1×10${sup("−6")}`, "(0.1)²")} = 1.8 N → towards A`, `from C: ${fr(`9×10${sup("9")}×4×10${sup("−6")}×1×10${sup("−6")}`, "(0.2)²")} = 0.9 N → towards C`, `opposite directions → 1.8 − 0.9`],
      `${hl(`${sig3(Math.abs(n.e6.net))} N towards A`)}`,
    ),

  // Page 7
  h("Four charges on a square") +
    fig(figSquare) +
    solved(
      `4 equal charges q = 1 ${μC} on a square of side 10 cm. Net force on one?`,
      [`2 neighbours: each F${sub("1")} = kq²/a² = ${sig3(n.e7.unit)} N, at 90° → √2 F${sub("1")}`, `diagonal one: distance √2 a → F${sub("1")}/2, along the same diagonal`, `total = (√2 + ½) F${sub("1")}`],
      `${hl(`F ≈ ${sig3(n.e7.magnitude)} N along the diagonal`)}`,
    ) +
    trick(`Equilateral triangle (side a, equal q): F = √3 · kq²/a² on each.`),

  // Page 7
  H("9. Null point (net force = 0)") +
    fig(figNull) +
    imp(`like → ${hl("between")}, near smaller &nbsp;|&nbsp; unlike → ${hl("outside")}, beyond smaller &nbsp;|&nbsp; test charge cancels out`) +
    solved(
      `+2 ${μC} and +8 ${μC}, 30 cm apart. Null point?`,
      [`let x from 2 ${μC} → ${fr("2", "x²")} = ${fr("8", "(30 − x)²")}`, `√ both sides: ${fr("1", "x")} = ${fr("2", "30 − x")} → 30 − x = 2x`, `x = 10`],
      `${hl(`${n.e8a} cm from +2 ${μC}`)}`,
    ) +
    solved(
      `+4 ${μC} and −1 ${μC}, 30 cm apart. Null point?`,
      [`unlike → outside, beyond −1 ${μC}. Let x beyond it.`, `${fr("4", "(30 + x)²")} = ${fr("1", "x²")} → 2x = 30 + x`],
      `${hl(`x = ${n.e8b} cm beyond −1 ${μC}`)} (60 cm from +4 ${μC})`,
    ) +
    h("All 3 in equilibrium") +
    p(`q and 4q, distance d. Third charge Q = ${red("−4q/9")} at ${red("d/3")} from q.`) +
    p(`(why? Q sits at the null point → d/3. Then for q: pull of Q = push of 4q → ${fr(`kq|Q|`, "(d/3)²")} = ${fr("kq·4q", "d²")} → |Q| = 4q/9, and Q must be −ve)`),

  // Page 8
  H("10. Touching identical spheres") +
    formula(`each gets ${fr(`q${sub("1")} + q${sub("2")}`, "2")} &nbsp;&nbsp;(with signs!)`) +
    solved(
      `+8 ${μC} and −2 ${μC} identical spheres touch, then back to same distance. F'/F ?`,
      [`each = (8 − 2)/2 = +3 ${μC}`, `before ∝ 8 × 2 = 16 (attract)`, `after ∝ 3 × 3 = 9 (repel)`],
      `${hl("F'/F = 9/16")}, attraction → repulsion`,
    ) +
    H("11. Hanging charged balls") +
    fig(figBalls) +
    steps([`vertical: T cos θ = mg`, `horizontal: T sin θ = F`, `divide → T cancels`]) +
    formula(`tan θ = ${fr("F", "mg")} = ${fr(`kq${sup("2")}`, `r${sup("2")} mg`)}`) +
    p(`e.g. m = 0.9 g, q = 0.1 ${μC}, r = 10 cm → F = 9×10${sup("−3")} N = mg → tan θ = 1 → ${hl(`θ = ${sig3(n.e10.thetaDeg)}°`)}`),

  // Page 10
  imp(`In a liquid (density σ, dielectric K): same angle if &nbsp; K = ${fr("ρ", "ρ − σ")} &nbsp; (ρ = ball density). e.g. ρ = 1600, σ = 800 → K = ${n.e10b}`) +
    H("12. Max force trick") +
    p(`Q split into q and (Q − q): F ∝ q(Q − q) → d/dq = 0 → ${hl("q = Q/2")}`) +
    H("Common mistakes ✗") +
    pts([
      `not converting ${μC} → C and cm → m`,
      `forgetting to square r`,
      `adding forces like numbers (they're ${red("vectors")}!)`,
      `"bigger charge feels bigger force" → NO, both feel the same (Newton's 3rd)`,
      `null point on wrong side`,
      `sharing charge without signs (+8, −2 → +3 each, not +5)`,
      `in a medium force is ${red("÷ K")}, not × K`,
    ]) +
    H("Quick formula sheet") +
    `<div class="sheet">
      <div>q = n e, &nbsp; e = 1.6×10${sup("−19")} C</div>
      <div>F = k ${fr(`${q1}${q2}`, "r²")}, &nbsp; k = 9×10${sup("9")}</div>
      <div>${e0} = 8.85×10${sup("−12")}</div>
      <div>F${sub("medium")} = F / K</div>
      <div>${vec("F")}${sub("net")} = Σ ${vec("F")}${sub("i")}</div>
      <div>null pt (like): x = ${fr(`d√q${sub("1")}`, `√q${sub("1")} + √q${sub("2")}`)}</div>
      <div>touching: (q${sub("1")} + q${sub("2")}) / 2</div>
      <div>hanging: tan θ = F / mg</div>
      <div>square: (√2 + ½) kq²/a²</div>
      <div>triangle: √3 kq²/a²</div>
    </div>` +
    `<div class="end">— end of lecture 1 —</div>`,
];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Electric Charge &amp; Coulomb's Law: Class Notes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Kalam, "Comic Sans MS", cursive; color: #1a3a8f; font-size: 14.5pt; line-height: 9mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative;
    padding: 14mm 14mm 10mm 30mm;
    background:
      linear-gradient(90deg, transparent 23mm, rgba(214,63,63,.55) 23mm, rgba(214,63,63,.55) 23.6mm, transparent 23.6mm),
      repeating-linear-gradient(180deg, #fffdf6 0, #fffdf6 calc(9mm - 0.3mm), #b9cbe6 calc(9mm - 0.3mm), #b9cbe6 9mm);
    background-color: #fffdf6;
  }
  .page:last-child { page-break-after: auto; }
  .pno { position: absolute; bottom: 6mm; right: 14mm; font-size: 12pt; color: #8a96b8; }
  h1 { font-family: Caveat, cursive; font-size: 36pt; line-height: 13mm; margin: 0; color: #111; }
  h2 { font-family: Caveat, cursive; font-size: 24pt; line-height: 11mm; margin: 2mm 0 0; color: #c0392b; display: table; border-bottom: 2.5px solid #c0392b; }
  h3 { font-size: 15pt; margin: 0; line-height: 9mm; color: #111; text-decoration: underline; text-underline-offset: 3px; }
  p { margin: 0; }
  ul, ol { margin: 0; padding-left: 7mm; }
  li { margin: 0; }
  .title-block { border-bottom: 2px dashed #8a96b8; margin-bottom: 2mm; }
  .date { color: #8a96b8; font-size: 12pt; text-align: right; }
  .topic { color: #1d7a46; font-weight: 700; }
  .by { color: #8a96b8; font-size: 12pt; }
  .hl { background: linear-gradient(180deg, transparent 35%, rgba(255,235,59,.75) 35%, rgba(255,235,59,.75) 88%, transparent 88%); padding: 0 1mm; }
  .red { color: #c0392b; font-weight: 700; }
  .grn { color: #1d7a46; }
  .vec { position: relative; display: inline-block; }
  .vec::after { content: "→"; position: absolute; left: 0; right: 0; top: -0.72em; text-align: center; font-size: .72em; line-height: 1; }
  .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.15; font-size: .92em; margin: 0 1mm; }
  .frac > span:first-child { border-bottom: 1.8px solid currentColor; padding: 0 1mm; }
  .formula { border: 2.5px solid #1a3a8f; border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px; padding: 2mm 5mm; margin: 2mm 0; display: inline-block; color: #111; background: rgba(255,255,255,.6); line-height: 1.6; }
  .fnote { font-size: 11.5pt; color: #1d7a46; }
  .imp, .trick, .careful { margin: 2mm 0; padding: 1mm 3mm; line-height: 1.6; border-radius: 3mm; }
  .imp { border: 2px dashed #c0392b; color: #111; }
  .imp .star { color: #c0392b; font-weight: 700; }
  .trick { border-left: 4px solid #1d7a46; background: rgba(29,122,70,.07); }
  .careful { border-left: 4px solid #c0392b; background: rgba(192,57,43,.06); }
  .tag { font-weight: 700; color: #c0392b; }
  .trick .tag { color: #1d7a46; }
  .solved { margin: 2mm 0; padding: 1mm 3mm 2mm; border-left: 3px solid #1a3a8f; line-height: 1.6; break-inside: avoid; }
  .solved .q { color: #111; }
  .solved .sol { color: #1d7a46; font-weight: 700; }
  .solved .ans { color: #111; font-weight: 700; }
  table { border-collapse: collapse; margin: 2mm 0; font-size: 13pt; line-height: 1.5; }
  th, td { border: 1.8px solid #1a3a8f; padding: 1mm 4mm; text-align: left; }
  th { color: #c0392b; }
  .fig { margin: 1mm 0; }
  .fig svg { max-width: 100%; height: auto; }
  .cap { font-size: 12pt; color: #1d7a46; margin-top: -3mm; }
  .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; border: 2.5px solid #c0392b; border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px; padding: 3mm 5mm; color: #111; line-height: 1.8; }
  .end { text-align: center; color: #8a96b8; margin-top: 8mm; }
</style></head>
<body>
${pages.map((pg, i) => `<div class="page">${pg}<div class="pno">${i + 1}</div></div>`).join("\n")}
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, `${base}.html`);
fs.writeFileSync(htmlPath, html);

const chrome = path.join(root, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!fs.existsSync(chrome)) throw new Error("Headless Chrome not found. Render any video once to download it.");
const pdfPath = path.join(outDir, `${base}.pdf`);
const result = spawnSync(
  chrome,
  ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header", "--virtual-time-budget=15000", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href],
  { stdio: "inherit" },
);
if (result.status !== 0 || !fs.existsSync(pdfPath)) throw new Error("Printing to PDF failed.");
console.log(`Class notes → ${path.relative(root, pdfPath)}`);
// Pages are fixed A4 sheets; anything taller than a sheet would be cut off, so check the HTML in a browser if you add content.
void grn;
