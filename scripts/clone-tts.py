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
lines = json.loads(Path(lines_path).read_text(encoding="utf-8"))
out_dir.mkdir(parents=True, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading the voice model on {device}...", flush=True)
model = ChatterboxTTS.from_pretrained(device=device)
# Clone from a cleaned copy of the sample, so the hiss in the recording isn't copied into every line.
ref_clean = str(Path(ref).with_name("ref-clean.wav"))
x, sr0 = sf.read(ref)
sf.write(ref_clean, clean(x if x.ndim == 1 else x.mean(axis=1), sr0), sr0, subtype="PCM_16")
model.prepare_conditionals(ref_clean, exaggeration=0.5)

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


def word_times(text: str, seconds: float) -> list:
    """Spread the words over the clip, longer words taking a little longer (an estimate, not a transcript)."""
    words = text.split()
    weights = [0.6 + min(len(w), 12) * 0.12 for w in words]
    total = sum(weights)
    speech = max(0.1, seconds - 2 * PAD_S)
    t, out = PAD_S, []
    for w, k in zip(words, weights):
        out.append({"start": round(t, 3), "text": w})
        t += speech * k / total
    return out


for i, line in enumerate(lines):
    # Same line → same seed → same take, so a re-run doesn't change clips that were fine.
    seed = sum(ord(c) for c in line["key"] + line["say"]) % (2**31)
    torch.manual_seed(seed)
    random.seed(seed)
    wav = trim(model.generate(line["say"], cfg_weight=0.5, exaggeration=0.5), model.sr)
    # Remove what's left of the hiss and bring every line to the same loudness.
    wav = torch.from_numpy(clean(wav[0].cpu().numpy().astype("float64"), model.sr)).float().unsqueeze(0)
    ta.save(str(out_dir / f"{line['key']}.wav"), wav, model.sr)
    seconds = wav.shape[1] / model.sr
    (out_dir / f"{line['key']}.words.json").write_text(json.dumps(word_times(line["say"], seconds)), encoding="utf-8")
    print(f"  ok {line['key']} ({seconds:.1f} s)  [{i + 1}/{len(lines)}]", flush=True)
