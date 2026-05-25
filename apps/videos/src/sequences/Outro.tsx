import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { Scene } from '../components/Scene';
import { BigText, Label } from '../components/BigText';
import { Logo } from '../components/Logo';
import { colors, fonts } from '../tokens';

/*
 * Closing CTA — the take-action beat.
 *
 *   Label   "Open source"
 *   Logo    Plugin SDK wordmark (large)
 *   URL     wp-admincss.com (mono, brand blue)
 *   Pills   2 × 3 grid of value props
 *   Domain  github.com/artificialpoets/plugin-sdk
 */
export const Outro: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pills = [
    'Apache 2.0',
    'WP-blue native',
    'AI-ready',
    'No build step',
    'CSS · React · PHP',
    'GPL-safe',
  ];

  const logoSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.9 },
  });
  const logoY = interpolate(logoSpring, [0, 1], [40, 0]);

  return (
    <Scene totalFrames={totalFrames} fadeInFrames={18} fadeOutFrames={30}>
      <div style={{ textAlign: 'center', maxWidth: 1400 }}>
        <Label delay={0}>Free &amp; Open Source</Label>

        <div
          style={{
            opacity: logoSpring,
            transform: `translateY(${logoY}px)`,
            marginBottom: 36,
          }}
        >
          <Logo height={130} />
        </div>

        <BigText
          font="mono"
          size={48}
          delay={50}
          animation="fadeIn"
          color={colors.primary}
          style={{ marginTop: 16 }}
        >
          wp-admincss.com
        </BigText>

        {/* 2 × 3 feature pills */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            alignItems: 'center',
            marginTop: 56,
          }}
        >
          {[pills.slice(0, 3), pills.slice(3)].map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: 18 }}>
              {row.map((pill, colIdx) => {
                const i = rowIdx * 3 + colIdx;
                const sp = spring({
                  frame: Math.max(0, frame - (90 + i * 12)),
                  fps,
                  config: { damping: 22, stiffness: 130 },
                });
                const y = interpolate(sp, [0, 1], [12, 0]);
                return (
                  <div
                    key={pill}
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 26,
                      color: colors.textMuted,
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 999,
                      padding: '12px 28px',
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
          ))}
        </div>

        <BigText
          font="mono"
          size={22}
          delay={170}
          animation="fadeIn"
          color={colors.textMuted}
          style={{ marginTop: 56 }}
        >
          github.com/artificialpoets/plugin-sdk
        </BigText>
      </div>
    </Scene>
  );
};
