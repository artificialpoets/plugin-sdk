/*
 * Substitution engine for the scaffolder.
 *
 * The boilerplate ships as runnable code (you can clone
 * boilerplates/wordpress/ and activate it as-is). It uses concrete
 * placeholder values:
 *
 *   PHP namespace          PluginSDK\Starter
 *   PHP constant prefix    PSDK_
 *   Slug                   plugin-sdk-starter
 *   Option key fragment    psdk_db_version
 *   Asset handle           psdk-admin
 *   Plugin display name    "Plugin SDK Starter"
 *
 * `substitute()` replaces every occurrence in a string. Each rule is
 * applied in order — later rules see the output of earlier ones. The
 * order matters: more specific patterns must precede their substrings
 * so we don't double-replace.
 *
 * We use plain `String.replaceAll` (no regex) which means the search
 * patterns are literal strings — no escaping needed by callers.
 */

/**
 * Distribution channel for the scaffolded plugin. Decides which CI
 * workflow files are emitted, whether the Plugin Update Checker block
 * is included in the main PHP file, and whether the PUC composer
 * dependency lands in composer.json.
 *
 * - `wp.org`  — submission to the WordPress.org Plugin Directory.
 *               Updates ship via wp.org SVN; no GitHub release pipeline,
 *               no PUC code. The safest baseline for Plugin Check
 *               (no extra deps that might trip review).
 * - `github`  — self-hosted via GitHub releases. PUC is always-on so
 *               the plugin checks the repo's releases page for updates.
 *               No wp.org submission flow.
 * - `dual`    — both. Source ships to both channels; PUC is gated on
 *               a `.use-github-updates` marker that bin/build.sh writes
 *               only into the GitHub-flavoured dist. The wp.org zip is
 *               PUC-free; the GH zip auto-updates via PUC.
 */
export type DistributionChannel = 'wp.org' | 'github' | 'dual';

export interface PluginContext {
  /** Human-readable name: "Acme Forms" */
  name: string;
  /** Kebab slug: "acme-forms" — directory and file name */
  slug: string;
  /** PHP PSR-4: "Acme\Forms" */
  namespace: string;
  /** Constant prefix: "ACME_FORMS_" */
  constantPrefix: string;
  /** Lowercase snake from slug: "acme_forms" */
  slugSnake: string;
  /** Asset handle prefix: usually = slug */
  textDomain: string;
  /** Free-text description for composer.json + plugin header */
  description: string;
  /** Author display name */
  author: string;
  /** Author URL — optional, empty string if none */
  authorUrl: string;
  /** Distribution channel — see DistributionChannel above. */
  channel: DistributionChannel;
}

/** Build the list of (from, to) replacements in dependency order. */
export function buildRules(ctx: PluginContext): Array<[string, string]> {
  // PHP namespace pairs — emit before fragments so longer matches win.
  // The double-backslash form must come before the single-backslash form
  // so we don't partially replace.
  return [
    // Composer + JSON encoded namespace (double-escaped)
    ['PluginSDK\\\\Starter\\\\', escapeForJson(ctx.namespace) + '\\\\'],
    ['PluginSDK\\\\Starter', escapeForJson(ctx.namespace)],

    // PHP source namespace (single backslashes)
    ['PluginSDK\\Starter', ctx.namespace],

    // Constants
    ['PSDK_VERSION', `${ctx.constantPrefix}VERSION`],
    ['PSDK_FILE', `${ctx.constantPrefix}FILE`],
    ['PSDK_DIR', `${ctx.constantPrefix}DIR`],
    ['PSDK_URL', `${ctx.constantPrefix}URL`],

    // Composer vendor/slug — must precede the lone slug rule, otherwise
    // `plugin-sdk-starter` gets rewritten before the vendor/slug pattern
    // has a chance to match the original full string.
    ['your-org/plugin-sdk-starter', `${slugifyOrg(ctx.author)}/${ctx.slug}`],

    // Option keys + asset handles + slugs (longest first)
    ['plugin-sdk-starter', ctx.slug],
    // snake_case slug — used as the prefix for option keys, nonces,
    // custom-table names, REST error codes, and JS-globals exposed via
    // wp_add_inline_script. Must come AFTER the kebab-slug rule so the
    // two don't shadow each other (they share no substring, but order
    // is still meaningful for predictability).
    ['plugin_sdk_starter', ctx.slugSnake],
    ['psdk_db_version', `${ctx.slugSnake}_db_version`],
    ['psdk-admin', `${ctx.slug}-admin`],

    // Display name (boilerplate's plugin header + composer description)
    ['Plugin SDK Starter', ctx.name],
    [
      'Greenfield WordPress plugin scaffold using Plugin SDK.',
      ctx.description,
    ],

    // Author placeholders (only used if present in template)
    ['{{PLUGIN_AUTHOR}}', ctx.author],
    ['{{PLUGIN_AUTHOR_URL}}', ctx.authorUrl],

    // Mustache-style derived tokens. Used by phpcs.xml.dist's
    // PrefixAllGlobals ruleset (which needs every prefix variant the
    // plugin actually uses), and by anything else that wants a clean
    // way to reference the slug / namespace root / case-shifted prefix.
    // Listed AFTER the more specific rules so the lone `{{slug}}` token
    // doesn't accidentally match a longer pattern someone else set up.
    ['{{prefixLower}}', ctx.slugSnake],
    ['{{prefixUpper}}', ctx.constantPrefix.replace(/_+$/, '')],
    ['{{namespaceRoot}}', ctx.namespace.split('\\')[0] ?? ctx.namespace],
    ['{{slug}}', ctx.slug],
    ['{{slugSnake}}', ctx.slugSnake],
    ['{{textDomain}}', ctx.textDomain],
  ];
}

/** Apply rules left-to-right. Idempotent only if rules are non-overlapping. */
export function substitute(input: string, ctx: PluginContext): string {
  let out = input;
  for (const [from, to] of buildRules(ctx)) {
    out = out.split(from).join(to);
  }
  return out;
}

/** Path-level rename. The starter's main PHP file is named after the slug. */
export function renamePath(relPath: string, ctx: PluginContext): string {
  return relPath.replaceAll('plugin-sdk-starter.php', `${ctx.slug}.php`);
}

/* ── helpers ───────────────────────────────────────────────────────── */

function escapeForJson(s: string): string {
  // PSR-4 namespaces in composer.json are JSON-escaped with double
  // backslashes: "Acme\\Forms\\". JSON-encoding adds the escapes.
  return s.replace(/\\/g, '\\\\');
}

/** "Matías Sanchez" → "matias-sanchez". Used to build the composer
 *  vendor/package name. */
function slugifyOrg(author: string): string {
  const slug = author
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'your-org';
}
