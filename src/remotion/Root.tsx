import { CalculateMetadataFunction, Composition, Still } from "remotion";
import {
  HEMI_FPS,
  HemisphereCover,
  HemisphereExplainer,
  HemisphereExplainerProps,
  hemisphereMetadata,
} from "../templates/hemisphere/Explainer";
import { PRESSURE_FPS, PressureCover, PressureExplainer, PressureExplainerProps, pressureMetadata } from "../templates/pressure/Explainer";
import { FrictionCover, FrictionShort, MeasureCover, MeasureShort, frictionMetadata, measureMetadata } from "../shorts/MiddleShorts";
import { DropCover, DropShort, MonkeyCover, MonkeyShort, PLANE_FPS, PlaneShortProps, dropMetadata, monkeyMetadata } from "../shorts/PlaneShort";
import { SHORT_FPS, StartShort, StartShortCover, StartShortProps, startShortMetadata } from "../pitch/StartShort";
import { planShort } from "../pitch/short";
import { DEMO_FPS, TeacherDemo, TeacherDemoCover, TeacherDemoProps, demoSeconds, teacherDemoMetadata } from "../pitch/TeacherDemo";
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
        id="pressure-explainer"
        component={PressureExplainer}
        schema={PressureExplainerProps}
        durationInFrames={300}
        fps={PRESSURE_FPS}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={pressureMetadata}
      />
      <Still id="pressure-explainer-cover" component={PressureCover} width={1920} height={1080} />
      <Composition
        id="teacher-demo"
        component={TeacherDemo}
        schema={TeacherDemoProps}
        durationInFrames={Math.round(demoSeconds() * DEMO_FPS)}
        fps={DEMO_FPS}
        width={1920}
        height={1080}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={teacherDemoMetadata}
      />
      <Still id="teacher-demo-cover" component={TeacherDemoCover} width={1920} height={1080} />
      <Composition
        id="teacher-short"
        component={StartShort}
        schema={StartShortProps}
        durationInFrames={Math.round(planShort().seconds * SHORT_FPS)}
        fps={SHORT_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={startShortMetadata}
      />
      <Still id="teacher-short-cover" component={StartShortCover} width={1080} height={1920} />
      <Composition
        id="plane-drop"
        component={DropShort}
        schema={PlaneShortProps}
        durationInFrames={300}
        fps={PLANE_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={dropMetadata}
      />
      <Still id="plane-drop-cover" component={DropCover} width={1080} height={1920} />
      <Composition
        id="plane-monkey"
        component={MonkeyShort}
        schema={PlaneShortProps}
        durationInFrames={300}
        fps={PLANE_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={monkeyMetadata}
      />
      <Still id="plane-monkey-cover" component={MonkeyCover} width={1080} height={1920} />
      <Composition
        id="middle-measure"
        component={MeasureShort}
        schema={PlaneShortProps}
        durationInFrames={300}
        fps={PLANE_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={measureMetadata}
      />
      <Still id="middle-measure-cover" component={MeasureCover} width={1080} height={1920} />
      <Composition
        id="middle-friction"
        component={FrictionShort}
        schema={PlaneShortProps}
        durationInFrames={300}
        fps={PLANE_FPS}
        width={1080}
        height={1920}
        defaultProps={{ lang: "en" as const, voice: {} }}
        calculateMetadata={frictionMetadata}
      />
      <Still id="middle-friction-cover" component={FrictionCover} width={1080} height={1920} />
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
