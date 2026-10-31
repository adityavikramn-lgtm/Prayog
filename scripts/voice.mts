// Turns the narration of a video into one MP3 per spoken line with ElevenLabs.
//
//   npm run voice -- hemisphere --dry-run   (show every line and the character count; uses no credits)
//   npm run voice -- voices                 (list the voices on your account)
//   npm run voice -- hemisphere             (make the MP3s that are missing)
//   npm run voice -- hemisphere --force     (remake all of them)
//   npm run voice -- hemisphere --engine=windows [--voice="Microsoft Zira"]   (free voice built into Windows, no key)
//   npm run voice -- hemisphere --engine=clone [--emotion=0.7]   (the teacher's own voice, cloned locally; 0.7 = livelier)
//   ... --only=open-0,problem-0 --out=renders/voice-test   (just these lines, into another folder: for trying a voice)
//
// Needs .env.local (git-ignored, never printed):
//   ELEVENLABS_API_KEY=...
//   ELEVENLABS_VOICE_ID=...        (pick one from `npm run voice -- voices`)
//   ELEVENLABS_MODEL_ID=...        (optional; the API default is used when empty)
// Files go to public/voice/<template>-explainer-en/<beat>-<line>.mp3, where the render script finds them.

import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as coulomb from "../src/templates/coulomb/script";
import * as hemisphere from "../src/templates/hemisphere/script";
import * as demo from "../src/pitch/script";
import * as short from "../src/pitch/short";
import * as pressure from "../src/templates/pressure/script";
import * as plane from "../src/shorts/plane";
import * as middle from "../src/shorts/middle";
import * as phase from "../src/templates/phase/script";

/** Where each video's clips go; the render script looks in public/voice/<template>-<format>-<lang>. */
const FOLDER: Record<string, string> = {
  hemisphere: "hemisphere-explainer-en",
  coulomb: "coulomb-explainer-en",
  teacher: "teacher-demo-en",
  "teacher-short": "teacher-short-en",
  pressure: "pressure-explainer-en",
  "plane-drop": "plane-drop-en",
  "plane-monkey": "plane-monkey-en",
  "middle-measure": "middle-measure-en",
  "middle-friction": "middle-friction-en",
  phase: "phase-explainer-en",
};

/** Every video that has an English narration: one { key, say } per caption line. */
const NARRATION: Record<string, () => { key: string; say: string; show?: string }[]> = {
  // say = what the voice reads; show = the words on screen (used for word timings).
  "teacher-short": () => short.SHORT_LINES.map((l, i) => ({ key: short.shortLineKey(i), say: l.voice ?? l.say, show: l.say })),
  teacher: () => demo.DEMO_BEATS.flatMap((b) => b.lines.map((l, i) => ({ key: demo.lineKey(b.id, i), say: demo.spoken(l) }))),
  hemisphere: () => {
    const values = hemisphere.scriptValues();
    return hemisphere.BEATS.flatMap((b) => b.lines.map((line, i) => ({ key: hemisphere.lineKey(b.id, i), say: hemisphere.spokenText(line, values) })));
  },
  "plane-drop": () => plane.DROP_LINES.map((l, i) => ({ key: plane.lineKey(i), say: l.voice ?? l.say, show: l.say })),
  "plane-monkey": () => plane.MONKEY_LINES.map((l, i) => ({ key: plane.lineKey(i), say: l.voice ?? l.say, show: l.say })),
  "middle-measure": () => middle.MEASURE_LINES.map((l, i) => ({ key: plane.lineKey(i), say: l.voice ?? l.say, show: l.say })),
  "middle-friction": () => middle.FRICTION_LINES.map((l, i) => ({ key: plane.lineKey(i), say: l.voice ?? l.say, show: l.say })),
  phase: () => {
    const values = phase.scriptValues();
    return phase.BEATS.flatMap((b) => b.lines.map((line, i) => ({ key: phase.lineKey(b.id, i), say: phase.spokenText(line, values) })));
  },
  pressure: () => {
    const values = pressure.scriptValues();
    return pressure.BEATS.flatMap((b) => b.lines.map((line, i) => ({ key: pressure.lineKey(b.id, i), say: pressure.spokenText(line, values) })));
  },
  coulomb: () => {
    const values = coulomb.spokenValues();
    return coulomb.BEATS.flatMap((b) => b.lines.map((_, i) => ({ key: coulomb.lineKey(b.id, i), say: coulomb.spokenEn(b.id, i, values) })));
  },
};

config({ path: ".env.local", quiet: true });

const API = "https://api.elevenlabs.io/v1";
const args = process.argv.slice(2);
const command = args[0];
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
const modelId = process.env.ELEVENLABS_MODEL_ID?.trim();
const flagValue = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const engine = flagValue("engine") ?? "elevenlabs";

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function listVoices() {
  if (!key) fail("Add ELEVENLABS_API_KEY to .env.local first.");
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key } });
  if (!res.ok) fail(`ElevenLabs said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { voices: { voice_id: string; name: string; labels?: Record<string, string> }[] };
  console.log("\nVoices on your account (put the id in .env.local as ELEVENLABS_VOICE_ID):\n");
  for (const v of data.voices) {
    const labels = Object.values(v.labels ?? {}).join(", ");
    console.log(`  ${v.voice_id}  ${v.name}${labels ? `  (${labels})` : ""}`);
  }
}

async function makeVoice(template: string) {
  const source = NARRATION[template];
  if (!source) fail(`No narration script for "${template}" yet. Try: ${Object.keys(NARRATION).join(", ")}`);
  const lines = source();
  const outDir = flagValue("out") ?? path.join("public", "voice", FOLDER[template]);
  const ext = engine === "elevenlabs" ? "mp3" : "wav";
  const only = flagValue("only")?.split(",");
  const todo = lines.filter((l) => (only ? only.includes(l.key) : force || !fs.existsSync(path.join(outDir, `${l.key}.${ext}`))));
  const chars = todo.reduce((n, l) => n + l.say.length, 0);

  console.log(`\n${lines.length} lines in the script, ${todo.length} to make, ${chars} characters.`);
  if (dryRun) {
    for (const l of lines) console.log(`  ${l.key.padEnd(12)} ${l.say}`);
    return;
  }
  if (!todo.length) return console.log("Nothing to do. Use --force to remake them.");

  // Free, offline: the teacher's own voice, cloned by Chatterbox on the local GPU (scripts/clone-tts.py).
  if (engine === "clone") {
    const python = path.join(".voice-clone", "env", "Scripts", "python.exe");
    if (!fs.existsSync(python)) fail("The voice-clone tool is not set up yet (.voice-clone/env).");
    const ref = path.join(".voice-clone", "ref.wav");
    if (!fs.existsSync(ref)) fail("Missing .voice-clone/ref.wav (your voice sample, converted to WAV).");
    for (const f of fs.existsSync(outDir) ? fs.readdirSync(outDir) : []) if (f.endsWith(".mp3")) fs.rmSync(path.join(outDir, f));
    const list = path.join("renders", "voice-lines.json");
    fs.mkdirSync("renders", { recursive: true });
    fs.writeFileSync(list, JSON.stringify(todo));
    // --emotion=0.7 for a livelier, more human delivery (Chatterbox "exaggeration"; 0.5 = neutral).
    const emotion = flagValue("emotion") ?? "0.5";
    const cfg = Number(emotion) > 0.6 ? "0.35" : "0.5";
    // --bass=5 adds 5 dB of low end for a deeper, fuller voice (scripts/clean_audio.py).
    const bassDb = flagValue("bass") ?? "0";
    const result = spawnSync(python, ["scripts/clone-tts.py", list, outDir, ref, emotion, cfg], {
      stdio: "inherit",
      env: { ...process.env, VOICE_BASS_DB: bassDb },
    });
    if (result.status !== 0) fail("The cloned voice could not make the clips (see the message above).");
    console.log(`
Done in your voice. Now render: npm run render:explainer -- ${template}`);
    return;
  }

  // Free, offline: a voice built into Windows (one clip per line, same file names as ElevenLabs but .wav).
  if (engine === "windows") {
    // Only one engine's clips should be in the folder, or the render would pick up both.
    for (const f of fs.existsSync(outDir) ? fs.readdirSync(outDir) : []) if (f.endsWith(".mp3")) fs.rmSync(path.join(outDir, f));
    const list = path.join("renders", "voice-lines.json");
    fs.mkdirSync("renders", { recursive: true });
    fs.writeFileSync(list, JSON.stringify(todo));
    const voiceName = flagValue("voice") ?? "Microsoft Mark";
    const result = spawnSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/windows-tts.ps1", "-LinesJson", list, "-OutDir", outDir, "-Voice", voiceName],
      { stdio: "inherit" },
    );
    if (result.status !== 0) fail("The Windows voice could not make the clips (see the message above).");
    console.log(`\nDone with "${voiceName}". Now render: npm run render:explainer -- ${template}`);
    return;
  }
  if (!key) fail("Add ELEVENLABS_API_KEY to .env.local first (see the ACTION NEEDED box).");
  if (!voiceId) fail("Add ELEVENLABS_VOICE_ID to .env.local. Run `npm run voice -- voices` to see your voices.");

  fs.mkdirSync(outDir, { recursive: true });
  for (const l of todo) {
    const i = lines.findIndex((x) => x.key === l.key);
    const body: Record<string, unknown> = {
      text: l.say,
      // Neighbouring lines help the voice keep a natural, continuous flow.
      previous_text: lines[i - 1]?.say,
      next_text: lines[i + 1]?.say,
    };
    if (modelId) body.model_id = modelId;
    const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (!res.ok) fail(`Stopped at ${l.key}: ElevenLabs said ${res.status}: ${(await res.text()).slice(0, 300)}`);
    fs.writeFileSync(path.join(outDir, `${l.key}.mp3`), Buffer.from(await res.arrayBuffer()));
    console.log(`  ✓ ${l.key}`);
  }
  console.log(`\nDone. Now render: npm run render:explainer -- ${template}`);
}

async function main() {
  if (command === "voices") await listVoices();
  else if (command) await makeVoice(command);
  else fail(`Usage: npm run voice -- <${Object.keys(NARRATION).join("|")}|voices> [--dry-run] [--force] [--engine=windows]`);
}
void main();
