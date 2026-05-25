import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { c } from './util/log.ts';

/*
 * Thin wrapper around `node:readline/promises`.
 *
 * Every prompt:
 *   - Shows the default in dimmed brackets after the question
 *   - Returns the default when the user hits enter on an empty line
 *   - Loops on validation failure with the validator's error message
 *
 * The CLI calls `closePrompt()` when done — readline holds the stdin
 * file descriptor open until you do.
 */

let rl: readline.Interface | null = null;

function ensureRl(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({ input: stdin, output: stdout });
  }
  return rl;
}

export async function askText(
  question: string,
  options: {
    defaultValue?: string;
    validate?: (input: string) => string | null;
  } = {},
): Promise<string> {
  const { defaultValue, validate } = options;
  const suffix = defaultValue ? c.dim(`(${defaultValue})`) + ' ' : '';
  const interface_ = ensureRl();

  for (;;) {
    const answer = (await interface_.question(`${question} ${suffix}`)).trim();
    const value = answer || defaultValue || '';
    if (!value) {
      console.log(c.red('  Please enter a value.'));
      continue;
    }
    if (validate) {
      const err = validate(value);
      if (err) {
        console.log(c.red(`  ${err}`));
        continue;
      }
    }
    return value;
  }
}

export async function askConfirm(
  question: string,
  defaultValue = true,
): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const interface_ = ensureRl();
  for (;;) {
    const raw = (await interface_.question(`${question} ${c.dim(`(${hint})`)} `))
      .trim()
      .toLowerCase();
    if (!raw) return defaultValue;
    if (raw === 'y' || raw === 'yes') return true;
    if (raw === 'n' || raw === 'no') return false;
    console.log(c.red('  Please answer yes or no.'));
  }
}

export function closePrompt(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}
