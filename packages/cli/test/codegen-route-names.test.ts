import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { deriveRouteName } from '../src/codegen/route-names.ts';

describe('deriveRouteName — group derivation', () => {
  it('uses the first path segment as the group', () => {
    assert.equal(deriveRouteName('GET', '/submissions').group, 'submissions');
  });

  it('camelCases hyphenated groups', () => {
    assert.equal(deriveRouteName('GET', '/lead-magnets').group, 'leadMagnets');
  });
});

describe('deriveRouteName — verb derivation', () => {
  it('POST → create', () => {
    assert.equal(deriveRouteName('POST', '/submissions').verb, 'create');
  });

  it('GET with no path param → list', () => {
    assert.equal(deriveRouteName('GET', '/submissions').verb, 'list');
  });

  it('GET with path param → get', () => {
    assert.equal(deriveRouteName('GET', '/submissions/(?P<id>\\d+)').verb, 'get');
  });

  it('PUT and PATCH both → update', () => {
    assert.equal(deriveRouteName('PUT', '/submissions/(?P<id>\\d+)').verb, 'update');
    assert.equal(deriveRouteName('PATCH', '/submissions/(?P<id>\\d+)').verb, 'update');
  });

  it('DELETE → delete', () => {
    assert.equal(deriveRouteName('DELETE', '/submissions/(?P<id>\\d+)').verb, 'delete');
  });

  it('trailing literal after path param becomes the verb', () => {
    assert.equal(
      deriveRouteName('POST', '/submissions/(?P<id>\\d+)/approve').verb,
      'approve',
    );
  });
});

describe('deriveRouteName — pathParams', () => {
  it('extracts named path params in order', () => {
    const r = deriveRouteName('GET', '/orders/(?P<order_id>\\d+)/items/(?P<item_id>\\d+)');
    assert.deepEqual(r.pathParams, ['order_id', 'item_id']);
  });
  it('returns empty array when no params', () => {
    assert.deepEqual(deriveRouteName('GET', '/submissions').pathParams, []);
  });
});

describe('deriveRouteName — bodyTypeName', () => {
  it('composes group + verb + Body in PascalCase', () => {
    assert.equal(
      deriveRouteName('POST', '/submissions').bodyTypeName,
      'SubmissionsCreateBody',
    );
  });

  it('uses trailing-action verb for the type name', () => {
    assert.equal(
      deriveRouteName('POST', '/submissions/(?P<id>\\d+)/approve').bodyTypeName,
      'SubmissionsApproveBody',
    );
  });

  it('handles hyphenated groups', () => {
    assert.equal(
      deriveRouteName('POST', '/lead-magnets').bodyTypeName,
      'LeadMagnetsCreateBody',
    );
  });
});
