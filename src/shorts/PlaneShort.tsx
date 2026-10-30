import { Audio } from "@remotion/media";
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
import { Arrow } from "../components/Arrow";
import { Tex } from "../components/Tex";
import { Kan } from "../mascot/Kan";
import { displayFont, sceneFont } from "../sceneFont";
import { COLORS, SURFACE } from "../theme";
import { Backdrop, CLAMP, Confetti, Sfx, SfxName, popIn } from "../video/ui";
import {
  DROP,
  DROP_LINES,
  DropVisual,
  G,
  MONKEY,
  MONKEY_LINES,
  MonkeyVisual,
  PlaneLine,
  PlannedLine,
  ShortVoice,
  ballAt,
  bare,
  dropTime,
  fallHeight,
  fallSpeed,
  hitHeight,
  hitTime,
  monkeyAt,
  monkeyLandTime,
  planLines,
  throwRange,
  throwX,
  ux,
  uy,
} from "./plane";

/**
 * "Motion in a Plane" Shorts (9:16): physics animation in the middle, the spoken line at the top,
 * the current word huge at the bottom. Physical objects move by the equations only (no easing);
 * slow motion is a fixed, labelled factor. Everything stays inside the Shorts safe area (x 54–950, y 288–1536).
 */

export const PLANE_FPS = 30;
export const PlaneShortProps = z.object({
  lang: z.enum(["en"]),
  voice: z.record(
    z.string(),
    z.object({
      src: z.string(),
      seconds: z.number().positive(),
      words: z
        .array(z.object({ start: z.number(), text: z.string() }))
        .optional(),
    }),
  ),
});
export type PlaneShortProps = z.infer<typeof PlaneShortProps>;

export const dropMetadata: CalculateMetadataFunction<PlaneShortProps> = ({
  props,
}) => ({
  durationInFrames: Math.round(
    planLines(DROP_LINES, props.voice as ShortVoice).seconds * PLANE_FPS,
  ),
});
export const monkeyMetadata: CalculateMetadataFunction<PlaneShortProps> = ({
  props,
}) => ({
  durationInFrames: Math.round(
    planLines(MONKEY_LINES, props.voice as ShortVoice).seconds * PLANE_FPS,
  ),
});

const MINT = COLORS.kan;
const YELLOW = COLORS.displacement;
const WORD_Y = 1290;
const SLOW = 0.5; // slow motion: half speed, shown on screen
const SVGW = 1080;
const SVGH = 1920;

export const fade = (t: number, start: number, len = 0.3) =>
  interpolate(t, [start, start + len], [0, 1], CLAMP);

// ---------- shared frame: subtitle, big word, progress, punch-in, sounds ----------

export interface SceneCtx {
  t: number; // seconds into the Short
  starts: number[]; // start of each line
  line: number; // current line index
  lines: PlannedLine[]; // planned lines, with word times
}

export function ShortFrame<V extends string>({
  lines,
  voice,
  Scene,
  sounds,
}: {
  lines: PlaneLine<V>[];
  voice: ShortVoice;
  Scene: React.FC<{ ctx: SceneCtx }>;
  sounds: (
    line: PlannedLine,
    script: PlaneLine<V>,
  ) => [number, SfxName, number][];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const plan = planLines(lines, voice);
  const starts = plan.lines.map((l) => l.from);
  const current = Math.max(0, starts.filter((s) => s <= t).length - 1);
  const local = t - starts[current];
  const punch = interpolate(local, [0, 0.3], [1.05, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const flash = interpolate(local, [0, 0.16], [0.12, 0], CLAMP);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.board,
        color: "#fff",
        fontFamily: sceneFont,
      }}
    >
      <Backdrop />
      <AbsoluteFill style={{ scale: String(punch) }}>
        <Scene ctx={{ t, starts, line: current, lines: plan.lines }} />
        <Subtitle
          text={lines[current].say}
          line={plan.lines[current]}
          local={local}
        />
        <BigWord
          script={lines[current]}
          line={plan.lines[current]}
          local={local}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "#fff", opacity: flash, pointerEvents: "none" }}
      />
      <Progress p={Math.min(1, t / plan.seconds)} />
      {plan.lines.map((l) => {
        const until =
          l.index + 1 < plan.lines.length
            ? plan.lines[l.index + 1].from
            : plan.seconds;
        return (
          <Sequence
            key={l.index}
            from={Math.round(l.from * fps)}
            durationInFrames={Math.max(1, Math.round((until - l.from) * fps))}
            layout="none"
          >
            {l.clip && <Audio src={staticFile(l.clip.src)} />}
            {sounds(l, lines[l.index]).map(([at, name, volume], i) => (
              <Sfx key={i} at={at} name={name} volume={volume} />
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/** Whoosh on each cut, a pop on each key word, plus the scene's own sounds. */
export function baseSounds<V extends string>(
  line: PlannedLine,
  script: PlaneLine<V>,
  extra: Partial<Record<V, [number, SfxName, number][]>>,
): [number, SfxName, number][] {
  const cues: [number, SfxName, number][] =
    line.index === 0 ? [] : [[0, "whoosh", 0.2]];
  for (const w of line.words)
    if (script.accent?.includes(bare(w.text))) cues.push([w.start, "pop", 0.3]);
  return [...cues, ...(extra[script.visual] ?? [])];
}

const Progress: React.FC<{ p: number }> = ({ p }) => (
  <div
    style={{
      position: "absolute",
      left: 54,
      right: 130,
      top: 300,
      height: 10,
      borderRadius: 5,
      background: "rgba(255,255,255,0.12)",
    }}
  >
    <div
      style={{
        width: `${p * 100}%`,
        height: "100%",
        borderRadius: 5,
        background: `linear-gradient(90deg, ${MINT}, ${YELLOW})`,
        boxShadow: `0 0 16px ${MINT}`,
      }}
    />
  </div>
);

const Subtitle: React.FC<{
  text: string;
  line: PlannedLine;
  local: number;
}> = ({ text, line, local }) => {
  const words = text.split(/\s+/);
  const spoken = line.words.filter((w) => w.start <= local).length;
  const shown = line.words.length
    ? Math.ceil((spoken * words.length) / line.words.length)
    : words.length;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 146,
        top: 340,
        textAlign: "center",
        fontSize: 42,
        fontWeight: 700,
        lineHeight: 1.3,
        opacity: fade(local, 0, 0.2),
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            color:
              i === shown - 1
                ? YELLOW
                : i < shown
                  ? "#fff"
                  : "rgba(255,255,255,0.45)",
            textShadow: i === shown - 1 ? `0 0 18px ${YELLOW}88` : undefined,
          }}
        >
          {w}{" "}
        </span>
      ))}
    </div>
  );
};

const BigWord: React.FC<{
  script: PlaneLine<string>;
  line: PlannedLine;
  local: number;
}> = ({ script, line, local }) => {
  const current = [...line.words].reverse().find((w) => w.start <= local);
  if (!current) return null;
  const word = current.text.replace(/[,.?:!]+$/, "");
  const key = bare(word);
  const accent = script.accent?.includes(key);
  const echo = script.echo?.includes(key);
  const p = popIn(local, current.start, 0.2);
  const size = word.length > 9 ? 112 : 140;
  const style: React.CSSProperties = {
    position: "absolute",
    left: 54,
    right: 130,
    textAlign: "center",
    fontFamily: displayFont,
    fontSize: size,
    lineHeight: 1,
    textTransform: "uppercase",
    letterSpacing: 2,
  };
  return (
    <>
      {echo &&
        [1, 2].map((k) => (
          <div
            key={k}
            style={{
              ...style,
              top: WORD_Y + k * size * 0.95,
              color: "transparent",
              WebkitTextStroke: `2px ${MINT}`,
              opacity: (k === 1 ? 0.45 : 0.18) * Math.min(1, p),
            }}
          >
            {word}
          </div>
        ))}
      <div
        style={{
          ...style,
          top: WORD_Y,
          scale: String(1.2 - 0.2 * Math.min(1, p)),
          opacity: Math.min(1, p * 1.5),
        }}
      >
        <span
          style={
            accent
              ? {
                  color: COLORS.board,
                  background: MINT,
                  padding: "6px 24px 0",
                  borderRadius: 18,
                  display: "inline-block",
                  rotate: `${-2 * Math.min(1, p)}deg`,
                  boxShadow: `0 0 40px ${MINT}aa`,
                }
              : { color: "#fff", textShadow: "0 6px 24px rgba(0,0,0,0.6)" }
          }
        >
          {word}
        </span>
      </div>
    </>
  );
};

// ---------- small drawing pieces ----------

export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  o: number;
  color?: string;
  children: React.ReactNode;
}> = ({ x, y, w, o, color = MINT, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      background: SURFACE,
      border: `3px solid ${color}`,
      borderRadius: 26,
      padding: "18px 26px",
      boxShadow: `0 0 36px ${color}33`,
      opacity: Math.min(1, o),
      scale: String(0.85 + 0.15 * Math.min(1.05, o)),
      fontSize: 38,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{
  x: number;
  y: number;
  color: string;
  size?: number;
  o?: number;
  anchor?: "start" | "middle" | "end";
  children: React.ReactNode;
}> = ({ x, y, color, size = 34, o = 1, anchor = "middle", children }) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    fontWeight={800}
    textAnchor={anchor}
    opacity={o}
    fontFamily={sceneFont}
  >
    {children}
  </text>
);

export const Ball: React.FC<{ x: number; y: number; color: string; r?: number }> = ({
  x,
  y,
  color,
  r = 22,
}) => (
  <g>
    <circle cx={x} cy={y} r={r + 10} fill={color} opacity={0.18} />
    <circle cx={x} cy={y} r={r} fill={color} />
    <circle
      cx={x - r * 0.35}
      cy={y - r * 0.35}
      r={r * 0.3}
      fill="#fff"
      opacity={0.5}
    />
  </g>
);

// ---------- Part 1: drop vs throw ----------

const D = { ground: 1150, top: 560, edge: 170, aX: 190, bX: 232 }; // px; 20 m tall cliff
const DS = (D.ground - D.top) / DROP.h; // px per metre (29.5)
const dropY = (t: number) => D.ground - fallHeight(t) * DS;

const DropScene: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const at = (v: DropVisual) =>
    starts[DROP_LINES.findIndex((l) => l.visual === v)];
  const animStart = at("watch") + 0.7;
  const sim = Math.max(0, Math.min(dropTime, (t - animStart) * SLOW)); // physics time
  const running = t >= animStart;
  const vis = DROP_LINES[line].visual;
  const after = (v: DropVisual) => t >= at(v);
  const strobe = Array.from({ length: 9 }, (_, i) => i * 0.25).filter(
    (s) => s <= sim + 1e-9,
  );
  const ax = D.aX;
  const bx = (tt: number) => D.bX + throwX(tt) * DS;
  const showGhost = vis === "guess";
  return (
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      {/* cliff and ground */}
      <rect
        x={60}
        y={D.top + 22}
        width={D.edge - 60}
        height={D.ground - D.top - 22}
        fill={COLORS.boardRaised}
        stroke={COLORS.boardLine}
        strokeWidth={4}
      />
      <line
        x1={60}
        y1={D.ground}
        x2={960}
        y2={D.ground}
        stroke={COLORS.chalkDim}
        strokeWidth={5}
      />
      {[0, 5, 10, 15, 20].map((m) => (
        <g key={m} opacity={0.6}>
          <line
            x1={D.bX + m * DS}
            y1={D.ground}
            x2={D.bX + m * DS}
            y2={D.ground + 14}
            stroke={COLORS.chalkDim}
            strokeWidth={3}
          />
          <Label
            x={D.bX + m * DS}
            y={D.ground + 46}
            color={COLORS.chalkDim}
            size={24}
          >
            {m} m
          </Label>
        </g>
      ))}
      <Label x={115} y={D.top + 340} color={COLORS.chalkDim} size={28}>
        {DROP.h} m
      </Label>
      {/* the guess: the thrown ball's real (longer) path, as a ghost */}
      {showGhost && (
        <g opacity={fade(t - at("guess"), 0.3)}>
          <polyline
            points={Array.from({ length: 41 }, (_, i) => {
              const tt = (dropTime * i) / 40;
              return `${bx(tt)},${dropY(tt)}`;
            }).join(" ")}
            fill="none"
            stroke={YELLOW}
            strokeWidth={4}
            strokeDasharray="12 10"
          />
          <line
            x1={ax}
            y1={D.top}
            x2={ax}
            y2={D.ground}
            stroke={MINT}
            strokeWidth={4}
            strokeDasharray="12 10"
          />
          <Label x={620} y={760} color={YELLOW} size={36}>
            longer path...
          </Label>
          <Label x={620} y={806} color={YELLOW} size={36}>
            so slower to land?
          </Label>
        </g>
      )}
      {/* stroboscope: where each ball was every 0.25 s, joined by a line at equal times */}
      {running &&
        strobe.map((s) => (
          <g key={s} opacity={0.55}>
            <line
              x1={ax}
              y1={dropY(s)}
              x2={bx(s)}
              y2={dropY(s)}
              stroke="#fff"
              strokeWidth={2}
              strokeDasharray="6 8"
              opacity={0.6}
            />
            <circle cx={ax} cy={dropY(s)} r={10} fill={MINT} />
            <circle cx={bx(s)} cy={dropY(s)} r={10} fill={YELLOW} />
          </g>
        ))}
      {/* the balls themselves */}
      <Ball x={ax} y={dropY(sim)} color={MINT} />
      <Ball x={bx(sim)} y={dropY(sim)} color={YELLOW} />
      {vis === "setup" && (
        <g opacity={fade(t, 0.2)}>
          <circle cx={560} cy={640} r={14} fill={MINT} />
          <Label x={588} y={652} color={MINT} size={34} anchor="start">
            A: just dropped
          </Label>
          <circle cx={560} cy={700} r={14} fill={YELLOW} />
          <Label x={588} y={712} color={YELLOW} size={34} anchor="start">
            B: thrown at {DROP.u} m/s →
          </Label>
        </g>
      )}
      {running && !after("secret") && (
        <g>
          <Label x={930} y={600} color="#fff" size={44} anchor="end">
            t = {sim.toFixed(2)} s
          </Label>
          <Label x={930} y={640} color={COLORS.chalkDim} size={26} anchor="end">
            slow motion ×{SLOW}
          </Label>
        </g>
      )}
      {/* landing stamps */}
      {after("land") && (
        <g opacity={popIn(t, at("land") + 0.2, 0.4)}>
          <Label
            x={ax + 30}
            y={D.ground - 50}
            color={MINT}
            size={40}
            anchor="start"
          >
            {dropTime} s
          </Label>
          <Label x={bx(dropTime)} y={D.ground - 50} color={YELLOW} size={40}>
            {dropTime} s
          </Label>
        </g>
      )}
      {/* the secret: velocity parts at each strobe point, and g */}
      {(vis === "secret" || vis === "split" || vis === "plane") && (
        <g opacity={fade(t - at("secret"), 0.6)}>
          <Arrow
            x1={880}
            y1={570}
            x2={880}
            y2={690}
            color={COLORS.acceleration}
            head="double-chevron"
            width={6}
            label={{ text: "g" }}
            fontSize={40}
          />
          <Label
            x={850}
            y={640}
            color={COLORS.acceleration}
            size={34}
            anchor="end"
          >
            gravity: only down
          </Label>
        </g>
      )}
      {after("split") &&
        [0.5, 1, 1.5].map((s, i) => (
          <g key={s} opacity={fade(t - at("split"), 0.3 + i * 0.4)}>
            <Arrow
              x1={bx(s)}
              y1={dropY(s)}
              x2={bx(s) + DROP.u * 6}
              y2={dropY(s)}
              color={COLORS.velocity}
              head="open"
              dashed
              width={5}
            />
            <Arrow
              x1={bx(s)}
              y1={dropY(s)}
              x2={bx(s)}
              y2={dropY(s) + fallSpeed(s) * 6}
              color={COLORS.velocity}
              head="open"
              dashed
              width={5}
            />
            <Arrow
              x1={ax}
              y1={dropY(s)}
              x2={ax}
              y2={dropY(s) + fallSpeed(s) * 6}
              color={COLORS.velocity}
              head="open"
              dashed
              width={5}
            />
          </g>
        ))}
      {vis === "split" && (
        <g opacity={fade(t - at("split"), 1.6)}>
          <Label
            x={240}
            y={990}
            color={COLORS.velocity}
            size={32}
            anchor="start"
          >
            sideways: always {DROP.u} m/s
          </Label>
          <Label
            x={240}
            y={1034}
            color={COLORS.velocity}
            size={32}
            anchor="start"
          >
            falling: same for A and B
          </Label>
        </g>
      )}
      {(vis === "plane" || vis === "next") && (
        <g opacity={fade(t - at("plane"), 0.3)}>
          <Label
            x={240}
            y={990}
            color={COLORS.velocity}
            size={36}
            anchor="start"
          >
            x: steady steps →
          </Label>
          <Label
            x={240}
            y={1036}
            color={COLORS.acceleration}
            size={36}
            anchor="start"
          >
            y: bigger steps ↓
          </Label>
        </g>
      )}
      {/* x positions at landing, measured */}
      {after("land") && vis === "land" && (
        <Label x={bx(dropTime)} y={D.ground + 90} color={YELLOW} size={30}>
          lands {throwRange} m away
        </Label>
      )}
    </svg>
  );
};

const DropOverlay: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const vis = DROP_LINES[line].visual;
  const at = (v: DropVisual) =>
    starts[DROP_LINES.findIndex((l) => l.visual === v)];
  return (
    <>
      {vis === "question" &&
        ["A first", "B first", "Together"].map((o, i) => (
          <div
            key={o}
            style={{
              position: "absolute",
              left: 560,
              top: 640 + i * 110,
              width: 380,
              opacity: popIn(t, at("question") + 0.4 + i * 0.25, 0.35),
            }}
          >
            <div
              style={{
                background: SURFACE,
                border: `3px solid ${COLORS.boardLine}`,
                borderRadius: 20,
                padding: "14px 22px",
                fontSize: 38,
                fontWeight: 800,
              }}
            >
              <span style={{ color: MINT }}>{"ABC"[i]}.</span> {o}?
            </div>
          </div>
        ))}
      {vis === "numbers" && (
        <Card
          x={290}
          y={600}
          w={640}
          o={popIn(t, at("numbers") + 0.3)}
          color={YELLOW}
        >
          <Tex
            tex={`t = \\sqrt{\\dfrac{2h}{g}} = \\sqrt{\\dfrac{2 \\times ${DROP.h}}{${G}}} = ${dropTime}\\,\\text{s}`}
          />
          <div style={{ fontSize: 28, color: COLORS.chalkDim, marginTop: 8 }}>
            doesn&apos;t depend on the sideways speed
          </div>
        </Card>
      )}
      {vis === "next" && (
        <Card
          x={150}
          y={560}
          w={780}
          o={popIn(t, at("next") + 0.2)}
          color={COLORS.force}
        >
          <div
            style={{
              fontFamily: displayFont,
              fontSize: 76,
              color: COLORS.force,
              letterSpacing: 2,
            }}
          >
            PART 2
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, marginTop: 6 }}>
            The throw that can&apos;t miss 🐒
          </div>
        </Card>
      )}
    </>
  );
};

export const DropShort: React.FC<PlaneShortProps> = ({ voice }) => (
  <ShortFrame
    lines={DROP_LINES}
    voice={voice as ShortVoice}
    Scene={({ ctx }) => (
      <>
        <DropScene ctx={ctx} />
        <DropOverlay ctx={ctx} />
      </>
    )}
    sounds={(l, s) =>
      baseSounds(l, s, {
        watch: [
          [0.7, "swish", 0.35],
          [0.7 + dropTime / SLOW, "thud", 0.55],
        ],
        land: [[0.25, "ding", 0.4]],
        numbers: [[0.4, "ding", 0.35]],
        next: [[0.2, "sparkle", 0.4]],
        question: [
          [0.4, "tick", 0.4],
          [0.65, "tick", 0.4],
          [0.9, "tick", 0.4],
        ],
      })
    }
  />
);

// ---------- Part 2: the monkey ----------

const M = { gx: 140, gy: 1150, s: 37 }; // launch point (px) and px per metre
const mx = (x: number) => M.gx + x * M.s;
const my = (y: number) => M.gy - y * M.s;

const Monkey: React.FC<{ x: number; y: number; holding: boolean }> = ({
  x,
  y,
  holding,
}) => (
  <g>
    {holding && (
      <line
        x1={x - 22}
        y1={y - 30}
        x2={x - 30}
        y2={y - 64}
        stroke="#8a5a3c"
        strokeWidth={10}
        strokeLinecap="round"
      />
    )}
    {holding && (
      <line
        x1={x + 22}
        y1={y - 30}
        x2={x + 30}
        y2={y - 64}
        stroke="#8a5a3c"
        strokeWidth={10}
        strokeLinecap="round"
      />
    )}
    {!holding && (
      <line
        x1={x - 26}
        y1={y - 10}
        x2={x - 56}
        y2={y - 46}
        stroke="#8a5a3c"
        strokeWidth={10}
        strokeLinecap="round"
      />
    )}
    {!holding && (
      <line
        x1={x + 26}
        y1={y - 10}
        x2={x + 56}
        y2={y - 46}
        stroke="#8a5a3c"
        strokeWidth={10}
        strokeLinecap="round"
      />
    )}
    <path
      d={`M ${x + 20} ${y + 30} q 40 20 30 60`}
      fill="none"
      stroke="#8a5a3c"
      strokeWidth={8}
      strokeLinecap="round"
    />
    <circle cx={x - 30} cy={y - 6} r={12} fill="#8a5a3c" />
    <circle cx={x + 30} cy={y - 6} r={12} fill="#8a5a3c" />
    <circle cx={x} cy={y} r={34} fill="#8a5a3c" />
    <ellipse cx={x} cy={y + 8} rx={22} ry={18} fill="#e6c49b" />
    <circle cx={x - 10} cy={y - 6} r={5} fill="#1b1b1b" />
    <circle cx={x + 10} cy={y - 6} r={5} fill="#1b1b1b" />
    <path
      d={`M ${x - 8} ${y + 14} q 8 6 16 0`}
      fill="none"
      stroke="#1b1b1b"
      strokeWidth={3}
    />
  </g>
);

const MonkeyScene: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const at = (v: MonkeyVisual) =>
    starts[MONKEY_LINES.findIndex((l) => l.visual === v)];
  const after = (v: MonkeyVisual) => t >= at(v);
  const vis = MONKEY_LINES[line].visual;
  const animStart = at("watch") + 0.8;
  const sim = Math.max(0, Math.min(hitTime, (t - animStart) * SLOW)); // frozen at the moment they meet
  const running = t >= animStart;
  const hit = running && sim >= hitTime;
  const ball = ballAt(sim);
  const monkey = monkeyAt(sim);
  const strobe = Array.from({ length: 9 }, (_, i) => i * 0.125).filter(
    (s) => s <= sim + 1e-9,
  );
  const aimO = after("aim") ? fade(t - at("aim"), 0.3) : 0;
  const ghosts =
    vis === "nogravity" || vis === "both" || vis === "five" || vis === "meet";
  return (
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <line
        x1={60}
        y1={M.gy}
        x2={960}
        y2={M.gy}
        stroke={COLORS.chalkDim}
        strokeWidth={5}
      />
      {/* tree and branch */}
      <rect
        x={mx(MONKEY.d) + 50}
        y={my(MONKEY.H) - 130}
        width={34}
        height={M.gy - my(MONKEY.H) + 130}
        fill="#5b3a26"
      />
      <line
        x1={mx(MONKEY.d) - 70}
        y1={my(MONKEY.H) - 64}
        x2={mx(MONKEY.d) + 70}
        y2={my(MONKEY.H) - 64}
        stroke="#6b4630"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <circle
        cx={mx(MONKEY.d) + 70}
        cy={my(MONKEY.H) - 150}
        r={70}
        fill="#1f6b45"
        opacity={0.85}
      />
      {/* line of sight: the aim */}
      <line
        x1={mx(0)}
        y1={my(0)}
        x2={mx(MONKEY.d)}
        y2={my(MONKEY.H)}
        stroke="#fff"
        strokeWidth={3}
        strokeDasharray="14 12"
        opacity={0.55 * aimO}
      />
      {after("aim") && (
        <Label
          x={mx(5)}
          y={my(5.6)}
          color="#fff"
          size={28}
          o={aimO}
          anchor="start"
        >
          aim: straight at it (
          {Math.round((Math.atan2(MONKEY.H, MONKEY.d) * 180) / Math.PI)}°)
        </Label>
      )}
      {/* strobe trails */}
      {running &&
        strobe.map((s) => (
          <g key={s} opacity={0.5}>
            <circle
              cx={mx(ballAt(s).x)}
              cy={my(ballAt(s).y)}
              r={9}
              fill={YELLOW}
            />
            <circle
              cx={mx(MONKEY.d)}
              cy={my(monkeyAt(s).y)}
              r={9}
              fill="#c98b5e"
            />
          </g>
        ))}
      {/* no-gravity ghosts: where the ball would be on the straight line */}
      {ghosts &&
        [0.5, 1].map((s) => (
          <circle
            key={s}
            cx={mx(ux * s)}
            cy={my(uy * s)}
            r={20}
            fill="none"
            stroke={YELLOW}
            strokeWidth={4}
            strokeDasharray="6 6"
            opacity={fade(t - at("nogravity"), 0.3)}
          />
        ))}
      {(vis === "both" || vis === "five" || vis === "meet") &&
        [0.5, 1].map((s, i) => (
          <g key={s} opacity={fade(t - at("both"), 0.4 + i * 0.5)}>
            <Arrow
              x1={mx(ux * s)}
              y1={my(uy * s)}
              x2={mx(ux * s)}
              y2={my(ballAt(s).y)}
              color={YELLOW}
              head="bars"
              width={5}
            />
            {i === 0 && (
              <Arrow
                x1={mx(MONKEY.d) - 70}
                y1={my(MONKEY.H)}
                x2={mx(MONKEY.d) - 70}
                y2={my(monkeyAt(s).y)}
                color={YELLOW}
                head="bars"
                width={5}
              />
            )}
            <Label
              x={mx(ux * s) - 22}
              y={(my(uy * s) + my(ballAt(s).y)) / 2 + 12}
              color={YELLOW}
              size={30}
              anchor="end"
            >
              {(0.5 * G * s * s).toFixed(2).replace(/\.?0+$/, "")} m
            </Label>
            {i === 0 && (
              <Label
                x={mx(MONKEY.d) - 92}
                y={(my(MONKEY.H) + my(monkeyAt(s).y)) / 2 + 12}
                color={YELLOW}
                size={30}
                anchor="end"
              >
                {(0.5 * G * s * s).toFixed(2).replace(/\.?0+$/, "")} m
              </Label>
            )}
          </g>
        ))}
      {/* the thrower (Kan) is drawn as HTML below; the ball and monkey here */}
      {after("aim") && (
        <Ball x={mx(ball.x)} y={my(ball.y)} color={YELLOW} r={20} />
      )}
      <Monkey x={mx(monkey.x)} y={my(monkey.y)} holding={!running} />
      {hit && (
        <g opacity={popIn(t, animStart + hitTime / SLOW, 0.4)}>
          <circle
            cx={mx(MONKEY.d)}
            cy={my(hitHeight)}
            r={70}
            fill="none"
            stroke={COLORS.force}
            strokeWidth={8}
          />
          <Label
            x={mx(MONKEY.d) - 84}
            y={my(hitHeight) + 96}
            color={COLORS.force}
            size={60}
            anchor="end"
          >
            HIT!
          </Label>
        </g>
      )}
      {running && !after("nogravity") && (
        <g>
          <Label x={80} y={600} color="#fff" size={44} anchor="start">
            t = {sim.toFixed(2)} s
          </Label>
          <Label
            x={80}
            y={640}
            color={COLORS.chalkDim}
            size={26}
            anchor="start"
          >
            slow motion ×{SLOW}
          </Label>
        </g>
      )}
      {after("letgo") && !running && (
        <Label
          x={mx(MONKEY.d) - 60}
          y={my(MONKEY.H) + 90}
          color="#e6c49b"
          size={30}
          anchor="end"
          o={fade(t - at("letgo"), 0.3)}
        >
          lets go when you throw!
        </Label>
      )}
    </svg>
  );
};

const MonkeyOverlay: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const vis = MONKEY_LINES[line].visual;
  const at = (v: MonkeyVisual) =>
    starts[MONKEY_LINES.findIndex((l) => l.visual === v)];
  return (
    <>
      <div style={{ position: "absolute", left: M.gx - 70, top: M.gy - 120 }}>
        <Kan
          radius={46}
          expression={
            vis === "hit" || vis === "end" || vis === "meet"
              ? "excited"
              : "calm"
          }
          arms={vis === "aim" ? "up" : "out"}
          look={{ x: 1, y: -0.6 }}
          time={t}
        />
      </div>
      {vis === "both" && (
        <Card
          x={70}
          y={680}
          w={380}
          o={popIn(t, at("both") + 0.5)}
          color={YELLOW}
        >
          <Tex tex={`\\text{drop} = \\tfrac{1}{2}\\,g\\,t^2`} />
        </Card>
      )}
      {vis === "condition" && (
        <Card
          x={110}
          y={560}
          w={820}
          o={popIn(t, at("condition") + 0.3)}
          color={MINT}
        >
          <div>
            <Tex
              tex={`\\text{meet: } t = \\dfrac{d}{u\\cos\\theta} = ${hitTime}\\,\\text{s}`}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <Tex
              tex={`\\text{monkey lands: } t = \\sqrt{\\dfrac{2H}{g}} \\approx ${monkeyLandTime.toFixed(2)}\\,\\text{s}`}
            />
          </div>
          <div
            style={{ fontSize: 34, fontWeight: 800, color: MINT, marginTop: 8 }}
          >
            {hitTime} s &lt; {monkeyLandTime.toFixed(2)} s ✓ hit first
          </div>
        </Card>
      )}
      {vis === "end" && (
        <Confetti local={t - at("end")} at={0.3} x={540} y={700} count={130} />
      )}
    </>
  );
};

export const MonkeyShort: React.FC<PlaneShortProps> = ({ voice }) => (
  <ShortFrame
    lines={MONKEY_LINES}
    voice={voice as ShortVoice}
    Scene={({ ctx }) => (
      <>
        <MonkeyScene ctx={ctx} />
        <MonkeyOverlay ctx={ctx} />
      </>
    )}
    sounds={(l, s) =>
      baseSounds(l, s, {
        aim: [[0.3, "swish", 0.3]],
        watch: [
          [0.8, "swish", 0.35],
          [0.8 + hitTime / SLOW, "thud", 0.55],
          [0.8 + hitTime / SLOW + 0.05, "success", 0.45],
        ],
        five: [[0.5, "ding", 0.35]],
        condition: [[0.4, "ding", 0.3]],
        end: [[0.3, "sparkle", 0.4]],
      })
    }
  />
);

// ---------- covers ----------

const CoverTitle: React.FC<{ kicker: string; title: string; sub: string }> = ({
  kicker,
  title,
  sub,
}) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      right: 150,
      top: 360,
      textAlign: "center",
    }}
  >
    <div
      style={{ fontSize: 40, fontWeight: 800, color: MINT, letterSpacing: 4 }}
    >
      {kicker}
    </div>
    <div
      style={{
        fontFamily: displayFont,
        fontSize: 138,
        lineHeight: 1.02,
        marginTop: 16,
        textTransform: "uppercase",
      }}
    >
      {title}
    </div>
    <div
      style={{ fontSize: 46, fontWeight: 800, color: YELLOW, marginTop: 22 }}
    >
      {sub}
    </div>
  </div>
);

export const DropCover: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.board,
      color: "#fff",
      fontFamily: sceneFont,
    }}
  >
    <Backdrop />
    <CoverTitle
      kicker="MOTION IN A PLANE · PART 1"
      title="Drop vs throw"
      sub="Which lands first?"
    />
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <g transform="translate(0, 330)">
        <rect
          x={60}
          y={D.top + 22}
          width={D.edge - 60}
          height={D.ground - D.top - 22}
          fill={COLORS.boardRaised}
          stroke={COLORS.boardLine}
          strokeWidth={4}
        />
        {Array.from({ length: 9 }, (_, i) => i * 0.25).map((s) => (
          <g key={s}>
            <line
              x1={D.aX}
              y1={dropY(s)}
              x2={D.bX + throwX(s) * DS}
              y2={dropY(s)}
              stroke="#fff"
              strokeWidth={2}
              strokeDasharray="6 8"
              opacity={0.4}
            />
            <circle cx={D.aX} cy={dropY(s)} r={12} fill={MINT} />
            <circle
              cx={D.bX + throwX(s) * DS}
              cy={dropY(s)}
              r={12}
              fill={YELLOW}
            />
          </g>
        ))}
        <line
          x1={60}
          y1={D.ground}
          x2={960}
          y2={D.ground}
          stroke={COLORS.chalkDim}
          strokeWidth={5}
        />
      </g>
    </svg>
  </AbsoluteFill>
);

export const MonkeyCover: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.board,
      color: "#fff",
      fontFamily: sceneFont,
    }}
  >
    <Backdrop />
    <CoverTitle
      kicker="MOTION IN A PLANE · PART 2"
      title="You can't miss"
      sub="The monkey problem"
    />
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <g transform="translate(0, 330)">
        <line
          x1={60}
          y1={M.gy}
          x2={960}
          y2={M.gy}
          stroke={COLORS.chalkDim}
          strokeWidth={5}
        />
        <line
          x1={mx(0)}
          y1={my(0)}
          x2={mx(MONKEY.d)}
          y2={my(MONKEY.H)}
          stroke="#fff"
          strokeWidth={3}
          strokeDasharray="14 12"
          opacity={0.5}
        />
        {Array.from({ length: 9 }, (_, i) => i * 0.125).map((s) => (
          <g key={s}>
            <circle
              cx={mx(ballAt(s).x)}
              cy={my(ballAt(s).y)}
              r={11}
              fill={YELLOW}
              opacity={0.8}
            />
          </g>
        ))}
        <Monkey x={mx(MONKEY.d)} y={my(hitHeight)} holding={false} />
      </g>
    </svg>
  </AbsoluteFill>
);
