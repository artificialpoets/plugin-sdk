import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  deriveSlug,
  deriveNamespace,
  deriveConstantPrefix,
  deriveDbVersionOption,
  validateName,
  validateSlug,
  validateNamespace,
  validateConstantPrefix,
} from '../src/util/slug.ts';

describe('deriveSlug', () => {
  it('converts spaces to hyphens, lowercases', () => {
    assert.equal(deriveSlug('Acme Forms'), 'acme-forms');
  });
  it('collapses repeated separators', () => {
    assert.equal(deriveSlug('Acme  --  Forms'), 'acme-forms');
  });
  it('strips leading/trailing separators', () => {
    assert.equal(deriveSlug('  Acme Forms  '), 'acme-forms');
  });
  it('removes diacritics', () => {
    assert.equal(deriveSlug('Café Münster'), 'cafe-munster');
  });
  it('handles digits adjacent to letters', () => {
    assert.equal(deriveSlug('WP 2 Cents'), 'wp-2-cents');
  });
  it('truncates to 63 chars', () => {
    const long = 'a'.repeat(100);
    assert.equal(deriveSlug(long).length, 63);
  });
});

describe('deriveNamespace', () => {
  it('PascalCases each word, separates with backslash', () => {
    assert.equal(deriveNamespace('Acme Forms'), 'Acme\\Forms');
  });
  it('handles underscores and hyphens as word separators', () => {
    assert.equal(deriveNamespace('my-plugin_name'), 'My\\Plugin\\Name');
  });
  it('strips non-alphanumeric in tokens', () => {
    assert.equal(deriveNamespace('Acme!! Forms?'), 'Acme\\Forms');
  });
  it('keeps single word', () => {
    assert.equal(deriveNamespace('Acme'), 'Acme');
  });
  it('handles unicode by deburring first', () => {
    assert.equal(deriveNamespace('Café Münster'), 'Cafe\\Munster');
  });
});

describe('deriveConstantPrefix', () => {
  it('uppercases + appends underscore', () => {
    assert.equal(deriveConstantPrefix('Acme Forms'), 'ACME_FORMS_');
  });
  it('collapses repeated separators', () => {
    assert.equal(deriveConstantPrefix('Acme--Forms'), 'ACME_FORMS_');
  });
  it('strips leading/trailing underscores from body', () => {
    assert.equal(deriveConstantPrefix('  Acme Forms  '), 'ACME_FORMS_');
  });
  it('truncates body to 30 chars before adding _', () => {
    const long = 'A'.repeat(60);
    const result = deriveConstantPrefix(long);
    assert.equal(result.length, 31); // 30 chars + final _
    assert.ok(result.endsWith('_'));
  });
});

describe('deriveDbVersionOption', () => {
  it('replaces hyphens with underscores, appends _db_version', () => {
    assert.equal(deriveDbVersionOption('acme-forms'), 'acme_forms_db_version');
  });
  it('handles single-word slugs', () => {
    assert.equal(deriveDbVersionOption('acme'), 'acme_db_version');
  });
});

describe('validateName', () => {
  it('rejects empty', () => {
    assert.ok(validateName(''));
    assert.ok(validateName('   '));
  });
  it('accepts normal names', () => {
    assert.equal(validateName('Acme Forms'), null);
    assert.equal(validateName('my-plugin'), null);
  });
  it('rejects starting with non-alphanumeric', () => {
    assert.ok(validateName('-acme'));
  });
});

describe('validateSlug', () => {
  it('rejects starting with digit', () => {
    assert.ok(validateSlug('1plugin'));
  });
  it('rejects uppercase', () => {
    assert.ok(validateSlug('Plugin'));
  });
  it('rejects underscores', () => {
    assert.ok(validateSlug('my_plugin'));
  });
  it('accepts kebab', () => {
    assert.equal(validateSlug('my-plugin'), null);
  });
});

describe('validateNamespace', () => {
  it('accepts single PascalCase', () => {
    assert.equal(validateNamespace('Acme'), null);
  });
  it('accepts multi-segment with backslashes', () => {
    assert.equal(validateNamespace('Acme\\Forms\\Admin'), null);
  });
  it('rejects starting with lowercase', () => {
    assert.ok(validateNamespace('acme\\Forms'));
  });
  it('rejects forward slashes', () => {
    assert.ok(validateNamespace('Acme/Forms'));
  });
});

describe('validateConstantPrefix', () => {
  it('requires trailing underscore', () => {
    assert.ok(validateConstantPrefix('ACME'));
    assert.equal(validateConstantPrefix('ACME_'), null);
  });
  it('rejects lowercase', () => {
    assert.ok(validateConstantPrefix('Acme_'));
  });
  it('accepts digits after the first char', () => {
    assert.equal(validateConstantPrefix('ACME_V2_'), null);
  });
});
