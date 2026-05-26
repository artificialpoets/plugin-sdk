/*
 * Naming derivations for a scaffolded plugin.
 *
 * Given a single user-supplied "plugin name" (e.g. "Acme Forms"), we
 * derive every other identifier the boilerplate needs:
 *
 *   - slug             "acme-forms"          (kebab — directory + file name)
 *   - textDomain       "acme-forms"          (alias of slug for i18n)
 *   - namespace        "Acme\Forms"          (PHP PSR-4)
 *   - constantPrefix   "ACME_FORMS_"         (PHP define() prefix)
 *   - dbVersionOption  "acme_forms_db_version"  (snake — WP option key)
 *
 * The user can override any field interactively or via --flags.
 */

const ALLOWED_NAME = /^[a-z0-9][a-z0-9 _-]{0,63}$/i;
const ALLOWED_SLUG = /^[a-z][a-z0-9-]{1,63}$/;
const ALLOWED_NAMESPACE = /^[A-Z][A-Za-z0-9_]*(\\[A-Z][A-Za-z0-9_]*)*$/;
const ALLOWED_CONSTANT_PREFIX = /^[A-Z][A-Z0-9_]*_$/;

/** Drop diacritics ("café" → "cafe") so derivations stay ASCII. */
function deburr(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "Acme Forms" → "acme-forms" */
export function deriveSlug(name: string): string {
  return deburr(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

/** "Acme Forms" → "Acme\Forms" */
export function deriveNamespace(name: string): string {
  return deburr(name)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => {
      const cleaned = part.replace(/[^A-Za-z0-9]/g, '');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    })
    .join('\\');
}

/** "Acme Forms" → "ACME_FORMS_" */
export function deriveConstantPrefix(name: string): string {
  return (
    deburr(name)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30) + '_'
  );
}

/** "acme-forms" → "acme_forms_db_version" */
export function deriveDbVersionOption(slug: string): string {
  return slug.replace(/-/g, '_') + '_db_version';
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Plugin name cannot be empty';
  if (!ALLOWED_NAME.test(name.trim())) return 'Use letters, digits, spaces, hyphens, or underscores (64 chars max)';
  return null;
}

export function validateSlug(slug: string): string | null {
  if (!ALLOWED_SLUG.test(slug)) return 'Slug must start with a letter and use only lowercase letters, digits, and hyphens (2–64 chars)';
  return null;
}

export function validateNamespace(ns: string): string | null {
  if (!ALLOWED_NAMESPACE.test(ns)) return 'Namespace must use PHP PSR-4 form, e.g. Acme\\Forms';
  return null;
}

export function validateConstantPrefix(prefix: string): string | null {
  if (!ALLOWED_CONSTANT_PREFIX.test(prefix)) return 'Constant prefix must be UPPER_SNAKE ending in _, e.g. ACME_FORMS_';
  return null;
}

import type { DistributionChannel } from '../template.ts';

/** Returns the parsed channel value, or null if the input is not a known channel. */
export function parseChannel(value: string): DistributionChannel | null {
  if (value === 'wp.org' || value === 'github' || value === 'dual') return value;
  return null;
}

export function validateChannel(value: string): string | null {
  if (!parseChannel(value)) return "Channel must be one of: wp.org, github, dual";
  return null;
}
