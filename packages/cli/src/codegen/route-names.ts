/*
 * Derive sensible TypeScript identifiers from a REST route path + method.
 *
 * The codegen emits a typed client that groups routes by their first
 * path segment ("resource"), then exposes one method per route ("verb"):
 *
 *   POST /submissions               → client.submissions.create
 *   GET  /submissions               → client.submissions.list
 *   GET  /submissions/(?P<id>\d+)   → client.submissions.get
 *   PUT  /submissions/(?P<id>\d+)   → client.submissions.update
 *   DELETE /submissions/(?P<id>\d+) → client.submissions.delete
 *   POST /submissions/(?P<id>\d+)/approve → client.submissions.approve
 *
 * The interface name used for the request body is derived from the
 * group + verb in PascalCase + "Body" suffix:
 *
 *   POST /submissions  →  SubmissionsCreateBody
 */

export interface RouteName {
  /** First path segment, used as the property name on the client. */
  group: string;
  /** Verb / action — "create", "list", "get", "update", "delete", or a
   *  trailing action segment for non-CRUD paths. */
  verb: string;
  /** PascalCase symbol used as the body type interface name. */
  bodyTypeName: string;
  /** Path parameter names (e.g. "id" from "(?P<id>\d+)"), in declaration
   *  order. The client wraps them as the first argument to the method. */
  pathParams: string[];
}

const METHOD_VERB: Record<string, string> = {
  GET:    'get',
  POST:   'create',
  PUT:    'update',
  PATCH:  'update',
  DELETE: 'delete',
};

export function deriveRouteName(method: string, path: string): RouteName {
  const segments = splitPath(path);
  const group = segments[0]?.literal ?? 'root';

  const pathParams: string[] = [];
  for (const seg of segments) {
    if (seg.param) pathParams.push(seg.param);
  }

  // Verb derivation:
  //   - GET with a path param after the resource → "get" (read one)
  //   - GET without a path param → "list"
  //   - POST → "create"
  //   - PUT/PATCH → "update"
  //   - DELETE → "delete"
  //   - Any of these followed by a trailing literal segment (an action
  //     like /approve, /resend) → use that segment as the verb.
  const upper = method.toUpperCase();
  const trailing = trailingAction(segments);
  let verb: string;
  if (trailing) {
    verb = camel(trailing);
  } else if (upper === 'GET') {
    verb = pathParams.length > 0 ? 'get' : 'list';
  } else {
    verb = METHOD_VERB[upper] ?? upper.toLowerCase();
  }

  const bodyTypeName = pascal(group) + pascal(verb) + 'Body';

  return { group: camel(group), verb, bodyTypeName, pathParams };
}

interface Segment {
  literal: string | null;
  param: string | null;
}

function splitPath(path: string): Segment[] {
  return path
    .split('/')
    .filter(Boolean)
    .map((raw): Segment => {
      // (?P<id>\d+) → capture "id"
      const m = raw.match(/^\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/);
      if (m) return { literal: null, param: m[1]! };
      return { literal: raw, param: null };
    });
}

function trailingAction(segments: Segment[]): string | null {
  // After a path param, a trailing literal is treated as an action
  // (e.g. /submissions/(?P<id>\d+)/approve → "approve").
  if (segments.length < 3) return null;
  let sawParam = false;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i]!.param) sawParam = true;
  }
  if (!sawParam) return null;
  const last = segments[segments.length - 1]!;
  return last.literal && last.literal !== segments[0]!.literal ? last.literal : null;
}

function camel(s: string): string {
  const parts = s.split(/[-_]/).filter(Boolean);
  if (parts.length === 0) return s;
  const [head, ...rest] = parts;
  return head!.toLowerCase() + rest.map((p) => pascalWord(p)).join('');
}

function pascal(s: string): string {
  return s.split(/[-_]/).filter(Boolean).map(pascalWord).join('');
}

function pascalWord(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
