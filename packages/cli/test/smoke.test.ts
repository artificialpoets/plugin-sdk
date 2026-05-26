import { after, before, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scaffold } from '../src/scaffolder.ts';
import { getPlatform } from '../src/platforms/index.ts';
import type { PluginContext } from '../src/template.ts';

/*
 * Smoke test — proves the scaffolder end-to-end:
 *   1. Run scaffold() into a fresh temp dir
 *   2. Assert the expected files exist
 *   3. Assert template tokens are GONE (no stray PluginSDK\Starter etc.)
 *   4. Assert the user's namespace + constants are PRESENT
 *   5. Parse the generated composer.json to confirm it's valid JSON
 *
 * No external tooling required (no composer install, no PHP runtime).
 * Pure file-system + string assertions, so this test runs in CI on a
 * minimal Node image.
 */

const TMP_PREFIX = join(tmpdir(), 'plugin-sdk-smoke-');

const ctx: PluginContext = {
  name: 'Smoke Test Plugin',
  slug: 'smoke-test-plugin',
  slugSnake: 'smoke_test_plugin',
  textDomain: 'smoke-test-plugin',
  namespace: 'Smoke\\TestPlugin',
  constantPrefix: 'STP_',
  description: 'Smoke test for the Plugin SDK scaffolder.',
  author: 'Acme QA',
  authorUrl: 'https://example.test',
  channel: 'wp.org',
};

describe('scaffolder smoke test — WordPress', () => {
  let outDir: string;

  before(async () => {
    outDir = await mkdtemp(TMP_PREFIX);
    const platform = getPlatform('wordpress')!;
    await scaffold({
      platform,
      outDir,
      ctx,
      runPostCreate: false, // skip composer install in CI
    });
  });

  after(async () => {
    if (outDir && existsSync(outDir)) {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('renames the entry PHP file to the slug', () => {
    assert.ok(
      existsSync(join(outDir, 'smoke-test-plugin.php')),
      'Expected smoke-test-plugin.php at output root',
    );
    assert.ok(
      !existsSync(join(outDir, 'plugin-sdk-starter.php')),
      'Original starter filename should be gone',
    );
  });

  it('includes composer.json + src/ + assets/', () => {
    assert.ok(existsSync(join(outDir, 'composer.json')));
    assert.ok(existsSync(join(outDir, 'src')));
    assert.ok(existsSync(join(outDir, 'assets')));
    assert.ok(existsSync(join(outDir, 'src/Plugin.php')));
  });

  it('substituted the PHP namespace everywhere', async () => {
    const main = await readFile(join(outDir, 'smoke-test-plugin.php'), 'utf8');
    assert.ok(main.includes('Smoke\\TestPlugin'), 'main file missing namespace');
    assert.ok(!main.includes('PluginSDK\\Starter'), 'main file leaks PluginSDK\\Starter');

    const plugin = await readFile(join(outDir, 'src/Plugin.php'), 'utf8');
    assert.ok(plugin.includes('namespace Smoke\\TestPlugin;'), plugin);
    assert.ok(!plugin.includes('PluginSDK'), 'src/Plugin.php still references PluginSDK');
  });

  it('substituted the constant prefix on all four lifecycle constants', async () => {
    const main = await readFile(join(outDir, 'smoke-test-plugin.php'), 'utf8');
    for (const constant of ['STP_VERSION', 'STP_FILE', 'STP_DIR', 'STP_URL']) {
      assert.ok(main.includes(`define('${constant}'`), `missing ${constant}`);
    }
    assert.ok(!main.includes('PSDK_'), 'main file still has PSDK_ prefix');
  });

  it('substituted the slug in the plugin header text domain', async () => {
    const main = await readFile(join(outDir, 'smoke-test-plugin.php'), 'utf8');
    assert.ok(main.includes('smoke-test-plugin'), 'slug missing from main');
  });

  it('produces a valid composer.json with the new namespace', async () => {
    const raw = await readFile(join(outDir, 'composer.json'), 'utf8');
    const parsed = JSON.parse(raw);

    assert.equal(parsed.name, 'acme-qa/smoke-test-plugin', 'composer name should be vendor/slug');
    assert.equal(parsed.description, ctx.description);
    assert.ok(parsed.autoload?.['psr-4']?.['Smoke\\TestPlugin\\'] === 'src/',
      `composer PSR-4 mapping is wrong: ${JSON.stringify(parsed.autoload, null, 2)}`,
    );
    assert.ok(!JSON.stringify(parsed).includes('PluginSDK'),
      'composer.json still references PluginSDK',
    );
  });

  it('requires plugin-sdk/wp from Packagist (no path repo fallback)', async () => {
    const raw = await readFile(join(outDir, 'composer.json'), 'utf8');
    const parsed = JSON.parse(raw);
    // Boilerplate composer.json should declare a versioned require so
    // `composer install` works against Packagist out of the box, with
    // no monorepo-specific `path` repository leaking through.
    assert.ok(
      typeof parsed.require?.['plugin-sdk/wp'] === 'string',
      'expected plugin-sdk/wp in require',
    );
    assert.equal(parsed.repositories, undefined,
      'scaffolded composer.json should not carry the monorepo path repository');
  });

  it('updates the asset handle prefix', async () => {
    const assets = await readFile(join(outDir, 'src/Admin/Assets.php'), 'utf8');
    assert.ok(
      assets.includes('smoke-test-plugin-admin'),
      'expected asset handle to be renamed to slug-admin',
    );
    assert.ok(!assets.includes('psdk-admin'), 'old psdk-admin handle still present');
  });

  it('updates the db version option key', async () => {
    const plugin = await readFile(join(outDir, 'src/Plugin.php'), 'utf8');
    assert.ok(
      plugin.includes('smoke_test_plugin_db_version'),
      'expected db version option to be renamed (snake form)',
    );
    assert.ok(!plugin.includes('psdk_db_version'), 'old psdk_db_version key still present');
  });
});
