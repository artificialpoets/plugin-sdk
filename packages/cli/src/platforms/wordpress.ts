import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { step, warn } from '../util/log.ts';
import type { Platform } from './types.ts';

/*
 * WordPress platform adapter.
 *
 * Template location:
 *   - In the monorepo (development): boilerplates/wordpress/
 *   - When installed via npm: packages/cli/templates/wordpress/
 *     (a copy made by the publish step, since npm doesn't include
 *      sibling packages by default).
 *
 * Both paths are tried in order so `node src/index.ts` works from a
 * fresh clone without a build step.
 */

const here = dirname(fileURLToPath(import.meta.url));
const CANDIDATE_TEMPLATE_DIRS = [
  // Local dev: packages/cli/src/platforms/ → ../../../../boilerplates/wordpress/
  resolve(here, '../../../../boilerplates/wordpress'),
  // Compiled dist: packages/cli/dist/platforms/ → ../../../../boilerplates/wordpress/
  resolve(here, '../../../../boilerplates/wordpress'),
  // Bundled with the published package
  resolve(here, '../../templates/wordpress'),
];

export const wordpress: Platform = {
  id: 'wordpress',
  displayName: 'WordPress',
  defaultName: 'My Plugin',

  resolveTemplateDir(): string {
    for (const candidate of CANDIDATE_TEMPLATE_DIRS) {
      if (existsSync(candidate)) return candidate;
    }
    throw new Error(
      `Could not locate the WordPress template. Looked in:\n` +
        CANDIDATE_TEMPLATE_DIRS.map((p) => `  - ${p}`).join('\n'),
    );
  },

  async postCreate(outDir): Promise<void> {
    if (!hasComposer()) {
      warn(
        'composer not found on PATH — skipping `composer install`. ' +
          `Run it yourself in ${outDir} before activating the plugin.`,
      );
      return;
    }
    step('Running composer install …');
    await run('composer', ['install', '--no-interaction', '--prefer-dist'], outDir);
  },
};

/* ── helpers ───────────────────────────────────────────────────────── */

function hasComposer(): boolean {
  // crude PATH probe — `composer --version` returns 0 if installed
  try {
    const child = spawnSync('composer', ['--version'], { stdio: 'ignore' });
    return child.status === 0;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolveP, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit' });
    child.on('exit', (code) =>
      code === 0 ? resolveP() : reject(new Error(`${cmd} exited with code ${code}`)),
    );
    child.on('error', reject);
  });
}
