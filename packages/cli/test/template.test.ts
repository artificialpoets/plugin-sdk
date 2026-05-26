import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { substitute, renamePath, buildRules, type PluginContext } from '../src/template.ts';

const ctx: PluginContext = {
  name: 'Acme Forms',
  slug: 'acme-forms',
  slugSnake: 'acme_forms',
  textDomain: 'acme-forms',
  namespace: 'Acme\\Forms',
  constantPrefix: 'ACME_FORMS_',
  description: 'Forms plugin for Acme.',
  author: 'Acme Corp',
  authorUrl: 'https://acme.example',
  channel: 'wp.org',
};

describe('substitute — PHP namespace', () => {
  it('replaces single-backslash namespace in PHP source', () => {
    const input = `namespace PluginSDK\\Starter;\nuse PluginSDK\\Starter\\Admin\\Menu;`;
    const out = substitute(input, ctx);
    assert.ok(out.includes('namespace Acme\\Forms;'), out);
    assert.ok(out.includes('use Acme\\Forms\\Admin\\Menu;'), out);
    assert.ok(!out.includes('PluginSDK'), `Did not strip "PluginSDK" from: ${out}`);
  });

  it('replaces JSON-escaped namespace in composer.json', () => {
    const input = `"psr-4": { "PluginSDK\\\\Starter\\\\": "src/" }`;
    const out = substitute(input, ctx);
    assert.ok(out.includes('"Acme\\\\Forms\\\\"'), out);
    assert.ok(!out.includes('PluginSDK'), out);
  });
});

describe('substitute — constants', () => {
  it('replaces PSDK_ prefix on all four lifecycle constants', () => {
    const input = `define('PSDK_VERSION', '0.1.0');
define('PSDK_FILE', __FILE__);
define('PSDK_DIR', plugin_dir_path(__FILE__));
define('PSDK_URL', plugin_dir_url(__FILE__));`;
    const out = substitute(input, ctx);
    assert.ok(out.includes("define('ACME_FORMS_VERSION'"));
    assert.ok(out.includes("define('ACME_FORMS_FILE'"));
    assert.ok(out.includes("define('ACME_FORMS_DIR'"));
    assert.ok(out.includes("define('ACME_FORMS_URL'"));
    assert.ok(!out.includes('PSDK_'), `PSDK_ still present in: ${out}`);
  });
});

describe('substitute — slugs and option keys', () => {
  it('replaces slug strings', () => {
    const input = `__('Error', 'plugin-sdk-starter');`;
    const out = substitute(input, ctx);
    assert.equal(out, `__('Error', 'acme-forms');`);
  });

  it('replaces db version option key with derived snake form', () => {
    const input = `update_option('psdk_db_version', '0.1.0');`;
    const out = substitute(input, ctx);
    assert.equal(out, `update_option('acme_forms_db_version', '0.1.0');`);
  });

  it('replaces asset handle', () => {
    const input = `wp_register_script('psdk-admin', '', [], '1.0', true);`;
    const out = substitute(input, ctx);
    assert.equal(out, `wp_register_script('acme-forms-admin', '', [], '1.0', true);`);
  });
});

describe('substitute — display name and description', () => {
  it('replaces "Plugin SDK Starter" with the plugin name', () => {
    const input = `/** Plugin Name: Plugin SDK Starter */`;
    const out = substitute(input, ctx);
    assert.equal(out, `/** Plugin Name: Acme Forms */`);
  });

  it('replaces composer description string', () => {
    const input = `"description": "Greenfield WordPress plugin scaffold using Plugin SDK.",`;
    const out = substitute(input, ctx);
    assert.ok(out.includes('"description": "Forms plugin for Acme."'));
  });

  it('replaces composer vendor/package placeholder', () => {
    const input = `"name": "your-org/plugin-sdk-starter",`;
    const out = substitute(input, ctx);
    // author "Acme Corp" → vendor "acme-corp"
    assert.ok(out.includes('"name": "acme-corp/acme-forms"'), out);
  });
});

describe('substitute — idempotence-ish properties', () => {
  it('leaves unrelated text untouched', () => {
    const input = `// This file has no template tokens at all.\necho "Hello";\n`;
    assert.equal(substitute(input, ctx), input);
  });

  it('does not double-replace a token already in target form', () => {
    // If the boilerplate template ever drifts and includes the *output*
    // form, we shouldn't keep substituting infinitely. Our rule list
    // doesn't define rules that would match the output, so this is
    // structurally safe; verify it.
    const input = `namespace Acme\\Forms;`;
    assert.equal(substitute(input, ctx), input);
  });
});

describe('renamePath', () => {
  it('renames the main starter PHP file to the slug', () => {
    assert.equal(renamePath('plugin-sdk-starter.php', ctx), 'acme-forms.php');
  });
  it('does not rename files that happen to share a prefix', () => {
    // No false positives — only the exact "plugin-sdk-starter.php" gets renamed.
    assert.equal(
      renamePath('plugin-sdk-starter-helpers.php', ctx),
      'plugin-sdk-starter-helpers.php',
    );
  });
  it('preserves directory paths around the renamed file', () => {
    assert.equal(renamePath('src/plugin-sdk-starter.php', ctx), 'src/acme-forms.php');
  });
});

describe('buildRules', () => {
  it('produces the longest patterns before shorter overlapping ones', () => {
    const rules = buildRules(ctx);
    const positions = new Map(rules.map((r, i) => [r[0], i]));
    // Composer's double-escaped form must precede its single-escaped one
    const doubleEsc = positions.get('PluginSDK\\\\Starter\\\\');
    const singleEsc = positions.get('PluginSDK\\Starter');
    assert.ok(
      doubleEsc !== undefined && singleEsc !== undefined && doubleEsc < singleEsc,
      'JSON-double-escaped namespace must be replaced before PHP single-backslash form',
    );
  });
});
