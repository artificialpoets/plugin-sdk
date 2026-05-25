# Security Policy

## Reporting a vulnerability

**Please do not file public issues for security vulnerabilities.**

Email **<matias@artificialpoets.com>** with the subject line starting
`[SECURITY] plugin-sdk:` followed by a short summary. Include:

- The version / commit SHA you're testing against
- Steps to reproduce
- Impact assessment (data exposure / privilege escalation / DoS / supply-chain / other)
- Suggested fix if you have one

You'll get an acknowledgement within 48 hours and a status update within 7 days.

## Scope

This policy covers code in this repository:

- `packages/cli/`, `packages/wp-tokens/`, `packages/wp-core-css/`, `packages/wp-react/`, `packages/wp-composer/`
- `boilerplates/wordpress/` (the WP plugin scaffold)
- `apps/site/` (the docs site, currently hosted at wp-admincss.com)
- `platforms/<name>/skills/` and `platforms/<name>/AGENTS.md` (if a skill recommends an insecure pattern, that's a security bug)

Out of scope:

- Vulnerabilities in WordPress core itself (report to <https://hackerone.com/wordpress>)
- Vulnerabilities in the plugins users build *with* this framework (their responsibility)
- Vulnerabilities in MailChannels, Cloudflare, or other infrastructure providers we depend on (report to them directly)

## What counts as a vulnerability

In priority order:

1. **A pattern in `skills/` or the boilerplate that leads users to write
   insecure code** (e.g., a code sample missing nonce verification, a SQL
   example without `prepare()`, an escape-on-output omission). These are
   the highest-impact because the framework is meant to be copied.

2. **A vulnerability in `@plugin-sdk/wp-core-css` / `wp-tokens` /
   `wp-react` / `wp-composer`** that would let an attacker exploit a
   plugin built with it (CSS injection, XSS via React component, SQL
   injection in PHP helper, etc.).

3. **A vulnerability in the docs site itself** (`apps/site/`).

4. **Supply-chain risks** — a dependency that introduces a known CVE.

## Coordinated disclosure

We follow a 90-day disclosure timeline. After we ship a fix:

1. The patch lands in `main`
2. We tag a release with a `SECURITY:` prefix in the release notes
3. After 14 days we credit the reporter (with consent) in the GitHub Security Advisory
4. If the issue affects users of the published packages, we file a CVE through GitHub's automated process

If you'd prefer to remain anonymous, that's fine — please say so in your initial email.

## Bug bounty

We don't run a formal bug bounty (yet). Material contributions to project
security may be acknowledged in the release notes and the contributors
list.

## PGP

For especially sensitive reports, you can request a PGP-encrypted channel
by emailing the address above. We'll respond with a key.
