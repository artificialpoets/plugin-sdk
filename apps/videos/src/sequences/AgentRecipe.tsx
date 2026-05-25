import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Scene } from '../components/Scene';
import { Label, BigText } from '../components/BigText';
import { Terminal } from '../components/Terminal';
import { colors, fonts } from '../tokens';

/*
 * AI-agent recipe beat — the most differentiated piece of Plugin SDK.
 * Two columns:
 *   left  — terminal showing the one-line agent kickoff
 *   right — card listing the artifacts the CDN serves to agents
 *
 * The card items pop in staggered, so the eye follows the terminal
 * first, then reads the artifact list.
 */
const artifacts = [
  { name: 'AGENTS.md',           note: 'Master entry point' },
  { name: 'skills/security.md',  note: 'Caps + nonces + sanitize/escape' },
  { name: 'skills/database.md',  note: '$wpdb + dbDelta' },
  { name: 'skills/enqueue.md',   note: '4 enqueue hooks' },
  { name: 'boilerplate/',        note: 'Working WP plugin starter' },
];

export const AgentRecipe: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Scene totalFrames={totalFrames} background={colors.bgRaised}>
      <div style={{ textAlign: 'center', maxWidth: 1600, width: '100%' }}>
        <Label delay={0}>Built for AI agents</Label>

        <BigText delay={10} size={80} animation="fadeUp" style={{ marginBottom: 56 }}>
          Point your agent. Skip the prompting.
        </BigText>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 40,
            alignItems: 'stretch',
            maxWidth: 1400,
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          {/* Left — terminal kickoff. Single visual command with a
              wrapped continuation line so the terminal shows one $
              prompt instead of two. */}
          <Terminal
            startFrame={50}
            charsPerFrame={2.6}
            lines={[
              { type: 'cmd', text: 'claude "build a settings page using' },
              {
                type: 'output',
                text: '         cdn.wp-admincss.com/AGENTS.md"',
                delay: 26,
              },
              { type: 'blank', text: '', delay: 60 },
              {
                type: 'output',
                text: '→ fetching AGENTS.md…',
                delay: 80,
              },
              {
                type: 'output',
                text: '→ loading skills/security.md…',
                delay: 95,
              },
              {
                type: 'success',
                text: '✓ plugin scaffolded — secure by default.',
                delay: 110,
              },
            ]}
          />

          {/* Right — artifact list */}
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 32,
              boxShadow:
                '0 1px 2px rgba(0,0,0,0.04), 0 24px 64px -16px rgba(20,24,31,0.12)',
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 16,
                color: colors.primary,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 22,
              }}
            >
              cdn.wp-admincss.com
            </div>

            {artifacts.map((a, i) => {
              const enter = spring({
                frame: Math.max(0, frame - (90 + i * 14)),
                fps,
                config: { damping: 22, stiffness: 100 },
              });
              const x = interpolate(enter, [0, 1], [24, 0]);

              return (
                <div
                  key={a.name}
                  style={{
                    opacity: enter,
                    transform: `translateX(${x}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 22,
                      fontWeight: 600,
                      color: colors.text,
                    }}
                  >
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 17,
                      color: colors.textMuted,
                      marginTop: 4,
                    }}
                  >
                    {a.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Scene>
  );
};
