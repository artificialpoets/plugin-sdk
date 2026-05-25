import React from 'react';
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';
import { colors } from '../tokens';

interface SceneProps {
  children: React.ReactNode;
  background?: string;
  /** Frames to fade in at start of scene. Default: 12 */
  fadeInFrames?: number;
  /** Frames to fade out at end of scene. Default: 12 */
  fadeOutFrames?: number;
  /** Required for the fade-out interpolation. */
  totalFrames?: number;
  padding?: number | string;
  align?: 'center' | 'flex-start' | 'flex-end';
  justify?: 'center' | 'flex-start' | 'flex-end';
}

/**
 * Standard scene wrapper. Adds the brand gradient + cross-scene fade
 * transitions so individual sequences don't have to manage fade math.
 */
export const Scene: React.FC<SceneProps> = ({
  children,
  background,
  fadeInFrames = 12,
  fadeOutFrames = 12,
  totalFrames,
  padding = 96,
  align = 'center',
  justify = 'center',
}) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  if (fadeInFrames > 0) {
    opacity = Math.min(
      opacity,
      interpolate(frame, [0, fadeInFrames], [0, 1], { extrapolateRight: 'clamp' })
    );
  }
  if (totalFrames && fadeOutFrames > 0) {
    opacity = Math.min(
      opacity,
      interpolate(frame, [totalFrames - fadeOutFrames, totalFrames], [1, 0], {
        extrapolateLeft: 'clamp',
      })
    );
  }

  // Default — light brand gradient. Pass `background` to override (e.g.
  // the Outro uses solid white for a clean final beat).
  const bg =
    background ??
    `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,113,177,.10), transparent 65%), linear-gradient(180deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 100%)`;

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        justifyContent: justify,
        padding,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
