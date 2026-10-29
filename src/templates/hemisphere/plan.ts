import { BEATS, BeatId, lineKey, scriptValues, spokenText } from "./script";

export interface VoiceClip {
  src: string;
  seconds: number;
}
/** One clip per spoken line, keyed "beat-index" (see `lineKey`). */
export type Voice = Record<string, VoiceClip>;

export interface PlannedLine {
  key: string;
  at: number; // seconds from the beat start
  seconds: number; // how long the line is spoken (clip length, or an estimate)
  clip?: VoiceClip;
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const LEAD_S = 0.6; // pause before the first line of a beat
const GAP_S = 0.5; // breath between lines
const TAIL_S = 1.4; // pause before the next beat
const WORDS_PER_SECOND = 2.5; // calm teaching pace, used when there is no voice clip

/** Rough speaking time for a line, from its spoken words. */
export function estimateSeconds(words: string): number {
  return 0.4 + words.trim().split(/\s+/).length / WORDS_PER_SECOND;
}

/**
 * Lays out every line back to back. Each line starts when the one before it
 * has finished (the real clip length when there is a voiceover, otherwise an
 * estimate), so captions, voice and the drawings tied to each line stay in sync.
 */
export function planHemisphere(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  const values = scriptValues();
  let from = 0;
  const beats = BEATS.map((b) => {
    let t = LEAD_S;
    const lines = b.lines.map((line, i) => {
      const key = lineKey(b.id, i);
      const clip = voice[key];
      const seconds = clip ? clip.seconds : estimateSeconds(spokenText(line, values));
      const planned = { key, at: t, seconds, clip };
      t += seconds + GAP_S;
      return planned;
    });
    const seconds = t - GAP_S + TAIL_S;
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
