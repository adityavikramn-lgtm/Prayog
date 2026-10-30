import { Backdrop } from "../../video/ui";
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { Arrow } from "../../components/Arrow";
import { stateAt } from "../../physics/projectile";
import { sceneFont } from "../../sceneFont";
import { COLORS } from "../../theme";
import { solve } from "./model";
import { Ground, KanAt, Label, StrobeDots, SvgLayer, Trajectory } from "./parts";
import { CARDS, PAIR, VIDEO_PARAMS } from "./script";
import { LANDSCAPE, Layout, PORTRAIT, makeWorld } from "./world";

export const ProjectileCoverProps = z.object({
  format: z.enum(["short", "explainer"]),
  lang: z.enum(["en", "hi"]),
});
export type ProjectileCoverProps = z.infer<typeof ProjectileCoverProps>;

/** Cover image (thumbnail) for each video. The drawn paths are real solver output. */
export const ProjectileCover: React.FC<ProjectileCoverProps> = ({ format, lang }) =>
  format === "short" ? <ShortCover lang={lang} /> : <ExplainerCover lang={lang} />;

const Brand: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", fontSize: 34, color: COLORS.chalkDim, letterSpacing: 2, ...style }}>
    ADITHYA VIKRAM
  </div>
);

const ShortCover: React.FC<{ lang: "en" | "hi" }> = ({ lang }) => {
  const world = makeWorld(VIDEO_PARAMS, [...PAIR], PORTRAIT);
  const x0 = world.x(0);
  const y0 = world.y(0);
  const len = 300;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <SvgLayer layout={PORTRAIT}>
        <Ground world={world} />
        {PAIR.map((th) => {
          const rad = (th * Math.PI) / 180;
          const x2 = x0 + Math.cos(rad) * len;
          const y2 = y0 - Math.sin(rad) * len;
          return (
            <g key={th}>
              <Arrow x1={x0} y1={y0} x2={x2} y2={y2} color={COLORS.velocity} head="triangle" width={8} />
              <Label x={x2 + Math.cos(rad) * 70} y={y2 - Math.sin(rad) * 55} color={COLORS.kan} size={56}>
                {th}°
              </Label>
            </g>
          );
        })}
      </SvgLayer>
      <KanAt world={world} x={x0} y={y0} expression="excited" squashOrigin="bottom" look={{ x: 1, y: -0.6 }} time={0.4} />
      <div style={{ position: "absolute", left: 70, right: 150, top: 330, textAlign: "center" }}>
        <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1.05 }}>{CARDS.shortCoverTitle[lang]}</div>
        <div style={{ fontSize: 62, fontWeight: 700, color: COLORS.displacement, marginTop: 20 }}>
          {CARDS.shortCoverSub[lang]}
        </div>
      </div>
      <Brand style={{ left: 70, top: 1420 }} />
    </AbsoluteFill>
  );
};

const COVER_LANDSCAPE: Layout = { ...LANDSCAPE, left: 860, right: 1780, top: 230, groundY: 900, kanR: 52, textScale: 1.1 };

const ExplainerCover: React.FC<{ lang: "en" | "hi" }> = ({ lang }) => {
  const p = { ...VIDEO_PARAMS, thetaDeg: 45 };
  const sol = solve(p);
  const world = makeWorld(p, [], COVER_LANDSCAPE);
  const apex = stateAt(sol.components, sol.timeToApex);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board, color: COLORS.chalk, fontFamily: sceneFont }}>
      <Backdrop />
      <SvgLayer layout={COVER_LANDSCAPE}>
        <Ground world={world} />
        <Trajectory c={sol.components} world={world} tEnd={sol.timeOfFlight} variant="trail" />
        <StrobeDots c={sol.components} world={world} t={sol.timeOfFlight} T={sol.timeOfFlight} />
      </SvgLayer>
      <KanAt world={world} x={world.x(apex.x)} y={world.y(apex.y)} expression="calm" arms="out" look={{ x: 1, y: 0 }} time={0.4} />
      <div style={{ position: "absolute", left: 90, top: 300, width: 760 }}>
        <div style={{ fontSize: 112, fontWeight: 700, lineHeight: 1.05 }}>{CARDS.explainerCoverTitle[lang]}</div>
        <div style={{ fontSize: 60, fontWeight: 700, color: COLORS.displacement, marginTop: 24 }}>
          {CARDS.explainerCoverSub[lang]}
        </div>
      </div>
      <Brand style={{ left: 90, top: 760 }} />
    </AbsoluteFill>
  );
};
