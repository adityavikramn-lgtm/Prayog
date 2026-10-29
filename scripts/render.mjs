// Renders a template's Short or explainer to renders/ in English and Hinglish, plus covers.
//
//   npm run render:short -- projectile
//   npm run render:explainer -- projectile
//   npm run render:short -- projectile --lang=en          (one language)
//   npm run render:short -- projectile --frames=0,300     (PNG check frames only)
//   npm run render:short -- projectile --safe-zones       (draw the Shorts safe area)
//
// Voiceover: put one MP3 per beat in public/voice/<template>-<format>-<lang>/<beat>.mp3
// (beats: hook, concept, demo, sweep, predict, reveal, cta). Missing files = captions only.

import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { webpackOverride } from "../src/remotion/webpack-override.mjs";

const FORMATS = ["short", "explainer"];
const TEMPLATES = ["projectile"];
const BEATS = ["hook", "concept", "demo", "sweep", "predict", "reveal", "cta"];

const [format, template, ...flags] = process.argv.slice(2);
if (!FORMATS.includes(format) || !TEMPLATES.includes(template)) {
  console.error(`Usage: npm run render:<${FORMATS.join("|")}> -- <${TEMPLATES.join("|")}> [--lang=en|hi] [--frames=0,300] [--safe-zones]`);
  process.exit(1);
}
const flag = (name) => flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
const flagValue = (name) => flag(name)?.split("=")[1];
const langs = flagValue("lang") ? [flagValue("lang")] : ["en", "hi"];
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
  for (const beat of BEATS) {
    const rel = `${folder}/${beat}.mp3`;
    const abs = path.join(root, "public", rel);
    if (fs.existsSync(abs)) voice[beat] = { src: rel, seconds: audioSeconds(abs) };
  }
  return voice;
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
  console.log(`\n  video → ${path.relative(root, output)} (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);

  const coverProps = { format, lang };
  const cover = await selectComposition({ serveUrl, id: `${id}-cover`, inputProps: coverProps });
  const coverOut = path.join(outDir, `${name}-cover.png`);
  await renderStill({ composition: cover, serveUrl, inputProps: coverProps, output: coverOut });
  console.log(`  cover → ${path.relative(root, coverOut)}`);
}
