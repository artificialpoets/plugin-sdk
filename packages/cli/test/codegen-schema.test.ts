import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { schemaToTs } from '../src/codegen/schema-to-ts.ts';

describe('schemaToTs — primitives', () => {
  it('emits string for type=string', () => {
    assert.equal(schemaToTs({ type: 'string' }), 'string');
  });
  it('emits number for integer and number alike', () => {
    assert.equal(schemaToTs({ type: 'integer' }), 'number');
    assert.equal(schemaToTs({ type: 'number' }), 'number');
  });
  it('emits boolean / null verbatim', () => {
    assert.equal(schemaToTs({ type: 'boolean' }), 'boolean');
    assert.equal(schemaToTs({ type: 'null' }), 'null');
  });
  it('falls back to unknown for unrecognised types', () => {
    assert.equal(schemaToTs({}), 'unknown');
    assert.equal(schemaToTs({ type: 'date' as never }), 'unknown');
  });
});

describe('schemaToTs — type array (nullable etc.)', () => {
  it('emits a union when type is an array', () => {
    assert.equal(schemaToTs({ type: ['string', 'null'] }), 'string | null');
  });
});

describe('schemaToTs — enum', () => {
  it('emits string literal union', () => {
    assert.equal(
      schemaToTs({ type: 'string', enum: ['production', 'staging'] }),
      '"production" | "staging"',
    );
  });
  it('mixes string and number literals', () => {
    assert.equal(schemaToTs({ enum: ['x', 1, null] }), '"x" | 1 | null');
  });
});

describe('schemaToTs — array', () => {
  it('emits T[] for items of primitive type', () => {
    assert.equal(schemaToTs({ type: 'array', items: { type: 'string' } }), 'string[]');
  });
  it('parenthesises a union before []', () => {
    assert.equal(
      schemaToTs({ type: 'array', items: { type: ['string', 'null'] } }),
      '(string | null)[]',
    );
  });
  it('handles tuple-form items', () => {
    assert.equal(
      schemaToTs({ type: 'array', items: [{ type: 'string' }, { type: 'integer' }] }),
      '[string, number]',
    );
  });
  it('falls back to unknown[] when items missing', () => {
    assert.equal(schemaToTs({ type: 'array' }), 'unknown[]');
  });
});

describe('schemaToTs — object', () => {
  it('renders required + optional members', () => {
    const out = schemaToTs({
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
        name:  { type: 'string' },
      },
    });
    assert.ok(out.includes('email: string;'), out);
    assert.ok(out.includes('name?: string;'), out);
  });

  it('attaches description as a JSDoc comment', () => {
    const out = schemaToTs({
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', description: 'Subscriber email' } },
    });
    assert.ok(out.includes('/** Subscriber email */'), out);
  });

  it('quotes invalid identifier keys', () => {
    const out = schemaToTs({
      type: 'object',
      required: ['weird-key'],
      properties: { 'weird-key': { type: 'string' } },
    });
    assert.ok(out.includes('"weird-key": string;'), out);
  });

  it('emits {} when additionalProperties:false and no props', () => {
    assert.equal(schemaToTs({ type: 'object', additionalProperties: false }), '{}');
  });

  it('falls back to Record<string, unknown> for typeless empty object', () => {
    assert.equal(schemaToTs({ type: 'object' }), 'Record<string, unknown>');
  });

  it('emits index signature when additionalProperties is a schema', () => {
    const out = schemaToTs({
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
      additionalProperties: { type: 'number' },
    });
    assert.ok(out.includes('[k: string]: number;'), out);
  });
});

describe('schemaToTs — oneOf / anyOf', () => {
  it('emits union for oneOf', () => {
    const out = schemaToTs({ oneOf: [{ type: 'string' }, { type: 'integer' }] });
    assert.equal(out, 'string | number');
  });

  it('emits union for anyOf', () => {
    const out = schemaToTs({ anyOf: [{ type: 'string' }, { type: 'null' }] });
    assert.equal(out, 'string | null');
  });
});

describe('schemaToTs — nested', () => {
  it('renders nested object', () => {
    const out = schemaToTs({
      type: 'object',
      required: ['user'],
      properties: {
        user: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string' },
          },
        },
      },
    });
    assert.ok(out.includes('user: {'), out);
    assert.ok(out.includes('email: string;'), out);
  });
});
