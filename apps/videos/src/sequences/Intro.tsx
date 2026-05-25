import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { Scene } from '../components/Scene';
import { Logo } from '../components/Logo';
import { colors, fonts } from '../tokens';

/*
 * Opening beat — establishes the brand.
 *
 * Animation order:
 *   0–20f   scene fades in
 *   15–60f  logo lifts up + fades in
 *   45–90f  headline line 1 fades up
 *   75–120f headline line 2 fades up (in WP blue, mirroring the landing
 *           hero's gradient-clipped accent line)
 *   115–145f tagline + pills fade in
 */
export const Intro: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tweak = (delay: number, opts?: { damping?: number; stiffness?: number }) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: opts?.damping ?? 18, stiffness: opts?.stiffness ?? 80, mass: 0.9 },
    });

  const logoSpring = tweak(15);
  const logoY = interpolate(logoSpring, [0, 1], [40, 0]);

  const h1Spring = tweak(45);
  const h1Y = interpolate(h1Spring, [0, 1], [40, 0]);

  const h2Spring = tweak(75);
  const h2Y = interpolate(h2Spring, [0, 1], [40, 0]);

  const subSpring = tweak(115, { damping: 22, stiffness: 100 });

  const pillBaseDelay = 130;

  return (
    <Scene totalFrames={totalFrames}>
      <div style={{ textAlign: 'center', maxWidth: 1400 }}>
        {/* Logo */}
        <div
          style={{
            opacity: logoSpring,
            transform: `translateY(${logoY}px)`,
            marginBottom: 56,
          }}
        >
          <Logo height={70} />
        </div>

        {/* Two-line headline. Mirrors the landing hero: black line on
            top, WP-blue accent line below. */}
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 132,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            color: colors.text,
            marginBottom: 36,
          }}
        >
          <div style={{ opacity: h1Spring, transform: `translateY(${h1Y}px)` }}>
            Build WordPress plugins
          </div>
          <div
            style={{
              opacity: h2Spring,
              transform: `translateY(${h2Y}px)`,
              color: colors.primary,
            }}
          >
            that feel native.
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: subSpring,
            fontFamily: fonts.sans,
            fontSize: 32,
            color: colors.textMuted,
            maxWidth: 1100,
            margin: '0 auto 48px',
            lineHeight: 1.45,
          }}
        >
          Real WP admin markup. Security by default. CSS, React, and PHP.
        </div>

        {/* Brand pills — same vocabulary as the landing eyebrow */}
        <div
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {['Open source', 'Apache 2.0', 'No build step', 'AI-ready'].map((pill, i) => {
            const sp = tweak(pillBaseDelay + i * 10, { damping: 22, stiffness: 130 });
            const y = interpolate(sp, [0, 1], [16, 0]);
            return (
              <div
                key={pill}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 24,
                  color: colors.textMuted,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 999,
                  padding: '10px 22px',
                  opacity: sp,
                  transform: `translateY(${y}px)`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};
