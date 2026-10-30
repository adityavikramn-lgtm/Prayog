import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/google-fonts/Anton";
import "katex/dist/katex.min.css";
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Tex } from "../components/Tex";
import { Kan } from "../mascot/Kan";
import { sig3 } from "../physics/format";
import { sceneFont } from "../sceneFont";
import { solve } from "../templates/projectile/model";
import { COLORS } from "../theme";
import { CLAMP } from "../video/ui";
import { PlannedShortLine, SHORT_LINES, ShortVoice, bare, planShort, shortLineKey, slip } from "./short";

/**
 * The "Start Here" pitch as a 9:16 kinetic-typography Short: one big word at a
 * time in sync with the voice, graphics that pop in, a moving grid behind.
 * All text and graphics stay inside the Shorts safe area (x 54–950, y 288–1536).
 */

const { fontFamily: display } = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export const StartShortProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(
    z.string(),
    z.object({
      src: z.string(),
      seconds: z.number().positive(),
      words: z.array(z.object({ start: z.number(), text: z.string() })).optional(),
    }),
  ),
});
export type StartShortProps = z.infer<typeof StartShortProps>;

export const SHORT_FPS = 30;
export const startShortMetadata: CalculateMetadataFunction<StartShortProps> = ({ props }) => ({
  durationInFrames: Math.round(planShort(props.voice as ShortVoice).seconds * SHORT_FPS),
});

const W = 1080;
const BG = "#0a0f0d";
const MINT = COLORS.kan;
const YELLOW = COLORS.displacement;
const RED = "#ff5a52";
const CENTER = { x: 540, y: 760 }; // middle of the graphics area
const WORD_Y = 1250;

const pop = (t: number, start: number, len = 0.35) =>
  interpolate(t, [start, start + len], [0, 1], { ...CLAMP, easing: Easing.out(Easing.back(1.8)) });
const fadeIn = (t: number, start: number, len = 0.2) => interpolate(t, [start, start + len], [0, 1], CLAMP);

export const StartShort: React.FC<StartShortProps> = ({ voice }) => {
  const { fps } = useVideoConfig();
  const plan = planShort(voice as ShortVoice);
  return (
    <AbsoluteFill style={{ backgroundColor: BG, color: "#fff", fontFamily: sceneFont }}>
      <Grid />
      {plan.lines.map((l) => {
        const from = Math.round(l.from * fps);
        const next = plan.lines[l.index + 1];
        const until = next ? Math.round(next.from * fps) : Math.round(plan.seconds * fps);
        return (
          <Sequence key={l.index} from={from} durationInFrames={until - from} name={`line ${l.index + 1}`}>
            <LineScene line={l} />
            {l.clip && <Audio src={staticFile(l.clip.src)} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** A faint grid that drifts slowly upwards, like squared paper under a camera. */
const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const step = 96;
  const off = (frame * 0.6) % step;
  return (
    <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={i * step - 36} y1={0} x2={i * step - 36} y2={1920} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * step - off} x2={W} y2={i * step - off} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
      ))}
      <defs>
        <radialGradient id="vignette" cx="50%" cy="45%" r="70%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
        </radialGradient>
      </defs>
      <rect width={W} height={1920} fill="url(#vignette)" />
    </svg>
  );
};

const LineScene: React.FC<{ line: PlannedShortLine }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const script = SHORT_LINES[line.index];
  const at = (word: string) => line.words.find((w) => bare(w.text) === word)?.start ?? 0;
  const Visual = VISUALS[script.visual];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 150,
          top: 300,
          textAlign: "center",
          fontSize: 34,
          color: "rgba(255,255,255,0.75)",
          opacity: fadeIn(t, 0),
        }}
      >
        {script.say}
      </div>
      <Visual t={t} at={at} />
      <BigWord line={line} t={t} />
    </AbsoluteFill>
  );
};

/** The word being spoken right now, huge, with a quick pop; key words glow, some get stacked echoes. */
const BigWord: React.FC<{ line: PlannedShortLine; t: number }> = ({ line, t }) => {
  const script = SHORT_LINES[line.index];
  const current = [...line.words].reverse().find((w) => w.start <= t);
  if (!current) return null;
  const word = current.text.replace(/[,]$/, "");
  const key = bare(word);
  const accent = script.accent?.includes(key);
  const echo = script.echo?.includes(key);
  const p = pop(t, current.start, 0.18);
  const color = accent ? (key === "wrong" ? RED : MINT) : "#fff";
  const size = word.length > 9 ? 120 : 150;
  const style: React.CSSProperties = {
    position: "absolute",
    left: 54,
    right: 130,
    textAlign: "center",
    fontFamily: display,
    fontSize: size,
    lineHeight: 1,
    textTransform: "uppercase",
    letterSpacing: 2,
  };
  return (
    <>
      {echo &&
        [-2, -1, 1, 2].map((k) => (
          <div
            key={k}
            style={{
              ...style,
              top: WORD_Y + k * (size * 0.95),
              color: "transparent",
              WebkitTextStroke: `2px ${color}`,
              opacity: (Math.abs(k) === 1 ? 0.45 : 0.18) * p,
            }}
          >
            {word}
          </div>
        ))}
      <div
        style={{
          ...style,
          top: WORD_Y,
          color,
          scale: String(1.25 - 0.25 * p),
          opacity: Math.min(1, p * 1.5),
          textShadow: accent ? `0 0 28px ${color}, 0 0 60px ${color}66` : "0 6px 24px rgba(0,0,0,0.6)",
        }}
      >
        {word}
      </div>
    </>
  );
};

// ---------- the graphics for each line ----------

type VisualProps = { t: number; at: (word: string) => number };

const Center: React.FC<{ scale?: number; children: React.ReactNode; y?: number }> = ({ scale = 1, children, y = CENTER.y }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", translate: "0 -50%", scale: String(scale) }}>
    {children}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = "rgba(255,255,255,0.25)", style }) => (
  <div
    style={{
      background: "rgba(20,30,27,0.92)",
      border: `3px solid ${color}`,
      borderRadius: 32,
      padding: "28px 36px",
      boxShadow: `0 0 40px ${color}33`,
      ...style,
    }}
  >
    {children}
  </div>
);

const AiVisual: React.FC<VisualProps> = ({ t }) => {
  const s = pop(t, 0.05);
  return (
    <Center scale={s}>
      <div style={{ position: "relative" }}>
        <Card color={MINT} style={{ width: 420, height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: display, fontSize: 230, color: MINT, textShadow: `0 0 40px ${MINT}` }}>AI</div>
        </Card>
        {[0, 1, 2].map((i) => {
          const a = t * 2 + (i * Math.PI * 2) / 3;
          return (
            <div key={i} style={{ position: "absolute", left: 210 + Math.cos(a) * 290 - 25, top: 210 + Math.sin(a) * 290 - 25, fontSize: 50, color: YELLOW }}>
              ✦
            </div>
          );
        })}
      </div>
    </Center>
  );
};

const WrongVisual: React.FC<VisualProps> = ({ t }) => {
  const d = interpolate(t, [0.1, 0.5], [1, 0], CLAMP);
  const d2 = interpolate(t, [0.35, 0.75], [1, 0], CLAMP);
  const len = 560;
  return (
    <Center scale={pop(t, 0.05)}>
      <svg width={460} height={460} viewBox="0 0 460 460">
        <circle cx={230} cy={230} r={210} fill="none" stroke={RED} strokeWidth={14} opacity={0.35} />
        <line x1={110} y1={110} x2={350} y2={350} stroke={RED} strokeWidth={40} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * d} />
        <line x1={350} y1={110} x2={110} y2={350} stroke={RED} strokeWidth={40} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * d2} />
      </svg>
    </Center>
  );
};

const FormulaVisual: React.FC<VisualProps> = ({ t, at }) => {
  const fix = at("theta") || 1.8;
  const strike = interpolate(t, [0.3, 0.7], [0, 1], CLAMP);
  return (
    <>
      <Center y={620} scale={pop(t, 0.05)}>
        <Card color={RED} style={{ position: "relative", fontSize: 64, color: "#fff" }}>
          <Tex tex="R = \dfrac{u^2 \sin\theta}{g}" />
          <div style={{ position: "absolute", left: 30, right: 30, top: "50%", height: 8, background: RED, transformOrigin: "left", scale: `${strike} 1`, borderRadius: 4 }} />
        </Card>
      </Center>
      <Center y={930} scale={pop(t, fix)}>
        <Card color={MINT} style={{ fontSize: 64, color: "#fff", display: "flex", alignItems: "center", gap: 24 }}>
          <Tex tex={`R = \\dfrac{u^2 \\sin \\textcolor{${MINT}}{2}\\theta}{g}`} />
          <span style={{ fontSize: 70, color: MINT }}>✓</span>
        </Card>
      </Center>
    </>
  );
};

const NumberVisual: React.FC<VisualProps> = ({ t }) => {
  const s = slip();
  const target = Number(s.diff);
  const shown = interpolate(t, [0.2, 1.2], [0, target], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  return (
    <Center scale={pop(t, 0.05)}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: display, fontSize: 260, color: RED, lineHeight: 1, textShadow: `0 0 40px ${RED}88` }}>{shown.toFixed(1)} m</div>
        <div style={{ fontSize: 44, color: "rgba(255,255,255,0.8)", marginTop: 20 }}>
          wrong answer {s.wrong} m &nbsp;·&nbsp; right answer {s.right} m
        </div>
      </div>
    </Center>
  );
};

const SplitVisual: React.FC<VisualProps> = ({ t, at }) => {
  const go = interpolate(t, [at("split") || 0.6, (at("split") || 0.6) + 0.5], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const half = (label: string, sub: string, color: string, dir: number) => (
    <div style={{ translate: `${dir * go * 40}px 0`, rotate: `${dir * go * 4}deg` }}>
      <Card color={color} style={{ width: 360, height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontFamily: display, fontSize: 120, color }}>{label}</div>
        <div style={{ fontSize: 44, color: "#fff" }}>{sub}</div>
      </Card>
    </div>
  );
  return (
    <Center scale={pop(t, 0.05)}>
      <div style={{ display: "flex", gap: 20 * (1 + go * 2) }}>
        {half("AI", "words", MINT, -1)}
        {half("CODE", "numbers", YELLOW, 1)}
      </div>
    </Center>
  );
};

const WordsVisual: React.FC<VisualProps> = ({ t }) => {
  const rows = [0.9, 0.7, 0.8, 0.5];
  return (
    <Center scale={pop(t, 0.05)}>
      <Card color={MINT} style={{ width: 620 }}>
        <div style={{ fontFamily: display, fontSize: 70, color: MINT, marginBottom: 20 }}>AI ✎</div>
        {rows.map((w, i) => (
          <div
            key={i}
            style={{
              height: 26,
              borderRadius: 13,
              margin: "18px 0",
              background: "rgba(255,255,255,0.8)",
              width: `${w * 100 * interpolate(t, [0.2 + i * 0.15, 0.5 + i * 0.15], [0, 1], CLAMP)}%`,
            }}
          />
        ))}
        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.7)" }}>captions · Hinglish · hooks · stories</div>
      </Card>
    </Center>
  );
};

const CodeVisual: React.FC<VisualProps> = ({ t }) => {
  const r = solve({ u: 20, thetaDeg: 60, g: 10, trig: "exact" });
  const rows = [
    ["Range", `${sig3(r.range)} m`],
    ["Height", `${sig3(r.maxHeight)} m`],
    ["Time", `${sig3(r.timeOfFlight)} s`],
  ];
  return (
    <Center scale={pop(t, 0.05)}>
      <Card color={YELLOW} style={{ width: 640 }}>
        <div style={{ fontFamily: display, fontSize: 90, color: YELLOW, marginBottom: 10 }}>{"</>"}</div>
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 50, margin: "14px 0", opacity: fadeIn(t, 0.3 + i * 0.3) }}>
            <span style={{ color: "rgba(255,255,255,0.75)" }}>{k}</span>
            <span>
              {v} <span style={{ color: MINT }}>✓</span>
            </span>
          </div>
        ))}
      </Card>
    </Center>
  );
};

const AgreeVisual: React.FC<VisualProps> = ({ t, at }) => {
  const s = slip();
  const tick = pop(t, at("agree") || 1.6);
  const card = (label: string, value: string, start: number) => (
    <div style={{ scale: String(pop(t, start)) }}>
      <Card color={MINT} style={{ width: 380, textAlign: "center", padding: "16px 30px" }}>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.75)" }}>{label}</div>
        <div style={{ fontFamily: display, fontSize: 96, color: "#fff", lineHeight: 1.1 }}>{value} m</div>
      </Card>
    </div>
  );
  return (
    <Center y={800}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {card("Formula", s.right, at("formula") || 0.2)}
        <div style={{ fontFamily: display, fontSize: 90, color: MINT, scale: String(tick), textShadow: `0 0 30px ${MINT}` }}>= ✓</div>
        {card("Simulation", s.sim, at("simulation") || 0.8)}
      </div>
    </Center>
  );
};

const DeliverVisual: React.FC<VisualProps> = ({ t, at }) => {
  const tiles: [string, string, string][] = [
    ["shorts", "▶", "Shorts"],
    ["lessons", "🎬", "Full lessons"],
    ["notes", "📄", "Notes"],
  ];
  return (
    <Center>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {tiles.map(([key, icon, label], i) => (
          <div key={key} style={{ scale: String(pop(t, at(key) || 0.6 + i * 0.5)) }}>
            <Card color={i === 1 ? YELLOW : MINT} style={{ width: 640, display: "flex", alignItems: "center", gap: 36, padding: "22px 40px" }}>
              <span style={{ fontSize: 90 }}>{icon}</span>
              <span style={{ fontFamily: display, fontSize: 84 }}>{label}</span>
            </Card>
          </div>
        ))}
      </div>
    </Center>
  );
};

const CheckedVisual: React.FC<VisualProps> = ({ t, at }) => {
  const start = at("checked") || 1;
  const d = interpolate(t, [start, start + 0.45], [1, 0], CLAMP);
  return (
    <Center scale={pop(t, 0.05)}>
      <svg width={460} height={460} viewBox="0 0 460 460" style={{ filter: `drop-shadow(0 0 30px ${MINT})` }}>
        <circle cx={230} cy={230} r={200} fill="none" stroke={MINT} strokeWidth={16} />
        <path d="M 130 240 L 205 315 L 340 160" fill="none" stroke={MINT} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={400} strokeDashoffset={400 * d} />
      </svg>
    </Center>
  );
};

const NameVisual: React.FC<VisualProps> = ({ t }) => (
  <Center scale={pop(t, 0.05)}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <Kan radius={120} expression="excited" arms="out" look={{ x: 0, y: 0.3 }} time={t} />
      <div style={{ fontFamily: display, fontSize: 96, color: "#fff", lineHeight: 1, marginTop: 10 }}>ADITHYA VIKRAM</div>
      <div style={{ fontSize: 40, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 6 }}>
        JEE Physics content · AI for words, code for numbers
      </div>
    </div>
  </Center>
);

const VISUALS: Record<(typeof SHORT_LINES)[number]["visual"], React.FC<VisualProps>> = {
  ai: AiVisual,
  wrong: WrongVisual,
  formula: FormulaVisual,
  number: NumberVisual,
  split: SplitVisual,
  words: WordsVisual,
  code: CodeVisual,
  agree: AgreeVisual,
  deliver: DeliverVisual,
  checked: CheckedVisual,
  name: NameVisual,
};

export const StartShortCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG, color: "#fff", fontFamily: sceneFont }}>
    <Grid />
    <div style={{ position: "absolute", left: 70, right: 150, top: 420, textAlign: "center" }}>
      <div style={{ fontFamily: display, fontSize: 170, lineHeight: 1, color: MINT, textShadow: `0 0 40px ${MINT}` }}>AI + PHYSICS</div>
      <div style={{ fontFamily: display, fontSize: 120, lineHeight: 1.1, marginTop: 30 }}>CHECKED BY CODE</div>
      <div style={{ fontSize: 46, marginTop: 50, color: "rgba(255,255,255,0.8)" }}>Adithya Vikram</div>
    </div>
    <div style={{ position: "absolute", left: 370, top: 1050 }}>
      <Kan radius={100} expression="excited" arms="out" look={{ x: 0, y: 0.3 }} time={0.4} />
    </div>
  </AbsoluteFill>
);

export { shortLineKey };
