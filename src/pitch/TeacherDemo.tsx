import "katex/dist/katex.min.css";
import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { z } from "zod";
import { Tex } from "../components/Tex";
import renderTimes from "../generated/render-times.json";
import stats from "../generated/stats.json";
import { Kan } from "../mascot/Kan";
import { sig3 } from "../physics/format";
import { sceneFont } from "../sceneFont";
import { CoulombExplainer } from "../templates/coulomb/Explainer";
import { ProjectileCover } from "../templates/projectile/Cover";
import { ProjectileScene, defaultSceneProps } from "../templates/projectile/Scene";
import { ProjectileVideo } from "../templates/projectile/Video";
import { solve } from "../templates/projectile/model";
import { simulateProjectile } from "../templates/projectile/simulate";
import { buildTimeline } from "../templates/projectile/timeline";
import { COLORS } from "../theme";
import { CLAMP, Captions, Card, fade } from "../video/ui";
import { Beat, BeatId, DEMO_BEATS, demoSeconds } from "./script";

export { demoSeconds };

/**
 * "How a JEE teacher can use AI content": the pitch video for the application (no product name on screen).
 * Every scene shown here is the real component, every number is computed or
 * read from the real test and render results (src/generated/*.json).
 */

export const TeacherDemoProps = z.object({ lang: z.enum(["en"]) });
export const DEMO_FPS = 30;

const TOPICS = ["Projectile motion", "Coulomb's law"];
const NAME = "Adithya Vikram";
type Timing = { videoSeconds: number; renderSeconds: number };
const times = renderTimes as Record<string, Timing | undefined>;

const EASE = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };
const CAPTION_BOX = { left: 160, right: 160, bottom: 36 };

export const TeacherDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      {DEMO_BEATS.map((b) => {
        const start = Math.round(from * fps);
        from += b.seconds;
        const end = Math.round(from * fps);
        return (
          <Sequence key={b.id} name={b.id} from={start} durationInFrames={end - start}>
            <BeatView beat={b} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ beat: Beat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const Scene = SCENES[beat.id];
  return (
    <AbsoluteFill>
      <Scene local={local} />
      <Captions cues={beat.lines} local={local} box={CAPTION_BOX} fontSize={42} />
    </AbsoluteFill>
  );
};

/** Shows a real composition, scaled down, starting at `startFrame` of that composition. */
const Embed: React.FC<{
  w: number;
  h: number;
  scale: number;
  startFrame?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ w, h, scale, startFrame = 0, style, children }) => (
  <div
    style={{
      position: "absolute",
      width: w * scale,
      height: h * scale,
      overflow: "hidden",
      borderRadius: 14,
      border: `2px solid ${COLORS.boardLine}`,
      ...style,
    }}
  >
    <div style={{ position: "absolute", width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      <Sequence from={-startFrame}>{children}</Sequence>
    </div>
  </div>
);

const Heading: React.FC<{ text: string; local: number; at?: number; top?: number }> = ({ text, local, at = 0, top = 60 }) => (
  <div style={{ position: "absolute", left: 100, top, fontSize: 64, fontWeight: 700, opacity: fade(local, at, 0.4) }}>{text}</div>
);

type SceneProps = { local: number };

const Open: React.FC<SceneProps> = ({ local }) => (
  <>
    <div style={{ position: "absolute", left: 140, top: 250, opacity: fade(local, 0.1, 0.5) }}>
      <div style={{ fontSize: 34, color: COLORS.chalkDim, letterSpacing: 3 }}>FOR JEE TEACHERS</div>
      <div style={{ fontSize: 130, fontWeight: 700, lineHeight: 1.05, marginTop: 10 }}>{NAME}</div>
      <div style={{ fontSize: 50, color: COLORS.displacement, marginTop: 24, maxWidth: 980 }}>
        AI-assisted lessons, checked by real physics.
      </div>
    </div>
    <div style={{ position: "absolute", left: 1330, top: 270, opacity: fade(local, 0.6, 0.5) }}>
      <Kan radius={130} expression={local < 5 ? "calm" : "excited"} arms={local > 5 ? "out" : "none"} look={{ x: -1, y: 0.2 }} time={local} />
    </div>
  </>
);

const Problem: React.FC<SceneProps> = ({ local }) => {
  const u = 20;
  const th = 30;
  const g = 10;
  const wrong = (u * u * Math.sin((th * Math.PI) / 180)) / g; // the slip: sin θ instead of sin 2θ
  const right = solve({ u, thetaDeg: th, g, trig: "exact" });
  const sim = simulateProjectile(right.components);
  const check = fade(local, 7.5, 0.5);
  return (
    <>
      <Heading text="The problem" local={local} />
      <div style={{ position: "absolute", left: 100, top: 190, fontSize: 34, color: COLORS.chalkDim, opacity: fade(local, 0.6, 0.4) }}>
        Question: u = {u} m/s, θ = {th}°, g = {g} m/s². Find the range.
      </div>
      <Card opacity={fade(local, 1.2, 0.5)} fontSize={40} style={{ left: 100, top: 280, width: 760, textAlign: "left", fontWeight: 400 }}>
        <div style={{ fontSize: 28, color: COLORS.chalkDim, marginBottom: 10 }}>A typical AI answer</div>
        <Tex tex={`R = \\dfrac{u^2 \\sin\\theta}{g} = \\dfrac{(${u})^2 \\sin ${th}^\\circ}{${g}} = ${sig3(wrong)}\\ \\text{m}`} />
        <div style={{ marginTop: 14, fontSize: 32, color: COLORS.force, opacity: check }}>✗ missing the 2 in sin 2θ</div>
      </Card>
      <Card opacity={check} fontSize={40} style={{ left: 960, top: 280, width: 860, textAlign: "left", fontWeight: 400 }}>
        <div style={{ fontSize: 28, color: COLORS.chalkDim, marginBottom: 10 }}>Checked by code</div>
        <Tex tex={`R = \\dfrac{u^2 \\sin 2\\theta}{g} = \\textcolor{${COLORS.displacement}}{${sig3(right.range)}}\\ \\text{m}`} />
        <div style={{ marginTop: 14, fontSize: 32, color: COLORS.kan }}>
          ✓ simulation agrees: {sig3(sim.range)} m
        </div>
      </Card>
    </>
  );
};

const Principle: React.FC<SceneProps> = ({ local }) => {
  const col = (at: number, title: string, color: string, items: string[], left: number) => (
    <Card opacity={fade(local, at, 0.5)} fontSize={38} style={{ left, top: 230, width: 760, textAlign: "left" }}>
      <div style={{ fontSize: 54, color, marginBottom: 18 }}>{title}</div>
      {items.map((it) => (
        <div key={it} style={{ fontWeight: 400, lineHeight: 1.6 }}>
          · {it}
        </div>
      ))}
    </Card>
  );
  return (
    <>
      <Heading text="AI for language, code for truth" local={local} />
      {col(2.8, "AI writes", COLORS.kan, ["captions and voice scripts", "Hinglish versions", "hooks and titles", "fresh story settings"], 100)}
      {col(8.3, "Code computes", COLORS.displacement, ["every number on screen", "every frame of motion", "a second check by simulation", "the final answer"], 1000)}
    </>
  );
};

const Tile: React.FC<{ left: number; top: number; label: string; opacity: number; children?: React.ReactNode; soon?: boolean }> = ({
  left,
  top,
  label,
  opacity,
  children,
  soon,
}) => (
  <div style={{ position: "absolute", left, top, opacity }}>
    {children}
    {soon ? (
      <div
        style={{
          width: 600,
          height: 130,
          borderRadius: 14,
          border: `3px dashed ${COLORS.chalkDim}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 26, color: COLORS.chalkDim }}>Coming next, not built yet</div>
      </div>
    ) : (
      label && <div style={{ position: "absolute", top: 400, width: 700, fontSize: 30, fontWeight: 700 }}>{label}</div>
    )}
  </div>
);

const Templates: React.FC<SceneProps> = ({ local }) => {
  const shortProps = { format: "short" as const, lang: "en" as const, showSafeZones: false, voice: {} };
  return (
    <>
      <Heading text="Templates for Vedantu JEE teachers" local={local} />
      <Tile left={100} top={200} label="Live class simulation" opacity={fade(local, 5.8, 0.5)}>
        <Embed w={1920} h={1080} scale={0.36}>
          <ProjectileScene {...defaultSceneProps} />
        </Embed>
      </Tile>
      <Tile left={860} top={200} label="9:16 Short" opacity={fade(local, 12.8, 0.5)}>
        <Embed w={1080} h={1920} scale={0.2}>
          <ProjectileVideo {...shortProps} />
        </Embed>
      </Tile>
      <Tile left={1160} top={200} label="16:9 explainer" opacity={fade(local, 19.8, 0.5)}>
        <Embed w={1920} h={1080} scale={0.34} startFrame={52 * 30}>
          <CoulombExplainer lang="en" voice={{}} />
        </Embed>
      </Tile>
      <Tile left={100} top={680} label="Practice sheet (DPP) builder" opacity={fade(local, 26.8, 0.5)} soon />
      <Tile left={760} top={680} label="Paste a question → animation" opacity={fade(local, 26.8, 0.5)} soon />
    </>
  );
};

const Workflow: React.FC<SceneProps> = ({ local }) => {
  const theta = interpolate(local, [8, 13], [60, 37], EASE);
  const params = { ...defaultSceneProps, thetaDeg: theta, includeSweep: false };
  const tl = buildTimeline(params, false);
  const landedFrame = Math.round((tl.landAt + 1.6) * 30);
  const exact = solve(params);
  const sim = simulateProjectile(exact.components);
  const step = local < 7 ? 1 : local < 15 ? 2 : local < 23 ? 3 : 4;
  const steps = ["Pick a template", "Set the numbers", "Code checks itself", "Render en + hi"];
  return (
    <>
      <Heading text="From idea to video" local={local} />
      <div style={{ position: "absolute", left: 100, top: 170, display: "flex", gap: 18 }}>
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              fontSize: 30,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 12,
              border: `2px solid ${i + 1 === step ? COLORS.kan : COLORS.boardLine}`,
              color: i + 1 <= step ? COLORS.chalk : COLORS.chalkDim,
              opacity: fade(local, 0.3 + i * 0.2, 0.3),
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>
      {step <= 3 && (
        <Embed w={1920} h={1080} scale={0.45} style={{ left: 100, top: 270 }}>
          <Freeze frame={landedFrame}>
            <ProjectileScene {...params} />
          </Freeze>
        </Embed>
      )}
      {step >= 2 && step <= 3 && (
        <Card opacity={1} fontSize={36} style={{ left: 1030, top: 270, width: 790, textAlign: "left", fontWeight: 400 }}>
          <div>
            u = 20 m/s · θ = <b style={{ color: COLORS.kan }}>{theta.toFixed(0)}°</b> · g = 10 m/s²
          </div>
          {step === 3 && (
            <div style={{ marginTop: 16, lineHeight: 1.6 }}>
              <div>Formula: R = {sig3(exact.range)} m</div>
              <div>RK4 simulation: R = {sig3(sim.range)} m</div>
              <div style={{ color: COLORS.kan }}>
                Difference: {((Math.abs(sim.range - exact.range) / exact.range) * 100).toExponential(1)} %
              </div>
            </div>
          )}
        </Card>
      )}
      {step === 4 && (
        <>
          <Embed w={1080} h={1920} scale={0.27} style={{ left: 300, top: 270 }}>
            <ProjectileCover format="short" lang="en" />
          </Embed>
          <Embed w={1080} h={1920} scale={0.27} style={{ left: 640, top: 270 }}>
            <ProjectileCover format="short" lang="hi" />
          </Embed>
          <Card opacity={fade(local, 31, 0.5)} fontSize={32} style={{ left: 1030, top: 300, width: 790, textAlign: "left", fontWeight: 400 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Your voice, optional</div>
            <div>Drop one MP3 per beat into</div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: COLORS.kan, marginTop: 8 }}>public/voice/…/hook.mp3</div>
            <div style={{ marginTop: 12 }}>and each beat stretches to fit it.</div>
          </Card>
        </>
      )}
    </>
  );
};

const Stat: React.FC<{ value: string; label: string; opacity: number; left: number; top: number }> = ({ value, label, opacity, left, top }) => (
  <div style={{ position: "absolute", left, top, width: 820, opacity }}>
    <div style={{ fontSize: 96, fontWeight: 700, color: COLORS.displacement, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 34, marginTop: 10 }}>{label}</div>
  </div>
);

const Proof: React.FC<SceneProps> = ({ local }) => {
  const short = times["projectile-short-en"];
  const explainer = times["coulomb-explainer-en"];
  return (
    <>
      <Heading text="Proof, not promises" local={local} />
      <Stat
        left={100}
        top={220}
        opacity={fade(local, 0.6, 0.4)}
        value={`${stats.testsPassed}/${stats.testsTotal}`}
        label={stats.allPassed ? `automated checks passing (${stats.generatedOn})` : "automated checks: some failing, needs review"}
      />
      <Stat left={1000} top={220} opacity={fade(local, 1.4, 0.4)} value={String(TOPICS.length)} label={`topics ready: ${TOPICS.join(", ")}`} />
      {short && (
        <Stat
          left={100}
          top={520}
          opacity={fade(local, 2.2, 0.4)}
          value={`${short.renderSeconds} s`}
          label={`to render a ${Math.round(short.videoSeconds)} s Short on my laptop`}
        />
      )}
      {explainer && (
        <Stat
          left={1000}
          top={520}
          opacity={fade(local, 3, 0.4)}
          value={`${explainer.renderSeconds} s`}
          label={`to render a ${sig3(explainer.videoSeconds / 60)} min explainer`}
        />
      )}
    </>
  );
};

const Weekly: React.FC<SceneProps> = ({ local }) => {
  const items = [
    "3 Shorts on your current chapter, in English and Hinglish",
    "1 full explainer video",
    "1 live simulation to use in class",
    "Practice questions with worked solutions (once the question engine is done)",
  ];
  return (
    <>
      <Heading text="Every week" local={local} />
      {items.map((it, i) => (
        <div key={it} style={{ position: "absolute", left: 140, top: 210 + i * 130, fontSize: 46, opacity: fade(local, 1 + i * 1.3, 0.4), display: "flex", gap: 24 }}>
          <span style={{ color: COLORS.kan, fontWeight: 700 }}>{i + 1}</span>
          <span>{it}</span>
        </div>
      ))}
    </>
  );
};

const Close: React.FC<SceneProps> = ({ local }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", opacity: fade(local, 0.2, 0.5) }}>
      <div style={{ fontSize: 40, color: COLORS.chalkDim }}>Made by</div>
      <div style={{ fontSize: 110, fontWeight: 700, marginTop: 10 }}>{NAME}</div>
      <div style={{ fontSize: 44, color: COLORS.displacement, marginTop: 20 }}>for the Vedantu JEE content role</div>
      <div style={{ fontSize: 30, color: COLORS.chalkDim, marginTop: 30 }}>Built for JEE teachers · all content original</div>
    </div>
    <div style={{ position: "absolute", left: 1500, top: 560, opacity: fade(local, 0.8, 0.5) }}>
      <Kan radius={70} expression="proud" arms="out" look={{ x: -1, y: -0.2 }} time={local} />
    </div>
  </>
);

const SCENES: Record<BeatId, React.FC<SceneProps>> = {
  open: Open,
  problem: Problem,
  principle: Principle,
  templates: Templates,
  workflow: Workflow,
  proof: Proof,
  weekly: Weekly,
  close: Close,
};

export const TeacherDemoCover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
    <div style={{ position: "absolute", left: 120, top: 250 }}>
      <div style={{ fontSize: 34, color: COLORS.chalkDim, letterSpacing: 3 }}>FOR JEE TEACHERS</div>
      <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1.05, marginTop: 10 }}>{NAME}</div>
      <div style={{ fontSize: 52, color: COLORS.displacement, marginTop: 24, maxWidth: 1000 }}>
        AI content that's checked by real physics
      </div>
    </div>
    <div style={{ position: "absolute", left: 1350, top: 300 }}>
      <Kan radius={120} expression="excited" arms="out" look={{ x: -1, y: 0 }} time={0.4} />
    </div>
  </AbsoluteFill>
);
