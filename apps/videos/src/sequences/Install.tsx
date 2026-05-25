import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Scene } from '../components/Scene';
import { Label, BigText } from '../components/BigText';
import { Terminal } from '../components/Terminal';
import { colors, fonts } from '../tokens';

/*
 * "How to install" beat — shows the one-line drop-in.
 *
 * The terminal types the <link> tag, then a "✓ Native WP admin look"
 * success line lands underneath to telegraph that one tag is the whole
 * install path. No build, no bundler, no npm package required.
 */
export const Install: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const termSpring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 22, stiffness: 70, mass: 1 },
  });
  const termY = interpolate(termSpring, [0, 1], [60, 0]);

  return (
    <Scene totalFrames={totalFrames} background={colors.bgRaised}>
      <div style={{ textAlign: 'center', maxWidth: 1500 }}>
        <Label delay={0}>One tag. Zero build step.</Label>

        <BigText delay={10} size={84} animation="fadeUp" style={{ marginBottom: 56 }}>
          Drop it into any plugin admin page.
        </BigText>

        <div
          style={{
            opacity: termSpring,
            transform: `translateY(${termY}px)`,
            maxWidth: 1280,
            margin: '0 auto',
            // Terminal contents must read left-to-right; the parent
            // Scene uses align-items: center which would otherwise
            // squeeze the typed text into the middle of the box.
            textAlign: 'left',
          }}
        >
          <Terminal
            startFrame={50}
            charsPerFrame={2.4}
            lines={[
              // Single visual command so the terminal shows one prompt,
              // not two. The continuation line is rendered as `output`
              // (no prompt prefix) but inherits the same typewriter feel.
              {
                type: 'cmd',
                text: '<link rel="stylesheet"',
              },
              {
                type: 'output',
                text: '      href="https://cdn.wp-admincss.com/css/latest.css">',
                delay: 26,
              },
              { type: 'blank', text: '', delay: 60 },
              {
                type: 'success',
                text: '✓ Native WordPress admin look — no build, no bundler.',
                delay: 70,
              },
              {
                type: 'output',
                text: '  Use real WP class names: .button, .notice, .wp-list-table…',
                delay: 90,
              },
            ]}
          />
        </div>

        <div
          style={{
            marginTop: 56,
            fontFamily: fonts.mono,
            fontSize: 22,
            color: colors.textMuted,
            opacity: spring({
              frame: Math.max(0, frame - 200),
              fps,
              config: { damping: 22, stiffness: 130 },
            }),
          }}
        >
          Or use the React, PHP, or tokens package — same markup, your stack.
        </div>
      </div>
    </Scene>
  );
};
