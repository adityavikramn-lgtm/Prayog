// Turns the narration of a video into one MP3 per spoken line with ElevenLabs.
//
//   npm run voice -- hemisphere --dry-run   (show every line and the character count; uses no credits)
//   npm run voice -- voices                 (list the voices on your account)
//   npm run voice -- hemisphere             (make the MP3s that are missing)
//   npm run voice -- hemisphere --force     (remake all of them)
//   npm run voice -- hemisphere --engine=windows [--voice="Microsoft Zira"]   (free voice built into Windows, no key)
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

/** Every video that has an English narration: one { key, say } per caption line. */
const NARRATION: Record<string, () => { key: string; say: string }[]> = {
  hemisphere: () => {
    const values = hemisphere.scriptValues();
    return hemisphere.BEATS.flatMap((b) => b.lines.map((line, i) => ({ key: hemisphere.lineKey(b.id, i), say: hemisphere.spokenText(line, values) })));
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
  const outDir = path.join("public", "voice", `${template}-explainer-en`);
  const ext = engine === "windows" ? "wav" : "mp3";
  const todo = lines.filter((l) => force || !fs.existsSync(path.join(outDir, `${l.key}.${ext}`)));
  const chars = todo.reduce((n, l) => n + l.say.length, 0);

  console.log(`\n${lines.length} lines in the script, ${todo.length} to make, ${chars} characters.`);
  if (dryRun) {
    for (const l of lines) console.log(`  ${l.key.padEnd(12)} ${l.say}`);
    return;
  }
  if (!todo.length) return console.log("Nothing to do. Use --force to remake them.");

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

if (command === "voices") await listVoices();
else if (command) await makeVoice(command);
else fail("Usage: npm run voice -- <hemisphere|voices> [--dry-run] [--force]");
