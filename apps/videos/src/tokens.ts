/**
 * Design tokens — mirrored from the wp-admincss.com landing page + OG cards.
 *
 * Edits here propagate to every sequence. Keep the palette tight so the
 * video reads as one piece with the rest of the brand surface.
 */
export const colors = {
  // Surface — light palette matching the landing page hero gradient
  bg: '#ffffff',
  bgRaised: '#f6f8fb',
  bgGradientStart: '#f6f8fb',
  bgGradientEnd: '#ffffff',
  border: '#dcdcde',
  text: '#14181f',
  textMuted: '#646970',

  // Brand — WordPress admin primary. Same hex used everywhere.
  primary: '#2271b1',
  primaryDark: '#1c5d94',
  primaryLight: '#4f94d4',

  // Status — used sparingly inside the terminal + success notice mocks
  green: '#00a32a',
  red: '#d63638',
  yellow: '#dba617',

  // Terminal — dark surface that contrasts the light scene background
  termBg: '#0f1115',
  termText: '#e6edf3',
  termPrompt: '#4f94d4',
  termOutput: '#9ba1ab',
} as const;

export const fonts = {
  // Stay native — the WP admin uses system fonts. Mirrors --wpadmin-font.
  sans:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  mono:
    'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", Consolas, "Liberation Mono", monospace',
} as const;

// Video format. Landscape primary — vertical (9:16) is a separate composition.
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 60;
