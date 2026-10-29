"use client";

import { Player } from "@remotion/player";
import React from "react";
import { ProjectileScene, ProjectileSceneProps } from "./Scene";
import { durationInFrames } from "./timeline";

export const LAB_FPS = 60;

/** The same scene code as the MP4 render, played live in the browser at 60 fps. */
const LabPlayer: React.FC<{ props: ProjectileSceneProps }> = ({ props }) => (
  <Player
    component={ProjectileScene}
    inputProps={props}
    durationInFrames={durationInFrames(props, props.includeSweep, LAB_FPS)}
    fps={LAB_FPS}
    compositionWidth={1920}
    compositionHeight={1080}
    style={{ width: "100%", aspectRatio: "16 / 9" }}
    controls
    loop
    autoPlay
    spaceKeyToPlayOrPause
    acknowledgeRemotionLicense
  />
);

export default LabPlayer;
