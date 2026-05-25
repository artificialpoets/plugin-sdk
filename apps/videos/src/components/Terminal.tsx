import React from 'react';
import { useCurrentFrame } from 'remotion';
import { colors, fonts } from '../tokens';

export type TermLineType = 'cmd' | 'output' | 'blank' | 'success' | 'error';

export interface TermLine {
  type: TermLineType;
  text: string;
  /** Frames after `startFrame` before this line begins appearing. */
  delay?: number;
}

interface TerminalProps {
  lines: TermLine[];
  startFrame?: number;
  /** Speed of the typewriter effect on `cmd` lines. */
  charsPerFrame?: number;
  style?: React.CSSProperties;
}

/**
 * Animated terminal mock used in Install + AgentRecipe scenes. `cmd`
 * lines type character-by-character; `output` / `success` / `error`
 * lines pop in fully formed after their delay.
 *
 * The chrome (red/yellow/green dots) matches the browser frame used
 * elsewhere on the landing — keeps the visual language consistent.
 */
export const Terminal: React.FC<TerminalProps> = ({
  lines,
  startFrame = 0,
  charsPerFrame = 3,
  style,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);

  const rendered: { line: TermLine; visible: string; done: boolean }[] = [];

  for (const line of lines) {
    const lineDelay = line.delay ?? 0;
    const lineElapsed = Math.max(0, elapsed - lineDelay);

    if (line.type === 'blank') {
      rendered.push({ line, visible: '', done: lineElapsed > 0 });
      continue;
    }

    if (line.type !== 'cmd') {
      // Output lines pop in fully formed after a short delay.
      const done = lineElapsed > 4;
      rendered.push({ line, visible: done ? line.text : '', done });
      continue;
    }

    // cmd lines — typewriter
    const charsVisible = Math.min(line.text.length, Math.floor(lineElapsed * charsPerFrame));
    const done = charsVisible >= line.text.length;
    rendered.push({ line, visible: line.text.slice(0, charsVisible), done });
  }

  return (
    <div
      style={{
        background: colors.termBg,
        borderRadius: 14,
        padding: '28px 36px',
        fontFamily: fonts.mono,
        fontSize: 24,
        lineHeight: 1.7,
        boxShadow:
          '0 32px 96px rgba(20,24,31,0.18), 0 2px 8px rgba(20,24,31,0.06)',
        ...style,
      }}
    >
      {/* Window chrome — same dot palette as the landing mockup */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {['#ff5f57', '#ffbd2e', '#28c840'].map((c, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
        ))}
      </div>

      {rendered.map((r, i) => {
        if (!r.done && r.visible === '' && r.line.type !== 'cmd') return null;
        const isLastCmd = r.line.type === 'cmd' && i === rendered.length - 1;
        const showCursor = isLastCmd && !r.done;

        return (
          <div key={i} style={{ minHeight: r.line.type === 'blank' ? 14 : undefined }}>
            {r.line.type === 'cmd' && (
              <span>
                <span style={{ color: colors.termPrompt }}>$ </span>
                <span style={{ color: colors.termText }}>{r.visible}</span>
                {showCursor && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1em',
                      background: colors.termPrompt,
                      marginLeft: 1,
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </span>
            )}
            {r.line.type === 'output' && r.done && (
              <span style={{ color: colors.termOutput }}>{r.line.text}</span>
            )}
            {r.line.type === 'success' && r.done && (
              <span style={{ color: colors.green }}>{r.line.text}</span>
            )}
            {r.line.type === 'error' && r.done && (
              <span style={{ color: colors.red }}>{r.line.text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
