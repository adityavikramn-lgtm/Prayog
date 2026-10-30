// A short portfolio PDF for the application: what's in the Drive folder, and which AI tools were used and how.
//   npm run portfolio
// The test count is read from src/generated/stats.json (run `npm run stats` first).
// Output: notes/portfolio-adithya-vikram.html and .pdf

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import stats from "../src/generated/stats.json";

const root = process.cwd();
const outDir = path.join(root, "notes");
const base = "portfolio-adithya-vikram";
const DRIVE = "https://drive.google.com/drive/folders/10NAg8tTV5YEnMx2jsSIvik3hg6fnfYNA";

const BLUE = "#2f6fe4";
const GREEN = "#1f9d6b";
const ORANGE = "#f08a24";
const INK = "#1d2340";

const item = (title: string, kind: string, desc: string, where: string) =>
  `<div class="item"><div class="kind">${kind}</div><div class="t">${title}</div><div class="d">${desc}</div><div class="w">📁 ${where}</div></div>`;

const page1 = `
<header>
  <div class="kicker">CONTENT PORTFOLIO</div>
  <h1>Adithya Vikram</h1>
  <div class="sub">AI-assisted science &amp; maths content · Class 6–8 and Class 11–12 physics</div>
  <a class="drive" href="${DRIVE}">${DRIVE}</a>
</header>

<h2 style="--c:${GREEN}">Class 6–8 samples <span class="tag">made for this role</span></h2>
<div class="grid">
  ${item(
    "Why does a sharp knife cut? Pressure = force ÷ area",
    "VIDEO · SCIENCE · CLASS 8",
    "An animated lesson (about 2 min): a puzzle hook, a brick drawn to scale, the rule, worked numbers, a knife and school-bag example, a pause-and-try question and a recap. Every size and number is calculated by code.",
    "0. Class 6–8 samples (folder)",
  )}
  ${item(
    "Fractions: notes, worksheet and answer key",
    "PDF · MATHS · CLASS 6–7",
    "Two pages of picture-based notes, a 14-question worksheet in 5 sections (from easy to word problems) and a full answer key with working. All answers are computed and double-checked by code.",
    "0. Class 6–8 samples (folder)",
  )}
</div>

<h2 style="--c:${BLUE}">Higher classes: physics</h2>
<div class="grid">
  ${item("Start Here: how I can help (2:36)", "VIDEO · OVERVIEW", "How I combine AI and code to make checked content, with real examples. Voiced in my own (AI-cloned) voice.", "1. Start Here")}
  ${item("Work done on a rough dome: full lesson (10 min)", "VIDEO · JEE", "A hard JEE question, explained step by step from zero: forces, splitting the weight, the integral, a second check with energy, and the common traps. In my own (AI-cloned) voice.", "3. Problem Solving")}
  ${item("Short: AI + Physics, checked by code", "VIDEO · 9:16", "A 44-second motion-graphics Short for YouTube and Reels, in my own (AI-cloned) voice.", "5. Short")}
  ${item("Electric charge &amp; Coulomb's law class notes", "PDF · CLASS 12", "Clear class notes with diagrams and solved questions.", "4. Class Notes")}
</div>
`;

const page2 = `
<h2 style="--c:${ORANGE}">AI tools I used, and how</h2>
<table>
  <tr><th>Tool</th><th>What I use it for</th></tr>
  <tr><td><b>Claude</b> (Anthropic), an AI assistant</td><td>Drafting scripts, captions and explanations, and writing the animation and checking code. I decide the topic, the teaching order and the examples, and I review every script and frame.</td></tr>
  <tr><td><b>Code that checks the maths</b></td><td>Every number is calculated by code, never typed in by hand or taken from AI text. Each answer is checked a second, independent way (for example a simulation, or a different unit route). Right now <b>${stats.testsPassed} of ${stats.testsTotal}</b> automatic checks pass.</td></tr>
  <tr><td><b>Remotion</b> (video made with code)</td><td>Animations where every frame comes from the equations, so motion and sizes are physically correct. One scene can come out as a 16:9 lesson, a 9:16 Short, or in another language.</td></tr>
  <tr><td><b>KaTeX</b></td><td>Clean, correct maths formulas on screen and in PDFs.</td></tr>
  <tr><td><b>Text-to-speech</b></td><td>Every video is voiced by an AI copy of <b>my own voice</b>, made with Chatterbox (free, open source, runs on my laptop) from a short recording of me, then cleaned of background noise and levelled. A check re-records any line that comes out rushed.</td></tr>
</table>

<h2 style="--c:${GREEN}">My rule: AI for words, code for numbers</h2>
<div class="rule">
  <div><b>AI helps with</b><br>scripts, captions, simpler wording, Hinglish versions, hooks, new story settings for old questions</div>
  <div><b>Code decides</b><br>every number, every graph, every frame of motion, and the second check of each answer</div>
</div>
<p>If an answer can't be checked, it is marked <b>"needs teacher review"</b> and never shown as final.</p>

<h2 style="--c:${BLUE}">How one piece gets made</h2>
<ol class="flow">
  <li><b>Plan:</b> pick the topic, the student level and one clear example.</li>
  <li><b>Write:</b> draft the script with AI help, then rewrite it in plain, spoken language.</li>
  <li><b>Calculate:</b> code works out every number and checks it a second way.</li>
  <li><b>Animate and render:</b> video, Short, notes or worksheet, in English or Hinglish.</li>
  <li><b>Review:</b> I watch or read everything before it goes out.</li>
</ol>
<div class="foot">All questions, scripts, visuals and the mascot (Kan) are original. Thank you for reviewing my work. Adithya Vikram</div>
`;

const pages = [page1, page2];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Portfolio: Adithya Vikram</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Nunito, "Segoe UI", sans-serif; color: ${INK}; font-size: 11.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 14mm 15mm; }
  .page:last-child { page-break-after: auto; }
  .page::before { content: ""; position: absolute; left: 0; top: 0; right: 0; height: 5mm; background: linear-gradient(90deg, ${BLUE}, ${GREEN}, ${ORANGE}); }
  .pno { position: absolute; bottom: 7mm; right: 15mm; font-size: 9.5pt; color: #8a90a8; }
  header { border-bottom: 2px solid #e3e6f0; padding-bottom: 4mm; margin-bottom: 5mm; }
  .kicker { font-size: 10pt; font-weight: 900; letter-spacing: 2px; color: ${GREEN}; }
  h1 { font-size: 32pt; font-weight: 900; margin: 0; line-height: 1.05; }
  .sub { color: #5a6080; font-size: 13pt; }
  .drive { display: inline-block; margin-top: 2mm; font-size: 10pt; color: ${BLUE}; word-break: break-all; }
  h2 { font-size: 15pt; font-weight: 900; margin: 5mm 0 3mm; padding: 1mm 3mm; border-left: 5px solid var(--c); background: color-mix(in srgb, var(--c) 10%, white); border-radius: 0 3mm 3mm 0; }
  .tag { font-size: 9pt; font-weight: 800; color: #fff; background: ${GREEN}; border-radius: 10mm; padding: 0.5mm 2.5mm; vertical-align: middle; margin-left: 2mm; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
  .item { border: 1.5px solid #e3e6f0; border-radius: 3.5mm; padding: 3mm 4mm; }
  .kind { font-size: 8.5pt; font-weight: 900; letter-spacing: 1.2px; color: #8a90a8; }
  .t { font-size: 12.5pt; font-weight: 900; margin: 0.5mm 0 1mm; line-height: 1.2; }
  .d { font-size: 10.5pt; color: #3d4360; }
  .w { font-size: 9.5pt; color: ${BLUE}; margin-top: 1.5mm; font-weight: 700; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1.5px solid #e3e6f0; padding: 2.2mm 3mm; text-align: left; vertical-align: top; }
  th { background: #f5f6fb; font-size: 10.5pt; }
  td:first-child { width: 32%; }
  .rule { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .rule > div { border-radius: 3.5mm; padding: 3mm 4mm; }
  .rule > div:first-child { background: #eaf7f1; border-left: 4px solid ${GREEN}; }
  .rule > div:last-child { background: #fff3e6; border-left: 4px solid ${ORANGE}; }
  .flow { padding-left: 6mm; margin: 0; }
  .flow li { margin: 1.6mm 0; }
  p { margin: 2mm 0; }
  .foot { position: absolute; left: 15mm; right: 15mm; bottom: 14mm; font-size: 10pt; color: #6a7090; border-top: 1.5px solid #e3e6f0; padding-top: 2.5mm; }
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
console.log(`Portfolio → ${path.relative(root, pdfPath)}`);
