import { CalculateMetadataFunction, Composition, Still } from "remotion";
import { ProjectileCover, ProjectileCoverProps } from "../templates/projectile/Cover";
import {
  ProjectileScene,
  ProjectileSceneProps,
  defaultSceneProps,
} from "../templates/projectile/Scene";
import { ProjectileVideo, ProjectileVideoProps, VIDEO_FPS, videoMetadata } from "../templates/projectile/Video";
import { durationInFrames } from "../templates/projectile/timeline";

const FPS = 30;

// Duration depends on the physics (a slower launch flies longer).
const projectileMetadata: CalculateMetadataFunction<ProjectileSceneProps> = ({ props }) => ({
  durationInFrames: durationInFrames(props, props.includeSweep, FPS),
});

const shortProps: ProjectileVideoProps = { format: "short", lang: "en", showSafeZones: false, voice: {} };
const explainerProps: ProjectileVideoProps = { format: "explainer", lang: "en", showSafeZones: false, voice: {} };

// Composition registry. IDs follow "<template>-<format>" so render scripts can find them.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="projectile-lab"
        component={ProjectileScene}
        schema={ProjectileSceneProps}
        durationInFrames={durationInFrames(defaultSceneProps, true, FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultSceneProps}
        calculateMetadata={projectileMetadata}
      />
      <Composition
        id="projectile-short"
        component={ProjectileVideo}
        schema={ProjectileVideoProps}
        durationInFrames={300}
        fps={VIDEO_FPS}
        width={1080}
        height={1920}
        defaultProps={shortProps}
        calculateMetadata={videoMetadata}
      />
      <Composition
        id="projectile-explainer"
        component={ProjectileVideo}
        schema={ProjectileVideoProps}
        durationInFrames={300}
        fps={VIDEO_FPS}
        width={1920}
        height={1080}
        defaultProps={explainerProps}
        calculateMetadata={videoMetadata}
      />
      <Still
        id="projectile-short-cover"
        component={ProjectileCover}
        schema={ProjectileCoverProps}
        width={1080}
        height={1920}
        defaultProps={{ format: "short" as const, lang: "en" as const }}
      />
      <Still
        id="projectile-explainer-cover"
        component={ProjectileCover}
        schema={ProjectileCoverProps}
        width={1920}
        height={1080}
        defaultProps={{ format: "explainer" as const, lang: "en" as const }}
      />
    </>
  );
};
