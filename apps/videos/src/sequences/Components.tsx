import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Scene } from '../components/Scene';
import { Label, BigText } from '../components/BigText';
import { colors, fonts } from '../tokens';

/*
 * Component-grid beat — shows four real WP admin primitives
 * rendered with the same class names a WordPress plugin would use.
 * Each card pops in on its own spring so the grid assembles itself.
 *
 * These aren't real WP-admin DOM (rendering the live CSS bundle inside
 * Remotion would balloon the bundle); they're stylized mockups in the
 * same palette + spacing as the real components. Close enough to read
 * as "this is what you get" in a 2-second glance.
 */

const cards: { title: string; render: () => React.ReactNode }[] = [
  {
    title: 'Button',
    render: () => (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          style={{
            background: colors.primary,
            color: '#fff',
            border: `1px solid ${colors.primaryDark}`,
            borderRadius: 4,
            padding: '8px 16px',
            fontSize: 16,
            fontFamily: fonts.sans,
            fontWeight: 500,
          }}
        >
          Save changes
        </button>
        <button
          style={{
            background: colors.bg,
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            borderRadius: 4,
            padding: '8px 16px',
            fontSize: 16,
            fontFamily: fonts.sans,
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
      </div>
    ),
  },
  {
    title: 'Notice',
    render: () => (
      <div
        style={{
          background: colors.bg,
          borderLeft: `4px solid ${colors.green}`,
          padding: '12px 16px',
          fontSize: 16,
          fontFamily: fonts.sans,
          color: colors.text,
          width: '100%',
          boxShadow: '0 1px 1px rgba(0,0,0,0.04)',
        }}
      >
        <strong>Settings saved.</strong>
      </div>
    ),
  },
  {
    title: 'Form table',
    render: () => (
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          color: colors.text,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 90, fontWeight: 600, paddingTop: 6 }}>API key</div>
          <input
            value="sk-abc1234567890"
            readOnly
            style={{
              flex: 1,
              border: `1px solid ${colors.border}`,
              padding: '6px 10px',
              fontFamily: fonts.mono,
              fontSize: 14,
              borderRadius: 3,
              background: colors.bg,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 90, fontWeight: 600, paddingTop: 6 }}>Env</div>
          <select
            style={{
              flex: 1,
              border: `1px solid ${colors.border}`,
              padding: '6px 10px',
              fontFamily: fonts.sans,
              fontSize: 14,
              borderRadius: 3,
              background: colors.bg,
            }}
          >
            <option>Production</option>
          </select>
        </div>
      </div>
    ),
  },
  {
    title: 'Status badge',
    render: () => (
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { text: 'Active',   bg: '#dff7e3', fg: '#0c662a', bd: '#9ed8ad' },
          { text: 'Pending',  bg: '#fff5d6', fg: '#5b4400', bd: '#f0d36e' },
          { text: 'Disabled', bg: '#f6f7f7', fg: '#646970', bd: '#dcdcde' },
        ].map((b) => (
          <span
            key={b.text}
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: fonts.sans,
              color: b.fg,
              background: b.bg,
              border: `1px solid ${b.bd}`,
              borderRadius: 3,
              padding: '3px 10px',
            }}
          >
            {b.text}
          </span>
        ))}
      </div>
    ),
  },
];

export const Components: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Scene totalFrames={totalFrames}>
      <div style={{ textAlign: 'center', maxWidth: 1500, width: '100%' }}>
        <Label delay={0}>Real WP class names</Label>

        <BigText delay={10} size={84} animation="fadeUp" style={{ marginBottom: 64 }}>
          Indistinguishable from native WordPress.
        </BigText>

        {/* 2 × 2 card grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {cards.map((card, i) => {
            const enter = spring({
              frame: Math.max(0, frame - (40 + i * 14)),
              fps,
              config: { damping: 22, stiffness: 90 },
            });
            const y = interpolate(enter, [0, 1], [40, 0]);

            return (
              <div
                key={card.title}
                style={{
                  opacity: enter,
                  transform: `translateY(${y}px)`,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '28px 28px 32px',
                  textAlign: 'left',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(0,0,0,0.1)',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: colors.primary,
                    marginBottom: 22,
                  }}
                >
                  {card.title}
                </div>
                <div>{card.render()}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: fonts.mono,
            fontSize: 20,
            color: colors.textMuted,
            opacity: spring({
              frame: Math.max(0, frame - 200),
              fps,
              config: { damping: 22, stiffness: 130 },
            }),
          }}
        >
          .button · .notice · .form-table · .wp-list-table · .postbox · 20+ more
        </div>
      </div>
    </Scene>
  );
};
