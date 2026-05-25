import { resolve } from 'node:path';
import { copyTree } from './util/fs.ts';
import { renamePath, substitute, type PluginContext } from './template.ts';
import type { Platform } from './platforms/types.ts';

/**
 * Run the platform-specific scaffold:
 *   1. Resolve the template directory
 *   2. Walk it; for every text file, apply substitution + path rename
 *   3. Optionally run the platform's postCreate hook
 *
 * Returns the absolute output directory.
 */
export async function scaffold(opts: {
  platform: Platform;
  outDir: string;
  ctx: PluginContext;
  runPostCreate: boolean;
}): Promise<{ outDir: string; filesWritten: number }> {
  const { platform, ctx, runPostCreate } = opts;
  const outAbs = resolve(opts.outDir);
  const templateDir = platform.resolveTemplateDir();

  const result = await copyTree(templateDir, outAbs, (rel, text) => {
    const newPath = renamePath(rel, ctx);
    const newContent = substitute(text, ctx);
    return { kind: 'write', path: newPath, content: newContent };
  });

  if (runPostCreate && platform.postCreate) {
    await platform.postCreate(outAbs, ctx);
  }

  return { outDir: outAbs, filesWritten: result.written.length };
}
