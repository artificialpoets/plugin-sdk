import React from 'react';
import { colors } from '../tokens';

interface LogoProps {
  /** Total height in px. Width auto-scales. */
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Plugin SDK wordmark — same composition as the topbar logo on the
 * landing site: bold "Plugin" in body text + blue "SDK" accent. We
 * render it as DOM (not SVG) because the rendered fonts use system
 * stacks and matching the kerning exactly is more reliable that way.
 */
export const Logo: React.FC<LogoProps> = ({ height = 80, style }) => {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 700,
        fontSize: height,
        lineHeight: 1,
        color: colors.text,
        letterSpacing: '-0.02em',
        display: 'inline-flex',
        gap: height * 0.22,
        alignItems: 'baseline',
        ...style,
      }}
      aria-label="Plugin SDK"
    >
      <span>Plugin</span>
      <span style={{ color: colors.primary }}>SDK</span>
    </div>
  );
};
