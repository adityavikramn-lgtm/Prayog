import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Phase 0 pipeline check: proves Remotion renders with our palette.
// Text is a UI element, so easing it in is allowed (physical objects never ease).
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="items-center justify-center bg-board text-chalk">
      <h1 className="text-[140px] font-bold" style={{ opacity }}>
        Prayog Studio
      </h1>
    </AbsoluteFill>
  );
};
