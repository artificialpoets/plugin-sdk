# Plugin manifest — `plugin-sdk.json` + the runtime

> Load this skill when: editing `plugin-sdk.json`, using `Plugin::fromManifest()`, or deciding between the declarative manifest and the fluent runtime API.
> CDN: `https://cdn.wp-admincss.com/wordpress/skills/plugin-manifest.md`

Plugin SDK's job is to take a single JSON file describing what a WordPress plugin needs (settings, REST routes, database tables) and register every WordPress hook on the plugin's behalf — with capability checks, nonce verification, sanitisation, and request-body validation baked in. This skill is the field reference for that JSON file and the runtime that consumes it.

The manifest validates against the JSON Schema at `https://cdn.wp-admincss.com/wordpress/plugin-sdk.schema.json`. Point your editor at that URL via the `$schema` key and you get autocomplete + inline validation while editing.

---

## Top-level shape

```json
{
  "$schema": "https://cdn.wp-admincss.com/wordpress/plugin-sdk.schema.json",
  "platform": "wordpress",
  "name": "Acme Forms",
  "slug": "acme-forms",
  "textDomain": "acme-forms",
  "version": "0.1.0",
  "namespace": "Acme\\Forms",

  "settings": { … },
  "rest":     { … },
  "database": { … }
}
```

| Field | Required | What it does |
|---|---|---|
| `$schema` | no | IDE convenience. Doesn't affect runtime behaviour. |
| `platform` | **yes** | Always `"wordpress"` today. |
| `name` | **yes** | Human-readable plugin name. Appears in the WP plugins list. |
| `slug` | **yes** | Kebab-case (`^[a-z][a-z0-9-]+$`). Used for menu slugs, asset handles, the main PHP file name. |
| `textDomain` | **yes** | i18n text domain. Usually = `slug`. |
| `version` | no | Semver string. Drives DB-version comparisons + asset cache busting. |
| `namespace` | no | PHP PSR-4 root namespace (`Acme\\Forms`). |
| `settings` | no | A settings page. Omit if the plugin has no admin UI. |
| `rest` | no | REST API surface. Omit if no REST. |
| `database` | no | Custom tables. Omit if you only use options/meta. |

If any field violates the schema, `Plugin::fromManifest()` throws `\PluginSDK\WP\ConfigException` at boot — fail-fast, with the full validation path in the message.

---

## `settings` — a settings page

```json
"settings": {
  "page": {
    "title": "Acme Forms",
    "menuTitle": "Forms",
    "parent": "options-general.php",
    "capability": "manage_options",
    "sections": [{
      "id": "general",
      "title": "General",
      "description": "Optional help text under the section heading.",
      "fields": [
        { "id": "api_key", "label": "API Key", "type": "password", "required": true },
        { "id": "environment", "label": "Environment", "type": "select",
          "default": "production",
          "options": [
            { "value": "production", "label": "Production" },
            { "value": "staging", "label": "Staging" }
          ]
        },
        { "id": "enable_logging", "label": "Verbose logging", "type": "checkbox", "default": false }
      ]
    }]
  }
}
```

### Field types

| `type` | Sanitiser used | Notes |
|---|---|---|
| `text` | `strip_tags` + collapse whitespace | Single-line text. |
| `textarea` | `strip_tags` + preserve newlines | Multi-line text. |
| `email` | strip tags then `FILTER_VALIDATE_EMAIL` | Returns `''` if invalid. |
| `url` | strip tags then `FILTER_VALIDATE_URL` | Returns `''` if invalid. |
| `number` | numeric cast, clamped to `min`/`max` | Use `min`, `max`, `step`. |
| `checkbox` | coerced to bool | `'1'`/`'on'`/`'yes'`/`true` → `true`; null/missing → `false`. |
| `select` | whitelist against `options[].value` | Returns `default` if value not in the list. |
| `password` | preserve all printable chars | Tags NOT stripped (passwords may contain anything). |
| `list` | comma-split, trim, strip tags, dedupe | Renders one text input ("MyBot, OtherBot"); stores an **array** of strings. |
| `keyedSelect` | keys trimmed/tag-stripped; values whitelisted against `options[].value` | A table with one dropdown per row. Rows come from the field's `rows` map (key → label) **plus any keys already in the stored value**, so dynamically added keys keep their setting. Stores an assoc array. |

### Conditional visibility — `showIf`

Any field can hide behind a sibling field in the same settings option:

```json
{ "id": "mode", "label": "Mode", "type": "select", "options": ["a", "b"],
  "showIf": { "field": "enabled", "equals": true } }
```

The row is visible only while the controller field holds the value. Checkbox controllers compare against `true`/`false`; everything else compares strings. The runtime ships the (tiny, dependency-free) toggle script automatically — no JS to write.

The Settings runtime saves the sanitised array as a single WP option whose key = `slug`. Read it with `get_option('acme-forms')`.

**Performance guarantee worth knowing:** because everything stores under ONE option row and WordPress autoloads options by default, reading your settings on the front end costs **zero additional SQL queries** — the value rides the `alloptions` cache loaded once per request. Never split SDK settings into per-field options; you'd trade this guarantee away for nothing.

Validation errors (e.g. a required field left empty) accumulate on `$settings->getErrors()` for surfacing as admin notices.

### Where the page appears

The `parent` field controls placement:

| Value | Where the page lives |
|---|---|
| `"options-general.php"` (default) | Settings → Acme Forms |
| `"tools.php"` | Tools → Acme Forms |
| `"edit.php"` | Posts → Acme Forms |
| `"themes.php"` | Appearance → Acme Forms |
| `"plugins.php"` | Plugins → Acme Forms |
| `"users.php"` | Users → Acme Forms |
| `"top-level"` | Its own top-level menu. Provide `menuIcon` (dashicon name) if you want a non-default icon. |

### Attaching to a CORE settings screen — `attach`

Small plugins often shouldn't add a page at all. Set `attach` to put your fields on one of WordPress's own Settings screens instead:

```json
"settings": {
  "page": {
    "title": "Agents visibility",
    "capability": "manage_options",
    "attach": "reading",
    "sections": [{
      "id": "default",
      "title": "Agents visibility",
      "fields": [
        { "id": "enabled", "label": "Agents visibility", "type": "checkbox", "default": false }
      ]
    }]
  }
}
```

Rules:

- `attach` is one of `general` · `writing` · `reading` · `discussion` · `media`. No menu item is added; `parent`, `menuTitle`, and `menuIcon` are ignored.
- Fields in a section with id **`default`** render inside the core screen's own table — on `reading` that places them directly under "Search engine visibility". Other sections render below the core table with their own headings.
- Storage is unchanged: one option named after the settings slug, saved by the native core form (the option joins the core screen's settings group). Sanitisation still runs through every field.

---

## `rest` — REST API surface

```json
"rest": {
  "namespace": "acme-forms/v1",
  "routes": [
    {
      "path": "/submissions",
      "method": "POST",
      "capability": "manage_options",
      "handler": "Acme\\Forms\\REST\\Submissions::create",
      "schema": {
        "type": "object",
        "required": ["email"],
        "properties": {
          "email": { "type": "string", "format": "email" },
          "name":  { "type": "string", "maxLength": 200 }
        },
        "additionalProperties": false
      }
    },
    {
      "path": "/submissions/(?P<id>\\d+)",
      "method": "GET",
      "capability": "manage_options",
      "handler": "Acme\\Forms\\REST\\Submissions::get"
    }
  ]
}
```

### How a request flows

Every request to a manifest-declared route goes through this sequence:

1. **Permission check** — runtime calls `current_user_can($route.capability)`. Failing returns `WP_Error('rest_forbidden')` with 401/403.
2. **Body validation** — for POST/PUT/PATCH, the JSON body is matched against `route.schema`. Failing returns `WP_Error('rest_invalid_body', 'Invalid request body', ['status'=>400, 'errors'=>[…]])`. Your handler is never called.
3. **Handler dispatch** — the runtime resolves `route.handler` to a callable and invokes it with the `WP_REST_Request`. Three handler reference forms accepted:
   - `"Class::method"` — runtime looks up the class via autoloader.
   - `"InvokableClass"` — instantiates the class; uses `__invoke`.
   - For maximum IDE/refactor safety, register a real callable up front via `Plugin::withRestHandler($ref, [Class::class, 'method'])`.
4. **Error wrapping** — if your handler throws, the runtime catches and returns `WP_Error('rest_handler_error', $message, ['status'=>500])` rather than letting the exception bubble.

### Path parameters

Use WP's `(?P<name>\\d+)` syntax in `path`. The runtime extracts every captured group. The codegen turns these into typed params:

```typescript
// generated from /submissions/(?P<id>\d+)
client.submissions.get({ id: 42 });
```

### Body schema — supported keywords

The runtime ships a tiny JSON Schema validator (no external deps). Covers what manifests actually use:

- types: `string`, `integer`, `number`, `boolean`, `array`, `object`, `null`
- objects: `required`, `properties`, `additionalProperties`
- arrays: `items`, `minItems`, `maxItems`
- strings: `minLength`, `maxLength`, `pattern`, `format` (`email`, `uri`)
- numbers: `minimum`, `maximum`
- common: `enum`

Anything else (`$ref`, `oneOf`, `allOf`, `if/then/else`) is intentionally unsupported in the runtime. Schemas the runtime accepts also validate clean against a full-spec validator, so the runtime can be swapped for one later without breaking existing manifests.

---

## `database` — custom tables

```json
"database": {
  "tables": [{
    "name": "submissions",
    "columns": [
      { "name": "id",         "type": "BIGINT UNSIGNED", "primary": true, "autoIncrement": true },
      { "name": "email",      "type": "VARCHAR(255)", "notNull": true },
      { "name": "name",       "type": "VARCHAR(200)" },
      { "name": "created_at", "type": "DATETIME", "notNull": true, "default": "CURRENT_TIMESTAMP" }
    ],
    "indexes": [
      { "name": "email_idx", "columns": ["email"] }
    ]
  }]
}
```

### What the runtime does

On plugin activation:

1. Renders every table to a `dbDelta`-compatible `CREATE TABLE` statement (with the two-space-before-`(col)` quirk that dbDelta requires).
2. Runs `dbDelta()` over each statement — which creates new tables and `ALTER`s existing ones to match the schema diff.
3. Writes the manifest's `version` to a WP option named `<slug>_db_version` (with hyphens converted to underscores). Subsequent activations are no-ops unless the manifest's `version` changes.

### Column options

| Key | Effect |
|---|---|
| `type` | Raw SQL type. Examples: `BIGINT UNSIGNED`, `VARCHAR(255)`, `TEXT`, `DATETIME`, `TINYINT(1)`. |
| `primary` | Adds the column to `PRIMARY KEY  (…)`. Implies `notNull`. |
| `autoIncrement` | Adds `AUTO_INCREMENT`. |
| `notNull` | Adds `NOT NULL`. |
| `unique` | Adds inline `UNIQUE` (not as a separate index). |
| `default` | String, number, bool, or one of the literals `CURRENT_TIMESTAMP`, `NULL`, `NOW()`. Strings are SQL-quoted automatically; literals stay unquoted. |

Table names are prefixed at runtime: the final name = `$wpdb->prefix + plugin_prefix + table.name`. The plugin prefix is whatever you pass as the third argument to `Config::buildMigration($prefix)`; the SDK boilerplate uses `'plugin_sdk_'` by default — change it to something plugin-specific like `'acme_'`.

---

## `routes` — virtual documents

Serve a URL pattern yourself — `llms.txt`, a Markdown rendition, a manifest, a feed — with no template and no physical file:

```json
"routes": [
  {
    "pattern": "^llms\\.txt$",
    "queryVar": "acme_forms_llms",
    "handler": "Acme\\Forms\\Routes\\Llms::serve",
    "contentType": "text/plain; charset=utf-8",
    "cache": "public, max-age=3600"
  },
  {
    "pattern": "^(.+)\\.md$",
    "queryVar": "acme_forms_md",
    "handler": "Acme\\Forms\\Routes\\Markdown::serve",
    "contentType": "text/markdown; charset=utf-8"
  }
]
```

What the runtime wires for you (the battle-tested serving pattern):

- `add_rewrite_rule` on `init`, the query var whitelisted via `query_vars`.
- Interception at **`parse_request` priority 0** — before the main query, any template, or other frontend interceptors.
- **Self-healing rewrites**: when the plugin updates without a reactivation and the stored rules predate it, one automatic flush repairs them.
- **Activation priming**: rules are registered and flushed on activation, so the first request after activating already resolves.

The handler receives the matched value (`$matches[1]` for patterns with a capture group, `'1'` for static patterns) and returns:

```php
final class Markdown {
    /** @return string|array|null */
    public static function serve(string $path) {
        $post = /* resolve $path */;
        if (!$post) {
            return null; // → clean 404, core renders its template
        }
        return "# " . get_the_title($post) . "\n\n…";
        // or fine-grained: ['body' => …, 'status' => 200,
        //                   'contentType' => …, 'headers' => [ … ]]
    }
}
```

Register the handler at boot exactly like REST handlers: `->withRouteHandler('Acme\\Forms\\Routes\\Markdown::serve', [Markdown::class, 'serve'])`.

Two rules of the road: keep patterns anchored (`^…$`) so you never shadow real content, and remember `.md`/`.txt` URLs only resolve under pretty permalinks (check `get_option('permalink_structure')` before advertising them).

---

## `uninstall` — declare what deletion removes

```json
"uninstall": {
  "options": ["acme-forms", "acme_forms_db_version"],
  "dropTables": true
}
```

The scaffolded `uninstall.php` reads this fragment straight from `plugin-sdk.json` (no SDK boot — uninstall runs standalone) and deletes the listed options; with `dropTables: true` it also drops the tables declared under `database.tables`. Declaring cleanup in the manifest keeps `uninstall.php` in sync as the plugin grows — a wp.org review expectation.

---

## Booting the runtime

The bootstrap in your plugin's main PHP file:

```php
<?php
/**
 * Plugin Name: Acme Forms
 * Version:     0.1.0
 * Text Domain: acme-forms
 */
declare(strict_types=1);
defined('ABSPATH') || exit;

require_once __DIR__ . '/vendor/autoload.php';

use PluginSDK\WP\Plugin;
use PluginSDK\WP\Version;
use Acme\Forms\REST\Submissions;

add_action('plugins_loaded', function () {
    // Optional: assert a minimum SDK version. Catches the case where a
    // user updated your plugin without updating its SDK dependency.
    Version::requireAtLeast('0.1.0');

    Plugin::fromManifest(__DIR__ . '/plugin-sdk.json', __FILE__)
        ->withRestHandler('Acme\\Forms\\REST\\Submissions::create', [Submissions::class, 'create'])
        ->withRestHandler('Acme\\Forms\\REST\\Submissions::get',    [Submissions::class, 'get'])
        ->boot();
});
```

That's the entire bootstrap. The handler methods themselves stay focused on business logic — no nonce verification, no capability checks, no body validation; the runtime did it before invoking them.

```php
<?php
namespace Acme\Forms\REST;

final class Submissions {
    public static function create(\WP_REST_Request $request): \WP_REST_Response {
        // $request->get_json_params() already validated against the schema.
        $body = $request->get_json_params();
        // … your business logic …
        return new \WP_REST_Response(['ok' => true], 201);
    }
}
```

---

## Fluent runtime — when you don't (or can't) use the manifest

The declarative manifest is a convenience layer on top of imperative classes. Use them directly when:

- You're scaffolding settings/REST/migrations conditionally (different shape per WP role, etc.)
- You need a pattern the manifest schema doesn't express yet
- You're maintaining a pre-SDK plugin and only want to adopt one piece

### Fluent Settings

```php
use PluginSDK\WP\Settings;
use PluginSDK\WP\Settings\Field;

$settings = (new Settings('acme-forms', 'Acme Forms'))
    ->capability('manage_options');

$settings->section('general', 'General')
    ->field('api_key', 'API Key', Field::TYPE_PASSWORD, required: true)
    ->field('env', 'Environment', Field::TYPE_SELECT, default: 'production',
            options: ['production', 'staging']);

$settings->register();
```

### Fluent REST

```php
use PluginSDK\WP\REST;

$rest = new REST('acme-forms/v1');
$rest->route('/submissions', 'POST')
    ->capability('manage_options')
    ->schema([
        'type' => 'object',
        'required' => ['email'],
        'properties' => ['email' => ['type' => 'string', 'format' => 'email']],
    ])
    ->setHandler([Submissions::class, 'create']);

$rest->register();
```

### Fluent Migration

```php
use PluginSDK\WP\Migration;
use PluginSDK\WP\Migration\Table;

$migration = (new Migration('acme_db_version', '0.1.0', 'acme_'))
    ->addTable(new Table('submissions', [
        ['name' => 'id', 'type' => 'BIGINT UNSIGNED', 'primary' => true, 'autoIncrement' => true],
        ['name' => 'email', 'type' => 'VARCHAR(255)', 'notNull' => true],
    ]));

// Run on activation:
register_activation_hook(__FILE__, [$migration, 'run']);
```

---

## Codegen — typed REST clients from the manifest

Once the manifest declares route schemas, the CLI turns them into a typed TypeScript client:

```bash
npx @plugin-sdk/cli codegen --manifest=./plugin-sdk.json --out=./src/api.ts
```

Output (excerpt):

```typescript
export interface SubmissionsCreateBody {
  email: string;
  name?: string;
}

export interface PluginSDKClient {
  submissions: {
    create(body: SubmissionsCreateBody): Promise<unknown>;
    get(params: { id: string | number }): Promise<unknown>;
  };
}

export function createPluginSDKClient(opts: PluginSDKClientOptions): PluginSDKClient { … }
```

Usage in React:

```tsx
import { createPluginSDKClient } from './src/api';

const client = createPluginSDKClient({
  baseUrl: (window as any).wpApiSettings.root,
  nonce:   (window as any).wpApiSettings.nonce,
});

await client.submissions.create({ email: 'a@b.com' });
```

Regenerate after every manifest change. Wiring this into `npm run dev` is a one-line `chokidar` watcher away.

---

## Common patterns

### Adding a setting to an existing plugin

Edit `plugin-sdk.json`:

```diff
       "sections": [{
         "id": "general",
         "title": "General",
         "fields": [
+          { "id": "max_submissions", "label": "Daily limit", "type": "number", "min": 1, "max": 10000, "default": 100 },
           { "id": "api_key", "label": "API Key", "type": "password", "required": true }
         ]
       }]
```

No other code change needed. The runtime renders the field on next admin-page load and sanitises submissions automatically.

Read it from anywhere:

```php
$settings = get_option('acme-forms', []);
$limit    = (int) ($settings['max_submissions'] ?? 100);
```

### Adding a REST endpoint

Edit the manifest's `rest.routes[]` and add a handler class. The codegen picks up the new route automatically.

### Adding a new column to an existing table

Edit the manifest, bump `version` (e.g. `0.1.0` → `0.2.0`), reactivate the plugin. `dbDelta` applies the diff.

---

## When to drop down to raw WordPress

The runtime covers the common cases. Drop to raw WP APIs when:

- You need to register a custom post type / taxonomy → use `register_post_type()` / `register_taxonomy()` directly.
- You need a cron schedule → use `wp_schedule_event()`.
- You need a block editor extension → use the Gutenberg APIs.

The SDK doesn't get in the way of any of these — your plugin can call WP APIs alongside `Plugin::fromManifest()` freely. The runtime owns the settings/REST/migration hooks and nothing else.

---

## Related skills

- [`security.md`](./security.md) — what the runtime is enforcing under the hood, and how to add cap/nonce checks for code that isn't covered by the manifest.
- [`database.md`](./database.md) — when to use a custom table at all (the runtime handles the schema; this skill teaches data-store choice).
- [`plugin-structure.md`](./plugin-structure.md) — where files live in a Plugin-SDK plugin.
- [`enqueue.md`](./enqueue.md) — getting the CSS bundle onto the right pages.
