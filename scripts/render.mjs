// Renders a template's Short or explainer to renders/ in English and Hinglish, plus covers.
//
//   npm run render:short -- projectile
//   npm run render:explainer -- projectile
//   npm run render:short -- projectile --lang=en          (one language)
//   npm run render:short -- projectile --frames=0,300     (PNG check frames only)
//   npm run render:short -- projectile --safe-zones       (draw the Shorts safe area)
//   npm run render:explainer -- coulomb
//   npm run render:demo -- teacher                        (the teacher demo / pitch video)
//
// Voiceover: put one MP3 per beat in public/voice/<template>-<format>-<lang>/<beat>.mp3
// (beats: hook, concept, demo, sweep, predict, reveal, cta). Missing files = captions only.

import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { webpackOverride } from "../src/remotion/webpack-override.mjs";

// What exists: template → formats, the beats that can take a voiceover, and the languages.
const CATALOG = {
  projectile: {
    formats: ["short", "explainer"],
    beats: ["hook", "concept", "demo", "sweep", "predict", "reveal", "cta"],
    langs: ["en", "hi"],
  },
  coulomb: {
    formats: ["explainer"],
    beats: "per-line", // one clip per caption line, made by `npm run voice -- coulomb`
    langs: ["en", "hi"],
  },
  // demo: `npm run voice -- teacher`; short: `npm run voice -- teacher-short`
  teacher: { formats: ["demo", "short"], beats: "per-line", langs: ["en"] },
  // One voice clip per spoken line (made by `npm run voice -- hemisphere`), not one per beat.
  hemisphere: { formats: ["explainer"], beats: "per-line", langs: ["en"] },
  // Class 8 science: pressure = force ÷ area (`npm run voice -- pressure`).
  pressure: { formats: ["explainer"], beats: "per-line", langs: ["en"] },
  // Class 11 Motion in a Plane Shorts, part 1 and 2 (`npm run voice -- plane-drop` / `plane-monkey`).
  plane: { formats: ["drop", "monkey"], beats: "per-line", langs: ["en"] },
  // Class 6–8 Shorts: measurement (Class 6) and friction (Class 8).
  middle: { formats: ["measure", "friction"], beats: "per-line", langs: ["en"] },
  // ASE102 Unit III: alloys and phase diagrams, full lesson (`npm run voice -- phase`).
  phase: { formats: ["explainer"], beats: "per-line", langs: ["en"] },
  // ASE102 Unit II: imperfections in solids and strengthening (`npm run voice -- defects`).
  defects: { formats: ["explainer"], beats: "per-line", langs: ["en"] },
  // Analytic functions from zero, with MCQs and worked exam answers (`npm run voice -- complex`).
  complex: { formats: ["explainer"], beats: "per-line", langs: ["en"] },
};

const [format, template, ...flags] = process.argv.slice(2);
const entry = CATALOG[template];
if (!entry || !entry.formats.includes(format)) {
  const options = Object.entries(CATALOG)
    .map(([t, e]) => `${e.formats.map((f) => `render:${f} -- ${t}`).join(", ")}`)
    .join("; ");
  console.error(`Not available: ${format} for ${template}. Try: ${options}`);
  process.exit(1);
}
const BEATS = entry.beats;
const flag = (name) => flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
const flagValue = (name) => flag(name)?.split("=")[1];
const langs = flagValue("lang") ? [flagValue("lang")] : entry.langs;
const frames = flagValue("frames")?.split(",").map(Number);
const showSafeZones = Boolean(flag("safe-zones"));

const root = process.cwd();
const outDir = path.join(root, "renders");
fs.mkdirSync(outDir, { recursive: true });

function audioSeconds(file) {
  const out = execSync(`npx remotion ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`, {
    encoding: "utf8",
  });
  const seconds = Number(out.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`Could not read the length of ${file}`);
  return seconds;
}

function findVoice(lang) {
  const folder = `voice/${template}-${format}-${lang}`;
  const voice = {};
  if (BEATS === "per-line") {
    const dir = path.join(root, "public", folder);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mp3") || f.endsWith(".wav")) : [];
    for (const f of files) {
      const key = f.slice(0, -4);
      const clip = { src: `${folder}/${f}`, seconds: audioSeconds(path.join(dir, f)) };
      // Word start times saved by the Windows voice (used for word-by-word captions).
      const wordsFile = path.join(dir, `${key}.words.json`);
      if (fs.existsSync(wordsFile)) clip.words = JSON.parse(fs.readFileSync(wordsFile, "utf8"));
      voice[key] = clip;
    }
    return voice;
  }
  for (const beat of BEATS) {
    const rel = `${folder}/${beat}.mp3`;
    const abs = path.join(root, "public", rel);
    if (fs.existsSync(abs)) voice[beat] = { src: rel, seconds: audioSeconds(abs) };
  }
  return voice;
}

/** Real render timings, read by the pitch video (src/generated/render-times.json). */
function recordRenderTime(name, timing) {
  const file = path.join(root, "src", "generated", "render-times.json");
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  all[name] = { videoSeconds: Number(timing.videoSeconds.toFixed(1)), renderSeconds: Math.round(timing.renderSeconds) };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
}

console.log("Bundling the project (one time)…");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), webpackOverride });

for (const lang of langs) {
  const voice = findVoice(lang);
  const voiced = Object.keys(voice);
  console.log(`\n[${lang}] voiceover: ${voiced.length ? voiced.join(", ") : "none (captions only)"}`);

  const id = `${template}-${format}`;
  const inputProps = { format, lang, showSafeZones, voice };
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const name = `${id}-${lang}`;

  if (frames) {
    for (const frame of frames) {
      const output = path.join(outDir, "check", `${name}-f${frame}.png`);
      await renderStill({ composition, serveUrl, inputProps, frame, output });
      console.log(`  frame ${frame} → ${path.relative(root, output)}`);
    }
    continue;
  }

  const output = path.join(outDir, `${name}.mp4`);
  let last = -1;
  const started = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    inputProps,
    codec: "h264",
    // Standard HD colour (BT.709, limited range, yuv420p): what every phone and YouTube expects.
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    outputLocation: output,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(`  ${pct}%`);
      }
    },
  });
  const renderSeconds = (Date.now() - started) / 1000;
  const videoSeconds = composition.durationInFrames / composition.fps;
  console.log(`\n  video → ${path.relative(root, output)} (${videoSeconds.toFixed(1)} s, rendered in ${renderSeconds.toFixed(0)} s)`);
  recordRenderTime(name, { videoSeconds, renderSeconds });

  const coverProps = { format, lang };
  const cover = await selectComposition({ serveUrl, id: `${id}-cover`, inputProps: coverProps });
  const coverOut = path.join(outDir, `${name}-cover.png`);
  await renderStill({ composition: cover, serveUrl, inputProps: coverProps, output: coverOut });
  console.log(`  cover → ${path.relative(root, coverOut)}`);
}
