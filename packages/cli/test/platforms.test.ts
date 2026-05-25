import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { listPlatforms, getPlatform } from '../src/platforms/index.ts';

describe('platforms registry', () => {
  it('exposes WordPress as a supported platform', () => {
    assert.deepEqual(listPlatforms(), ['wordpress']);
  });

  it('returns null for unknown platform ids', () => {
    assert.equal(getPlatform('shopify'), null);
    assert.equal(getPlatform(''), null);
  });

  it('returns the WordPress adapter with the required shape', () => {
    const platform = getPlatform('wordpress')!;
    assert.ok(platform, 'platform should be defined');
    assert.equal(platform.id, 'wordpress');
    assert.equal(typeof platform.displayName, 'string');
    assert.equal(typeof platform.defaultName, 'string');
    assert.equal(typeof platform.resolveTemplateDir, 'function');
  });
});

describe('WordPress platform — template location', () => {
  it('resolves to an existing directory inside the monorepo', () => {
    const platform = getPlatform('wordpress')!;
    const dir = platform.resolveTemplateDir();
    assert.ok(existsSync(dir), `Template dir ${dir} does not exist`);
  });

  it('points at the WordPress boilerplate (contains the starter PHP)', () => {
    const platform = getPlatform('wordpress')!;
    const dir = platform.resolveTemplateDir();
    assert.ok(
      existsSync(`${dir}/plugin-sdk-starter.php`),
      `Expected plugin-sdk-starter.php at template root: ${dir}`,
    );
    assert.ok(
      existsSync(`${dir}/composer.json`),
      `Expected composer.json at template root: ${dir}`,
    );
  });
});
