#!/usr/bin/env node
/**
 * build-cdn.mjs — Build the cdn/ output directory.
 *
 * Produces:
 *   cdn/css/latest.css                 Concatenated tokens + core-css
 *   cdn/css/v<version>/wp-admin.css    Pinned version (same content as latest)
 *
 *   cdn/AGENTS.md                      Root dispatcher (multi-platform)
 *   cdn/wordpress/AGENTS.md            WordPress-specific agent instructions
 *   cdn/wordpress/skills/*.md          WordPress skill files
 *
 *   cdn/skills/*.md                    Legacy alias of wordpress/skills/*.md
 *                                      so agents referencing the old paths
 *                                      keep working through this release.
 *
 *   cdn/_headers                       Cloudflare Pages headers (cache + CORS)
 *   cdn/index.html                     Tiny landing for cdn.wp-admincss.com/
 *
 * Deploy this directory as a separate Cloudflare Pages project bound to
 * cdn.wp-admincss.com. See README.md → Deploy.
 *
 * Multi-platform: each supported platform lives under cdn/<platform>/.
 * When we add Shopify / Figma / etc., this script grows another platform
 * block (or better — a loop over platforms/*).
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CDN_OUT = resolve(ROOT, 'cdn');

const pkg = JSON.parse(
  readFileSync(resolve(ROOT, 'packages/wp-core-css/package.json'), 'utf8')
);
const VERSION = pkg.version;

// Inline local @import statements. Skip remote https:// imports — those
// should stay as @import url(...) so the browser fetches them at runtime
// (specifically: dashicons.css imports from s.w.org).
function inlineImports(cssPath, seen = new Set()) {
  if (seen.has(cssPath)) return '';
  seen.add(cssPath);
  const dir = dirname(cssPath);
  const content = readFileSync(cssPath, 'utf8');
  return content.replace(
    /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\);?/g,
    (match, url) => {
      if (/^https?:\/\//.test(url)) return match; // keep external imports
      const localPath = resolve(dir, url);
      return `\n/* @import ${url} */\n` + inlineImports(localPath, seen);
    }
  );
}

function copyMarkdownDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const file of readdirSync(src)) {
    if (file.endsWith('.md')) {
      copyFileSync(resolve(src, file), resolve(dest, file));
      count++;
    }
  }
  return count;
}

function build() {
  rmSync(CDN_OUT, { recursive: true, force: true });
  mkdirSync(resolve(CDN_OUT, 'css'), { recursive: true });
  mkdirSync(resolve(CDN_OUT, `css/v${VERSION}`), { recursive: true });

  // ── CSS bundle ────────────────────────────────────────────────────────
  const tokens = inlineImports(resolve(ROOT, 'packages/wp-tokens/src/tokens.css'));
  const coreCss = inlineImports(resolve(ROOT, 'packages/wp-core-css/src/wp-admin.css'));
  const banner =
    `/*!\n` +
    ` * Plugin SDK v${VERSION} — WordPress\n` +
    ` * https://wp-admincss.com\n` +
    ` * Tokens overlay © Artificial Poets, Inc. — Apache-2.0\n` +
    ` * WordPress core admin CSS © WordPress contributors — GPLv2-or-later\n` +
    ` * See https://wp-admincss.com/NOTICE for full third-party attributions.\n` +
    ` */\n`;
  const bundle = banner + tokens + '\n' + coreCss;
  writeFileSync(resolve(CDN_OUT, 'css/latest.css'), bundle);
  writeFileSync(resolve(CDN_OUT, `css/v${VERSION}/wp-admin.css`), bundle);

  // ── Root AGENTS.md (dispatcher) ───────────────────────────────────────
  copyFileSync(resolve(ROOT, 'AGENTS.md'), resolve(CDN_OUT, 'AGENTS.md'));

  // ── WordPress AGENTS.md + skills + schema ─────────────────────────────
  // Two paths for every artifact:
  //   /wordpress/<file>                    → rolling latest
  //   /wordpress/v<VERSION>/<file>         → immutable pinned version
  // Agents that pin a specific SDK release should use the versioned URL.
  mkdirSync(resolve(CDN_OUT, 'wordpress'), { recursive: true });
  mkdirSync(resolve(CDN_OUT, `wordpress/v${VERSION}`), { recursive: true });

  // AGENTS.md — latest + pinned
  copyFileSync(
    resolve(ROOT, 'platforms/wordpress/AGENTS.md'),
    resolve(CDN_OUT, 'wordpress/AGENTS.md')
  );
  copyFileSync(
    resolve(ROOT, 'platforms/wordpress/AGENTS.md'),
    resolve(CDN_OUT, `wordpress/v${VERSION}/AGENTS.md`)
  );

  // Skills — latest + pinned
  const wpSkillCount = copyMarkdownDir(
    resolve(ROOT, 'platforms/wordpress/skills'),
    resolve(CDN_OUT, 'wordpress/skills')
  );
  copyMarkdownDir(
    resolve(ROOT, 'platforms/wordpress/skills'),
    resolve(CDN_OUT, `wordpress/v${VERSION}/skills`)
  );

  // Plugin-SDK manifest JSON Schema (consumed by IDEs via the $schema URL).
  // Pin under /v<VERSION>/ too so a saved manifest can lock its schema.
  copyFileSync(
    resolve(ROOT, 'packages/wp-composer/schema/plugin-sdk.schema.json'),
    resolve(CDN_OUT, 'wordpress/plugin-sdk.schema.json')
  );
  copyFileSync(
    resolve(ROOT, 'packages/wp-composer/schema/plugin-sdk.schema.json'),
    resolve(CDN_OUT, `wordpress/v${VERSION}/plugin-sdk.schema.json`)
  );

  // ── Legacy alias: /skills/<name>.md → WordPress skills ────────────────
  // Old agent prompts may reference cdn.wp-admincss.com/skills/<name>.md.
  // Keep that working for one release cycle; drop on the next major.
  copyMarkdownDir(
    resolve(ROOT, 'platforms/wordpress/skills'),
    resolve(CDN_OUT, 'skills')
  );

  // ── _headers (Cloudflare Pages) ───────────────────────────────────────
  writeFileSync(
    resolve(CDN_OUT, '_headers'),
    `# Versioned CSS bundles — immutable, year-long cache
/css/v*/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

# Rolling latest — short cache, agents/users can pick up fixes
/css/latest.css
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *

# Agent instructions and skills — fetched by AI agents, served as markdown
/AGENTS.md
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8

/wordpress/AGENTS.md
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8

/wordpress/skills/*
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8

# Manifest JSON Schema — IDEs hit this via the $schema URL in plugin-sdk.json
/wordpress/plugin-sdk.schema.json
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *
  Content-Type: application/schema+json; charset=utf-8

# Versioned agent artifacts — immutable, year-long cache
/wordpress/v*/AGENTS.md
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8

/wordpress/v*/skills/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8

/wordpress/v*/plugin-sdk.schema.json
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  Content-Type: application/schema+json; charset=utf-8

# Legacy alias — drop on next major
/skills/*
  Cache-Control: public, max-age=300, s-maxage=600
  Access-Control-Allow-Origin: *
  Content-Type: text/markdown; charset=utf-8
`
  );

  // ── Landing page ──────────────────────────────────────────────────────
  writeFileSync(
    resolve(CDN_OUT, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>cdn.wp-admincss.com</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="icon" href="https://wp-admincss.com/favicon.svg" type="image/svg+xml">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 24px; color: #14181f; line-height: 1.55; }
    a { color: #2271b1; }
    code { background: #f6f7f7; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.92em; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #dcdcde; vertical-align: top; }
    th { background: #f6f7f7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #50575e; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #50575e; }
  </style>
</head>
<body>
  <h1>Plugin SDK CDN</h1>
  <p>Static asset host for <a href="https://wp-admincss.com">wp-admincss.com</a>.</p>
  <table>
    <thead>
      <tr><th>Path</th><th>Content</th></tr>
    </thead>
    <tbody>
      <tr><td><a href="/css/latest.css"><code>/css/latest.css</code></a></td><td>Latest WordPress CSS bundle (rolling)</td></tr>
      <tr><td><a href="/css/v${VERSION}/wp-admin.css"><code>/css/v${VERSION}/wp-admin.css</code></a></td><td>Pinned v${VERSION}</td></tr>
      <tr><td><a href="/AGENTS.md"><code>/AGENTS.md</code></a></td><td>Plugin SDK — agent dispatcher</td></tr>
      <tr><td><a href="/wordpress/AGENTS.md"><code>/wordpress/AGENTS.md</code></a></td><td>WordPress-specific agent instructions (rolling)</td></tr>
      <tr><td><a href="/wordpress/v${VERSION}/AGENTS.md"><code>/wordpress/v${VERSION}/AGENTS.md</code></a></td><td>WordPress agent instructions (pinned v${VERSION})</td></tr>
      <tr><td><a href="/wordpress/skills/security.md"><code>/wordpress/skills/&lt;name&gt;.md</code></a></td><td>WordPress skill files (rolling)</td></tr>
      <tr><td><a href="/wordpress/v${VERSION}/skills/security.md"><code>/wordpress/v${VERSION}/skills/&lt;name&gt;.md</code></a></td><td>WordPress skill files (pinned v${VERSION})</td></tr>
      <tr><td><a href="/wordpress/plugin-sdk.schema.json"><code>/wordpress/plugin-sdk.schema.json</code></a></td><td>Plugin manifest JSON Schema (\`$schema\` URL)</td></tr>
    </tbody>
  </table>
</body>
</html>
`
  );

  const kb = (bundle.length / 1024).toFixed(1);
  console.log(`[build-cdn] CSS bundle: ${kb} KB → cdn/css/latest.css + cdn/css/v${VERSION}/wp-admin.css`);
  console.log(`[build-cdn] WordPress AGENTS.md + ${wpSkillCount} skills → cdn/wordpress/ (rolling)`);
  console.log(`[build-cdn] WordPress AGENTS.md + ${wpSkillCount} skills + schema → cdn/wordpress/v${VERSION}/ (pinned)`);
  console.log(`[build-cdn] Root dispatcher AGENTS.md → cdn/AGENTS.md`);
  console.log(`[build-cdn] Legacy /skills/ alias → ${wpSkillCount} files`);
  console.log(`[build-cdn] cdn/ ready`);
}

build();
