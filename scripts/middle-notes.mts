// Two Class 6–8 material packs (A4 PDF, 4 pages each: notes ×2, worksheet, answer key).
//   npm run notes:middle
// Every answer comes from src/notes/middle.ts (checked by tests/middle-notes.test.ts).
// Output: notes/class-6-measurement-pack.pdf, notes/class-8-friction-pack.pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BOARD_M, BROKEN, CONVERSIONS, FRICTION_ANSWERS, FRICTION_Q, HANDSPANS, LAPS, SHORT_EXAMPLE } from "../src/notes/middle";

const root = process.cwd();
const outDir = path.join(root, "notes");
const url = (p: string) => pathToFileURL(path.join(root, p)).href;

const BLUE = "#2f6fe4";
const GREEN = "#1f9d6b";
const ORANGE = "#f08a24";
const PINK = "#d93d73";
const RED = "#d64545";
const INK = "#1d2340";
const WOOD = "#9a6a43";

const section = (title: string, color: string, body: string) => `<section><h2 style="--c:${color}">${title}</h2>${body}</section>`;
const tip = (s: string) => `<div class="tip"><b>Remember</b> ${s}</div>`;
const oops = (s: string) => `<div class="oops"><b>Common mistake</b> ${s}</div>`;
const ex = (s: string) => `<div class="ex"><b>Example</b> ${s}</div>`;
const header = (kicker: string, title: string, sub: string, nameLine = true) =>
  `<header><div><div class="kicker">${kicker}</div><h1>${title}</h1><div class="sub">${sub}</div></div>${nameLine ? `<div class="name">Name: ________________<br>Date: ________</div>` : ""}</header>`;
const n = (x: number) => String(Math.round(x * 1e6) / 1e6);

// ---------- small diagrams ----------

/** A ruler from `from` to `to` cm, with an object laid on it between `a` and `b`. */
function ruler(from: number, to: number, a: number, b: number, broken = false, label = "") {
  const px = 44;
  const w = (to - from) * px;
  const ticks = Array.from({ length: Math.round((to - from) * 10) + 1 }, (_, i) => {
    const v = from + i / 10;
    const x = 20 + (v - from) * px;
    const big = Math.abs(v - Math.round(v)) < 1e-6;
    const half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
    return `<line x1="${x}" y1="70" x2="${x}" y2="${big ? 44 : half ? 54 : 60}" stroke="${INK}" stroke-width="${big ? 2 : 1}"/>${big ? `<text x="${x}" y="38" font-size="14" text-anchor="middle" fill="${INK}">${Math.round(v)}</text>` : ""}`;
  }).join("");
  return `<svg width="${w + 40}" height="110" viewBox="0 0 ${w + 40} 110">
    <rect x="${20 + (a - from) * px}" y="80" width="${(b - a) * px}" height="18" rx="9" fill="${ORANGE}"/>
    <rect x="${broken ? 26 : 10}" y="20" width="${w + 20}" height="50" fill="#fff6d6" stroke="${INK}" stroke-width="2"/>
    ${broken ? `<path d="M10 20 L26 20 L20 34 L28 46 L18 58 L26 70 L10 70 Z" fill="#fff" stroke="${RED}" stroke-width="2"/>` : ""}
    ${ticks}
    ${label ? `<text x="${20 + ((a + b) / 2 - from) * px}" y="108" font-size="13" text-anchor="middle" fill="${INK}">${label}</text>` : ""}
  </svg>`;
}

function spans(cmEach: number, count: number, color: string, name: string) {
  const px = 2.4;
  return `<svg width="${count * cmEach * px + 160}" height="44" viewBox="0 0 ${count * cmEach * px + 160} 44">
    ${Array.from({ length: count }, (_, i) => `<rect x="${i * cmEach * px + 2}" y="6" width="${cmEach * px - 4}" height="30" rx="7" fill="${color}"/><text x="${(i + 0.5) * cmEach * px}" y="27" font-size="13" font-weight="700" text-anchor="middle" fill="#fff">${i + 1}</text>`).join("")}
    <text x="${count * cmEach * px + 10}" y="27" font-size="14" font-weight="700" fill="${color}">${name}: ${count} × ${cmEach} cm</text>
  </svg>`;
}

/** Tiny bumps on the box (top) and the floor (bottom). Still: the box's bumps sit between the floor's bumps. Sliding: they ride on top. */
function bumps(locked: boolean) {
  // Solid box (top) and floor (bottom), each with a row of teeth. Still: teeth mesh. Sliding: the box rides up.
  const teeth = (base: number, tip: number, shift: number) => Array.from({ length: 11 }, (_, i) => `${10 + i * 30 + shift},${base} ${25 + i * 30 + shift},${tip}`).join(" ");
  const lift = locked ? 0 : 16;
  return `<svg width="340" height="140" viewBox="0 0 340 140">
    <defs><clipPath id="bc${locked ? 1 : 0}"><rect x="10" y="22" width="320" height="96" rx="8"/></clipPath></defs>
    <g clip-path="url(#bc${locked ? 1 : 0})">
      <polygon points="0,0 0,${52 - lift} ${teeth(52 - lift, 88 - lift, 15)} 345,${52 - lift} 345,0" fill="${WOOD}"/>
      <polygon points="0,130 0,100 ${teeth(100, 76, 0)} 345,100 345,130" fill="#9aa4c2"/>
    </g>
    <rect x="10" y="22" width="320" height="96" rx="8" fill="none" stroke="#c9cde0" stroke-width="2"/>
    <text x="170" y="16" font-size="13" text-anchor="middle" fill="${WOOD}" font-weight="700">box above, floor below (zoomed in)</text>
    <text x="170" y="136" font-size="14" text-anchor="middle" fill="#5a6585" font-weight="700">${locked ? "still: bumps lock together" : "sliding: bumps skip over"}</text>
  </svg>`;
}

function boxForces(push: number, friction: number, moving: boolean) {
  const k = 1.4;
  return `<svg width="420" height="150" viewBox="0 0 420 150">
    <line x1="10" y1="120" x2="410" y2="120" stroke="${INK}" stroke-width="3"/>
    <rect x="200" y="50" width="100" height="70" rx="6" fill="${WOOD}"/>
    <text x="250" y="92" font-size="16" text-anchor="middle" fill="#fff" font-weight="700">box</text>
    <line x1="${200 - push * k}" y1="85" x2="196" y2="85" stroke="${PINK}" stroke-width="4"/><path d="M196 85 L184 78 L184 92 Z" fill="${PINK}"/>
    <text x="${200 - (push * k) / 2}" y="76" font-size="14" text-anchor="middle" fill="${PINK}" font-weight="700">push ${push} N</text>
    <line x1="250" y1="134" x2="${250 - friction * k}" y2="134" stroke="${ORANGE}" stroke-width="4"/><path d="M${250 - friction * k} 134 L${262 - friction * k} 127 L${262 - friction * k} 141 Z" fill="${ORANGE}"/>
    <text x="${330}" y="140" font-size="14" fill="${ORANGE}" font-weight="700">friction ${friction} N</text>
    <text x="250" y="36" font-size="15" text-anchor="middle" fill="${moving ? GREEN : INK}" font-weight="700">${moving ? "moving" : "not moving"}</text>
  </svg>`;
}

// ---------- Class 6: measurement ----------

const [riya, arjun] = [
  { name: "Riya", cm: 20, n: 8 },
  { name: "Arjun", cm: 16, n: 10 },
];

const measurePages = [
  header("SCIENCE · CLASS 6", "Measurement of Length", "Notes · why we need standard units, and how to measure correctly") +
    section(
      "1. Why do we need a standard unit?",
      BLUE,
      `<p>Riya and Arjun measured the <b>same 1.6 m table</b> with their handspans:</p>
      <div class="fig">${spans(riya.cm, riya.n, GREEN, riya.name)}<br>${spans(arjun.cm, arjun.n, ORANGE, arjun.name)}</div>
      <p>They got different numbers, but <b>neither is wrong</b>: Arjun's hand is smaller. Handspans, footspans, cubits and steps change from person to person. So everyone agreed on <b>standard units</b> that are the same everywhere.</p>` +
        tip(`The <b>SI unit of length is the metre (m)</b>. "SI" means the International System of Units, used by the whole world.`),
    ) +
    section(
      "2. Bigger and smaller units",
      GREEN,
      `<table class="units"><tr><th>Unit</th><th>Symbol</th><th>Relation</th><th>Used for</th></tr>
        <tr><td>kilometre</td><td>km</td><td>1 km = 1000 m</td><td>distance between towns</td></tr>
        <tr><td>metre</td><td>m</td><td>1 m = 100 cm</td><td>length of a room, cloth</td></tr>
        <tr><td>centimetre</td><td>cm</td><td>1 cm = 10 mm</td><td>length of a pencil, book</td></tr>
        <tr><td>millimetre</td><td>mm</td><td>—</td><td>thickness of a coin</td></tr></table>` +
        `<p class="rule">Big unit → small unit: <b>multiply</b>. &nbsp; Small unit → big unit: <b>divide</b>.</p>` +
        ex(`2.5 m = 2.5 × 100 = <b>250 cm</b>. &nbsp; 340 cm = 340 ÷ 100 = <b>3.4 m</b>.`),
    ),
  section(
    "3. How to measure correctly",
    ORANGE,
    `<ul>
      <li>Place the scale <b>along</b> the length, touching the object.</li>
      <li>Start from the <b>zero mark</b>.</li>
      <li>Keep your eye <b>straight above</b> the mark you read. Looking from the side gives a wrong reading.</li>
    </ul>
    <p><b>Broken ruler?</b> Start from any full mark and <b>subtract</b>:</p>
    <div class="fig">${ruler(1, 11, BROKEN[0].start, BROKEN[0].end, true, `${BROKEN[0].what}: ${BROKEN[0].end} − ${BROKEN[0].start} = ${n(BROKEN[0].length)} cm`)}</div>` +
      oops(`Reading the end mark (${BROKEN[0].end} cm) as the length when the object starts at ${BROKEN[0].start} cm.`),
  ) +
    section(
      "4. Measuring a curved line",
      BLUE,
      `<p>Lay a <b>thread</b> carefully along the curve, mark where it ends, then straighten the thread and measure it with a ruler.</p>`,
    ) +
    section(
      "Quick summary",
      GREEN,
      `<ul><li>Handspans and steps are not reliable: they differ from person to person.</li>
      <li>SI unit of length: <b>metre (m)</b>. 1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm.</li>
      <li>Measure from zero, scale along the object, eye straight above the mark.</li></ul>`,
    ),
  header("SCIENCE · CLASS 6", "Measurement: worksheet", "Try every question. Show your working.") +
    section(
      "A. Convert the units",
      BLUE,
      `<div class="grid2">${CONVERSIONS.map((c, i) => `<div class="q"><span class="qn">${i + 1}</span> ${c.q}</div>`).join("")}</div>`,
    ) +
    section(
      "B. Broken ruler",
      ORANGE,
      `<div class="q wide"><span class="qn">7</span> ${BROKEN[1].what} starts at the <b>${BROKEN[1].start} cm</b> mark and ends at the <b>${BROKEN[1].end} cm</b> mark. How long is it?</div>
      <div class="fig">${ruler(1, 11, BROKEN[1].start, BROKEN[1].end, true)}</div>`,
    ) +
    section(
      "C. Handspans",
      GREEN,
      `<div class="q wide"><span class="qn">8</span> The class board is <b>${BOARD_M} m</b> long. Meena's handspan is ${HANDSPANS[0].cm} cm and Ravi's is ${HANDSPANS[1].cm} cm. How many handspans does each of them count? Who is right?</div><div class="work"></div>`,
    ) +
    section(
      "D. Word problem",
      BLUE,
      `<div class="q wide"><span class="qn">9</span> A running track is <b>${LAPS.lapM} m</b> long. Sana runs <b>${LAPS.laps}</b> laps. How far does she run, in metres and in kilometres?</div><div class="work"></div>`,
    ) +
    section(
      "E. Think",
      GREEN,
      `<div class="q wide"><span class="qn">10</span> Why would a shopkeeper not sell cloth by handspans? Give one reason.</div><div class="work small"></div>`,
    ),
  header("SCIENCE · CLASS 6", "Measurement: answer key", "With short working · every answer checked by code", false) +
    `<div class="key">
      <h3 style="color:${BLUE}">A. Conversions</h3>
      ${CONVERSIONS.map((c, i) => {
        const big = ["km", "m", "cm", "mm"];
        const mult = big.indexOf(c.from) < big.indexOf(c.to);
        const f = c.answer / c.value;
        return `<p><b>${i + 1}.</b> ${c.q.replace("___", `<b style="color:${GREEN}">${n(c.answer)}</b>`)} &nbsp; <span class="w">(${mult ? `big → small: × ${n(f)}` : `small → big: ÷ ${n(1 / f)}`})</span></p>`;
      }).join("")}
      <h3 style="color:${ORANGE}">B. Broken ruler</h3>
      <p><b>7.</b> ${BROKEN[1].end} − ${BROKEN[1].start} = <b style="color:${GREEN}">${n(BROKEN[1].length)} cm</b></p>
      <h3 style="color:${GREEN}">C. Handspans</h3>
      <p><b>8.</b> ${BOARD_M} m = ${n(BOARD_M * 100)} cm. Meena: ${n(BOARD_M * 100)} ÷ ${HANDSPANS[0].cm} = <b style="color:${GREEN}">${n(HANDSPANS[0].spans)}</b> spans. Ravi: ${n(BOARD_M * 100)} ÷ ${HANDSPANS[1].cm} = <b style="color:${GREEN}">${n(HANDSPANS[1].spans)}</b> spans. <b>Both are right</b>: their hands are different sizes, which is why we need a standard unit.</p>
      <h3 style="color:${BLUE}">D. Word problem</h3>
      <p><b>9.</b> ${LAPS.laps} × ${LAPS.lapM} m = <b style="color:${GREEN}">${LAPS.totalM} m</b> = ${LAPS.totalM} ÷ 1000 = <b style="color:${GREEN}">${n(LAPS.totalKm)} km</b></p>
      <h3 style="color:${GREEN}">E. Think</h3>
      <p><b>10.</b> Sample answer: different people have different handspans, so customers would get different amounts of cloth for the same price. A metre is the same for everyone.</p>
    </div>
    <div class="foot">Original questions by Adithya Vikram · matches the Class 6 Short "Who measured it wrong?" · every numerical answer computed and double-checked by code.</div>`,
];

// ---------- Class 8: friction ----------

const fb = FRICTION_Q.box;
const frictionPages = [
  header("SCIENCE · CLASS 8", "Friction", "Notes · what friction is, why the first push is hardest, and how we change it") +
    section(
      "1. What is friction?",
      BLUE,
      `<p><b>Friction</b> is a force that <b>opposes motion</b> (or an attempt to move) between two surfaces that touch each other. It acts along the surfaces, opposite to the direction of motion.</p>
      <p><b>Why does it happen?</b> Even smooth-looking surfaces have tiny bumps. When two surfaces press together, the bumps <b>lock into each other</b>.</p>
      <div class="fig two">${bumps(true)}${bumps(false)}</div>`,
    ) +
    section(
      "2. Why is the first push the hardest?",
      ORANGE,
      `<p>The friction that stops a still object from moving (<b>static friction</b>) is <b>more</b> than the friction while it slides (<b>sliding friction</b>). When still, the bumps have time to lock firmly; when sliding, they don't.</p>
      <div class="fig two">${boxForces(SHORT_EXAMPLE.startN - 30, SHORT_EXAMPLE.startN - 30, false)}${boxForces(SHORT_EXAMPLE.slideN, SHORT_EXAMPLE.slideN, true)}</div>` +
        ex(`A ${SHORT_EXAMPLE.kg} kg box needs <b>${SHORT_EXAMPLE.startN} N</b> to start moving but only <b>${SHORT_EXAMPLE.slideN} N</b> to keep it moving at a steady speed.`) +
        tip(`<b>static friction &gt; sliding friction &gt; rolling friction</b>. That's why wheels make moving things easy.`),
    ),
  section(
    "3. What decides how much friction there is?",
    GREEN,
    `<ul><li><b>The type of surfaces:</b> rough surfaces (sandpaper, gravel) have more friction than smooth ones (glass, ice).</li>
      <li><b>How hard they are pressed together:</b> a heavier box has more friction.</li></ul>`,
  ) +
    section(
      "4. Friction: a necessary evil",
      BLUE,
      `<div class="cols"><div><h3 style="color:${GREEN}">Useful: we need it to</h3><ul><li>walk without slipping</li><li>hold a pen and write</li><li>stop a bicycle with brakes</li><li>light a matchstick</li></ul></div>
      <div><h3 style="color:${RED}">Harmful: it also</h3><ul><li>wears out shoe soles and tyres</li><li>heats up machine parts</li><li>wastes energy in engines</li></ul></div></div>`,
    ) +
    section(
      "5. Increasing and reducing friction",
      ORANGE,
      `<table class="units"><tr><th>To increase friction</th><th>To reduce friction</th></tr>
        <tr><td>treads on tyres and shoe soles</td><td>oil or grease (lubricants)</td></tr>
        <tr><td>gymnasts' chalk powder on hands</td><td>ball bearings in fans and cycles</td></tr>
        <tr><td>sand on a slippery road</td><td>wheels on suitcases</td></tr></table>` +
        `<p><b>Fluid friction (drag):</b> air and water also oppose motion. Fish, birds and aeroplanes have <b>streamlined</b> shapes to reduce it.</p>` +
        oops(`Saying friction always "stops" things. It only opposes <b>relative</b> motion. Without friction, your feet couldn't push the ground to walk!`),
    ),
  header("SCIENCE · CLASS 8", "Friction: worksheet", "Try every question. Show your working.") +
    section(
      "A. Choose the correct answer",
      BLUE,
      `<div class="q wide"><span class="qn">1</span> Friction acts (a) along the motion &nbsp; (b) opposite to the motion &nbsp; (c) upwards</div>
      <div class="q wide"><span class="qn">2</span> Which is the smallest? (a) static friction &nbsp; (b) sliding friction &nbsp; (c) rolling friction</div>
      <div class="q wide"><span class="qn">3</span> Gymnasts rub chalk powder on their hands to (a) increase friction &nbsp; (b) reduce friction</div>
      <div class="q wide"><span class="qn">4</span> Ball bearings are used to (a) increase friction &nbsp; (b) reduce friction</div>`,
    ) +
    section(
      "B. Push the box",
      ORANGE,
      `<p>A box needs <b>more than ${fb.startN} N</b> to start moving. Once it slides, friction is <b>${fb.slideN} N</b>.</p>
      <div class="q wide"><span class="qn">5</span> You push with <b>${FRICTION_Q.pushes[0]} N</b>. Does the box move? How big is the friction?</div>
      <div class="q wide"><span class="qn">6</span> You push with <b>${FRICTION_Q.pushes[1]} N</b>. Does it move? Once it slides, what is the net force on it?</div>
      <div class="q wide"><span class="qn">7</span> How hard must you push to keep it sliding at a <b>steady speed</b>?</div><div class="work small"></div>`,
    ) +
    section(
      "C. Increase or reduce friction?",
      GREEN,
      `<div class="grid2">${["deep treads on tyres", "oiling a squeaky door hinge", "sand on an icy road", "wheels on a suitcase", "spikes on running shoes", "polishing a carrom board"].map((s, i) => `<div class="q"><span class="qn">${8 + i}</span> ${s}: ________</div>`).join("")}</div>`,
    ) +
    section(
      "D. Think",
      BLUE,
      `<div class="q wide"><span class="qn">14</span> Why does a matchstick catch fire when you strike it on the box?</div><div class="work small"></div>`,
    ),
  header("SCIENCE · CLASS 8", "Friction: answer key", "With short working · every number checked by code", false) +
    `<div class="key">
      <h3 style="color:${BLUE}">A. Choose</h3>
      <p><b>1.</b> (b) opposite to the motion &nbsp; <b>2.</b> (c) rolling friction &nbsp; <b>3.</b> (a) increase &nbsp; <b>4.</b> (b) reduce</p>
      <h3 style="color:${ORANGE}">B. Push the box</h3>
      <p><b>5.</b> ${FRICTION_Q.pushes[0]} N is not more than ${fb.startN} N, so the box <b style="color:${GREEN}">does not move</b>. Friction matches your push: <b style="color:${GREEN}">${FRICTION_ANSWERS.push70.friction} N</b>.</p>
      <p><b>6.</b> ${FRICTION_Q.pushes[1]} N &gt; ${fb.startN} N, so it <b style="color:${GREEN}">starts to move</b>. While sliding: net force = ${FRICTION_Q.pushes[1]} − ${fb.slideN} = <b style="color:${GREEN}">${FRICTION_ANSWERS.push90.net} N</b> (so it speeds up).</p>
      <p><b>7.</b> Push = sliding friction = <b style="color:${GREEN}">${FRICTION_ANSWERS.steady} N</b>. Then the net force is 0 and the speed stays the same.</p>
      <h3 style="color:${GREEN}">C. Increase or reduce</h3>
      <p><b>8.</b> increase &nbsp; <b>9.</b> reduce &nbsp; <b>10.</b> increase &nbsp; <b>11.</b> reduce &nbsp; <b>12.</b> increase &nbsp; <b>13.</b> reduce</p>
      <h3 style="color:${BLUE}">D. Think</h3>
      <p><b>14.</b> Friction between the match head and the rough side of the box produces heat. The heat raises the temperature of the chemicals on the match head until they catch fire.</p>
    </div>
    <div class="foot">Original questions by Adithya Vikram · matches the Class 8 Short "Why is the first push the hardest?" · every numerical answer computed and double-checked by code.</div>`,
];

// ---------- printing ----------

const css = `
  @font-face { font-family: "Atkinson Hyperlegible"; src: url("${url("public/fonts/atkinson-400.woff2")}") format("woff2"); font-weight: 400; }
  @font-face { font-family: "Atkinson Hyperlegible"; src: url("${url("public/fonts/atkinson-700.woff2")}") format("woff2"); font-weight: 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif; color: ${INK}; font-size: 12pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 13mm 15mm 12mm; }
  .page:last-child { page-break-after: auto; }
  .page::before { content: ""; position: absolute; left: 0; top: 0; right: 0; height: 5mm; background: linear-gradient(90deg, ${BLUE}, ${GREEN}, ${ORANGE}); }
  .pno { position: absolute; bottom: 6mm; right: 15mm; font-size: 9.5pt; color: #8a90a8; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e3e6f0; padding-bottom: 3mm; margin-bottom: 4mm; }
  .kicker { font-size: 9.5pt; font-weight: 700; letter-spacing: 2px; color: ${GREEN}; }
  h1 { font-size: 26pt; margin: 0; line-height: 1.1; }
  .sub { color: #5a6585; }
  .name { font-size: 10.5pt; color: #5a6585; text-align: right; line-height: 1.8; }
  section { margin-bottom: 4.5mm; }
  h2 { font-size: 14pt; margin: 0 0 2mm; padding: 1mm 3mm; border-left: 5px solid var(--c); background: color-mix(in srgb, var(--c) 10%, white); border-radius: 0 3mm 3mm 0; }
  h3 { font-size: 12.5pt; margin: 2.5mm 0 1mm; }
  p { margin: 1.2mm 0; }
  ul { margin: 1mm 0; padding-left: 6mm; }
  li { margin: 1mm 0; }
  .fig { margin: 2mm 0; }
  .fig.two { display: flex; gap: 6mm; align-items: center; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .tip, .oops, .ex { margin: 2.5mm 0; padding: 2mm 4mm; border-radius: 3mm; }
  .tip { background: #eaf7f1; border-left: 4px solid ${GREEN}; } .tip b:first-child { color: ${GREEN}; }
  .oops { background: #fdeeee; border-left: 4px solid ${RED}; } .oops b:first-child { color: ${RED}; }
  .ex { background: #eef3fd; border-left: 4px solid ${BLUE}; } .ex b:first-child { color: ${BLUE}; }
  .rule { font-size: 12.5pt; }
  table.units { border-collapse: collapse; width: 100%; margin: 2mm 0; }
  table.units td, table.units th { border: 1.5px solid #e3e6f0; padding: 1.8mm 3mm; text-align: left; }
  table.units th { background: #f5f6fb; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; }
  .q { font-size: 12.5pt; margin: 2mm 0; }
  .q.wide { margin: 2.5mm 0; }
  .qn { display: inline-flex; width: 7mm; height: 7mm; border-radius: 50%; border: 2px solid ${INK}; font-weight: 700; align-items: center; justify-content: center; font-size: 10pt; margin-right: 2mm; }
  .work { height: 15mm; border: 1.5px dashed #c9cde0; border-radius: 3mm; margin: 2mm 0; }
  .work.small { height: 11mm; }
  .key p { margin: 1.8mm 0; }
  .key .w { color: #5a6585; font-size: 10.5pt; }
  .foot { position: absolute; left: 15mm; right: 15mm; bottom: 12mm; font-size: 9.5pt; color: #5a6585; border-top: 1.5px solid #e3e6f0; padding-top: 2mm; }
`;

const chrome = path.join(root, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!fs.existsSync(chrome)) throw new Error("Headless Chrome not found. Render any video once to download it.");
fs.mkdirSync(outDir, { recursive: true });

for (const [base, title, pages] of [
  ["class-6-measurement-pack", "Class 6 · Measurement of Length", measurePages],
  ["class-8-friction-pack", "Class 8 · Friction", frictionPages],
] as const) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>
${pages.map((pg, i) => `<div class="page">${pg}<div class="pno">${i + 1} / ${pages.length}</div></div>`).join("\n")}
</body></html>`;
  const htmlPath = path.join(outDir, `${base}.html`);
  fs.writeFileSync(htmlPath, html);
  const pdfPath = path.join(outDir, `${base}.pdf`);
  const r = spawnSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files", "--virtual-time-budget=10000", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(pdfPath)) throw new Error(`Printing ${base} failed.`);
  console.log(`${title} → ${path.relative(root, pdfPath)}`);
}
