// Turns the narration of a video into one MP3 per spoken line with ElevenLabs.
//
//   npm run voice -- hemisphere --dry-run   (show every line and the character count; uses no credits)
//   npm run voice -- voices                 (list the voices on your account)
//   npm run voice -- hemisphere             (make the MP3s that are missing)
//   npm run voice -- hemisphere --force     (remake all of them)
//
// Needs .env.local (git-ignored, never printed):
//   ELEVENLABS_API_KEY=...
//   ELEVENLABS_VOICE_ID=...        (pick one from `npm run voice -- voices`)
//   ELEVENLABS_MODEL_ID=...        (optional; the API default is used when empty)
// Files go to public/voice/<template>-explainer-en/<beat>-<line>.mp3, where the render script finds them.

import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { BEATS, lineKey, scriptValues, spokenText } from "../src/templates/hemisphere/script";

config({ path: ".env.local", quiet: true });

const API = "https://api.elevenlabs.io/v1";
const args = process.argv.slice(2);
const command = args[0];
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const key = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
const modelId = process.env.ELEVENLABS_MODEL_ID?.trim();

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
  if (template !== "hemisphere") fail(`No narration script for "${template}" yet. Try: hemisphere`);
  const values = scriptValues();
  const lines = BEATS.flatMap((b) => b.lines.map((line, i) => ({ key: lineKey(b.id, i), say: spokenText(line, values) })));
  const outDir = path.join("public", "voice", `${template}-explainer-en`);
  const todo = lines.filter((l) => force || !fs.existsSync(path.join(outDir, `${l.key}.mp3`)));
  const chars = todo.reduce((n, l) => n + l.say.length, 0);

  console.log(`\n${lines.length} lines in the script, ${todo.length} to make, ${chars} characters (about ${chars} credits).`);
  if (dryRun) {
    for (const l of lines) console.log(`  ${l.key.padEnd(12)} ${l.say}`);
    return;
  }
  if (!todo.length) return console.log("Nothing to do. Use --force to remake them.");
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
