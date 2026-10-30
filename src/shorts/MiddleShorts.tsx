import React from "react";
import { AbsoluteFill, CalculateMetadataFunction } from "remotion";
import { Arrow } from "../components/Arrow";
import { Kan } from "../mascot/Kan";
import { displayFont, sceneFont } from "../sceneFont";
import { COLORS, SURFACE } from "../theme";
import { Backdrop, Confetti, popIn } from "../video/ui";
import { BOX, FRICTION_LINES, FrictionVisual, KICK, MEASURE_LINES, MeasureVisual, RAMP, SPANS, TABLE_M, boxX, cruiseSpeed, frictionAt, pushAt, spansFor, weightN } from "./middle";
import { ShortVoice, planLines } from "./plane";
import { Card, Label, PlaneShortProps, SceneCtx, ShortFrame, baseSounds, fade } from "./PlaneShort";

/**
 * Class 6–8 Shorts (9:16) on the shared Short engine: the scene in the middle, the spoken line on top,
 * the current word big at the bottom. Sizes are drawn to scale; the box moves by Newton's 2nd law only.
 */

export const measureMetadata: CalculateMetadataFunction<PlaneShortProps> = ({ props }) => ({
  durationInFrames: Math.round(planLines(MEASURE_LINES, props.voice as ShortVoice).seconds * 30),
});
export const frictionMetadata: CalculateMetadataFunction<PlaneShortProps> = ({ props }) => ({
  durationInFrames: Math.round(planLines(FRICTION_LINES, props.voice as ShortVoice).seconds * 30),
});

const MINT = COLORS.kan;
const YELLOW = COLORS.displacement;
const SVGW = 1080;
const SVGH = 1920;
const WOOD = "#9a6a43";
const WOOD_DARK = "#6e4a2e";

// ---------- Class 6: who measured it wrong? ----------

const T = { x0: 140, y: 900, pxPerM: 500 }; // table top: 1.6 m = 800 px
const cm = (c: number) => (c / 100) * T.pxPerM;

const Table: React.FC = () => (
  <g>
    <rect x={T.x0} y={T.y} width={TABLE_M * T.pxPerM} height={34} rx={8} fill={WOOD} stroke={WOOD_DARK} strokeWidth={4} />
    <rect x={T.x0 + 30} y={T.y + 34} width={26} height={210} fill={WOOD_DARK} />
    <rect x={T.x0 + TABLE_M * T.pxPerM - 56} y={T.y + 34} width={26} height={210} fill={WOOD_DARK} />
    <line x1={60} y1={T.y + 244} x2={1020} y2={T.y + 244} stroke={COLORS.chalkDim} strokeWidth={4} />
  </g>
);

/** A row of handspans laid along the table; `shown` of them visible so far. */
const SpanRow: React.FC<{ cmEach: number; count: number; shown: number; y: number; color: string; name: string; o: number }> = ({ cmEach, count, shown, y, color, name, o }) => (
  <g opacity={o}>
    {Array.from({ length: count }, (_, i) => i)
      .filter((i) => i < shown)
      .map((i) => (
        <g key={i}>
          <rect x={T.x0 + i * cm(cmEach) + 3} y={y} width={cm(cmEach) - 6} height={62} rx={14} fill={color} opacity={0.88} />
          <text x={T.x0 + (i + 0.5) * cm(cmEach)} y={y + 44} fill={COLORS.board} fontSize={32} fontWeight={800} textAnchor="middle" fontFamily={sceneFont}>
            {i + 1}
          </text>
        </g>
      ))}
    <Label x={T.x0} y={y - 16} color={color} size={30} anchor="start">
      {name}: {Math.min(shown, count)} spans
    </Label>
  </g>
);

/** The metre stick, drawn to scale with 10 cm stripes. */
const MetreStick: React.FC<{ x: number; y: number; m: number; o: number }> = ({ x, y, m, o }) => (
  <g opacity={o}>
    {Array.from({ length: Math.round(m * 10) }, (_, i) => (
      <rect key={i} x={x + cm(i * 10)} y={y} width={cm(10)} height={40} fill={i % 2 ? "#222" : YELLOW} />
    ))}
    <rect x={x} y={y} width={m * T.pxPerM} height={40} fill="none" stroke={YELLOW} strokeWidth={3} />
  </g>
);

const MeasureScene: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const idx = (v: MeasureVisual) => MEASURE_LINES.findIndex((l) => l.visual === v);
  const at = (v: MeasureVisual) => starts[idx(v)];
  const until = (v: MeasureVisual) => starts[idx(v) + 1] ?? at(v) + 4;
  const after = (v: MeasureVisual) => t >= at(v);
  const vis = MEASURE_LINES[line].visual;
  const count = (v: MeasureVisual, n: number) => Math.floor(Math.min(1, Math.max(0, (t - at(v) - 0.6) / Math.max(0.5, until(v) - at(v) - 1.1))) * n + 1e-9);
  const riyaN = spansFor(SPANS.riya.cm);
  const arjunN = spansFor(SPANS.arjun.cm);
  const metreOn = after("metre");
  const showRows = (!metreOn || vis === "same") && vis !== "hands" && vis !== "trust";
  const metreM = Math.min(TABLE_M, Math.max(0, (t - at("metre") - 0.5) * 0.6));
  return (
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <Table />
      <Label x={T.x0 + (TABLE_M * T.pxPerM) / 2} y={T.y + 90} color={COLORS.chalkDim} size={30} o={vis === "table" ? fade(t - at("table"), 0.3) : 0}>
        how long?
      </Label>
      {showRows && after("riya") && <SpanRow cmEach={SPANS.riya.cm} count={riyaN} shown={vis === "same" ? riyaN : count("riya", riyaN)} y={T.y - 200} color={MINT} name={SPANS.riya.name} o={1} />}
      {showRows && after("arjun") && <SpanRow cmEach={SPANS.arjun.cm} count={arjunN} shown={vis === "same" ? arjunN : count("arjun", arjunN)} y={T.y - 90} color={YELLOW} name={SPANS.arjun.name} o={1} />}
      {vis === "question" && (
        <text x={540} y={640} fill={COLORS.force} fontSize={200} fontWeight={800} textAnchor="middle" fontFamily={displayFont} opacity={popIn(t, at("question") + 0.3)}>
          ?
        </text>
      )}
      {(vis === "hands" || vis === "trust") && (
        <g opacity={fade(t - at("hands"), 0.3)}>
          {[
            [SPANS.riya.name, SPANS.riya.cm, MINT],
            [SPANS.arjun.name, SPANS.arjun.cm, YELLOW],
          ].map(([name, c, col], i) => (
            <g key={String(name)}>
              <rect x={T.x0} y={620 + i * 110} width={cm(Number(c)) * 2} height={60} rx={14} fill={String(col)} opacity={0.9} />
              <Label x={T.x0 + cm(Number(c)) * 2 + 24} y={664 + i * 110} color={String(col)} size={36} anchor="start">
                {String(name)}&apos;s span: {Number(c)} cm
              </Label>
            </g>
          ))}
          <Label x={T.x0} y={590} color={COLORS.chalkDim} size={26} anchor="start">
            (drawn twice as big)
          </Label>
        </g>
      )}
      {vis === "trust" &&
        [14, 18, 22].map((c, i) => (
          <g key={c} opacity={popIn(t, at("trust") + 1.2 + i * 0.3, 0.35)}>
            <rect x={T.x0 + i * 270} y={826} width={cm(c) * 1.2} height={36} rx={10} fill={COLORS.chalkDim} opacity={0.5} />
            <Label x={T.x0 + i * 270} y={816} color={COLORS.chalkDim} size={26} anchor="start">
              someone: {c} cm
            </Label>
          </g>
        ))}
      {metreOn && vis !== "same" && (
        <g>
          <MetreStick x={T.x0} y={T.y - 70} m={metreM} o={fade(t - at("metre"), 0.3)} />
          <Label x={T.x0 + cm(50)} y={T.y - 90} color={YELLOW} size={30} o={metreM >= 1 ? 1 : 0}>
            1 m
          </Label>
          <Label x={T.x0 + cm(130)} y={T.y - 90} color={YELLOW} size={30} o={metreM >= TABLE_M - 1e-6 ? 1 : 0}>
            + {Math.round((TABLE_M - 1) * 100) / 100} m
          </Label>
        </g>
      )}
      {vis === "answer" && (
        <Label x={540} y={700} color={YELLOW} size={120} o={popIn(t, at("answer") + 0.4)}>
          {TABLE_M} m
        </Label>
      )}
    </svg>
  );
};

const MeasureOverlay: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const vis = MEASURE_LINES[line].visual;
  const at = (v: MeasureVisual) => starts[MEASURE_LINES.findIndex((l) => l.visual === v)];
  return (
    <>
      {vis === "metre" && (
        <Card x={300} y={560} w={480} o={popIn(t, at("metre") + 0.3)} color={YELLOW}>
          <div style={{ fontSize: 30, color: COLORS.chalkDim }}>one standard unit</div>
          <div style={{ fontFamily: displayFont, fontSize: 80, color: YELLOW }}>1 METRE</div>
          <div style={{ fontSize: 28 }}>= 100 cm, the same everywhere</div>
        </Card>
      )}
      {vis === "same" && (
        <Card x={170} y={500} w={740} o={popIn(t, at("same") + 0.3)} color={MINT}>
          <div style={{ fontSize: 34 }}>
            8 × 20 cm = <b style={{ color: YELLOW }}>160 cm</b> &nbsp;·&nbsp; 10 × 16 cm = <b style={{ color: YELLOW }}>160 cm</b>
          </div>
          <div style={{ fontSize: 28, color: COLORS.chalkDim, marginTop: 6 }}>both were right, in different units</div>
        </Card>
      )}
      {vis === "try" && (
        <>
          <Card x={170} y={560} w={740} o={popIn(t, at("try") + 0.3)} color={MINT}>
            <div style={{ fontSize: 34, textAlign: "left" }}>My desk: ____ handspans</div>
            <div style={{ fontSize: 34, textAlign: "left", marginTop: 8 }}>My desk: ____ cm (ruler)</div>
          </Card>
          <Confetti local={t - at("try")} at={0.2} x={540} y={700} count={110} />
        </>
      )}
    </>
  );
};

export const MeasureShort: React.FC<PlaneShortProps> = ({ voice }) => (
  <ShortFrame
    lines={MEASURE_LINES}
    voice={voice as ShortVoice}
    Scene={({ ctx }) => (
      <>
        <MeasureScene ctx={ctx} />
        <MeasureOverlay ctx={ctx} />
      </>
    )}
    sounds={(l, s) =>
      baseSounds(l, s, {
        question: [[0.3, "thud", 0.45]],
        metre: [[0.3, "sparkle", 0.35]],
        answer: [[0.4, "ding", 0.4]],
        same: [[0.3, "success", 0.4]],
        try: [[0.2, "sparkle", 0.35]],
      })
    }
  />
);

// ---------- Class 8: why is the first push the hardest? ----------

const F = { floor: 1080, x0: 260, w: 200, h: 170, pxPerM: 150, nScale: 1.7 }; // 1.7 px per newton for force arrows
/**
 * Playback rate for the push: the push grows from 0 to 100 N between 0.4 s into the "gently" line and the
 * moment the voice says "slides", so the box starts sliding on that word. The same rate is used after that,
 * and the rate is shown on screen.
 */
function frictionClock(ctx: SceneCtx) {
  const idx = (v: FrictionVisual) => FRICTION_LINES.findIndex((l) => l.visual === v);
  const t0 = ctx.starts[idx("soft")] + 0.4;
  const w = ctx.lines[idx("watch")];
  const slideWord = w.words.find((x) => /^slides/i.test(x.text));
  const tSlide = w.from + (slideWord?.start ?? w.seconds * 0.8);
  const rate = RAMP / Math.max(0.5, tSlide - t0);
  const tau = Math.max(0, Math.min(RAMP + KICK + 2.2, (ctx.t - t0) * rate));
  return { tau, rate };
}

const Crate: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <rect x={x} y={F.floor - F.h} width={F.w} height={F.h} rx={8} fill={WOOD} stroke={WOOD_DARK} strokeWidth={5} />
    <line x1={x} y1={F.floor - F.h} x2={x + F.w} y2={F.floor} stroke={WOOD_DARK} strokeWidth={5} />
    <line x1={x + F.w} y1={F.floor - F.h} x2={x} y2={F.floor} stroke={WOOD_DARK} strokeWidth={5} />
    <text x={x + F.w / 2} y={F.floor - F.h / 2 + 14} fill="#fff" fontSize={40} fontWeight={800} textAnchor="middle" fontFamily={sceneFont}>
      {BOX.kg} kg
    </text>
  </g>
);

/** A force meter bar: length proportional to the force. */
const Meter: React.FC<{ y: number; label: string; value: number; color: string }> = ({ y, label, value, color }) => (
  <g>
    <Label x={110} y={y + 30} color={color} size={30} anchor="start">
      {label}
    </Label>
    <rect x={300} y={y} width={500} height={40} rx={20} fill="rgba(255,255,255,0.08)" />
    <rect x={300} y={y} width={Math.max(40, (value / BOX.staticMaxN) * 500)} height={40} rx={20} fill={color} />
    <Label x={820} y={y + 32} color={color} size={34} anchor="start">
      {Math.round(value)} N
    </Label>
  </g>
);

/** Zoomed-in surfaces. Still: the box's bumps sit between the floor's bumps (locked). Sliding: they ride on top. */
const Bumps: React.FC<{ locked: boolean; o: number }> = ({ locked, o }) => {
  const row = (base: number, tip: number, shift: number) =>
    Array.from({ length: 12 }, (_, i) => `${200 + i * 60 + shift},${base} ${230 + i * 60 + shift},${tip}`).join(" ") + ` ${920 + shift},${base}`;
  const lift = locked ? 0 : 45;
  return (
    <g opacity={o}>
      <rect x={180} y={520} width={720} height={330} rx={30} fill={SURFACE} stroke={COLORS.boardLine} strokeWidth={3} />
      <clipPath id="bump-clip">
        <rect x={190} y={530} width={700} height={310} rx={24} />
      </clipPath>
      <g clipPath="url(#bump-clip)">
        <polygon points={`180,500 180,${660 - lift} ${row(660 - lift, 755 - lift, 30)} 960,500`} fill={WOOD} />
        <polygon points={`180,860 180,780 ${row(780, 720, 0)} 960,860`} fill="#7f8aaa" />
      </g>
      <Label x={540} y={575} color="#fff" size={30}>
        bottom of the box (zoomed in)
      </Label>
      <Label x={540} y={828} color={COLORS.chalkDim} size={30}>
        floor
      </Label>
      <Label x={540} y={900} color={locked ? COLORS.force : MINT} size={38}>
        {locked ? "still: bumps lock together" : "sliding: bumps skip over"}
      </Label>
    </g>
  );
};

const FrictionScene: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const idx = (v: FrictionVisual) => FRICTION_LINES.findIndex((l) => l.visual === v);
  const at = (v: FrictionVisual) => starts[idx(v)];
  const after = (v: FrictionVisual) => t >= at(v);
  const vis = FRICTION_LINES[line].visual;
  const { tau, rate } = frictionClock(ctx); // physics time
  const pushing = after("soft");
  const push = pushing ? pushAt(tau) : 0;
  const fric = pushing ? frictionAt(tau) : 0;
  const x = F.x0 + boxX(tau) * F.pxPerM;
  const status = !pushing ? "" : tau <= RAMP ? "not moving" : tau <= RAMP + KICK ? "starts to slide!" : `steady speed: ${cruiseSpeed} m/s`;
  const showForces = pushing && !(vis === "bumps" || vis === "tip" || vis === "rule");
  return (
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <line x1={60} y1={F.floor} x2={1020} y2={F.floor} stroke={COLORS.chalkDim} strokeWidth={5} />
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={70 + i * 60} y1={F.floor + 4} x2={50 + i * 60} y2={F.floor + 26} stroke={COLORS.chalkDim} strokeWidth={3} opacity={0.5} />
      ))}
      {vis !== "bumps" && <Crate x={x} />}
      {showForces && push > 0.5 && (
        <g>
          <Arrow x1={x + 20 - push * F.nScale} y1={F.floor - F.h - 40} x2={x + 20} y2={F.floor - F.h - 40} color={COLORS.force} head="open-triangle" width={7} />
          <Label x={x + 20 - (push * F.nScale) / 2} y={F.floor - F.h - 60} color={COLORS.force} size={28}>
            push
          </Label>
          <Arrow x1={x + F.w / 2} y1={F.floor + 40} x2={x + F.w / 2 - fric * F.nScale} y2={F.floor + 40} color={COLORS.acceleration} head="open-triangle" width={7} />
        </g>
      )}
      {showForces && (
        <g>
          <Meter y={600} label="push" value={push} color={COLORS.force} />
          <Meter y={670} label="friction" value={fric} color={COLORS.acceleration} />
          <Label x={540} y={790} color={tau > RAMP ? MINT : "#fff"} size={44}>
            {status}
          </Label>
          <Label x={930} y={560} color={COLORS.chalkDim} size={26} anchor="end">
            slow motion ×{rate.toFixed(2)}
          </Label>
        </g>
      )}
      {vis === "setup" && (
        <Label x={540} y={760} color={COLORS.chalkDim} size={36} o={fade(t - at("setup"), 0.4)}>
          weight = {BOX.kg} kg × 10 = {weightN} N
        </Label>
      )}
      {vis === "why" && (
        <text x={540} y={760} fill={COLORS.force} fontSize={220} fontWeight={800} textAnchor="middle" fontFamily={displayFont} opacity={popIn(t, at("why") + 0.4)}>
          ?
        </text>
      )}
      {vis === "bumps" && <Bumps locked={line === idx("bumps")} o={fade(t - starts[line], 0.3)} />}
    </svg>
  );
};

const FrictionOverlay: React.FC<{ ctx: SceneCtx }> = ({ ctx }) => {
  const { t, starts, line } = ctx;
  const vis = FRICTION_LINES[line].visual;
  const at = (v: FrictionVisual) => starts[FRICTION_LINES.findIndex((l) => l.visual === v)];
  const x = F.x0 + boxX(frictionClock(ctx).tau) * F.pxPerM;
  return (
    <>
      {vis !== "bumps" && (
        <div style={{ position: "absolute", left: x - 150, top: F.floor - 150 }}>
          <Kan radius={50} expression={vis === "tip" ? "excited" : t >= at("soft") ? "dizzy" : "calm"} arms="out" look={{ x: 1, y: 0 }} time={t} />
        </div>
      )}
      {vis === "rule" && (
        <Card x={130} y={560} w={820} o={popIn(t, at("rule") + 0.3)} color={MINT}>
          <div style={{ fontSize: 36, textAlign: "left" }}>
            Holding still: up to <b style={{ color: COLORS.force }}>{BOX.staticMaxN} N</b>
          </div>
          <div style={{ fontSize: 36, textAlign: "left", marginTop: 8 }}>
            While sliding: only <b style={{ color: COLORS.acceleration }}>{BOX.slidingN} N</b>
          </div>
        </Card>
      )}
      {vis === "tip" && (
        <>
          <Card x={170} y={580} w={740} o={popIn(t, at("tip") + 0.3)} color={YELLOW}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>1. Push hard once to start</div>
            <div style={{ fontSize: 40, fontWeight: 800, marginTop: 8 }}>2. Then it gets easier</div>
          </Card>
          <Confetti local={t - at("tip")} at={0.3} x={540} y={700} count={110} />
        </>
      )}
    </>
  );
};

export const FrictionShort: React.FC<PlaneShortProps> = ({ voice }) => (
  <ShortFrame
    lines={FRICTION_LINES}
    voice={voice as ShortVoice}
    Scene={({ ctx }) => (
      <>
        <FrictionScene ctx={ctx} />
        <FrictionOverlay ctx={ctx} />
      </>
    )}
    sounds={(l, s) =>
      baseSounds(l, s, {
        why: [[0.4, "thud", 0.4]],
        watch: [[0.6, "swish", 0.35]],
        keep: [[0.3, "ding", 0.35]],
        rule: [[0.3, "ding", 0.3]],
        tip: [[0.3, "success", 0.4]],
      })
    }
  />
);

// ---------- covers ----------

const CoverTitle: React.FC<{ kicker: string; title: string; sub: string }> = ({ kicker, title, sub }) => (
  <div style={{ position: "absolute", left: 70, right: 150, top: 380, textAlign: "center" }}>
    <div style={{ fontSize: 40, fontWeight: 800, color: MINT, letterSpacing: 4 }}>{kicker}</div>
    <div style={{ fontFamily: displayFont, fontSize: 130, lineHeight: 1.02, marginTop: 16, textTransform: "uppercase" }}>{title}</div>
    <div style={{ fontSize: 46, fontWeight: 800, color: YELLOW, marginTop: 22 }}>{sub}</div>
  </div>
);

export const MeasureCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: "#fff", fontFamily: sceneFont }}>
    <Backdrop />
    <CoverTitle kicker="CLASS 6 SCIENCE" title="Who measured it wrong?" sub="8 handspans or 10?" />
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <g transform="translate(0, 260)">
        <Table />
        <SpanRow cmEach={SPANS.riya.cm} count={8} shown={8} y={T.y - 200} color={MINT} name={SPANS.riya.name} o={1} />
        <SpanRow cmEach={SPANS.arjun.cm} count={10} shown={10} y={T.y - 90} color={YELLOW} name={SPANS.arjun.name} o={1} />
      </g>
    </svg>
  </AbsoluteFill>
);

export const FrictionCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: "#fff", fontFamily: sceneFont }}>
    <Backdrop />
    <CoverTitle kicker="CLASS 8 SCIENCE" title="The first push is the hardest" sub="Friction, explained" />
    <svg width={SVGW} height={SVGH} style={{ position: "absolute", inset: 0 }}>
      <g transform="translate(0, 160)">
        <line x1={60} y1={F.floor} x2={1020} y2={F.floor} stroke={COLORS.chalkDim} strokeWidth={5} />
        <Crate x={F.x0 + 120} />
        <Arrow x1={F.x0 + 120 - BOX.staticMaxN * F.nScale - 10} y1={F.floor - F.h / 2} x2={F.x0 + 110} y2={F.floor - F.h / 2} color={COLORS.force} head="open-triangle" width={7} />
        <Label x={F.x0 + 120 - 90} y={F.floor - F.h / 2 - 30} color={COLORS.force} size={40}>
          {BOX.staticMaxN} N
        </Label>
      </g>
    </svg>
  </AbsoluteFill>
);
