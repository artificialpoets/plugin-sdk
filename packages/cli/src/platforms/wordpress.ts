import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { step, warn } from '../util/log.ts';
import type { DistributionChannel, PluginContext } from '../template.ts';
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

  shouldEmit(rel: string, ctx: PluginContext): boolean {
    return shouldEmitForChannel(rel, ctx.channel);
  },

  patchFile(rel: string, text: string, ctx: PluginContext): string {
    return patchFileForChannel(rel, text, ctx.channel);
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

/* ── channel-conditional emission ──────────────────────────────────── */

/**
 * Files that are channel-specific and only emitted for matching channels.
 * Anything not listed here is emitted for every channel.
 */
const CHANNEL_FILE_GATES: Record<string, ReadonlyArray<DistributionChannel>> = {
  // GitHub release pipeline — only useful when the channel actually
  // ships through a GitHub release (github or dual).
  '.github/workflows/release.yml': ['github', 'dual'],

  // wp.org-only artefacts — only emitted when wp.org is in scope.
  'readme.txt':                 ['wp.org', 'dual'],
  'bin/submission-prep.sh':     ['wp.org', 'dual'],
};

export function shouldEmitForChannel(rel: string, channel: DistributionChannel): boolean {
  const allowed = CHANNEL_FILE_GATES[rel];
  if (!allowed) return true; // not gated; always emit
  return allowed.includes(channel);
}

/**
 * Content patches applied AFTER shouldEmit (so a skipped file never
 * reaches patch logic) and BEFORE substitute() (so any literal-string
 * tokens we leave or insert still get the normal substitution pass).
 */
export function patchFileForChannel(rel: string, text: string, channel: DistributionChannel): string {
  // Main PHP file — strip or unlock the Plugin Update Checker block.
  if (rel === 'plugin-sdk-starter.php') {
    return patchMainPhp(text, channel);
  }

  // composer.json — drop the PUC require line for wp.org-only plugins.
  if (rel === 'composer.json') {
    return patchComposerJson(text, channel);
  }

  // package.json — drop `prep` script for github-only plugins (no
  // wp.org submission flow to run) and `slug-research` survives in all
  // channels (it's still useful for picking a name).
  if (rel === 'package.json') {
    return patchPackageJson(text, channel);
  }

  return text;
}

const PUC_BLOCK_RE = /\n*\/\* === PUC:BEGIN === \*\/[\s\S]*?\/\* === PUC:END === \*\/\n*/;
const PUC_MARKER_CHECK = "file_exists(PSDK_DIR . '.use-github-updates')";

function patchMainPhp(text: string, channel: DistributionChannel): string {
  if (channel === 'dual') {
    return text; // PUC block stays as-is (marker-gated, exactly what we want)
  }

  if (channel === 'wp.org') {
    // Remove the entire PUC block — wp.org users get updates via SVN.
    return text.replace(PUC_BLOCK_RE, '\n');
  }

  if (channel === 'github') {
    // PUC is always-on; remove the marker file check so the block runs
    // unconditionally at boot.
    return text.replace(
      PUC_MARKER_CHECK,
      "/* github channel — PUC always on */ true",
    );
  }

  return text;
}

const PUC_DEP_LINES_RE = /,?\s*"yahnis-elsts\/plugin-update-checker"\s*:\s*"[^"]+"/;

function patchComposerJson(text: string, channel: DistributionChannel): string {
  if (channel === 'wp.org') {
    return text.replace(PUC_DEP_LINES_RE, '');
  }
  return text;
}

const PREP_SCRIPT_LINE_RE = /\n?\s*"prep":\s*"[^"]*",?/;

function patchPackageJson(text: string, channel: DistributionChannel): string {
  if (channel === 'github') {
    // Strip the `prep` script — no submission-prep.sh ships in this
    // channel. Trailing comma cleanup keeps the JSON valid.
    let patched = text.replace(PREP_SCRIPT_LINE_RE, '');
    // If the removal left a stray `, }` because prep was the last
    // entry, normalise it.
    patched = patched.replace(/,(\s*})/g, '$1');
    return patched;
  }
  return text;
}

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
