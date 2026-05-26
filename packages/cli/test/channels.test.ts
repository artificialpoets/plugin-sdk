import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  shouldEmitForChannel,
  patchFileForChannel,
} from '../src/platforms/wordpress.ts';
import { parseChannel } from '../src/util/slug.ts';

/*
 * Channel-conditional emission tests.
 *
 * The CLI accepts --channel=<wp.org|github|dual> at scaffold time.
 * The wordpress platform implements two hooks the scaffolder calls
 * per file:
 *   - shouldEmit(rel, ctx): boolean   — decide whether to write
 *   - patchFile(rel, text, ctx): str  — rewrite content before substitute
 *
 * These tests exercise both hooks directly with each channel value so
 * we don't depend on running the full scaffolder (which needs a temp
 * dir + the boilerplate tree).
 */

describe('parseChannel', () => {
  it('accepts the three valid channel values', () => {
    assert.equal(parseChannel('wp.org'), 'wp.org');
    assert.equal(parseChannel('github'), 'github');
    assert.equal(parseChannel('dual'), 'dual');
  });
  it('rejects anything else', () => {
    assert.equal(parseChannel(''),         null);
    assert.equal(parseChannel('wporg'),    null);
    assert.equal(parseChannel('gitlab'),   null);
    assert.equal(parseChannel('WP.org'),   null); // case-sensitive
  });
});

describe('shouldEmitForChannel — wp.org channel', () => {
  it('skips the GitHub release workflow', () => {
    assert.equal(shouldEmitForChannel('.github/workflows/release.yml', 'wp.org'), false);
  });
  it('keeps the CI workflow (lint + Plugin Check)', () => {
    assert.equal(shouldEmitForChannel('.github/workflows/ci.yml', 'wp.org'), true);
  });
  it('keeps readme.txt + submission-prep.sh', () => {
    assert.equal(shouldEmitForChannel('readme.txt', 'wp.org'), true);
    assert.equal(shouldEmitForChannel('bin/submission-prep.sh', 'wp.org'), true);
  });
  it('keeps everything else (build.sh, slug-research, src, etc.)', () => {
    assert.equal(shouldEmitForChannel('bin/build.sh', 'wp.org'), true);
    assert.equal(shouldEmitForChannel('bin/slug-research.sh', 'wp.org'), true);
    assert.equal(shouldEmitForChannel('src/Plugin.php', 'wp.org'), true);
    assert.equal(shouldEmitForChannel('composer.json', 'wp.org'), true);
  });
});

describe('shouldEmitForChannel — github channel', () => {
  it('keeps the GitHub release workflow', () => {
    assert.equal(shouldEmitForChannel('.github/workflows/release.yml', 'github'), true);
  });
  it('skips readme.txt and submission-prep.sh', () => {
    assert.equal(shouldEmitForChannel('readme.txt', 'github'), false);
    assert.equal(shouldEmitForChannel('bin/submission-prep.sh', 'github'), false);
  });
  it('keeps slug-research (useful for picking a name even off wp.org)', () => {
    assert.equal(shouldEmitForChannel('bin/slug-research.sh', 'github'), true);
  });
});

describe('shouldEmitForChannel — dual channel', () => {
  it('emits everything', () => {
    for (const rel of [
      '.github/workflows/release.yml',
      '.github/workflows/ci.yml',
      'readme.txt',
      'bin/submission-prep.sh',
      'bin/slug-research.sh',
      'bin/build.sh',
      'plugin-sdk-starter.php',
      'composer.json',
      'package.json',
    ]) {
      assert.equal(shouldEmitForChannel(rel, 'dual'), true, `expected ${rel} to be emitted for dual channel`);
    }
  });
});

describe('patchFileForChannel — main PHP file (PUC block)', () => {
  const sample = `defined('ABSPATH') || exit;

define('PSDK_VERSION', '0.1.0');

add_action('plugins_loaded', static function() {
    // boot
});

/* === PUC:BEGIN === */
if (file_exists(PSDK_DIR . '.use-github-updates') && class_exists(\\YahnisElsts\\PluginUpdateChecker\\v5\\PucFactory::class)) {
    \\YahnisElsts\\PluginUpdateChecker\\v5\\PucFactory::buildUpdateChecker(
        'https://github.com/your-org/plugin-sdk-starter/',
        PSDK_FILE,
        'plugin-sdk-starter'
    );
}
/* === PUC:END === */
`;

  it('removes the PUC block entirely for wp.org', () => {
    const out = patchFileForChannel('plugin-sdk-starter.php', sample, 'wp.org');
    assert.ok(!out.includes('PUC:BEGIN'), 'PUC:BEGIN marker leaked');
    assert.ok(!out.includes('PUC:END'),   'PUC:END marker leaked');
    assert.ok(!out.includes('PucFactory'), 'PucFactory reference leaked');
    // Everything BEFORE the block stays
    assert.ok(out.includes("define('PSDK_VERSION'"), 'pre-block content lost');
    assert.ok(out.includes("add_action('plugins_loaded'"), 'pre-block content lost');
  });

  it('replaces the marker check with `true` for github', () => {
    const out = patchFileForChannel('plugin-sdk-starter.php', sample, 'github');
    assert.ok(out.includes('PUC:BEGIN'), 'block was removed instead of patched');
    assert.ok(!out.includes("file_exists(PSDK_DIR . '.use-github-updates')"),
              'marker check should have been replaced');
    assert.ok(out.includes('/* github channel — PUC always on */ true'),
              `expected always-on marker, got: ${out}`);
  });

  it('leaves the block intact for dual', () => {
    const out = patchFileForChannel('plugin-sdk-starter.php', sample, 'dual');
    assert.equal(out, sample, 'dual channel should leave the file unchanged');
  });
});

describe('patchFileForChannel — composer.json (PUC dep)', () => {
  const sample = `{
  "name": "your-org/plugin-sdk-starter",
  "require": {
    "php": ">=7.4",
    "plugin-sdk/wp": "^0.1.0-rc.1 || ^0.1",
    "yahnis-elsts/plugin-update-checker": "^5.0"
  }
}`;

  it('strips PUC dep for wp.org', () => {
    const out = patchFileForChannel('composer.json', sample, 'wp.org');
    const parsed = JSON.parse(out);
    assert.equal(parsed.require['yahnis-elsts/plugin-update-checker'], undefined,
                 'PUC dep should be gone for wp.org');
    assert.ok(parsed.require['plugin-sdk/wp'], 'plugin-sdk/wp dep should remain');
    // Ensure result is still valid JSON (no trailing comma artifacts).
    assert.doesNotThrow(() => JSON.parse(out));
  });

  it('keeps PUC dep for github', () => {
    const out = patchFileForChannel('composer.json', sample, 'github');
    const parsed = JSON.parse(out);
    assert.equal(parsed.require['yahnis-elsts/plugin-update-checker'], '^5.0');
  });

  it('keeps PUC dep for dual', () => {
    const out = patchFileForChannel('composer.json', sample, 'dual');
    const parsed = JSON.parse(out);
    assert.equal(parsed.require['yahnis-elsts/plugin-update-checker'], '^5.0');
  });
});

describe('patchFileForChannel — package.json (prep script)', () => {
  const sample = `{
  "name": "plugin-sdk-starter",
  "scripts": {
    "build": "bash bin/build.sh",
    "prep": "bash bin/submission-prep.sh",
    "slug-research": "bash bin/slug-research.sh"
  }
}`;

  it('strips the prep script for github', () => {
    const out = patchFileForChannel('package.json', sample, 'github');
    const parsed = JSON.parse(out);
    assert.equal(parsed.scripts.prep, undefined, 'prep script should be gone for github');
    assert.equal(parsed.scripts.build, 'bash bin/build.sh');
    assert.equal(parsed.scripts['slug-research'], 'bash bin/slug-research.sh');
    assert.doesNotThrow(() => JSON.parse(out));
  });

  it('keeps the prep script for wp.org', () => {
    const out = patchFileForChannel('package.json', sample, 'wp.org');
    const parsed = JSON.parse(out);
    assert.equal(parsed.scripts.prep, 'bash bin/submission-prep.sh');
  });

  it('keeps the prep script for dual', () => {
    const out = patchFileForChannel('package.json', sample, 'dual');
    const parsed = JSON.parse(out);
    assert.equal(parsed.scripts.prep, 'bash bin/submission-prep.sh');
  });
});
