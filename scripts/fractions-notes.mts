// Builds a Class 6–7 fractions pack: 2 pages of notes, a worksheet and an answer key (A4 PDF).
//   npm run notes:fractions
// Every answer comes from src/notes/fractions.ts (checked by tests/fractions.test.ts).
// Output: notes/fractions-class-6-7.html and .pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { COMPARE, EQUIVALENT, Frac, NOTES, SHADED, SUMS, WORD } from "../src/notes/fractions";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "fractions-class-6-7";

const BLUE = "#2f6fe4";
const ORANGE = "#f08a24";
const GREEN = "#1f9d6b";
const RED = "#d64545";
const INK = "#1d2340";

// ---------- helpers ----------

/** A fraction written top-over-bottom. */
const f = (x: Frac | string | [string, string], color = "") => {
  const [n, d] = Array.isArray(x) ? x : typeof x === "string" ? x.split("/") : [String(x.n), String(x.d)];
  return `<span class="frac"${color ? ` style="color:${color}"` : ""}><span>${n}</span><span>${d}</span></span>`;
};
const box = `<span class="blank"></span>`;

/** A bar cut into `parts` equal pieces with the first `shaded` coloured. */
function bar(parts: number, shaded: number, color = BLUE, w = 300, h = 34): string {
  const cell = w / parts;
  const cells = Array.from(
    { length: parts },
    (_, i) => `<rect x="${i * cell}" y="0" width="${cell}" height="${h}" fill="${i < shaded ? color : "#fff"}" stroke="${INK}" stroke-width="2"/>`,
  ).join("");
  return `<svg width="${w + 4}" height="${h + 4}" viewBox="-2 -2 ${w + 4} ${h + 4}">${cells}</svg>`;
}

/** A circle (pizza) cut into `parts` equal slices with the first `shaded` coloured. */
function pie(parts: number, shaded: number, color = ORANGE, r = 52): string {
  const c = r + 3;
  const slices = Array.from({ length: parts }, (_, i) => {
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = `M ${c} ${c} L ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`;
    return `<path d="${p}" fill="${i < shaded ? color : "#fff"}" stroke="${INK}" stroke-width="2"/>`;
  }).join("");
  return `<svg width="${2 * c}" height="${2 * c}">${slices}</svg>`;
}

const section = (title: string, color: string, body: string) => `<section><h2 style="--c:${color}">${title}</h2>${body}</section>`;
const tip = (s: string) => `<div class="tip"><b>Remember</b> ${s}</div>`;
const oops = (s: string) => `<div class="oops"><b>Common mistake</b> ${s}</div>`;
const header = (title: string, sub: string, nameLine = true) =>
  `<header><div><div class="kicker">MATHS · CLASS 6–7</div><h1>${title}</h1><div class="sub">${sub}</div></div>${nameLine ? `<div class="name">Name: ________________<br>Date: ________</div>` : ""}</header>`;

const n = NOTES;

// ---------- page 1: notes ----------

const page1 =
  header("Fractions", "Notes · what they are, equal fractions, comparing") +
  section(
    "1. What is a fraction?",
    BLUE,
    `<div class="row"><div>
      <p>A fraction tells us <b>how many equal parts</b> we have out of the whole.</p>
      <p class="big">${f("3/8", BLUE)} → <b style="color:${BLUE}">3</b> parts shaded, out of <b>8</b> equal parts</p>
      <p><b>Numerator</b> (top) = parts we take. <b>Denominator</b> (bottom) = equal parts in one whole.</p>
    </div><div class="pics">${pie(8, 3)}${bar(8, 3)}</div></div>` + tip("The parts must be <b>equal</b>. A pizza cut into 4 unequal pieces is not quarters!"),
  ) +
  section(
    "2. Equal (equivalent) fractions",
    GREEN,
    `<p>Different fractions can show the <b>same amount</b>:</p>
    <div class="stack">
      <div>${bar(2, 1, GREEN)} <span class="lab">${f(n.halfChain[0])}</span></div>
      <div>${bar(4, 2, GREEN)} <span class="lab">${f(n.halfChain[1])}</span></div>
      <div>${bar(8, 4, GREEN)} <span class="lab">${f(n.halfChain[2])}</span></div>
    </div>
    <p>To make an equal fraction, <b>multiply (or divide) the top and the bottom by the same number</b>:</p>
    <p class="big">${f("1/2")} = ${f("1×2/2×2")} = ${f("2/4")} &nbsp;&nbsp; ${f("18/24")} = ${f("18÷6/24÷6")} = ${f(n.simplify18_24, GREEN)} <span class="note">(simplest form)</span></p>`,
  ) +
  section(
    "3. Comparing fractions",
    ORANGE,
    `<ul>
      <li><b>Same bottom:</b> bigger top wins. ${f("5/7")} &gt; ${f("3/7")}</li>
      <li><b>Same top:</b> smaller bottom wins (fewer, bigger pieces). ${f("1/3")} &gt; ${f("1/5")}</li>
      <li><b>Different tops and bottoms:</b> cross-multiply.</li>
    </ul>
    <p class="big">${f(n.compareExample.a)} ? ${f(n.compareExample.b)} → 3 × 7 = <b>${n.compareExample.crossA}</b>, &nbsp;5 × 4 = <b>${n.compareExample.crossB}</b> → ${f(n.compareExample.a)} <b style="color:${ORANGE}">${n.compareExample.answer}</b> ${f(n.compareExample.b)}</p>`,
  );

// ---------- page 2: notes ----------

const ua = n.unlikeAdd;
const page2 =
  section(
    "4. Adding and subtracting",
    BLUE,
    `<p><b>Same bottom:</b> add the tops, keep the bottom.</p>
    <p class="big">${f("2/7")} + ${f("3/7")} = ${f(n.likeAdd, BLUE)}</p>
    <div class="row"><div>${bar(7, 2, BLUE)}<br>${bar(7, 5, BLUE)}</div><div class="note">2 pieces + 3 pieces = 5 pieces,<br>still sevenths.</div></div>
    <p style="margin-top:4mm"><b>Different bottoms:</b> first make the bottoms the same (use the LCM), then add.</p>
    <div class="steps">
      <div><span class="num">1</span> LCM of 2 and 3 is <b>${ua.lcd}</b></div>
      <div><span class="num">2</span> ${f(ua.a)} = ${f("3/6")}, &nbsp; ${f(ua.b)} = ${f("2/6")}</div>
      <div><span class="num">3</span> ${f("3/6")} + ${f("2/6")} = ${f(ua.answer, BLUE)}</div>
    </div>
    <div class="row"><div>${bar(6, 3, BLUE)} &nbsp;+&nbsp; ${bar(6, 2, ORANGE)}</div></div>` +
      oops(`${f(ua.a)} + ${f(ua.b)} is <b>not</b> ${f(n.wrongAdd, RED)}. Never add the bottoms! Check: ${f("1/2")} alone is already more than ${f("2/5")}.`),
  ) +
  section(
    "5. More than one whole",
    GREEN,
    `<p>When the top is bigger than the bottom, we have more than one whole:</p>
    <div class="row"><div class="pics">${pie(4, 4, GREEN, 40)}${pie(4, 3, GREEN, 40)}</div>
    <p class="big">${f(n.improper.f)} = ${n.improper.mixed!.whole} ${f(n.improper.mixed!.rest, GREEN)} <span class="note">(4 quarters make 1 whole, 3 quarters left)</span></p></div>`,
  ) +
  section(
    "Quick summary",
    ORANGE,
    `<table>
      <tr><td>Equal fractions</td><td>multiply or divide top and bottom by the same number</td></tr>
      <tr><td>Simplest form</td><td>divide top and bottom by their HCF</td></tr>
      <tr><td>Compare</td><td>same bottom → look at tops; otherwise cross-multiply</td></tr>
      <tr><td>Add / subtract</td><td>make bottoms equal (LCM), then add / subtract the tops</td></tr>
    </table>`,
  );

// ---------- page 3: worksheet ----------

const page3 =
  header("Fractions worksheet", "Try every question. Show your working. Answers on the last page.") +
  section(
    "A. What fraction is shaded? Write it in simplest form.",
    BLUE,
    `<div class="grid3">${SHADED.map((q, i) => `<div class="q"><span class="qn">${i + 1}</span>${i === 1 ? pie(q.parts, q.shaded, BLUE, 44) : bar(q.parts, q.shaded, BLUE, 200, 30)}<div class="ans-line">Answer: ________</div></div>`).join("")}</div>`,
  ) +
  section(
    "B. Fill in the box.",
    GREEN,
    `<div class="grid3">${EQUIVALENT.map((q, i) => `<div class="q"><span class="qn">${i + 4}</span><span class="big">${f(q.f)} = ${f([box, String(q.d)])}</span></div>`).join("")}</div>`,
  ) +
  section(
    "C. Put &lt;, &gt; or = in the circle.",
    ORANGE,
    `<div class="grid3">${COMPARE.map((q, i) => `<div class="q"><span class="qn">${i + 7}</span><span class="big">${f(q.a)} <span class="circle"></span> ${f(q.b)}</span></div>`).join("")}</div>`,
  ) +
  section(
    "D. Work out. Give the answer in simplest form.",
    BLUE,
    `<div class="grid3">${SUMS.map((q, i) => `<div class="q"><span class="qn">${i + 10}</span><span class="big">${f(q.a)} ${q.op} ${f(q.b)} = ______</span></div>`).join("")}</div>`,
  ) +
  section(
    "E. Word problems.",
    GREEN,
    `<div class="q wide"><span class="qn">13</span> Riya eats ${f(WORD.pizza.riya)} of a pizza and her brother eats ${f(WORD.pizza.brother)} of it. (a) How much of the pizza is eaten? (b) How much is left?</div>
    <div class="work"></div>
    <div class="q wide"><span class="qn">14</span> A ribbon is ${f(WORD.ribbon.length)} m long. Meena cuts off ${f(WORD.ribbon.cut)} m. How long is the ribbon now?</div>
    <div class="work"></div>`,
  );

// ---------- page 4: answer key ----------

const page4 =
  header("Answer key", "With short working · every answer checked by code", false) +
  `<div class="key">
    <h3 style="color:${BLUE}">A. Shaded</h3>
    ${SHADED.map((q, i) => `<p><b>${i + 1}.</b> ${f(q.answer)}${q.simplest.d !== q.answer.d ? ` = ${f(q.simplest, GREEN)}` : ""}</p>`).join("")}
    <h3 style="color:${GREEN}">B. Equal fractions</h3>
    ${EQUIVALENT.map((q, i) => `<p><b>${i + 4}.</b> ${q.d} ÷ ${q.f.d} = ${q.d / q.f.d}, so ${f(q.f)} = ${f(`${q.f.n}×${q.d / q.f.d}/${q.f.d}×${q.d / q.f.d}`)} = ${f(q.answer, GREEN)}</p>`).join("")}
    <h3 style="color:${ORANGE}">C. Compare</h3>
    ${COMPARE.map((q, i) => `<p><b>${i + 7}.</b> ${q.a.d === q.b.d ? "same bottom, compare tops" : `cross-multiply: ${q.a.n} × ${q.b.d} = ${q.crossA}, ${q.b.n} × ${q.a.d} = ${q.crossB}`} → ${f(q.a)} <b style="color:${ORANGE}">${q.answer}</b> ${f(q.b)}</p>`).join("")}
    <h3 style="color:${BLUE}">D. Add / subtract</h3>
    ${SUMS.map((q, i) => `<p><b>${i + 10}.</b> ${q.a.d === q.b.d ? `${f(q.a)} ${q.op} ${f(q.b)}` : `LCM = ${q.lcd}: ${f(q.A)} ${q.op} ${f(q.B)}`} = ${f(q.raw)}${q.raw.n !== q.answer.n ? ` = ${f(q.answer, GREEN)}` : ""}</p>`).join("")}
    <h3 style="color:${GREEN}">E. Word problems</h3>
    <p><b>13.</b> (a) ${f(WORD.pizza.riya)} + ${f(WORD.pizza.brother)} = ${f("3/8")} + ${f("2/8")} = ${f(WORD.pizza.eaten, GREEN)} eaten. (b) 1 − ${f(WORD.pizza.eaten)} = ${f(WORD.pizza.left, GREEN)} left.</p>
    <p><b>14.</b> ${f(WORD.ribbon.length)} − ${f(WORD.ribbon.cut)} = ${f("9/12")} − ${f("4/12")} = ${f(WORD.ribbon.rest, GREEN)} m</p>
  </div>
  <div class="foot">Original questions by Adithya Vikram. Every answer is computed and checked by code (a second check with decimals) before it is printed.</div>`;

const pages = [page1, page2, page3, page4];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Fractions: Class 6–7 notes and worksheet</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Nunito, "Segoe UI", sans-serif; color: ${INK}; font-size: 12.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 12mm 14mm 12mm; background: #fff; }
  .page:last-child { page-break-after: auto; }
  .page::before { content: ""; position: absolute; left: 0; top: 0; right: 0; height: 5mm; background: linear-gradient(90deg, ${BLUE}, ${GREEN}, ${ORANGE}); }
  .pno { position: absolute; bottom: 6mm; right: 14mm; font-size: 10pt; color: #8a90a8; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e3e6f0; padding-bottom: 3mm; margin-bottom: 4mm; }
  .kicker { font-size: 10pt; font-weight: 900; letter-spacing: 2px; color: ${GREEN}; }
  h1 { font-size: 30pt; font-weight: 900; margin: 0; line-height: 1.05; }
  .sub { color: #6a7090; }
  .name { font-size: 11pt; color: #6a7090; text-align: right; line-height: 1.8; }
  section { margin-bottom: 5mm; }
  h2 { font-size: 15pt; font-weight: 900; margin: 0 0 2mm; padding: 1mm 3mm; border-left: 5px solid var(--c); background: color-mix(in srgb, var(--c) 10%, white); border-radius: 0 3mm 3mm 0; }
  h3 { font-size: 13pt; margin: 3mm 0 1mm; }
  p { margin: 1.2mm 0; }
  ul { margin: 1mm 0; padding-left: 6mm; }
  li { margin: 1.5mm 0; }
  .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.1; margin: 0 1mm; font-weight: 800; }
  .frac > span:first-child { border-bottom: 2px solid currentColor; padding: 0 1.2mm; }
  .big { font-size: 15pt; }
  .note { font-size: 10.5pt; color: #6a7090; }
  .row { display: flex; align-items: center; gap: 8mm; }
  .pics { display: flex; align-items: center; gap: 6mm; }
  .stack > div { display: flex; align-items: center; gap: 4mm; margin: 1.5mm 0; }
  .lab { font-size: 14pt; }
  .tip, .oops { margin: 2.5mm 0; padding: 2mm 4mm; border-radius: 3mm; }
  .tip { background: #eaf7f1; border-left: 4px solid ${GREEN}; }
  .tip b { color: ${GREEN}; }
  .oops { background: #fdeeee; border-left: 4px solid ${RED}; }
  .oops b:first-child { color: ${RED}; }
  .steps > div { margin: 1.5mm 0; display: flex; align-items: center; gap: 2mm; font-size: 13pt; }
  .num { display: inline-flex; width: 7mm; height: 7mm; border-radius: 50%; background: ${BLUE}; color: #fff; font-weight: 900; align-items: center; justify-content: center; font-size: 10pt; }
  table { border-collapse: collapse; width: 100%; }
  td { border: 1.5px solid #e3e6f0; padding: 2mm 3mm; }
  td:first-child { font-weight: 800; width: 35%; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm 5mm; }
  .q { display: flex; flex-direction: column; gap: 2mm; align-items: flex-start; }
  .q.wide { display: block; margin-top: 2mm; }
  .qn { display: inline-flex; width: 7mm; height: 7mm; border-radius: 50%; border: 2px solid ${INK}; font-weight: 900; align-items: center; justify-content: center; font-size: 10pt; margin-right: 2mm; }
  .grid3 .q { flex-direction: row; flex-wrap: wrap; align-items: center; }
  .ans-line { width: 100%; color: #6a7090; }
  .blank { display: inline-block; width: 9mm; height: 7mm; border: 2px dashed ${INK}; border-radius: 1.5mm; }
  .circle { display: inline-block; width: 9mm; height: 9mm; border: 2px solid ${INK}; border-radius: 50%; vertical-align: middle; margin: 0 2mm; }
  .work { height: 20mm; border: 1.5px dashed #c9cde0; border-radius: 3mm; margin: 2mm 0 1mm; }
  .key p { margin: 1.6mm 0; font-size: 12.5pt; }
  .foot { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; font-size: 10pt; color: #6a7090; border-top: 1.5px solid #e3e6f0; padding-top: 2mm; }
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
  ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header", "--virtual-time-budget=15000", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href],
  { stdio: "inherit" },
);
if (result.status !== 0 || !fs.existsSync(pdfPath)) throw new Error("Printing to PDF failed.");
console.log(`Fractions pack → ${path.relative(root, pdfPath)}`);
