# Voice clean-up: cut low rumble, remove steady background hiss (spectral gating), even out loudness.
# Used by clone-tts.py on every clip; also runs on its own:
#   .voice-clone/env/Scripts/python.exe scripts/clean_audio.py in.wav out.wav

import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, istft, sosfiltfilt, stft
from scipy.ndimage import uniform_filter

TARGET_LUFS = -16.0  # clear speech level for YouTube
PEAK = 10 ** (-1.0 / 20)  # keep peaks under -1 dBFS
FLOOR_DB = -28  # how far the hiss is pushed down (not to zero, which sounds watery)


def denoise(x: np.ndarray, sr: int, noise_ref: np.ndarray | None = None) -> np.ndarray:
    x = sosfiltfilt(butter(4, 80, "highpass", fs=sr, output="sos"), x)
    n = 1024
    _, _, Z = stft(x, sr, nperseg=n, noverlap=n * 3 // 4)
    mag = np.abs(Z)
    if noise_ref is None:
        # The quietest 15% of frames are the gaps between words: that is the hiss.
        energy = mag.mean(axis=0)
        quiet = mag[:, energy <= np.quantile(energy, 0.15)]
    else:
        _, _, N = stft(noise_ref, sr, nperseg=n, noverlap=n * 3 // 4)
        quiet = np.abs(N)
    thresh = quiet.mean(axis=1, keepdims=True) + 1.5 * quiet.std(axis=1, keepdims=True)
    # Soft mask: 1 where speech is well above the hiss, FLOOR where it isn't; smoothed so it doesn't flutter.
    floor = 10 ** (FLOOR_DB / 20)
    ratio = mag / (thresh + 1e-12)
    mask = np.clip((ratio - 1.0) / 1.5, 0, 1)
    mask = uniform_filter(mask, size=(3, 5))
    mask = floor + (1 - floor) * mask
    _, y = istft(Z * mask, sr, nperseg=n, noverlap=n * 3 // 4)
    return y[: len(x)]


def level(x: np.ndarray, sr: int) -> np.ndarray:
    meter = pyln.Meter(sr)
    loud = meter.integrated_loudness(x)
    if np.isfinite(loud):
        x = pyln.normalize.loudness(x, loud, TARGET_LUFS)
    peak = np.max(np.abs(x)) or 1
    return x * min(1.0, PEAK / peak)


def clean(x: np.ndarray, sr: int) -> np.ndarray:
    return level(denoise(x, sr), sr)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    x, sr = sf.read(src)
    if x.ndim > 1:
        x = x.mean(axis=1)
    sf.write(dst, clean(x, sr), sr, subtype="PCM_16")
    print(f"cleaned {src} -> {dst}")
