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

/**
 * Multiple-choice prompt. Shows a numbered list, accepts either the
 * position (1, 2, …) or the literal value name. Bare Enter selects the
 * default. Loops on invalid input.
 */
export async function askChoice<T extends string>(
  question: string,
  choices: ReadonlyArray<{ value: T; label: string; description?: string }>,
  defaultValue: T,
): Promise<T> {
  const interface_ = ensureRl();
  for (;;) {
    console.log(`\n${question}`);
    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i]!;
      const marker = choice.value === defaultValue ? c.bold('●') : c.dim('○');
      const label  = choice.value === defaultValue ? c.bold(choice.label) : choice.label;
      console.log(`  ${marker} [${i + 1}] ${label}`);
      if (choice.description) {
        console.log(`        ${c.dim(choice.description)}`);
      }
    }
    const raw = (await interface_.question(
      `Pick 1-${choices.length} ${c.dim(`(default: ${defaultValue})`)} `,
    )).trim();

    if (!raw) return defaultValue;

    const num = Number.parseInt(raw, 10);
    if (Number.isFinite(num) && num >= 1 && num <= choices.length) {
      return choices[num - 1]!.value;
    }
    // Allow typing the value name directly too — handy for non-interactive
    // copy-paste from CLI documentation.
    const byValue = choices.find((c) => c.value === raw);
    if (byValue) return byValue.value;

    console.log(c.red(`  Pick a number 1-${choices.length} or a value name.`));
  }
}

export function closePrompt(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}
