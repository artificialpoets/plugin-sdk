# Contributing to Plugin SDK

Thanks for your interest. Plugin SDK sits at the intersection of multiple plugin ecosystems — WordPress today, more next — and modern frontend tooling (CSS / React / Vite) and AI agent runtimes (AGENTS.md / skills). Contributions from people in any of those communities are welcome.

> **Note:** this is a private mirror during development. External
> contributions are reviewed but not yet automatically merged. When the
> repo flips public we'll relax this; for now, please file an issue
> before doing significant work so we can confirm direction.

## Quick start

```bash
gh repo clone artificialpoets/plugin-sdk
cd plugin-sdk
npm install              # installs all workspaces
npm run dev              # boots the docs site at localhost:3000
npm run build            # builds everything (site + CDN bundle)
npm test                 # runs unit + smoke tests across workspaces
```

## Repo layout

```
plugin-sdk/
├── packages/
│   ├── cli/              ← @plugin-sdk/cli — cross-platform scaffolder
│   ├── wp-tokens/        ← CSS custom properties (Apache 2.0)
│   ├── wp-core-css/      ← WP admin CSS bundle (GPLv2-or-later)
│   ├── wp-react/         ← React components (Apache 2.0)
│   └── wp-composer/      ← PHP render helpers (Apache 2.0)
├── boilerplates/
│   └── wordpress/        ← WP plugin scaffold (GPLv2-or-later)
├── platforms/
│   └── wordpress/
│       ├── AGENTS.md     ← Master agent entry point for WP. Read first.
│       └── skills/       ← security · database · enqueue · …
└── apps/
    ├── site/             ← Landing, docs, components catalog
    └── videos/           ← Remotion promo videos
```

See [README.md](./README.md) for the architecture overview.

## Issues — what to file, where

- **Bug in the CSS bundle / a component renders wrong** → file an issue with a minimal reproduction (CodePen, JSFiddle, or a repo link).
- **Missing component / new pattern needed** → describe the platform context where it shows up. Patterns that exist in the platform's own admin/UI are easier yeses than novel patterns.
- **AGENTS.md / skills inaccuracy** → quote the section, explain what the agent did wrong, suggest the fix.
- **Boilerplate question** → please check `platforms/<platform>/skills/` first. If your question is answered there, point us at where the docs were unclear and we'll clarify.
- **New platform proposal** → open a discussion before doing work. Each new platform is a real commitment to maintain skills + scaffold + components.

## Pull requests

For non-trivial changes, **open an issue first** so we can talk about the
direction. Drive-by typo fixes / one-line clarifications are fine without.

Before pushing a PR:

```bash
npm run build            # must complete cleanly
npm test                 # all unit + smoke tests pass
```

PRs should:
- Target the `dev` branch (the default — `main` is reserved for stable releases)
- Have a clear title following the repo's conventional style (look at recent commit messages for examples)
- Include screenshots if the change is visual
- Update the relevant docs if behavior changes
- Add or extend unit tests for new code paths; add a smoke test for any new package surface

## Style — code

- **CSS**: real platform-native class names where the platform has them (e.g. WP's `.button`, `.notice`, `.wp-list-table`), no invented prefixes. Modern patterns we add ourselves use platform-prefixed names (`.wp-admin-status`, `.wp-admin-statcard`, etc.).
- **React**: typed components, render platform-native class names, no styled-components / runtime CSS-in-JS.
- **PHP**: PSR-12, PHP 7.4+, `declare(strict_types=1)`, namespaced under `PluginSDK\WP\` for the library and `PluginSDK\Starter\` for the boilerplate.
- **TypeScript**: strict mode, no `any` unless surrounded by a comment explaining why.

## Style — security (especially for boilerplate + skills)

Every PHP example in the framework should demonstrate:

1. Capability check (`current_user_can()`) before any read or write
2. Nonce verification (`check_admin_referer()` / `wp_verify_nonce()`)
3. Sanitize on input (`sanitize_text_field` / `sanitize_key` / type coercion — never trust `$_POST`)
4. Escape on output (`esc_html` / `esc_attr` / `esc_url`)
5. Prepared SQL (`$wpdb->prepare()`) for every database call

If a PR removes or weakens any of these, please justify in the PR description. If a PR fixes a missing one, please call it out — security fixes get reviewed faster.

## Style — docs

- Plain prose, no marketing-speak in `platforms/*/skills/` or `platforms/*/AGENTS.md`. Agents and developers should be able to grep for what they need.
- Code samples should be self-contained and runnable.
- When you add a skill, link it from the platform's `AGENTS.md`. When you change a skill's contract, update `AGENTS.md`.

## License

This repository uses a split license:

- **Apache 2.0** for the root, `packages/cli/`, `packages/wp-tokens/`, `packages/wp-react/`, `packages/wp-composer/`, `apps/site/`, `platforms/wordpress/AGENTS.md`, and `platforms/wordpress/skills/`
- **GPLv2-or-later** for `packages/wp-core-css/` (bundles WordPress core admin CSS, which is GPL) and `boilerplates/wordpress/` (WordPress plugin scaffold)

By submitting a contribution you agree your contribution is licensed under the same terms as the file(s) it touches.

Significant contributions may require a CLA (Contributor License Agreement) before merge — we'll send a link when needed.

## Code of conduct

Be kind. Disagreement is fine; disrespect is not. We follow the Contributor Covenant 2.1 in spirit even though we haven't formally adopted it as a file in this repo (yet).

## Contact

- File an issue for anything code-related
- Email <matias@artificialpoets.com> for security disclosures (see [SECURITY.md](./SECURITY.md)) or anything sensitive

Built by [Artificial Poets](https://artificialpoets.com).
