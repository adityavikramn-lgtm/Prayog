import { BEATS, BeatId, lineKey } from "./script";

export interface VoiceClip {
  src: string;
  seconds: number;
}
/** One clip per caption line, keyed "beat-index" (see `lineKey`). */
export type Voice = Record<string, VoiceClip>;

export interface PlacedClip {
  key: string;
  at: number; // seconds from the beat start: the moment its caption appears
  clip: VoiceClip;
  rate: number; // 1 = normal; slightly faster only if the line would run into the next one
}
export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
  clips: PlacedClip[];
}

const BREATH_S = 0.25; // gap kept before the next caption
export const MAX_RATE = 1.25; // never speed a voice up more than this

/**
 * The Coulomb video keeps its scripted timing (the animation is tied to it).
 * Each voice clip starts exactly when its caption appears. If a clip is a little
 * longer than its slot, it plays slightly faster so it never overlaps the next line.
 */
export function planCoulomb(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  let from = 0;
  const beats = BEATS.map((b) => {
    const clips: PlacedClip[] = [];
    b.lines.forEach((line, i) => {
      const clip = voice[lineKey(b.id, i)];
      if (!clip) return;
      const nextAt = i + 1 < b.lines.length ? b.lines[i + 1].at : b.seconds;
      const slot = nextAt - line.at - BREATH_S;
      clips.push({ key: lineKey(b.id, i), at: line.at, clip, rate: Math.max(1, clip.seconds / slot) });
    });
    const planned = { id: b.id, from, seconds: b.seconds, clips };
    from += b.seconds;
    return planned;
  });
  return { beats, seconds: from };
}
