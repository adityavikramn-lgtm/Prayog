import { BEATS, BeatId } from "./script";

export interface VoiceClip {
  src: string;
  seconds: number;
}
export type Voice = Partial<Record<BeatId, VoiceClip>>;

export interface PlannedBeat {
  id: BeatId;
  from: number;
  seconds: number;
}

const VOICE_TAIL_S = 0.5;

/** Beats end to end; a voiceover clip may stretch its beat, never shorten it. */
export function planCoulomb(voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  let from = 0;
  const beats = BEATS.map((b) => {
    const clip = voice[b.id];
    const seconds = clip ? Math.max(b.seconds, clip.seconds + VOICE_TAIL_S) : b.seconds;
    const planned = { id: b.id, from, seconds };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}
