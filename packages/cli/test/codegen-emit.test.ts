import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { emitClient } from '../src/codegen/emit.ts';

const baseManifest = {
  name: 'Test Plugin',
  slug: 'test-plugin',
  version: '0.1.0',
  rest: {
    namespace: 'test/v1',
    routes: [
      {
        path: '/submissions',
        method: 'POST',
        schema: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      {
        path: '/submissions/(?P<id>\\d+)',
        method: 'GET',
      },
    ],
  },
};

describe('emitClient — header', () => {
  it('includes the plugin name + slug in the banner', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(source.includes('Test Plugin'), source.slice(0, 300));
    assert.ok(source.includes('test-plugin'), source.slice(0, 300));
  });

  it('renders the auto-generated warning prominently', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(/Auto-generated/i.test(source));
  });
});

describe('emitClient — body types', () => {
  it('emits a body interface for routes that declare a schema', () => {
    const { source, bodyTypeCount } = emitClient(baseManifest);
    assert.equal(bodyTypeCount, 1);
    assert.ok(source.includes('export interface SubmissionsCreateBody'), source);
    assert.ok(source.includes('email: string;'), source);
  });

  it('does not emit a body interface for routes without a schema', () => {
    const { source } = emitClient(baseManifest);
    // The GET /submissions/{id} route has no schema → no body type emitted.
    assert.ok(!source.includes('SubmissionsGetBody'), source);
  });
});

describe('emitClient — client interface', () => {
  it('groups routes by resource and emits one method per route', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(source.includes('export interface PluginSDKClient'), source);
    assert.ok(source.includes('submissions: {'), source);
    assert.ok(/create\(body: SubmissionsCreateBody\): Promise<unknown>;/.test(source), source);
    assert.ok(/get\(params: \{ id: string \| number \}\): Promise<unknown>;/.test(source), source);
  });

  it('uses the typed body for POST + the params object for GET-with-id', () => {
    const { source } = emitClient(baseManifest);
    // Body is typed:
    assert.ok(source.includes('body: SubmissionsCreateBody'), source);
    // ID param is typed:
    assert.ok(source.includes('id: string | number'), source);
  });
});

describe('emitClient — implementation', () => {
  it('produces a createPluginSDKClient factory function', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(/export function createPluginSDKClient\(opts: PluginSDKClientOptions\): PluginSDKClient/.test(source));
  });

  it('uses the REST namespace from the manifest', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(source.includes('"test/v1"'), source);
  });

  it('interpolates path params into the URL template', () => {
    const { source } = emitClient(baseManifest);
    // Should produce a template-literal call like "/submissions/${params.id}"
    assert.ok(source.includes('${params.id}'), source);
  });

  it('passes the X-WP-Nonce header in every request', () => {
    const { source } = emitClient(baseManifest);
    assert.ok(source.includes("'X-WP-Nonce': opts.nonce"), source);
  });
});

describe('emitClient — counts', () => {
  it('reports routeCount + bodyTypeCount', () => {
    const result = emitClient(baseManifest);
    assert.equal(result.routeCount, 2);
    assert.equal(result.bodyTypeCount, 1);
  });

  it('handles a manifest with no rest surface', () => {
    const result = emitClient({ name: 'X', slug: 'x' });
    assert.equal(result.routeCount, 0);
    assert.equal(result.bodyTypeCount, 0);
    // Should still produce something compileable.
    assert.ok(result.source.includes('export interface PluginSDKClient'));
  });
});
