import { CalculateMetadataFunction, Composition, Still } from "remotion";
import {
  HEMI_FPS,
  HemisphereCover,
  HemisphereExplainer,
  HemisphereExplainerProps,
  hemisphereMetadata,
} from "../templates/hemisphere/Explainer";
import { DEMO_FPS, TeacherDemo, TeacherDemoCover, TeacherDemoProps, demoSeconds } from "../pitch/TeacherDemo";
import {
  COULOMB_FPS,
  CoulombCover,
  CoulombCoverProps,
  CoulombExplainer,
  CoulombExplainerProps,
  coulombMetadata,
} from "../templates/coulomb/Explainer";
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
      <Composition
        id="coulomb-explainer"
        component={CoulombExplainer}
        schema={CoulombExplainerProps}
        durationInFrames={300}
        fps={COULOMB_FPS}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={coulombMetadata}
      />
      <Still
        id="coulomb-explainer-cover"
        component={CoulombCover}
        schema={CoulombCoverProps}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const }}
      />
      <Composition
        id="hemisphere-explainer"
        component={HemisphereExplainer}
        schema={HemisphereExplainerProps}
        durationInFrames={300}
        fps={HEMI_FPS}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={hemisphereMetadata}
      />
      <Still id="hemisphere-explainer-cover" component={HemisphereCover} width={1920} height={1080} />
      <Composition
        id="teacher-demo"
        component={TeacherDemo}
        schema={TeacherDemoProps}
        durationInFrames={Math.round(demoSeconds() * DEMO_FPS)}
        fps={DEMO_FPS}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const }}
      />
      <Still id="teacher-demo-cover" component={TeacherDemoCover} width={1920} height={1080} />
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
