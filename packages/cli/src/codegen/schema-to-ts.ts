/*
 * JSON Schema → TypeScript type converter.
 *
 * Scope: the subset of Draft 2020-12 that Plugin SDK manifests
 * actually use today (matches packages/wp-composer/src/REST/Schema.php).
 *
 *   - primitive types: string, integer, number, boolean, null
 *   - object: properties, required, additionalProperties
 *   - array: items
 *   - enum (string + number unions)
 *   - oneOf / anyOf (best effort: union of all branches)
 *   - format=email / uri (no type narrowing — still 'string')
 *
 * Anything not covered gets emitted as `unknown` so the output always
 * parses as valid TS. The CLI smoke test catches when an unknown leak
 * indicates a schema feature we should add.
 *
 * The emitter is a pure function (schema in → string out). No I/O,
 * no module-scope state. Easy to unit-test.
 */

export interface SchemaToTsOptions {
  /** Indent string used per level. Default: 2 spaces. */
  indent?: string;
}

interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  enum?: Array<string | number | boolean | null>;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  format?: string;
  description?: string;
}

/**
 * Emit a TS type literal for the given schema.
 *
 *   schemaToTs({ type: 'string' })
 *   → "string"
 *
 *   schemaToTs({
 *     type: 'object',
 *     required: ['email'],
 *     properties: { email: { type: 'string' } },
 *   })
 *   → "{\n  email: string;\n}"
 */
export function schemaToTs(schema: JsonSchema, opts: SchemaToTsOptions = {}): string {
  const indent = opts.indent ?? '  ';
  return render(schema, 0, indent);
}

function render(schema: JsonSchema, depth: number, indent: string): string {
  if (!schema || typeof schema !== 'object') return 'unknown';

  // enum wins — fixed set, regardless of type
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map(renderLiteral).join(' | ');
  }

  // oneOf / anyOf → union
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return schema.oneOf.map((s) => render(s, depth, indent)).join(' | ');
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return schema.anyOf.map((s) => render(s, depth, indent)).join(' | ');
  }

  // type can be a single string or an array (string | null)
  if (Array.isArray(schema.type)) {
    return schema.type.map((t) => render({ ...schema, type: t }, depth, indent)).join(' | ');
  }

  switch (schema.type) {
    case 'string':  return 'string';
    case 'integer':
    case 'number':  return 'number';
    case 'boolean': return 'boolean';
    case 'null':    return 'null';
    case 'array':   return renderArray(schema, depth, indent);
    case 'object':  return renderObject(schema, depth, indent);
    default:        return 'unknown';
  }
}

function renderArray(schema: JsonSchema, depth: number, indent: string): string {
  if (!schema.items) return 'unknown[]';
  if (Array.isArray(schema.items)) {
    // Tuple form
    const parts = schema.items.map((s) => render(s, depth, indent));
    return `[${parts.join(', ')}]`;
  }
  const inner = render(schema.items, depth, indent);
  // Wrap union/object in parens so the [] binds correctly
  return /[|\s]/.test(inner) && !inner.startsWith('{') ? `(${inner})[]` : `${inner}[]`;
}

function renderObject(schema: JsonSchema, depth: number, indent: string): string {
  const properties = schema.properties ?? {};
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  const keys = Object.keys(properties);

  if (keys.length === 0) {
    if (schema.additionalProperties === false) return '{}';
    return 'Record<string, unknown>';
  }

  const pad = indent.repeat(depth + 1);
  const close = indent.repeat(depth);
  const lines: string[] = [];

  for (const key of keys) {
    const child = properties[key]!;
    const childType = render(child, depth + 1, indent);
    const optional = required.has(key) ? '' : '?';
    const safeKey = isValidIdentifier(key) ? key : JSON.stringify(key);
    const comment = child.description
      ? `${pad}/** ${escapeBlockComment(child.description)} */\n`
      : '';
    lines.push(`${comment}${pad}${safeKey}${optional}: ${childType};`);
  }

  // additionalProperties: true (or object) → index signature
  const ap = schema.additionalProperties;
  if (ap !== false && ap !== undefined) {
    const apType = ap === true ? 'unknown' : render(ap as JsonSchema, depth + 1, indent);
    lines.push(`${pad}[k: string]: ${apType};`);
  }

  return `{\n${lines.join('\n')}\n${close}}`;
}

function renderLiteral(v: string | number | boolean | null): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

function isValidIdentifier(s: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s);
}

function escapeBlockComment(s: string): string {
  // Avoid breaking out of the JSDoc block.
  return s.replace(/\*\//g, '*\\/');
}
