import { BEATS, BeatId, lineKey } from "./script";

export interface VoiceClip {
  src: string;
  seconds: number;
}
/** One clip per spoken line, keyed "beat-index" (see `lineKey`). */
export type Voice = Record<string, VoiceClip>;

export interface PlannedLine {
  key: string;
  at: number; // seconds from the beat start
  clip?: VoiceClip;
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  lines: PlannedLine[];
}

const GAP_S = 0.45; // breath between spoken lines
const TAIL_S = 1.2; // pause before the next beat

/**
 * Lays out every caption line. With a voiceover, each line starts after the
 * previous one has finished speaking (never earlier than its scripted time),
 * so captions, voice and the visuals tied to each line stay in sync.
 */
export function planHemisphere(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  let from = 0;
  const beats = BEATS.map((b) => {
    let prevEnd = 0;
    const lines = b.lines.map((line, i) => {
      const key = lineKey(b.id, i);
      const clip = voice[key];
      const at = Math.max(line.at, clip ? prevEnd + (i === 0 ? 0 : GAP_S) : line.at);
      prevEnd = at + (clip ? clip.seconds : 0);
      return { key, at, clip };
    });
    const seconds = Math.max(b.seconds, prevEnd + TAIL_S);
    const planned = { id: b.id, from, seconds, lines };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
