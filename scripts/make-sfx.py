# Original sound effects, synthesised from scratch (no samples, no licences needed).
#   .voice-clone/env/Scripts/python.exe scripts/make-sfx.py
# Writes public/sfx/<name>.wav (48 kHz mono). Same output every run (fixed random seed).

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48_000
OUT = Path("public/sfx")
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def t(seconds: float) -> np.ndarray:
    return np.arange(int(SR * seconds)) / SR


def env(n: int, attack: float, decay: float) -> np.ndarray:
    """Fast rise, exponential fall."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(attack, 1e-4)) * np.exp(-np.maximum(0, x - attack) / decay)


def bell(freq: float, seconds: float, decay: float) -> np.ndarray:
    x = t(seconds)
    tone = sum(a * np.sin(2 * np.pi * freq * k * x) for k, a in [(1, 1), (2.01, 0.45), (3.0, 0.2), (4.2, 0.08)])
    return tone * env(len(x), 0.004, decay)


def swept_noise(seconds: float, f0: float, f1: float, q_bw: float = 0.6) -> np.ndarray:
    """White noise through a band-pass whose centre slides from f0 to f1."""
    n = int(SR * seconds)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    block = 512
    for i in range(0, n, block):
        f = f0 * (f1 / f0) ** (i / n)
        lo, hi = f * (1 - q_bw / 2), min(f * (1 + q_bw / 2), SR / 2 - 100)
        sos = butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
        seg = noise[max(0, i - 2048) : i + block]
        out[i : i + block] = sosfilt(sos, seg)[-len(out[i : i + block]) :]
    return out


def save(name: str, x: np.ndarray, peak_db: float = -3.0) -> None:
    fade = min(len(x), int(SR * 0.01))
    x = x.copy()
    x[-fade:] *= np.linspace(1, 0, fade)
    x = x / (np.max(np.abs(x)) or 1) * 10 ** (peak_db / 20)
    sf.write(OUT / f"{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")
    print(f"  {name}.wav  {len(x) / SR:.2f} s")


# whoosh: a soft rush of air for scene changes
n = int(SR * 0.5)
x = np.arange(n) / n
save("whoosh", swept_noise(0.5, 300, 2600) * np.sin(np.pi * x) ** 2)

# pop: a bubbly blip when something appears
x = t(0.09)
f = 950 * np.exp(-x * 18) + 420
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, 0.03), -5)

# ding: a bright bell for a key number
save("ding", bell(1318.5, 1.0, 0.35), -4)

# tick: a clock tick for the countdown
x = t(0.05)
save("tick", (np.sin(2 * np.pi * 2200 * x) + 0.5 * rng.standard_normal(len(x))) * env(len(x), 0.001, 0.008), -6)

# success: a quick rising four-note chime for a right answer
notes = [1046.5, 1318.5, 1568.0, 2093.0]
gap = int(SR * 0.085)
out = np.zeros(gap * len(notes) + int(SR * 0.9))
for i, fr in enumerate(notes):
    b = bell(fr, 0.9, 0.28 if i < 3 else 0.5)
    out[i * gap : i * gap + len(b)] += b * (0.8 if i < 3 else 1.0)
save("success", out, -3)

# thud: something heavy landing (the brick)
x = t(0.35)
f = 120 * np.exp(-x * 8) + 45
low = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, 0.09)
dust = sosfilt(butter(2, 900, "lowpass", fs=SR, output="sos"), rng.standard_normal(len(x))) * env(len(x), 0.001, 0.03)
save("thud", low + 0.35 * dust, -4)

# swish: a fast blade through the air (the knife)
n = int(SR * 0.28)
x = np.arange(n) / n
save("swish", swept_noise(0.28, 5000, 1200, 0.5) * np.sin(np.pi * x) ** 1.5, -5)

# sparkle: a few tiny high bells, for a formula or a celebration
out = np.zeros(int(SR * 0.9))
for i in range(7):
    b = bell(float(rng.uniform(2600, 4200)), 0.5, 0.12) * float(rng.uniform(0.4, 1.0))
    s = int(SR * 0.06 * i)
    out[s : s + len(b)] += b
save("sparkle", out, -8)
