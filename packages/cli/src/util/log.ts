/*
 * Tiny logger with ANSI colors. Avoids a dependency on kleur / chalk —
 * we only need a handful of escape codes.
 *
 * Respects NO_COLOR (https://no-color.org) and isTTY. Tests pipe stdout
 * to a buffer so colors are stripped there automatically.
 */
const ENABLED =
  typeof process !== 'undefined' &&
  !process.env.NO_COLOR &&
  process.stdout &&
  process.stdout.isTTY === true;

function paint(code: number): (s: string) => string {
  return (s: string) => (ENABLED ? `\x1b[${code}m${s}\x1b[0m` : s);
}

export const c = {
  dim: paint(2),
  cyan: paint(36),
  green: paint(32),
  red: paint(31),
  yellow: paint(33),
  bold: paint(1),
};

export function info(msg: string): void {
  console.log(`${c.cyan('ℹ')} ${msg}`);
}

export function success(msg: string): void {
  console.log(`${c.green('✓')} ${msg}`);
}

export function warn(msg: string): void {
  console.error(`${c.yellow('!')} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${c.red('✗')} ${msg}`);
}

export function step(msg: string): void {
  console.log(`${c.dim('→')} ${msg}`);
}
