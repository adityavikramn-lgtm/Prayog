# Voice clean-up: cut low rumble, remove steady background hiss (spectral gating), even out loudness.
# Used by clone-tts.py on every clip; also runs on its own:
#   .voice-clone/env/Scripts/python.exe scripts/clean_audio.py in.wav out.wav

import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, istft, lfilter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter

TARGET_LUFS = -16.0  # clear speech level for YouTube
PEAK = 10 ** (-1.0 / 20)  # keep peaks under -1 dBFS
FLOOR_DB = -28  # how far the hiss is pushed down (not to zero, which sounds watery)
# Extra bass for a deeper, fuller voice (dB, low shelf around 180 Hz). Set with VOICE_BASS_DB, e.g. 5.
BASS_DB = float(os.environ.get("VOICE_BASS_DB", "0"))
BASS_HZ = 180.0


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


def bass(x: np.ndarray, sr: int, gain_db: float = BASS_DB) -> np.ndarray:
    """Low-shelf boost (RBJ audio-EQ cookbook biquad): lifts everything below ~BASS_HZ by gain_db."""
    if gain_db == 0:
        return x
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * BASS_HZ / sr
    alpha = np.sin(w0) / 2 * np.sqrt((a + 1 / a) * (1 / 0.8 - 1) + 2)
    cw = np.cos(w0)
    b = [a * ((a + 1) - (a - 1) * cw + 2 * np.sqrt(a) * alpha), 2 * a * ((a - 1) - (a + 1) * cw), a * ((a + 1) - (a - 1) * cw - 2 * np.sqrt(a) * alpha)]
    den = [(a + 1) + (a - 1) * cw + 2 * np.sqrt(a) * alpha, -2 * ((a - 1) + (a + 1) * cw), (a + 1) + (a - 1) * cw - 2 * np.sqrt(a) * alpha]
    return lfilter(np.array(b) / den[0], np.array(den) / den[0], x)


def level(x: np.ndarray, sr: int) -> np.ndarray:
    meter = pyln.Meter(sr)
    loud = meter.integrated_loudness(x)
    if np.isfinite(loud):
        x = pyln.normalize.loudness(x, loud, TARGET_LUFS)
    peak = np.max(np.abs(x)) or 1
    return x * min(1.0, PEAK / peak)


def clean(x: np.ndarray, sr: int) -> np.ndarray:
    return level(bass(denoise(x, sr), sr), sr)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    x, sr = sf.read(src)
    if x.ndim > 1:
        x = x.mean(axis=1)
    sf.write(dst, clean(x, sr), sr, subtype="PCM_16")
    print(f"cleaned {src} -> {dst}")
