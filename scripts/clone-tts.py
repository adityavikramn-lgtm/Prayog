# Speaks each line in the teacher's own voice with Chatterbox (free, open source, runs locally on the GPU).
# Called by `npm run voice -- <template> --engine=clone`; not meant to be run by hand.
#
#   .voice-clone/env/Scripts/python.exe scripts/clone-tts.py <lines.json> <out_dir> <reference.wav>
#
# lines.json: [{ "key": "open-0", "say": "..." }, ...]
# Writes <out_dir>/<key>.wav plus <key>.words.json (word start times, estimated from where the speech is).

import json
import random
import sys
from pathlib import Path

import soundfile as sf
import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

from clean_audio import clean

lines_path, out_dir, ref = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
# Tone: higher exaggeration = livelier, more human delivery; lower cfg = more natural pacing.
EXAGGERATION = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
CFG = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
lines = json.loads(Path(lines_path).read_text(encoding="utf-8"))
out_dir.mkdir(parents=True, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading the voice model on {device}...", flush=True)
model = ChatterboxTTS.from_pretrained(device=device)
# Clone from a cleaned copy of the sample, so the hiss in the recording isn't copied into every line.
ref_clean = str(Path(ref).with_name("ref-clean.wav"))
x, sr0 = sf.read(ref)
sf.write(ref_clean, clean(x if x.ndim == 1 else x.mean(axis=1), sr0), sr0, subtype="PCM_16")
model.prepare_conditionals(ref_clean, exaggeration=EXAGGERATION)

PAD_S = 0.08  # a little air before and after each clip


def trim(wav: torch.Tensor, sr: int) -> torch.Tensor:
    """Cut silence at both ends (keeps PAD_S)."""
    x = wav[0]
    win = int(sr * 0.02)
    frames = x[: len(x) // win * win].reshape(-1, win)
    loud = (frames.pow(2).mean(dim=1).sqrt() > 0.01).nonzero()
    if len(loud) == 0:
        return wav
    a = max(0, int(loud[0]) * win - int(PAD_S * sr))
    b = min(len(x), (int(loud[-1]) + 1) * win + int(PAD_S * sr))
    return wav[:, a:b]


def word_times(text: str, x, sr: int) -> list:
    """Word start times (an estimate, not a transcript): words are spread, by length, over the parts of
    the clip where there is actually speech, so pauses (after commas and full stops) are skipped."""
    words = text.split()
    win = int(sr * 0.01)
    frames = x[: len(x) // win * win].reshape(-1, win)
    rms = (frames**2).mean(axis=1) ** 0.5
    voiced = rms > max(1e-4, 0.08 * rms.max())
    # Fill tiny gaps (inside a word) so only real pauses (> 120 ms) count as silence.
    gap = 0
    for i in range(len(voiced)):
        if voiced[i]:
            if 0 < gap <= 12:
                voiced[i - gap : i] = True
            gap = 0
        else:
            gap += 1
    times = [i * 0.01 for i in range(len(voiced)) if voiced[i]]
    if not times:
        times = [0.0]
    weights = [0.6 + min(len(w), 12) * 0.12 for w in words]
    total = sum(weights)
    out, acc = [], 0.0
    for w, k in zip(words, weights):
        idx = min(len(times) - 1, int(acc / total * len(times)))
        out.append({"start": round(times[idx], 3), "text": w})
        acc += k
    return out


MAX_WORDS_PER_S = 3.8  # faster than this usually means the model skipped words: take it again


def take(text: str, seed: int) -> torch.Tensor:
    torch.manual_seed(seed)
    random.seed(seed)
    return trim(model.generate(text, cfg_weight=CFG, exaggeration=EXAGGERATION), model.sr)


for i, line in enumerate(lines):
    # Same line → same seed → same take, so a re-run doesn't change clips that were fine.
    seed = sum(ord(c) for c in line["key"] + line["say"]) % (2**31)
    words = len(line["say"].split())
    for attempt in range(4):
        wav = take(line["say"], seed + attempt * 7919)
        rate = words / (wav.shape[1] / model.sr)
        if rate <= MAX_WORDS_PER_S or words <= 4:
            break
        print(f"  retake {line['key']}: {rate:.1f} words/s looks rushed or cut", flush=True)
    # Remove what's left of the hiss and bring every line to the same loudness.
    wav = torch.from_numpy(clean(wav[0].cpu().numpy().astype("float64"), model.sr)).float().unsqueeze(0)
    ta.save(str(out_dir / f"{line['key']}.wav"), wav, model.sr)
    seconds = wav.shape[1] / model.sr
    # Word times use the on-screen words ("14.6"), spread over where the voice is speaking.
    shown = line.get("show") or line["say"]
    (out_dir / f"{line['key']}.words.json").write_text(json.dumps(word_times(shown, wav[0].numpy(), model.sr)), encoding="utf-8")
    print(f"  ok {line['key']} ({seconds:.1f} s)  [{i + 1}/{len(lines)}]", flush=True)
