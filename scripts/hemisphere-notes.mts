// Class notes for "Work done dragging a block over a rough dome" (matches the video lesson). A4 PDF.
//   npm run notes:hemisphere
// Every number comes from src/notes/hemisphere.ts and src/physics/hemisphere.ts (checked by tests).
// Output: notes/rough-dome-class-notes.html and .pdf

import katex from "katex";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { sig3 } from "../src/physics/format";
import { forcesAt } from "../src/physics/hemisphere";
import { PRACTICE, WORKED } from "../src/notes/hemisphere";
import { simulateDrag } from "../src/templates/hemisphere/simulate";
import { QUESTION } from "../src/templates/hemisphere/script";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "rough-dome-class-notes";
const url = (p: string) => pathToFileURL(path.join(root, p)).href;

const INK = "#1d2340";
const BLUE = "#2f6fe4";
const GREEN = "#1f9d6b";
const ORANGE = "#f08a24";
const FORCE = "#e0457b"; // force colour (pink), always with a label
const DIM = "#6a7090";
const DEG = Math.PI / 180;

const t = (tex: string, display = false) => katex.renderToString(tex, { displayMode: display, throwOnError: true });
const T = (tex: string) => `<div class="eq">${t(tex, true)}</div>`;
const n = (x: number) => sig3(x);

const section = (title: string, color: string, body: string) => `<section><h2 style="--c:${color}">${title}</h2>${body}</section>`;
const tip = (label: string, s: string) => `<div class="tip"><b>${label}</b> ${s}</div>`;
const warn = (label: string, s: string) => `<div class="warn"><b>${label}</b> ${s}</div>`;
const boxed = (s: string) => `<div class="answer">${s}</div>`;

// ---------- diagrams (drawn from the physics) ----------

function arrowHead(x: number, y: number, ang: number, color: string, open = true) {
  const s = 11;
  const a1 = ang + Math.PI * 0.85;
  const a2 = ang - Math.PI * 0.85;
  const p = `M ${x + s * Math.cos(a1)} ${y + s * Math.sin(a1)} L ${x} ${y} L ${x + s * Math.cos(a2)} ${y + s * Math.sin(a2)}`;
  return open ? `<path d="${p}" fill="none" stroke="${color}" stroke-width="2.4"/>` : `<path d="${p} Z" fill="${color}"/>`;
}
function arrow(x1: number, y1: number, x2: number, y2: number, color: string, label = "", lx = 0, ly = 0, w = 3) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"/>${arrowHead(x2, y2, ang, color)}${
    label ? `<text x="${x2 + lx}" y="${y2 + ly}" fill="${color}" font-size="17" font-weight="700" font-style="italic">${label}</text>` : ""
  }`;
}

/** Dome with the block at φ = 40°; force arrows to scale (px per newton) for the worked example. */
function forcesFigure() {
  const W = 420, H = 290, cx = 215, gy = 250, R = 150, k = 4.2;
  const phi = 40 * DEG;
  const f = forcesAt(WORKED.setup, phi);
  const bx = cx - R * Math.cos(phi);
  const by = gy - R * Math.sin(phi);
  // screen unit vectors: outward radial (−cos φ, −sin φ), up the slope (sin φ, −cos φ)
  const r = [-Math.cos(phi), -Math.sin(phi)];
  const u = [Math.sin(phi), -Math.cos(phi)];
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <path d="M ${cx - R} ${gy} A ${R} ${R} 0 0 1 ${cx + R} ${gy}" fill="#eef1fb" stroke="${INK}" stroke-width="2.5"/>
    <line x1="10" y1="${gy}" x2="${W - 10}" y2="${gy}" stroke="${INK}" stroke-width="2.5"/>
    <line x1="${cx}" y1="${gy}" x2="${bx}" y2="${by}" stroke="${DIM}" stroke-dasharray="5 4"/>
    <path d="M ${cx - 38} ${gy} A 38 38 0 0 1 ${cx - 38 * Math.cos(phi)} ${gy - 38 * Math.sin(phi)}" fill="none" stroke="${GREEN}" stroke-width="2"/>
    <text x="${cx - 62}" y="${gy - 10}" fill="${GREEN}" font-size="17" font-style="italic">φ</text>
    <text x="${cx + 4}" y="${gy + 18}" fill="${DIM}" font-size="13">centre</text>
    ${arrow(bx, by, bx, by + f.gravityAlong / Math.cos(phi) * k, FORCE, "mg", 8, -6)}
    ${arrow(bx, by, bx + r[0] * f.normal * k, by + r[1] * f.normal * k, FORCE, "N", -18, -6)}
    ${arrow(bx, by, bx - u[0] * f.friction * k, by - u[1] * f.friction * k, FORCE, "f", -16, 14)}
    ${arrow(bx, by, bx + u[0] * f.tension * k, by + u[1] * f.tension * k, FORCE, "T", 6, -4)}
    <circle cx="${bx}" cy="${by}" r="9" fill="${BLUE}"/>
    <text x="${W - 12}" y="${H - 8}" text-anchor="end" fill="${DIM}" font-size="12">to scale: 2 kg, μ = 0.5, φ = 40°</text>
  </svg>`;
}

/** Zoom on the block: radius, surface, vertical, and the two parts of mg. */
function splitFigure() {
  const W = 470, H = 300, px = 190, py = 110, phi = 40 * DEG, L = 150;
  const r = [-Math.cos(phi), -Math.sin(phi)]; // outward
  const u = [Math.sin(phi), -Math.cos(phi)]; // up the slope
  const mg = 140;
  const along = mg * Math.cos(phi); // down the slope = −u
  const into = mg * Math.sin(phi); // into the dome = −r
  const a = [px - u[0] * along, py - u[1] * along];
  const b = [px - r[0] * into, py - r[1] * into];
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <line x1="${px - u[0] * L}" y1="${py - u[1] * L}" x2="${px + u[0] * L}" y2="${py + u[1] * L}" stroke="${INK}" stroke-width="2.2"/>
    <text x="${px + u[0] * L - 4}" y="${py + u[1] * L - 8}" fill="${INK}" font-size="14" font-weight="700">surface</text>
    <line x1="${px}" y1="${py}" x2="${px - r[0] * L * 1.2}" y2="${py - r[1] * L * 1.2}" stroke="${ORANGE}" stroke-width="2.2"/>
    <text x="${px - r[0] * L * 1.2 + 6}" y="${py - r[1] * L * 1.2 + 4}" fill="${ORANGE}" font-size="14" font-weight="700">radius (to centre)</text>
    <line x1="${px}" y1="${py - 70}" x2="${px}" y2="${py + 175}" stroke="${DIM}" stroke-dasharray="5 4"/>
    <text x="${px + 6}" y="${py - 58}" fill="${DIM}" font-size="13">vertical</text>
    <line x1="${a[0]}" y1="${a[1]}" x2="${px}" y2="${py + mg}" stroke="${DIM}" stroke-dasharray="3 4"/>
    <line x1="${b[0]}" y1="${b[1]}" x2="${px}" y2="${py + mg}" stroke="${DIM}" stroke-dasharray="3 4"/>
    ${arrow(px, py, px, py + mg, FORCE, "mg", 8, 6, 3.4)}
    ${arrow(px, py, a[0], a[1], BLUE, "mg cos φ", -82, 4)}
    ${arrow(px, py, b[0], b[1], GREEN, "mg sin φ", 8, 10)}
    <path d="M ${px} ${py + 46} A 46 46 0 0 0 ${px - u[0] * 46} ${py - u[1] * 46}" fill="none" stroke="${BLUE}" stroke-width="2"/>
    <text x="${px - 30}" y="${py + 62}" fill="${BLUE}" font-size="15" font-style="italic">φ</text>
    <path d="M ${px} ${py + 70} A 70 70 0 0 1 ${px - r[0] * 70} ${py - r[1] * 70}" fill="none" stroke="${GREEN}" stroke-width="2"/>
    <text x="${px + 6}" y="${py + 92}" fill="${GREEN}" font-size="13" font-weight="700">90° − φ</text>
    <path d="M ${px + u[0] * 16} ${py + u[1] * 16} L ${px + u[0] * 16 - r[0] * 16} ${py + u[1] * 16 - r[1] * 16} L ${px - r[0] * 16} ${py - r[1] * 16}" fill="none" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="${px}" cy="${py}" r="8" fill="${BLUE}"/>
  </svg>`;
}

/** T(φ) for the worked example, 0 → 90°, with the peak at tan φ = μ marked. */
function pullGraph() {
  const W = 400, H = 220, x0 = 46, y0 = 180, w = 330, h = 150, tMax = 25;
  const X = (deg: number) => x0 + (deg / 90) * w;
  const Y = (tn: number) => y0 - (tn / tMax) * h;
  const pts = Array.from({ length: 91 }, (_, d) => `${X(d)},${Y(forcesAt(WORKED.setup, d * DEG).tension)}`).join(" ");
  const pk = PRACTICE.peak;
  const ticksY = [0, 10, 20].map((v) => `<line x1="${x0 - 4}" y1="${Y(v)}" x2="${x0 + w}" y2="${Y(v)}" stroke="#e3e6f0"/><text x="${x0 - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="${DIM}">${v}</text>`).join("");
  const ticksX = [0, 30, 60, 90].map((v) => `<text x="${X(v)}" y="${y0 + 18}" text-anchor="middle" font-size="12" fill="${DIM}">${v}°</text>`).join("");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${ticksY}${ticksX}
    <line x1="${x0}" y1="${y0}" x2="${x0 + w}" y2="${y0}" stroke="${INK}" stroke-width="1.6"/>
    <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - h - 6}" stroke="${INK}" stroke-width="1.6"/>
    <text x="${x0 + w}" y="${y0 + 34}" text-anchor="end" font-size="12" fill="${DIM}">angle φ</text>
    <text x="8" y="${y0 - h - 12}" font-size="12" fill="${DIM}">pull T (N)</text>
    <polyline points="${pts}" fill="none" stroke="${FORCE}" stroke-width="3"/>
    <circle cx="${X(pk.phiDeg)}" cy="${Y(pk.tension)}" r="5" fill="${FORCE}"/>
    <text x="${X(pk.phiDeg) + 8}" y="${Y(pk.tension) - 8}" font-size="13" font-weight="700" fill="${FORCE}">max ${n(pk.tension)} N at ${n(pk.phiDeg)}°</text>
    <text x="${X(0) + 6}" y="${Y(WORKED.pullBottom) + 18}" font-size="12" fill="${INK}">${n(WORKED.pullBottom)} N at the bottom</text>
    <text x="${X(90) - 4}" y="${Y(WORKED.pullTop) + 20}" text-anchor="end" font-size="12" fill="${INK}">${n(WORKED.pullTop)} N at the top</text>
  </svg>`;
}

// ---------- pages ----------

const sim = simulateDrag(WORKED.setup);
const P = PRACTICE;

const header = `<header>
  <div><div class="kicker">PHYSICS · CLASS 11 · JEE</div><h1>Work done dragging a block over a rough dome</h1>
  <div class="sub">Class notes · step by step, from zero · matches the video lesson</div></div>
</header>`;

const page1 =
  header +
  `<div class="question"><b>The question.</b> ${QUESTION.replace("μ", t("\\mu")).replace(" R ", ` ${t("R")} `).replace(" m ", ` ${t("m")} `)}</div>` +
  `<div class="cols">
    <div>${section(
      "What we know",
      BLUE,
      `<ul><li>Radius of the dome: ${t("R")}</li><li>Mass of the block: ${t("m")}</li><li>Friction coefficient: ${t("\\mu")}</li><li>The block moves <b>slowly</b></li><li>Find: ${t("W_{\\text{person}}")}</li></ul>`,
    )}${section(
      "The plan",
      ORANGE,
      `<ol><li>Draw every force on the block.</li><li><b>Slowly</b> ⇒ forces balance ⇒ the pull ${t("T")}.</li><li>${t("T")} keeps changing, so add up tiny pieces: ${t("W = \\int T\\,ds")}.</li><li>Check the answer with energy.</li></ol>`,
    )}</div>
    <div class="fig">${forcesFigure()}</div>
  </div>` +
  section(
    "1. What is work?",
    BLUE,
    `<p>A force does work when it moves something. If the force is at angle ${t("\\theta")} to the motion, only the part along the motion counts:</p>${T(
      "W = F\\,s\\cos\\theta",
    )}<p>Here the pull changes as the block climbs, so we cut the path into tiny pieces and add them up:</p>${T("dW = F\\,ds \\qquad W = \\int F\\,ds")}`,
  ) +
  section(
    "2. The forces on the block",
    FORCE,
    `<ul class="tight">
      <li><b>Weight</b> ${t("mg")}: straight down.</li>
      <li><b>Normal force</b> ${t("N")}: the dome pushes back, at right angles to the surface, out along the radius.</li>
      <li><b>Friction</b> ${t("f = \\mu N")}: fights the motion, so it points down the slope.</li>
      <li><b>Pull</b> ${t("T")}: the string lies along the surface, so it pulls up the slope.</li>
    </ul>` + tip("Remember:", `<b>slowly</b> means no acceleration. So the forces balance in every direction, and the kinetic energy never changes (${t("\\Delta KE = 0")}).`),
  );

const page2 =
  section(
    "3. Where is the block? The angle φ",
    GREEN,
    `<p>${t("\\varphi")} is the angle between the radius (centre → block) and the ground: ${t("0")} on the ground, ${t("90^\\circ = \\tfrac{\\pi}{2}")} at the top. A tiny turn ${t("d\\varphi")} moves the block along the curve by</p>${T(
      "ds = R\\,d\\varphi \\qquad (\\text{arc} = \\text{radius} \\times \\text{angle, in radians})",
    )}`,
  ) +
  section(
    "4. Splitting the weight (the step most people get wrong)",
    ORANGE,
    `<div class="cols"><div class="fig">${splitFigure()}</div><div>
      <ol class="tight">
        <li>The radius and the surface always meet at a <b>right angle</b>.</li>
        <li>The radius makes ${t("\\varphi")} with the ground. Turn both lines by 90°: radius → surface, ground → vertical. The angle stays the same.</li>
        <li>So ${t("mg")} makes ${t("\\varphi")} with the surface, and ${t("90^\\circ - \\varphi")} with the radius.</li>
      </ol>
      ${T("\\text{along the surface: } mg\\cos\\varphi \\;\\text{(down the slope)}")}
      ${T("\\text{into the dome: } mg\\cos(90^\\circ-\\varphi) = mg\\sin\\varphi")}
      ${tip("Check the ends:", `${t("\\varphi = 0")}: the surface is a wall, all of ${t("mg")} runs along it. ${t("\\varphi = 90^\\circ")}: the surface is flat, all of ${t("mg")} presses in. ✓`)}
    </div></div>`,
  ) +
  section(
    "5. Balance the forces",
    BLUE,
    `<div class="cols"><div>
      <p><b>Along the radius</b> (out = in). ${t("T")} and ${t("f")} lie along the surface, so they don't count:</p>
      ${T("N = mg\\sin\\varphi \\quad\\Rightarrow\\quad f = \\mu N = \\mu mg\\sin\\varphi")}
      <p><b>Along the surface</b> (up = down). ${t("N")} is across the surface, so it doesn't count:</p>
      ${T("T = mg\\cos\\varphi + \\mu mg\\sin\\varphi")}
      ${warn("Careful:", `${t("N")} is <b>not</b> ${t("mg")}. It changes along the dome, so friction changes too.`)}
    </div><div class="fig">${pullGraph()}<div class="cap">The pull for the worked example (2 kg, μ = 0.5). It is not largest at the bottom! (See P5.)</div></div></div>`,
  );

const page3 =
  section(
    "6. Add up the work",
    GREEN,
    `${T("dW = T\\,ds = (mg\\cos\\varphi + \\mu mg\\sin\\varphi)\\,R\\,d\\varphi")}
    ${T("W = mgR\\int_0^{\\pi/2}\\cos\\varphi\\,d\\varphi \\;+\\; \\mu mgR\\int_0^{\\pi/2}\\sin\\varphi\\,d\\varphi")}
    ${T("= mgR\\big[\\sin\\varphi\\big]_0^{\\pi/2} + \\mu mgR\\big[-\\cos\\varphi\\big]_0^{\\pi/2} = mgR(1) + \\mu mgR(1)")}` +
      boxed(t("W_{\\text{person}} = mgR\\,(1+\\mu)", true)),
  ) +
  section(
    "7. What the answer means",
    ORANGE,
    `<ul class="tight">
      <li>${t("mgR")} = weight × height: the work to lift the block by ${t("R")}. The shape of the path doesn't matter.</li>
      <li>${t("\\mu mgR")} = work against friction. This ${t("R")} is the <b>horizontal</b> distance, not the curved length.</li>
      <li>Smooth dome (${t("\\mu = 0")}): ${t("W = mgR")}. Makes sense.</li>
    </ul>` + tip("Handy rule:", `when you drag something <b>slowly</b> over any curved surface, friction's work is ${t("\\mu mg \\times \\text{horizontal distance}")}.`),
  ) +
  section(
    "8. Check it with energy (no integral)",
    BLUE,
    `${T("W_{\\text{total}} = \\Delta KE = 0 \\;\\;(\\text{slowly})")}
    <table class="grid">
      <tr><td>Normal force</td><td>always at right angles to the motion</td><td>${t("W_N = 0")}</td></tr>
      <tr><td>Gravity</td><td>block rises by ${t("R")}</td><td>${t("W_g = -mgR")}</td></tr>
      <tr><td>Friction</td><td>horizontal-distance rule</td><td>${t("W_f = -\\mu mgR")}</td></tr>
      <tr><td><b>Person</b></td><td>the rest must cancel these</td><td>${t("W = mgR(1+\\mu)\\;\\checkmark")}</td></tr>
    </table>`,
  ) +
  section(
    "9. With real numbers",
    GREEN,
    `<p>${t("m = 2\\text{ kg},\\; R = 1\\text{ m},\\; \\mu = 0.5,\\; g = 10\\text{ m/s}^2")}</p>
    <table class="grid">
      <tr><td>Lifting</td><td>${t("mgR")}</td><td><b>${n(WORKED.lift)} J</b></td></tr>
      <tr><td>Friction</td><td>${t("\\mu mgR")}</td><td><b>${n(WORKED.friction)} J</b></td></tr>
      <tr><td>Total</td><td>${t("mgR(1+\\mu)")}</td><td><b>${n(WORKED.total)} J</b></td></tr>
      <tr><td>Step-by-step simulation</td><td>adds up ${t("T\\,ds")} in 20,000 steps</td><td><b>${n(sim.byMan)} J ✓</b></td></tr>
    </table>`,
  );

const page4 =
  section(
    "Common traps",
    FORCE,
    `<table class="grid">
      <tr><th>Mistake</th><th>Answer you'd get</th><th>Why it's wrong</th></tr>
      <tr><td>Forgetting friction</td><td>${t("mgR")} = ${n(WORKED.wrongNoFriction)} J (too small)</td><td>The surface is rough.</td></tr>
      <tr><td>Taking ${t("N = mg")} everywhere</td><td>${t("mgR + \\mu mg\\tfrac{\\pi R}{2}")} = ${n(WORKED.wrongNEqualsMg)} J (too big)</td><td>${t("N = mg\\sin\\varphi")} changes along the dome.</td></tr>
      <tr><td>Thinking the pull is largest at the bottom</td><td>—</td><td>It peaks where ${t("\\tan\\varphi = \\mu")} (see P5).</td></tr>
    </table>`,
  ) +
  section(
    "Practice (try first, answers below)",
    BLUE,
    `<ol class="practice">
      <li>Same dome (${t("m = 2")} kg, ${t("R = 1")} m), but <b>smooth</b>. Find the work done by the person.</li>
      <li>${t("m = 1")} kg, ${t("R = 0.5")} m, ${t("\\mu = 0.3")}, ${t("g = 10")}. Find the work from the ground to the top.</li>
      <li>Worked example (${t("2")} kg, ${t("1")} m, ${t("\\mu = 0.5")}), but the person stops at ${t("\\varphi = 60^\\circ")}. Find the work. <i>Hint: integrate from 0 to ${t("\\pi/3")}.</i></li>
      <li>Worked example: find ${t("N")} and the friction at ${t("\\varphi = 30^\\circ")}.</li>
      <li>Worked example: at what angle is the pull largest, and how large is it?</li>
    </ol>`,
  ) +
  section(
    "Answers",
    GREEN,
    `<ol class="practice answers">
      <li>${t("\\mu = 0 \\Rightarrow W = mgR = 2\\times10\\times1 =")} <b>${n(P.smooth.answer)} J</b></li>
      <li>${t("W = mgR(1+\\mu) = 1\\times10\\times0.5\\times1.3 =")} <b>${n(P.other.answer)} J</b></li>
      <li>${t("W = mgR\\sin\\varphi + \\mu mgR(1-\\cos\\varphi) = 20(0.866) + 10(0.5) =")} ${n(P.partial.againstGravity)} + ${n(P.partial.againstFriction)} = <b>${n(P.partial.total)} J</b></li>
      <li>${t("N = mg\\sin 30^\\circ =")} <b>${n(P.at30.normal)} N</b>, ${t("f = \\mu N =")} <b>${n(P.at30.friction)} N</b></li>
      <li>${t("T = mg(\\cos\\varphi + \\mu\\sin\\varphi)")} is largest when ${t("\\tan\\varphi = \\mu = 0.5")}, i.e. ${t("\\varphi \\approx")} <b>${n(P.peak.phiDeg)}°</b>. Then ${t("T = mg\\sqrt{1+\\mu^2} =")} <b>${n(P.peak.tension)} N</b>, more than the ${n(WORKED.pullBottom)} N at the bottom.</li>
    </ol>`,
  ) +
  `<div class="foot">Original notes by Adithya Vikram. Every number here is computed by code and checked a second way (a step-by-step simulation or a numerical integral) before it is printed.</div>`;

const pages = [page1, page2, page3, page4];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Rough dome: class notes</title>
<link rel="stylesheet" href="${url("node_modules/katex/dist/katex.min.css")}">
<style>
  @font-face { font-family: "Atkinson Hyperlegible"; src: url("${url("public/fonts/atkinson-400.woff2")}") format("woff2"); font-weight: 400; }
  @font-face { font-family: "Atkinson Hyperlegible"; src: url("${url("public/fonts/atkinson-700.woff2")}") format("woff2"); font-weight: 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif; color: ${INK}; font-size: 11.3pt; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 12mm 14mm 12mm; }
  .page:last-child { page-break-after: auto; }
  .page::before { content: ""; position: absolute; left: 0; top: 0; right: 0; height: 5mm; background: linear-gradient(90deg, ${BLUE}, ${GREEN}, ${ORANGE}); }
  .pno { position: absolute; bottom: 6mm; right: 14mm; font-size: 9.5pt; color: #8a90a8; }
  header { border-bottom: 2px solid #e3e6f0; padding-bottom: 3mm; margin-bottom: 3mm; }
  .kicker { font-size: 9.5pt; font-weight: 700; letter-spacing: 2px; color: ${GREEN}; }
  h1 { font-size: 22pt; margin: 0.5mm 0 0; line-height: 1.1; }
  .sub { color: ${DIM}; }
  section { margin-bottom: 3.5mm; }
  h2 { font-size: 13pt; margin: 0 0 1.5mm; padding: 1mm 3mm; border-left: 5px solid var(--c); background: color-mix(in srgb, var(--c) 10%, white); border-radius: 0 3mm 3mm 0; }
  p { margin: 1mm 0; }
  ul, ol { margin: 1mm 0; padding-left: 6mm; }
  li { margin: 1mm 0; }
  .tight li { margin: 0.6mm 0; }
  .question { border: 2px solid ${INK}; border-radius: 3mm; padding: 2.5mm 4mm; margin-bottom: 3mm; background: #f7f8fc; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: center; }
  .fig { text-align: center; }
  .fig svg { max-width: 100%; height: auto; font-family: "Atkinson Hyperlegible", sans-serif; }
  .cap { font-size: 9.5pt; color: ${DIM}; }
  .eq { margin: 1mm 0; }
  .eq .katex-display { margin: 1.2mm 0; }
  .katex { font-size: 1.08em; }
  .tip, .warn { margin: 2mm 0; padding: 1.8mm 3.5mm; border-radius: 3mm; }
  .tip { background: #eaf7f1; border-left: 4px solid ${GREEN}; }
  .tip > b { color: ${GREEN}; }
  .warn { background: #fdeef3; border-left: 4px solid ${FORCE}; }
  .warn > b { color: ${FORCE}; }
  .answer { margin: 2.5mm auto; padding: 1mm 6mm; width: fit-content; border: 3px solid ${GREEN}; border-radius: 3mm; background: #eaf7f1; font-size: 1.25em; }
  table.grid { border-collapse: collapse; width: 100%; margin: 1.5mm 0; }
  table.grid td, table.grid th { border: 1.5px solid #e3e6f0; padding: 1.6mm 2.5mm; text-align: left; }
  table.grid th { background: #f5f6fb; }
  .practice li { margin: 2mm 0; }
  .answers li { margin: 1.6mm 0; }
  .foot { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; font-size: 9.5pt; color: ${DIM}; border-top: 1.5px solid #e3e6f0; padding-top: 2mm; }
</style></head>
<body>
${pages.map((pg, i) => `<div class="page">${pg}<div class="pno">${i + 1} / ${pages.length}</div></div>`).join("\n")}
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
console.log(`Rough-dome notes → ${path.relative(root, pdfPath)}`);
