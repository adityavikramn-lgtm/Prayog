import { CalculateMetadataFunction, Composition } from "remotion";
import {
  ProjectileScene,
  ProjectileSceneProps,
  defaultSceneProps,
} from "../templates/projectile/Scene";
import { durationInFrames } from "../templates/projectile/timeline";

const FPS = 30;

// Duration depends on the physics (a slower launch flies longer).
const projectileMetadata: CalculateMetadataFunction<ProjectileSceneProps> = ({ props }) => ({
  durationInFrames: durationInFrames(props, props.includeSweep, FPS),
});

// Composition registry. Phase 2 adds a 9:16 Short and a 16:9 explainer per template.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Projectile"
      component={ProjectileScene}
      schema={ProjectileSceneProps}
      durationInFrames={durationInFrames(defaultSceneProps, true, FPS)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultSceneProps}
      calculateMetadata={projectileMetadata}
    />
  );
};
