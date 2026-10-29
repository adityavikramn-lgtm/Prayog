// Builds the "Electric Charges and Coulomb's Law" notes as a printable page and a PDF.
//   npm run notes
// Every worked number comes from src/notes/electrostatics.ts (checked by tests/notes.test.ts).
// Output: notes/electric-charges-and-coulombs-law.html and .pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import katex from "katex";
import { sig3 } from "../src/physics/format";
import { ex1, ex10, ex10b, ex11, ex2, ex3, ex4, ex5, ex6, ex7, ex8a, ex8b, ex9 } from "../src/notes/electrostatics";
import { K_JEE, coulombForce, nullPointBetween } from "../src/physics/coulomb";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "electric-charges-and-coulombs-law";

// ---------- tiny text helpers ----------

/** $$…$$ = display maths, $…$ = inline maths, **…** = bold. */
function md(s: string): string {
  return s
    .replace(/\$\$([^$]+)\$\$/g, (_, t) => katex.renderToString(t, { displayMode: true, throwOnError: true }))
    .replace(/\$([^$]+)\$/g, (_, t) => katex.renderToString(t, { throwOnError: true }))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
const p = (s: string) => `<p>${md(s)}</p>`;
const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
const ol = (items: string[]) => `<ol>${items.map((i) => `<li>${md(i)}</li>`).join("")}</ol>`;
// The body may mix ready HTML with raw $…$ maths; md() turns any raw maths that is left into KaTeX.
const box = (kind: "key" | "formula" | "warn" | "tip", title: string, body: string) =>
  `<div class="box ${kind}"><div class="box-title">${md(title)}</div>${md(body)}</div>`;
const table = (head: string[], rows: string[][]) =>
  `<table><thead><tr>${head.map((h) => `<th>${md(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

let exampleNo = 0;
function example(title: string, question: string, steps: string[], answer: string): string {
  exampleNo++;
  return `<div class="example">
    <div class="ex-head">Example ${exampleNo} · ${md(title)}</div>
    <div class="ex-q">${md(question)}</div>
    <div class="ex-label">Solution, step by step</div>
    ${ol(steps)}
    <div class="ex-ans"><strong>Answer:</strong> ${md(answer)}</div>
  </div>`;
}

let sectionNo = 0;
const toc: string[] = [];
// Content flows from page to page (boxes and examples never split); only these start a fresh page.
const FRESH_PAGE = new Set(["Formula sheet", "Answers"]);
function section(title: string, body: string): string {
  sectionNo++;
  toc.push(`${sectionNo}. ${title}`);
  return `<section${FRESH_PAGE.has(title) ? ' class="new-page"' : ""}><h2><span class="num">${sectionNo}</span>${md(title)}</h2>${body}</section>`;
}
const sub = (t: string) => `<h3>${md(t)}</h3>`;
const fig = (svg: string, caption: string) => `<figure>${svg}<figcaption>${md(caption)}</figcaption></figure>`;

// ---------- diagrams (plain SVG) ----------

const INK = "#1d2a33";
const PLUS = "#c0392b";
const MINUS = "#1f6fb2";
const FORCE = "#9b3d8a";
const DIM = "#b07d12";

function charge(x: number, y: number, sign: "+" | "−", r = 18, label = ""): string {
  const c = sign === "+" ? PLUS : MINUS;
  return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="white" stroke="${c}" stroke-width="3"/>
    <text x="${x}" y="${y + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="${c}">${sign}</text>
    ${label ? `<text x="${x}" y="${y + r + 22}" text-anchor="middle" font-size="15" fill="${INK}">${label}</text>` : ""}</g>`;
}
function arrow(x1: number, y1: number, x2: number, y2: number, color = FORCE, label = "", dash = false): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 11;
  const p1 = `${x2 - h * Math.cos(a - 0.4)},${y2 - h * Math.sin(a - 0.4)}`;
  const p2 = `${x2 - h * Math.cos(a + 0.4)},${y2 - h * Math.sin(a + 0.4)}`;
  return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" ${dash ? 'stroke-dasharray="6 5"' : ""}/>
    <polygon points="${x2},${y2} ${p1} ${p2}" fill="${color}"/>
    ${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 10}" text-anchor="middle" font-size="15" font-style="italic" fill="${color}">${label}</text>` : ""}</g>`;
}
function dim(x1: number, x2: number, y: number, label: string): string {
  return `<g stroke="${DIM}" stroke-width="2"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 7}" x2="${x1}" y2="${y + 7}"/><line x1="${x2}" y1="${y - 7}" x2="${x2}" y2="${y + 7}"/></g>
    <text x="${(x1 + x2) / 2}" y="${y + 22}" text-anchor="middle" font-size="15" fill="${DIM}">${label}</text>`;
}
const svg = (w: number, h: number, inner: string) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial">${inner}</svg>`;

const figLikeUnlike = svg(
  620,
  150,
  charge(110, 50, "+") + charge(250, 50, "+") + arrow(88, 50, 30, 50) + arrow(272, 50, 330, 50) +
    `<text x="180" y="120" text-anchor="middle" font-size="15" fill="${INK}">Like charges push apart</text>` +
    charge(410, 50, "+") + charge(550, 50, "−") + arrow(432, 50, 470, 50) + arrow(528, 50, 490, 50) +
    `<text x="480" y="120" text-anchor="middle" font-size="15" fill="${INK}">Unlike charges pull together</text>`,
);

// Each step is 190 px wide: the rod on the left, then a gap, then the sphere (centre at x + 120).
function inductionStep(x: number, title: string, sphere: string, extra: string): string {
  return `<g><text x="${x + 95}" y="20" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}">${title}</text>
    <circle cx="${x + 120}" cy="95" r="40" fill="#f4f6f8" stroke="${INK}" stroke-width="2"/>${sphere}${extra}</g>`;
}
const signs = (x: number, list: [number, number, "+" | "−"][]) =>
  list.map(([dx, dy, s]) => `<text x="${x + 120 + dx}" y="${dy}" text-anchor="middle" font-size="18" font-weight="700" fill="${s === "+" ? PLUS : MINUS}">${s}</text>`).join("");
const rod = (x: number) =>
  `<rect x="${x + 10}" y="86" width="50" height="18" rx="4" fill="#fde7e4" stroke="${PLUS}" stroke-width="2"/><text x="${x + 35}" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="${PLUS}">+ + +</text>`;
const earth = (x: number) =>
  `<line x1="${x + 160}" y1="95" x2="${x + 178}" y2="95" stroke="${INK}" stroke-width="2"/><line x1="${x + 178}" y1="95" x2="${x + 178}" y2="150" stroke="${INK}" stroke-width="2"/><line x1="${x + 166}" y1="150" x2="${x + 190}" y2="150" stroke="${INK}" stroke-width="2"/><line x1="${x + 170}" y1="156" x2="${x + 186}" y2="156" stroke="${INK}" stroke-width="2"/><line x1="${x + 174}" y1="162" x2="${x + 182}" y2="162" stroke="${INK}" stroke-width="2"/>`;
const figInduction = svg(
  780,
  180,
  inductionStep(0, "1. Bring a + rod near", signs(0, [[-22, 90, "−"], [-22, 110, "−"], [22, 90, "+"], [22, 110, "+"]]), rod(0)) +
    inductionStep(195, "2. Earth the far side", signs(195, [[-22, 90, "−"], [-22, 110, "−"]]), rod(195) + earth(195)) +
    inductionStep(390, "3. Remove earth, then rod", signs(390, [[-22, 90, "−"], [-22, 110, "−"]]), "") +
    inductionStep(585, "4. Charge spreads out", signs(585, [[-26, 82, "−"], [26, 82, "−"], [0, 128, "−"], [0, 66, "−"]]), ""),
);

const figCoulomb = svg(
  560,
  130,
  charge(120, 50, "+", 18, "q₁") + charge(420, 50, "+", 18, "q₂") + arrow(98, 50, 30, 50, FORCE, "F₁₂") + arrow(442, 50, 530, 50, FORCE, "F₂₁") + dim(120, 420, 98, "r"),
);

const figLine = svg(
  640,
  140,
  `<line x1="40" y1="50" x2="600" y2="50" stroke="#aab" stroke-width="2" stroke-dasharray="4 6"/>` +
    charge(80, 50, "+", 18, "A: +2 µC") + charge(240, 50, "−", 18, "B: −1 µC") + charge(560, 50, "+", 18, "C: +4 µC") +
    arrow(240, 22, 160, 22, FORCE, "1.8 N") + arrow(240, 22, 290, 22, FORCE, "0.9 N") +
    dim(80, 240, 108, "10 cm") + dim(240, 560, 108, "20 cm"),
);

const figSquare = svg(
  520,
  330,
  `<rect x="90" y="70" width="180" height="180" fill="none" stroke="#aab" stroke-width="2" stroke-dasharray="5 5"/>` +
    charge(90, 70, "+") + charge(270, 70, "+") + charge(90, 250, "+") + charge(270, 250, "+", 18) +
    arrow(270, 250, 270, 320 - 30, FORCE) + arrow(270, 250, 330, 250, FORCE) + arrow(270, 250, 320, 300, FORCE, "") +
    `<text x="340" y="318" font-size="14" fill="${FORCE}">net force: along the diagonal</text>` +
    dim(90, 270, 30, "a"),
);

const figNull = svg(
  660,
  220,
  `<text x="20" y="22" font-size="15" font-weight="700" fill="${INK}">Like charges: null point between them, closer to the smaller one</text>` +
    `<line x1="40" y1="70" x2="620" y2="70" stroke="#aab" stroke-width="2" stroke-dasharray="4 6"/>` +
    charge(80, 70, "+", 16, "+2 µC") + charge(560, 70, "+", 16, "+8 µC") +
    `<circle cx="240" cy="70" r="7" fill="${DIM}"/><text x="240" y="50" text-anchor="middle" font-size="14" fill="${DIM}">F = 0</text>` +
    `<text x="20" y="140" font-size="15" font-weight="700" fill="${INK}">Unlike charges: null point outside, beyond the smaller one</text>` +
    `<line x1="40" y1="185" x2="620" y2="185" stroke="#aab" stroke-width="2" stroke-dasharray="4 6"/>` +
    charge(100, 185, "+", 16, "+4 µC") + charge(340, 185, "−", 16, "−1 µC") +
    `<circle cx="580" cy="185" r="7" fill="${DIM}"/><text x="580" y="165" text-anchor="middle" font-size="14" fill="${DIM}">F = 0</text>`,
);

const figBalls = svg(
  420,
  260,
  `<line x1="160" y1="20" x2="260" y2="20" stroke="${INK}" stroke-width="3"/>` +
    `<line x1="210" y1="20" x2="140" y2="180" stroke="${INK}" stroke-width="2"/><line x1="210" y1="20" x2="280" y2="180" stroke="${INK}" stroke-width="2"/>` +
    `<line x1="210" y1="20" x2="210" y2="200" stroke="#aab" stroke-width="1.5" stroke-dasharray="4 5"/>` +
    `<text x="222" y="75" font-size="16" fill="${INK}">θ</text>` +
    charge(140, 180, "+", 14) + charge(280, 180, "+", 14) +
    arrow(280, 180, 345, 180, FORCE, "F") + arrow(280, 180, 280, 245, FORCE, "mg") + arrow(280, 180, 250, 112, FORCE, "T"),
);

// ---------- numbers ----------

const n = {
  e1: sig3(Math.abs(ex1())),
  e2: sig3(Math.abs(ex2())),
  e3: ex3().toExponential(0).replace("e+", " \\times 10^{") + "}",
  e4: (ex4() / 1e39).toFixed(2),
  e5: ex5(),
  e6: ex6(),
  e7: ex7(),
  e8a: sig3(ex8a() * 100),
  e8b: ex8b(),
  e9: ex9(),
  e10: ex10(),
  e10b: sig3(ex10b()),
  e11: ex11(),
};

// Practice questions: answers computed here.
const practice = [
  {
    q: "Two charges of $+5\\ \\mu\\text{C}$ each are $50$ cm apart in air. Find the force between them and say whether it attracts or repels.",
    a: `$${sig3(coulombForce(K_JEE, 5e-6, 5e-6, 0.5))}$ N, repulsive.`,
  },
  { q: "How many electrons must be removed from a neutral body to give it a charge of $+1.6\\ \\mu\\text{C}$?", a: "$10^{13}$ electrons." },
  { q: "If the distance between two charges is halved, what happens to the force?", a: "It becomes $4$ times as large." },
  {
    q: "Charges $+1\\ \\mu\\text{C}$ and $+9\\ \\mu\\text{C}$ are $40$ cm apart. Where between them is the net force on a test charge zero?",
    a: `$${sig3(nullPointBetween(1e-6, 9e-6, 0.4) * 100)}$ cm from the $1\\ \\mu\\text{C}$ charge.`,
  },
  {
    q: "Identical spheres carry $+6\\ \\mu\\text{C}$ and $-2\\ \\mu\\text{C}$. They touch and go back to the same distance. Find each new charge and the ratio $F_{\\text{after}} / F_{\\text{before}}$.",
    a: "$+2\\ \\mu\\text{C}$ each; ratio $\\dfrac{2 \\times 2}{6 \\times 2} = \\dfrac{1}{3}$ (and it changes from attraction to repulsion).",
  },
  {
    q: "Three charges of $+2\\ \\mu\\text{C}$ sit on the corners of an equilateral triangle of side $20$ cm. Find the net force on any one of them.",
    a: `$\\sqrt3\\,\\dfrac{kq^2}{a^2} = ${sig3(Math.sqrt(3) * coulombForce(K_JEE, 2e-6, 2e-6, 0.2))}$ N, pointing away from the centre of the triangle.`,
  },
  { q: "Two charges are moved from air into water ($K = 80$) at the same distance. What happens to the force?", a: "It becomes $\\tfrac{1}{80}$ of the force in air." },
  { q: "A charge $Q$ is split into two parts, $q$ and $Q - q$. For what $q$ is the force between the parts largest?", a: "$q = \\dfrac{Q}{2}$." },
];

// ---------- the notes ----------

const body = [
  section(
    "What is electric charge?",
    p("Rub a plastic comb on dry hair and it starts picking up bits of paper. Something has changed on the comb. We say it has become **charged**. Electric charge is a basic property of matter, just like mass. Some particles have it, some don't, and it is what makes electric forces happen.") +
      p("There are exactly **two kinds** of charge. Benjamin Franklin named them **positive (+)** and **negative (−)**. The names are just labels. What matters is how they behave:") +
      fig(figLikeUnlike, "The one rule that never changes: like charges repel, unlike charges attract.") +
      box("key", "Remember", ul(["Like charges **repel**. Unlike charges **attract**.", "The SI unit of charge is the **coulomb (C)**.", "In everyday problems, charges are usually tiny: $1\\ \\mu\\text{C} = 10^{-6}$ C and $1\\ \\text{nC} = 10^{-9}$ C."])) +
      sub("Where does charge come from?") +
      p("Every atom has a small heavy nucleus (protons and neutrons) with electrons around it. Protons carry positive charge, electrons carry an equal amount of negative charge, and neutrons carry none.") +
      table(
        ["Particle", "Charge", "Mass"],
        [
          ["Electron", "$-e = -1.6 \\times 10^{-19}$ C", "$9.1 \\times 10^{-31}$ kg"],
          ["Proton", "$+e = +1.6 \\times 10^{-19}$ C", "$1.67 \\times 10^{-27}$ kg"],
          ["Neutron", "$0$", "$1.67 \\times 10^{-27}$ kg"],
        ],
      ) +
      p("A neutral atom has as many electrons as protons, so the charges cancel. A body becomes **negatively charged** when it gains extra electrons, and **positively charged** when it loses some. Only electrons move around in everyday charging. The protons stay locked in the nucleus.") +
      box("warn", "Common slip", p("A positively charged body has **lost electrons**. It has not gained protons.")),
  ),
  section(
    "Properties of electric charge",
    sub("1. Charge is additive (it's a scalar)") +
      p("The total charge of a system is just the algebraic sum of all the charges in it, with their signs. For example, charges $+3$ C, $-5$ C and $+1$ C add up to $-1$ C. Charge has no direction, so it is a **scalar**.") +
      sub("2. Charge is quantised") +
      p("Charge always comes in whole-number multiples of the smallest charge, $e$. You can't have half an electron's charge on a body.") +
      box("formula", "Quantisation of charge", `$$q = \\pm\\, n e, \\qquad n = 1, 2, 3, \\dots, \\qquad e = 1.6 \\times 10^{-19}\\ \\text{C}$$`) +
      example(
        "Counting electrons",
        "A body has a charge of $-3.2\\ \\mu\\text{C}$. How many extra electrons does it carry?",
        [
          "Use $q = ne$, so $n = \\dfrac{q}{e}$ (we take the size of $q$; the minus sign just tells us the extra particles are electrons).",
          "$n = \\dfrac{3.2 \\times 10^{-6}}{1.6 \\times 10^{-19}}$.",
          "Divide the numbers and the powers separately: $\\dfrac{3.2}{1.6} = 2$ and $\\dfrac{10^{-6}}{10^{-19}} = 10^{13}$.",
        ],
        `$n = ${n.e3}$ extra electrons.`,
      ) +
      p("Because $e$ is so small, quantisation is invisible in everyday life. A charge of just $1\\ \\mu\\text{C}$ is already about $6 \\times 10^{12}$ electrons, so charge looks continuous.") +
      sub("3. Charge is conserved") +
      p("Charge can't be created or destroyed. It can only move from one body to another. When you rub glass with silk, the glass loses exactly as many electrons as the silk gains. The total charge of an isolated system never changes.") +
      sub("4. Charge is invariant") +
      p("The charge on a particle is the same no matter how fast it moves. (Mass, by contrast, changes at speeds close to light.)") +
      box(
        "tip",
        "Charge vs mass, side by side",
        table(
          ["Charge", "Mass"],
          [
            ["Can be positive, negative or zero", "Always positive"],
            ["Quantised: always a multiple of $e$", "Not quantised in this sense"],
            ["Same at any speed", "Changes at very high speeds"],
            ["Like charges repel, unlike attract", "Masses always attract"],
          ],
        ),
      ),
  ),
  section(
    "Conductors, insulators and earthing",
    ul([
      "**Conductors** let charge move through them easily, because some electrons are free to wander. Metals, the human body and the Earth are conductors.",
      "**Insulators** hold charge where it is put. Their electrons are tightly bound. Glass, plastic, rubber, dry wood and silk are insulators.",
      "**Earthing (grounding)** means connecting a conductor to the Earth. The Earth is so big that it can give or take any amount of charge, so an earthed conductor shares away its extra charge.",
    ]) + box("key", "Why it matters", p("Charge given to a conductor spreads out over its outer surface. Charge given to an insulator stays at the spot where it was placed.")),
  ),
  section(
    "Three ways to charge a body",
    sub("1. By friction (rubbing)") +
      p("Rubbing two different materials moves electrons from one to the other. Both end up with **equal and opposite** charges.") +
      table(
        ["Rub this…", "…with this", "Result"],
        [
          ["Glass rod", "Silk", "Glass $+$, silk $-$"],
          ["Ebonite (or plastic) rod", "Fur or wool", "Ebonite $-$, fur $+$"],
        ],
      ) +
      sub("2. By conduction (touching)") +
      p("Touch a charged body to a neutral conductor and some charge flows across. The neutral body ends up with the **same sign** of charge, and the first body loses some of its charge.") +
      sub("3. By induction (without touching)") +
      p("This is the clever one. You charge a conductor without ever touching it with the charged object:") +
      fig(figInduction, "Charging a sphere negatively by induction with a positive rod.") +
      ol([
        "Bring a positive rod near a neutral metal sphere. The sphere's free electrons are pulled towards the rod, so the near side becomes negative and the far side positive.",
        "Earth the sphere. Electrons flow up from the Earth and cancel the positive charge on the far side.",
        "Remove the earth connection **first**, then take the rod away.",
        "The extra electrons spread over the whole sphere. It is now negatively charged.",
      ]) +
      box("key", "Induction in one line", p("Induction always gives the body the **opposite** sign to the charge that induced it, and the inducing body loses nothing.")) +
      box("warn", "Order matters", p("If you take the rod away **before** removing the earth, the electrons simply flow back to the Earth and the sphere ends up neutral.")),
  ),
  section(
    "Coulomb's law",
    p("In 1785 Charles-Augustin de Coulomb measured the force between charged bodies with a torsion balance. He found a simple rule:") +
      box(
        "key",
        "Coulomb's law in words",
        p("The force between two point charges is **directly proportional to the product of the charges** and **inversely proportional to the square of the distance** between them. It acts along the line joining them."),
      ) +
      fig(figCoulomb, "Two point charges a distance $r$ apart. Each pushes the other with the same size of force.") +
      box(
        "formula",
        "Coulomb's law",
        `$$F = k\\,\\frac{q_1 q_2}{r^2}, \\qquad k = \\frac{1}{4\\pi\\varepsilon_0} = 9 \\times 10^{9}\\ \\text{N m}^2\\text{/C}^2$$` +
          p("$\\varepsilon_0 = 8.85 \\times 10^{-12}\\ \\text{C}^2\\text{/(N m}^2)$ is the **permittivity of free space**. (More precisely $k = 8.99 \\times 10^9$; JEE uses $9 \\times 10^9$.)"),
      ) +
      sub("Reading the formula") +
      ul([
        "**Product of charges.** Double one charge and the force doubles. Double both and it becomes four times as big.",
        "**Inverse square.** Double the distance and the force drops to **one quarter**, not one half. Halve the distance and it becomes four times as big.",
        "**Sign tells the type.** Put the charges in with their signs: a positive answer means repulsion, a negative answer means attraction. (For the size of the force, use the magnitudes.)",
      ]) +
      sub("When does it apply?") +
      ul([
        "To **point charges**, meaning bodies much smaller than the distance between them.",
        "To charges **at rest** (that's why this topic is called electro**statics**).",
      ]) +
      sub("Vector form") +
      p("Forces have direction, so we can write the law as a vector. Let $\\vec r_{12}$ be the vector from $q_1$ to $q_2$, with unit vector $\\hat r_{12}$. The force on $q_2$ due to $q_1$ is") +
      box("formula", "Vector form", `$$\\vec F_{21} = k\\,\\frac{q_1 q_2}{r^2}\\,\\hat r_{12} = k\\,\\frac{q_1 q_2}{r^3}\\,\\vec r_{12}$$` + p("If $q_1 q_2 > 0$ the force on $q_2$ points away from $q_1$ (repulsion); if $q_1 q_2 < 0$ it points towards $q_1$ (attraction). And $\\vec F_{12} = -\\vec F_{21}$.")) +
      example(
        "Force between two charges",
        "Find the force between $+3\\ \\mu\\text{C}$ and $-2\\ \\mu\\text{C}$ placed $30$ cm apart in vacuum.",
        [
          "Convert to SI: $q_1 = 3 \\times 10^{-6}$ C, $q_2 = 2 \\times 10^{-6}$ C (size), $r = 0.3$ m.",
          "$F = k\\,\\dfrac{q_1 q_2}{r^2} = \\dfrac{(9\\times10^{9})(3\\times10^{-6})(2\\times10^{-6})}{(0.3)^2}$.",
          "Top: $9 \\times 3 \\times 2 = 54$ and $10^{9} \\times 10^{-6} \\times 10^{-6} = 10^{-3}$, so $54 \\times 10^{-3}$. Bottom: $0.09$.",
          "$F = \\dfrac{54 \\times 10^{-3}}{0.09} = 0.6$ N.",
          "The charges have opposite signs, so the force is attractive.",
        ],
        `$F = ${n.e1}$ N, attractive.`,
      ),
  ),
  section(
    "Coulomb's law in a medium",
    p("Put the same two charges inside oil or water instead of vacuum, and the force between them becomes weaker. The material partly shields the charges from each other. How much weaker is measured by its **dielectric constant** $K$ (also written $\\varepsilon_r$, the relative permittivity).") +
      box("formula", "Force in a medium", `$$F_{\\text{medium}} = \\frac{1}{4\\pi\\varepsilon_0 K}\\,\\frac{q_1 q_2}{r^2} = \\frac{F_{\\text{vacuum}}}{K}, \\qquad \\varepsilon = K\\varepsilon_0$$`) +
      table(["Medium", "Dielectric constant $K$"], [["Vacuum", "$1$ (by definition)"], ["Air", "$\\approx 1$ (1.0006)"], ["Water", "$\\approx 80$"], ["Metal (conductor)", "$\\infty$ (no field inside)"]]) +
      example(
        "Same charges, now in a liquid",
        "The two charges of the last example are placed, at the same distance, in a liquid with $K = 4$. Find the new force.",
        ["In a medium the force is divided by $K$: $F' = \\dfrac{F}{K}$.", "$F' = \\dfrac{0.6}{4}$."],
        `$F' = ${n.e2}$ N, still attractive.`,
      ),
  ),
  section(
    "Electric force vs gravitational force",
    p("Both forces follow an inverse-square law, but they are wildly different in strength.") +
      table(
        ["Electric force", "Gravitational force"],
        [
          ["$F = k\\dfrac{q_1q_2}{r^2}$", "$F = G\\dfrac{m_1m_2}{r^2}$"],
          ["Can attract or repel", "Only attracts"],
          ["Depends on the medium", "Does not depend on the medium"],
          ["Very strong", "Very weak"],
        ],
      ) +
      example(
        "How much stronger?",
        "Compare the electric and gravitational forces between an electron and a proton. Take $G = 6.67\\times10^{-11}$, $m_e = 9.1\\times10^{-31}$ kg, $m_p = 1.67\\times10^{-27}$ kg.",
        [
          "Both forces have $r^2$ in the bottom, so in the ratio the distance cancels: $\\dfrac{F_e}{F_g} = \\dfrac{k e^2}{G m_e m_p}$.",
          "Top: $(9\\times10^9)(1.6\\times10^{-19})^2 = 2.304 \\times 10^{-28}$.",
          "Bottom: $(6.67\\times10^{-11})(9.1\\times10^{-31})(1.67\\times10^{-27}) \\approx 1.014 \\times 10^{-67}$.",
          "Divide: $\\dfrac{2.304\\times10^{-28}}{1.014\\times10^{-67}}$.",
        ],
        `$\\dfrac{F_e}{F_g} \\approx ${n.e4} \\times 10^{39}$. The electric force wins by about $10^{39}$!`,
      ) +
      box("tip", "So why does gravity rule the sky?", p("Big bodies are almost exactly neutral, so their electric forces cancel out. Gravity never cancels, because mass is always positive.")),
  ),
  section(
    "Newton's third law and the superposition principle",
    p("The force $q_1$ puts on $q_2$ is always equal and opposite to the force $q_2$ puts on $q_1$, **even if the charges are different sizes**. Both use the same product $q_1q_2$ in Coulomb's law.") +
      box(
        "key",
        "Superposition principle",
        p("When many charges act on one charge, each pair interacts **as if the others were not there**. The net force is the **vector sum** of the separate forces:") +
          `$$\\vec F_{\\text{net}} = \\vec F_1 + \\vec F_2 + \\vec F_3 + \\dots$$`,
      ) +
      p("**How to use it, every time:** (1) find the size of each force with Coulomb's law; (2) draw its direction (away for like charges, towards for unlike); (3) add the arrows as vectors.") +
      fig(figLine, "Forces on B from A and from C.") +
      example(
        "Charges on a line",
        "$A = +2\\ \\mu\\text{C}$ at $x = 0$, $B = -1\\ \\mu\\text{C}$ at $x = 10$ cm, $C = +4\\ \\mu\\text{C}$ at $x = 30$ cm. Find the net force on $B$.",
        [
          `Force from A: $\\dfrac{(9\\times10^9)(2\\times10^{-6})(1\\times10^{-6})}{(0.1)^2} = ${sig3(Math.abs(n.e6.fromA))}$ N. A and B are unlike, so it pulls B **towards A** (left).`,
          `Force from C: $\\dfrac{(9\\times10^9)(4\\times10^{-6})(1\\times10^{-6})}{(0.2)^2} = ${sig3(n.e6.fromC)}$ N. Unlike again, so it pulls B **towards C** (right).`,
          "They act along the same line in opposite directions, so subtract: $1.8 - 0.9$.",
        ],
        `$${sig3(Math.abs(n.e6.net))}$ N, towards A.`,
      ) +
      fig(figSquare, "Four equal charges on a square: forces on the bottom-right corner.") +
      example(
        "Four charges on a square",
        "Equal charges $q = 1\\ \\mu\\text{C}$ sit on the corners of a square of side $a = 10$ cm. Find the net force on any one charge.",
        [
          `The two neighbours are a distance $a$ away. Each pushes with $F_1 = \\dfrac{kq^2}{a^2} = ${sig3(n.e7.unit)}$ N, at right angles to each other.`,
          "Two equal forces at $90^\\circ$ add to $\\sqrt2\\,F_1$, pointing along the diagonal.",
          "The opposite corner is $\\sqrt2\\,a$ away. Its push is $\\dfrac{kq^2}{(\\sqrt2 a)^2} = \\dfrac{F_1}{2}$, also along the diagonal.",
          "Everything now lies along the diagonal, so just add: $F = \\sqrt2\\,F_1 + \\tfrac12 F_1 = \\left(\\sqrt2 + \\tfrac12\\right)\\dfrac{kq^2}{a^2}$.",
        ],
        `$F = \\left(\\sqrt2 + \\tfrac12\\right)(${sig3(n.e7.unit)}) \\approx ${sig3(n.e7.magnitude)}$ N, along the diagonal, away from the centre.`,
      ) +
      box("tip", "Handy result", p("Three equal charges $q$ on an equilateral triangle of side $a$: net force on each is $\\sqrt3\\,\\dfrac{kq^2}{a^2}$, pointing away from the centre.")),
  ),
  section(
    "Where is the net force zero? (Equilibrium)",
    p("A very common JEE question: two fixed charges, and you must find where a third charge would feel **no net force**. This point is called the **null point**.") +
      fig(figNull, "Where the null point lies, for like and unlike charges.") +
      box(
        "key",
        "Where to look",
        ul([
          "**Like charges** (both + or both −): the null point is **between** them, closer to the **smaller** charge.",
          "**Unlike charges**: the null point is **outside**, on the side of the **smaller** charge (beyond it).",
          "The size and sign of the test charge **don't matter**. It cancels out of the equation.",
        ]),
      ) +
      example(
        "Like charges",
        "$+2\\ \\mu\\text{C}$ and $+8\\ \\mu\\text{C}$ are $30$ cm apart. Where between them is the net force on a test charge zero?",
        [
          "Let the point be $x$ cm from the $2\\ \\mu\\text{C}$ charge, so $(30 - x)$ cm from the $8\\ \\mu\\text{C}$ charge.",
          "For zero net force the two pushes must be equal: $\\dfrac{k\\,(2)\\,q}{x^2} = \\dfrac{k\\,(8)\\,q}{(30-x)^2}$. Cancel $k$ and $q$.",
          "Take square roots: $\\dfrac{\\sqrt2}{x} = \\dfrac{\\sqrt8}{30 - x}$, and $\\sqrt8 = 2\\sqrt2$, so $30 - x = 2x$.",
          "$3x = 30$, so $x = 10$ cm.",
        ],
        `$${n.e8a}$ cm from the $+2\\ \\mu\\text{C}$ charge.`,
      ) +
      example(
        "Unlike charges",
        "$+4\\ \\mu\\text{C}$ and $-1\\ \\mu\\text{C}$ are $30$ cm apart. Where is the null point?",
        [
          "Between them both forces on a test charge point the same way, so they can't cancel there. It must be outside, beyond the **smaller** charge ($-1\\ \\mu\\text{C}$).",
          "Let it be $x$ cm beyond the $-1\\ \\mu\\text{C}$ charge, so $(30 + x)$ cm from the $+4\\ \\mu\\text{C}$ charge.",
          "$\\dfrac{4}{(30+x)^2} = \\dfrac{1}{x^2}$. Square roots: $\\dfrac{2}{30 + x} = \\dfrac{1}{x}$, so $2x = 30 + x$.",
        ],
        `$x = ${sig3(n.e8b.x * 100)}$ cm beyond the $-1\\ \\mu\\text{C}$ charge (that is, $60$ cm from the $+4\\ \\mu\\text{C}$ charge).`,
      ) +
      sub("Putting all three charges in equilibrium") +
      example(
        "A third charge that balances everything",
        "Charges $q$ and $4q$ are a distance $d$ apart. What charge $Q$, placed where, makes **all three** charges stay in equilibrium?",
        [
          "For $Q$ itself: like the example above, $Q$ must sit between them at $\\dfrac{d}{3}$ from $q$ (here $\\sqrt{q} : \\sqrt{4q} = 1 : 2$).",
          "For $q$: the push from $4q$ (repulsion, size $\\dfrac{k\\,4q^2}{d^2}$) must be cancelled by a pull from $Q$, so $Q$ must be **negative**.",
          "Balance on $q$: $\\dfrac{k\\,q\\,|Q|}{(d/3)^2} = \\dfrac{k\\,q\\,(4q)}{d^2}$, so $9|Q| = 4q$, giving $|Q| = \\dfrac{4q}{9}$.",
          "Check on $4q$: pull from $Q$ is $\\dfrac{k(4q)(4q/9)}{(2d/3)^2} = \\dfrac{4kq^2}{d^2}$, which equals the push from $q$. Balanced.",
        ],
        "$Q = -\\dfrac{4q}{9}$, placed at $\\dfrac{d}{3}$ from $q$.",
      ) +
      box("tip", "Stable or unstable?", p("A positive test charge at the null point between two positive charges is **stable** if you nudge it along the line (it gets pushed back), but **unstable** if you nudge it sideways.")),
  ),
  section(
    "Touching identical spheres (sharing charge)",
    p("When two **identical** conducting spheres touch, the total charge is shared **equally** between them. Then they are moved apart again.") +
      box("formula", "Sharing between identical spheres", `$$q_{\\text{each}} = \\frac{q_1 + q_2}{2}\\quad(\\text{add with signs!})$$`) +
      example(
        "Force before and after touching",
        "Two identical spheres have $+8\\ \\mu\\text{C}$ and $-2\\ \\mu\\text{C}$. They touch and are put back at the same distance. Compare the forces.",
        [
          `After touching, each has $\\dfrac{8 + (-2)}{2} = +${n.e5.shared}\\ \\mu\\text{C}$.`,
          "Before: $F \\propto 8 \\times 2 = 16$ (attractive, opposite signs).",
          "After: $F' \\propto 3 \\times 3 = 9$ (repulsive, same signs).",
        ],
        "$\\dfrac{F'}{F} = \\dfrac{9}{16}$, and the force changes from **attraction** to **repulsion**.",
      ),
  ),
  section(
    "Hanging charged balls",
    p("Two small identical balls, each with charge $q$ and mass $m$, hang from the same point on threads. They repel and settle with each thread at an angle $\\theta$ to the vertical.") +
      fig(figBalls, "Forces on one ball: tension $T$ along the thread, weight $mg$ down, electric force $F$ sideways.") +
      ol([
        "Three forces act on each ball: tension $T$ (along the thread), weight $mg$ (down), and the electric push $F$ (horizontal, away from the other ball).",
        "The ball is at rest, so the forces balance. Vertically: $T\\cos\\theta = mg$.",
        "Horizontally: $T\\sin\\theta = F$.",
        "Divide the two equations: $T$ cancels.",
      ]) +
      box("formula", "Equilibrium of a hanging charged ball", `$$\\tan\\theta = \\frac{F}{mg} = \\frac{kq^2}{r^2\\,mg}$$`) +
      example(
        "Finding the angle",
        "Each ball has mass $0.9$ g and charge $0.1\\ \\mu\\text{C}$. They settle $10$ cm apart. Find $\\theta$ ($g = 10$ m/s²).",
        [
          `$F = \\dfrac{(9\\times10^9)(10^{-7})^2}{(0.1)^2} = ${sig3(n.e10.F * 1000)} \\times 10^{-3}$ N.`,
          `$mg = (0.9\\times10^{-3})(10) = ${sig3(n.e10.weight * 1000)} \\times 10^{-3}$ N.`,
          `$\\tan\\theta = \\dfrac{F}{mg} = ${sig3(n.e10.tanTheta)}$.`,
        ],
        `$\\theta = ${sig3(n.e10.thetaDeg)}^\\circ$.`,
      ) +
      sub("Dipping them in a liquid") +
      p("In a liquid of density $\\sigma$ and dielectric constant $K$, two things change: the electric force drops to $F/K$, and buoyancy reduces the weight to $mg\\,(1 - \\sigma/\\rho)$, where $\\rho$ is the density of the balls. The angle stays the same if both shrink by the same factor:") +
      box("formula", "Same angle in a liquid", `$$K = \\frac{\\rho}{\\rho - \\sigma}$$`) +
      p(`For example, balls of density $1600$ kg/m³ in a liquid of density $800$ kg/m³ keep the same angle when $K = ${n.e10b}$.`),
  ),
  section(
    "When is the force largest?",
    example(
      "Splitting a charge",
      "A charge $Q$ is split into two parts, $q$ and $Q - q$, placed a fixed distance apart. For what $q$ is the repulsion largest?",
      [
        "$F = k\\,\\dfrac{q(Q - q)}{r^2}$. Only the product $q(Q - q)$ changes.",
        "For the largest value, set the derivative to zero: $\\dfrac{d}{dq}\\big[q(Q - q)\\big] = Q - 2q = 0$.",
        "So $q = \\dfrac{Q}{2}$. (The second derivative is $-2 < 0$, so it's a maximum.)",
      ],
      `$q = \\dfrac{Q}{2}$: split the charge equally. (A numerical check gives $${n.e11.toFixed(3)}\\,Q$.)`,
    ),
  ),
  section(
    "Common mistakes to avoid",
    ul([
      "**Forgetting to convert units.** $\\mu\\text{C}$ to C ($\\times 10^{-6}$) and cm to m ($\\times 10^{-2}$) before using $k = 9 \\times 10^9$.",
      "**Forgetting to square $r$.** The force goes as $1/r^2$, not $1/r$.",
      "**Adding forces as plain numbers.** Forces are vectors. Add them as arrows, unless they lie on one line.",
      "**Thinking a bigger charge feels a bigger force.** In a pair, both charges feel the same size of force.",
      "**Searching for the null point on the wrong side.** Like charges: between them. Unlike charges: outside, beyond the smaller one.",
      "**Sharing charge without signs.** $+8$ and $-2$ share to $+3$ each, not $+5$.",
      "**Using the medium wrongly.** In a medium the force is $F/K$, smaller than in vacuum.",
    ]),
  ),
  section(
    "Formula sheet",
    table(
      ["Idea", "Formula"],
      [
        ["Quantisation", "$q = ne,\\ e = 1.6\\times10^{-19}$ C"],
        ["Coulomb's law", "$F = k\\dfrac{q_1q_2}{r^2},\\ k = \\dfrac{1}{4\\pi\\varepsilon_0} = 9\\times10^9$"],
        ["Permittivity of free space", "$\\varepsilon_0 = 8.85\\times10^{-12}\\ \\text{C}^2/\\text{N m}^2$"],
        ["Vector form", "$\\vec F_{21} = k\\dfrac{q_1q_2}{r^3}\\vec r_{12}$"],
        ["In a medium", "$F_m = \\dfrac{F_0}{K}$"],
        ["Superposition", "$\\vec F_{\\text{net}} = \\sum \\vec F_i$"],
        ["Null point (like charges)", "$x = \\dfrac{d\\sqrt{q_1}}{\\sqrt{q_1} + \\sqrt{q_2}}$ from $q_1$"],
        ["Identical spheres touching", "$q_{\\text{each}} = \\dfrac{q_1 + q_2}{2}$"],
        ["Hanging balls", "$\\tan\\theta = \\dfrac{F}{mg}$"],
        ["Same angle in a liquid", "$K = \\dfrac{\\rho}{\\rho - \\sigma}$"],
        ["Square of equal charges", "$F = \\left(\\sqrt2 + \\tfrac12\\right)\\dfrac{kq^2}{a^2}$"],
        ["Equilateral triangle", "$F = \\sqrt3\\,\\dfrac{kq^2}{a^2}$"],
      ],
    ),
  ),
  section(
    "Practice questions",
    p("Try each one before you look at the answers on the next page.") + ol(practice.map((x) => x.q)),
  ),
  section("Answers", ol(practice.map((x) => x.a))),
].join("\n");

const katexCss = pathToFileURL(path.join(root, "node_modules", "katex", "dist", "katex.min.css")).href;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Electric Charges and Coulomb's Law: Notes</title>
<link rel="stylesheet" href="${katexCss}">
<style>
  @page { size: A4; margin: 16mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1d2a33; font-size: 11pt; line-height: 1.55; margin: 0; }
  .cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .cover .tag { color: #b07d12; font-weight: 700; letter-spacing: .12em; font-size: 10pt; }
  .cover h1 { font-size: 34pt; line-height: 1.1; margin: 8mm 0 4mm; }
  .cover .sub { font-size: 14pt; color: #4a5a66; }
  .cover .meta { margin-top: 14mm; font-size: 10.5pt; color: #4a5a66; border-left: 3px solid #b07d12; padding-left: 4mm; }
  .toc { page-break-after: always; }
  .toc h2 { font-size: 18pt; }
  .toc ol { columns: 1; font-size: 12pt; line-height: 2; }
  section { margin-bottom: 6mm; }
  section.new-page { page-break-before: always; }
  h2 { font-size: 17pt; margin: 0 0 3mm; padding-bottom: 2mm; border-bottom: 2px solid #1d2a33; break-after: avoid; }
  h2 .num { display: inline-block; min-width: 9mm; color: #b07d12; }
  h3 { font-size: 12.5pt; margin: 5mm 0 2mm; break-after: avoid; }
  p { margin: 0 0 2.5mm; }
  ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
  li { margin-bottom: 1.5mm; }
  .box { border-radius: 2.5mm; padding: 3mm 4mm; margin: 3mm 0 4mm; break-inside: avoid; }
  .box-title { font-weight: 700; margin-bottom: 1.5mm; }
  .box.key { background: #fff7e6; border-left: 4px solid #b07d12; }
  .box.formula { background: #eef5fb; border-left: 4px solid #1f6fb2; }
  .box.warn { background: #fdeeee; border-left: 4px solid #c0392b; }
  .box.tip { background: #eef8f2; border-left: 4px solid #2e8b57; }
  .example { border: 1.5px solid #c9d3da; border-radius: 2.5mm; padding: 3mm 4mm; margin: 3mm 0 5mm; break-inside: avoid; }
  .ex-head { font-weight: 700; color: #1f6fb2; margin-bottom: 1.5mm; }
  .ex-q { margin-bottom: 2mm; }
  .ex-label { font-size: 9.5pt; text-transform: uppercase; letter-spacing: .08em; color: #6b7a86; margin-bottom: 1mm; }
  .ex-ans { background: #f4f6f8; border-radius: 1.5mm; padding: 2mm 3mm; }
  table { border-collapse: collapse; width: 100%; margin: 2mm 0 4mm; break-inside: avoid; font-size: 10.5pt; }
  th, td { border: 1px solid #c9d3da; padding: 1.8mm 2.5mm; text-align: left; vertical-align: middle; }
  th { background: #f0f3f5; }
  figure { margin: 3mm 0 4mm; text-align: center; break-inside: avoid; }
  figure svg { max-width: 100%; height: auto; }
  figcaption { font-size: 9.5pt; color: #6b7a86; margin-top: 1mm; }
  .katex-display { margin: 2mm 0; }
</style></head>
<body>
  <div class="cover">
    <div class="tag">CLASS 12 · JEE MAIN &amp; ADVANCED · PHYSICS</div>
    <h1>Electric Charges and<br>Coulomb's Law</h1>
    <div class="sub">Detailed notes, step by step, with worked examples</div>
    <div class="meta">
      Prepared by Adithya Vikram<br>
      Written to go with the class “Electrostatic Charges &amp; Coulomb's Force” (Vedantu JEE English, YouTube).<br>
      These are original notes on the same topics, not a transcript of the class.<br>
      Every worked answer is checked by code.
    </div>
  </div>
  <div class="toc"><h2>Contents</h2><ol>${toc.map((t) => `<li>${md(t.replace(/^\d+\.\s*/, ""))}</li>`).join("")}</ol>
    ${box("tip", "How to use these notes", ul(["Read a section, then cover the worked example and try it yourself.", "Grey boxes in examples are the final answers. Coloured boxes: **orange** = key idea, **blue** = formula, **red** = common mistake, **green** = tip.", "Finish with the practice questions. Answers are on the last page."]))}
  </div>
  ${body}
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, `${base}.html`);
fs.writeFileSync(htmlPath, html);

const chrome = path.join(root, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!fs.existsSync(chrome)) throw new Error("Headless Chrome not found. Render any video once (npm run render:short -- projectile --frames=0) to download it.");
const pdfPath = path.join(outDir, `${base}.pdf`);
const result = spawnSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf-no-header", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: "inherit" });
if (result.status !== 0 || !fs.existsSync(pdfPath)) throw new Error("Printing to PDF failed.");
console.log(`Notes → ${path.relative(root, pdfPath)}`);
