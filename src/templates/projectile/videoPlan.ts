import { solve } from "./model";
import { BeatId, CueTime, Format, PAIR, SCRIPT, VIDEO_PARAMS } from "./script";

export interface VoiceClip {
  src: string; // path inside public/, e.g. "voice/projectile-short-en/hook.mp3"
  seconds: number;
}
export type Voice = Partial<Record<BeatId, VoiceClip>>;

export interface PlannedBeat {
  id: BeatId;
  from: number; // seconds from video start
  seconds: number;
  /** Physics events inside the beat, in seconds from the beat start. */
  events: Partial<Record<Exclude<CueTime, number>, number>>;
  /** Simulated seconds per video second for flights in this beat. */
  rate: number;
}

const DEMO_PRE_S = 0.5;
const DEMO_FLIGHT_S: Record<Format, number> = { short: 5, explainer: 8 };
export const REVEAL_LAUNCH_S = 0.6;
const REVEAL_FLIGHT_S = 4;
const VOICE_TAIL_S = 0.5;

/**
 * Lays the beats end to end. A beat lasts its default length, or longer if its
 * voiceover clip needs more time. Flights always run at one constant rate.
 */
export function planBeats(format: Format, voice: Voice = {}): { beats: PlannedBeat[]; seconds: number } {
  const main = solve(VIDEO_PARAMS);
  const pair = PAIR.map((th) => solve({ ...VIDEO_PARAMS, thetaDeg: th }));
  const longest = Math.max(...pair.map((p) => p.timeOfFlight));

  let from = 0;
  const beats = SCRIPT[format].map((b): PlannedBeat => {
    let seconds = b.seconds;
    let rate = 1;
    let events: PlannedBeat["events"] = {};
    if (b.id === "demo") {
      const flight = DEMO_FLIGHT_S[format];
      rate = main.timeOfFlight / flight;
      events = { launch: DEMO_PRE_S, apex: DEMO_PRE_S + main.timeToApex / rate, land: DEMO_PRE_S + flight };
      seconds = DEMO_PRE_S + flight + b.seconds;
    }
    if (b.id === "reveal") {
      rate = longest / REVEAL_FLIGHT_S;
      const lands = pair.map((p) => REVEAL_LAUNCH_S + p.timeOfFlight / rate).sort((x, y) => x - y);
      events = { launch: REVEAL_LAUNCH_S, land: lands[0], land2: lands[1] };
    }
    const clip = voice[b.id];
    if (clip) seconds = Math.max(seconds, clip.seconds + VOICE_TAIL_S);
    const planned = { id: b.id, from, seconds, events, rate };
    from += seconds;
    return planned;
  });
  return { beats, seconds: from };
}

export function cueSeconds(at: CueTime, beat: PlannedBeat): number {
  if (typeof at === "number") return at;
  const t = beat.events[at];
  if (t === undefined) throw new Error(`Beat "${beat.id}" has no "${at}" event`);
  return t;
}
