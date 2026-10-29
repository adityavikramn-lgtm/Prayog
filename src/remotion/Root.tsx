import { Composition } from "remotion";
import { TitleCard } from "./TitleCard";

// Composition registry. Phase 2 adds a 9:16 Short and a 16:9 explainer per template.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TitleCard"
      component={TitleCard}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
