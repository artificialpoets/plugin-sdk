/*
 * @plugin-sdk/cli — main entry.
 *
 * Supported invocation:
 *   plugin-sdk create <name> [--platform=wordpress]
 *                            [--slug=…] [--namespace=…] [--prefix=…]
 *                            [--description=…] [--author=…] [--author-url=…]
 *                            [--no-install] [--yes] [--out=./<slug>]
 *
 * Examples:
 *   npx @plugin-sdk/cli create acme-forms --platform=wordpress --yes
 *   npx @plugin-sdk/cli create "Acme Forms"
 *
 * The CLI:
 *   1. Resolves the target platform (default: wordpress)
 *   2. Builds the PluginContext from flags, prompts for any missing
 *      pieces, validates each derived identifier
 *   3. Calls scaffolder.scaffold() which writes the tree
 *   4. Optionally invokes the platform's postCreate (composer install
 *      for WordPress)
 *
 * Exit codes:
 *   0  ok
 *   1  user error (bad args, validation failure they didn't fix)
 *   2  scaffolder failed (file system, network, child process)
 */
import { resolve } from 'node:path';
import { exit, argv } from 'node:process';
import { pathExists } from './util/fs.ts';
import { c, error, info, step, success } from './util/log.ts';
import { askChoice, askConfirm, askText, closePrompt } from './prompts.ts';
import { getPlatform, listPlatforms } from './platforms/index.ts';
import {
  deriveConstantPrefix,
  deriveDbVersionOption,
  deriveNamespace,
  deriveSlug,
  parseChannel,
  validateConstantPrefix,
  validateName,
  validateNamespace,
  validateSlug,
} from './util/slug.ts';
import { scaffold } from './scaffolder.ts';
import { codegenCommand } from './codegen/index.ts';
import type { DistributionChannel, PluginContext } from './template.ts';

interface Flags {
  command: string | null;
  positional: string[];
  platform: string;
  slug?: string;
  namespace?: string;
  prefix?: string;
  description?: string;
  author?: string;
  authorUrl?: string;
  channel?: string;
  /** Path to plugin-sdk.json (codegen). */
  manifest?: string;
  out?: string;
  install: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
}

function parseArgs(args: string[]): Flags {
  const out: Flags = {
    command: null,
    positional: [],
    platform: 'wordpress',
    install: true,
    yes: false,
    help: false,
    version: false,
  };
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg === '--help' || arg === '-h') { out.help = true; i++; continue; }
    if (arg === '--version' || arg === '-v') { out.version = true; i++; continue; }
    if (arg === '--yes' || arg === '-y') { out.yes = true; i++; continue; }
    if (arg === '--no-install') { out.install = false; i++; continue; }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      const key = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
      const val = eq === -1 ? args[++i] : arg.slice(eq + 1);
      switch (key) {
        case 'platform':    out.platform = val!; break;
        case 'manifest':    out.manifest = val; break;
        case 'slug':        out.slug = val; break;
        case 'namespace':   out.namespace = val; break;
        case 'prefix':      out.prefix = val; break;
        case 'description': out.description = val; break;
        case 'author':      out.author = val; break;
        case 'author-url':  out.authorUrl = val; break;
        case 'channel':     out.channel = val; break;
        case 'out':         out.out = val; break;
        default:
          error(`Unknown flag: ${arg}`);
          exit(1);
      }
      i++;
      continue;
    }
    if (!out.command) { out.command = arg; i++; continue; }
    out.positional.push(arg);
    i++;
  }
  return out;
}

function printHelp(): void {
  console.log(`
${c.bold('Plugin SDK CLI')}

  Scaffold a plugin for one of the supported platforms.

${c.bold('Usage')}
  plugin-sdk create <name>           Scaffold a new plugin
  plugin-sdk codegen                 Generate a typed REST client from plugin-sdk.json
  plugin-sdk --version               Print the CLI version
  plugin-sdk --help                  Print this help

${c.bold('Flags for `create`')}
  --platform=<id>          Target platform. Currently: ${listPlatforms().join(', ')}
                           (default: wordpress)
  --slug=<kebab>           Override derived slug (default: derived from name)
  --namespace=<ps\\Slash>   Override derived PHP namespace
  --prefix=<UPPER_>        Override derived constant prefix
  --description="..."      Plugin description
  --author="Name"          Author display name
  --author-url=<url>       Author URL
  --channel=<id>           Distribution channel: wp.org | github | dual
                           (default: wp.org). Decides whether release.yml,
                           readme.txt, submission-prep.sh, and the Plugin
                           Update Checker block are included.
  --out=<dir>              Output directory (default: ./<slug>)
  --no-install             Skip the platform's post-create hook (e.g.
                           skip 'composer install' on WordPress)
  --yes, -y                Use derived defaults for every prompt

${c.bold('Flags for `codegen`')}
  --manifest=<path>        Path to plugin-sdk.json (default: ./plugin-sdk.json)
  --out=<path>             Output .ts file (default: ./src/generated/plugin-sdk-client.ts)

${c.bold('Examples')}
  plugin-sdk create "Acme Forms"
  plugin-sdk create acme-forms --yes --no-install
  plugin-sdk create my-plugin --platform=wordpress --author="Acme"
  plugin-sdk codegen
  plugin-sdk codegen --manifest=./plugin-sdk.json --out=./src/api.ts
`);
}

async function buildContext(flags: Flags): Promise<PluginContext> {
  // Pull plugin name from the first positional arg, or prompt.
  const positionalName = flags.positional[0];
  const finalName: string = positionalName
    ? positionalName
    : await askText('Plugin name', {
        defaultValue: 'My Plugin',
        validate: validateName,
      });

  const defaultSlug = deriveSlug(finalName);
  const slug: string = flags.slug
    ? flags.slug
    : flags.yes
      ? defaultSlug
      : await askText('Slug', { defaultValue: defaultSlug, validate: validateSlug });

  const defaultNs = deriveNamespace(finalName);
  const namespace: string = flags.namespace
    ? flags.namespace
    : flags.yes
      ? defaultNs
      : await askText('PHP namespace', { defaultValue: defaultNs, validate: validateNamespace });

  const defaultPrefix = deriveConstantPrefix(finalName);
  const constantPrefix: string = flags.prefix
    ? flags.prefix
    : flags.yes
      ? defaultPrefix
      : await askText('Constant prefix', { defaultValue: defaultPrefix, validate: validateConstantPrefix });

  const description: string = flags.description
    ? flags.description
    : flags.yes
      ? `${finalName} — a WordPress plugin.`
      : await askText('Description', {
          defaultValue: `${finalName} — a WordPress plugin.`,
        });

  const author: string = flags.author
    ? flags.author
    : flags.yes
      ? 'Your Org'
      : await askText('Author', { defaultValue: 'Your Org' });

  let authorUrl: string;
  if (flags.authorUrl !== undefined) {
    authorUrl = flags.authorUrl;
  } else if (flags.yes) {
    authorUrl = '';
  } else {
    const raw = await askText('Author URL (optional)', { defaultValue: ' ' });
    authorUrl = raw.trim();
  }

  // Distribution channel — see DistributionChannel in template.ts for
  // the per-value contract. Default is `wp.org`: the safest choice for
  // Plugin Check and the most common case for new plugins.
  let channel: DistributionChannel;
  if (flags.channel !== undefined) {
    const parsed = parseChannel(flags.channel);
    if (!parsed) {
      error(`Invalid --channel value: '${flags.channel}'. Use wp.org, github, or dual.`);
      exit(1);
    }
    channel = parsed;
  } else if (flags.yes) {
    channel = 'wp.org';
  } else {
    channel = await askChoice<DistributionChannel>(
      'Distribution channel — where will updates come from?',
      [
        {
          value: 'wp.org',
          label: 'WordPress.org plugin directory',
          description: 'Updates via wp.org SVN. No GH release pipeline, no PUC.',
        },
        {
          value: 'github',
          label: 'Self-hosted via GitHub releases',
          description: 'Plugin Update Checker pulls updates from your GH repo. No wp.org submission.',
        },
        {
          value: 'dual',
          label: 'Both — dual-channel',
          description: 'wp.org for the directory; GH releases for early-access / prerelease builds.',
        },
      ],
      'wp.org',
    );
  }

  return {
    name: finalName,
    slug,
    namespace,
    constantPrefix,
    slugSnake: slug.replace(/-/g, '_'),
    textDomain: slug,
    description,
    author,
    authorUrl,
    channel,
  };
}

async function main(): Promise<void> {
  const flags = parseArgs(argv.slice(2));

  if (flags.help || (!flags.command && !flags.version)) {
    printHelp();
    return;
  }
  if (flags.version) {
    const { default: pkg } = await import('../package.json', {
      with: { type: 'json' },
    });
    console.log(pkg.version);
    return;
  }

  if (flags.command === 'codegen') {
    try {
      await codegenCommand({ manifest: flags.manifest, out: flags.out });
      return;
    } catch (e) {
      error(e instanceof Error ? e.message : String(e));
      exit(2);
    }
  }

  if (flags.command !== 'create') {
    error(`Unknown command: ${flags.command}`);
    printHelp();
    exit(1);
  }

  const platform = getPlatform(flags.platform);
  if (!platform) {
    error(`Unknown platform: ${flags.platform}. Available: ${listPlatforms().join(', ')}`);
    exit(1);
  }

  const ctx = await buildContext(flags);
  closePrompt();

  const outDir = flags.out ?? `./${ctx.slug}`;
  if (await pathExists(resolve(outDir))) {
    error(`Output directory already exists: ${outDir}`);
    exit(2);
  }

  info(`Scaffolding ${c.bold(ctx.name)} for ${c.cyan(platform.displayName)}`);
  step(`Output: ${resolve(outDir)}`);

  try {
    const { filesWritten } = await scaffold({
      platform,
      outDir,
      ctx,
      runPostCreate: flags.install,
    });
    success(`Wrote ${filesWritten} files`);
    success(`Done. Next steps:`);
    console.log(`
  cd ${outDir}
  ${platform.id === 'wordpress' ? 'composer install   # if skipped above' : ''}
  Open the project in your editor and follow the README inside.

`);
  } catch (e) {
    error(e instanceof Error ? e.message : String(e));
    exit(2);
  }
}

main().catch((e) => {
  error(e instanceof Error ? e.message : String(e));
  exit(2);
});
