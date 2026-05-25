import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors, fonts } from '../tokens';

interface BigTextProps {
  children: React.ReactNode;
  font?: 'mono' | 'sans';
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  delay?: number;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'none';
  style?: React.CSSProperties;
}

/**
 * Headline component with a spring-driven entrance. Used everywhere a
 * single big phrase needs to land on a beat.
 */
export const BigText: React.FC<BigTextProps> = ({
  children,
  font = 'sans',
  size = 96,
  color = colors.text,
  align = 'center',
  delay = 0,
  animation = 'fadeUp',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame - delay);

  const progress = spring({
    frame: elapsed,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });

  let transform: string = 'none';
  let opacity = 1;

  if (animation === 'fadeUp') {
    opacity = progress;
    transform = `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`;
  } else if (animation === 'fadeIn') {
    opacity = progress;
  } else if (animation === 'slideLeft') {
    opacity = progress;
    transform = `translateX(${interpolate(progress, [0, 1], [60, 0])}px)`;
  }

  return (
    <div
      style={{
        fontFamily: fonts[font],
        fontSize: size,
        fontWeight: 700,
        color,
        textAlign: align,
        lineHeight: 1.05,
        letterSpacing: font === 'sans' ? '-0.03em' : '-0.02em',
        opacity,
        transform,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Eyebrow label rendered above a BigText — short uppercase mono text
 * like "INSTALL" or "FOR AI AGENTS". The brand primary color gives it
 * the same vibe as the section eyebrows on the landing page.
 */
export const Label: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, color = colors.primary, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame - delay);
  const opacity = spring({ frame: elapsed, fps, config: { damping: 20, stiffness: 120 } });

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 26,
        color,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        opacity,
        marginBottom: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
