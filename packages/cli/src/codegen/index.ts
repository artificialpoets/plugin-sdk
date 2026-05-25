/*
 * Codegen command — reads plugin-sdk.json from disk, emits TS to a file.
 */
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { error, info, success } from '../util/log.ts';
import { emitClient } from './emit.ts';

export interface CodegenOptions {
  manifestPath: string;
  outPath: string;
}

export async function runCodegen(opts: CodegenOptions): Promise<{ outPath: string; routeCount: number; bodyTypeCount: number }> {
  const raw = await fs.readFile(opts.manifestPath, 'utf8').catch(() => null);
  if (raw === null) {
    throw new Error(`Could not read manifest at ${opts.manifestPath}`);
  }
  let manifest: unknown;
  try {
    manifest = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Manifest is not valid JSON: ${(e as Error).message}`);
  }
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be a JSON object');
  }

  const result = emitClient(manifest as Parameters<typeof emitClient>[0]);

  await fs.mkdir(dirname(opts.outPath), { recursive: true });
  await fs.writeFile(opts.outPath, result.source, 'utf8');

  return {
    outPath: resolve(opts.outPath),
    routeCount: result.routeCount,
    bodyTypeCount: result.bodyTypeCount,
  };
}

/** Invoked from src/index.ts when the user runs `plugin-sdk codegen ...`. */
export async function codegenCommand(args: {
  manifest?: string;
  out?: string;
}): Promise<void> {
  const manifestPath = resolve(args.manifest ?? 'plugin-sdk.json');
  const outPath = resolve(args.out ?? 'src/generated/plugin-sdk-client.ts');

  info(`Reading manifest: ${manifestPath}`);
  const result = await runCodegen({ manifestPath, outPath });
  success(`Wrote ${result.routeCount} routes (${result.bodyTypeCount} body types) → ${result.outPath}`);
}
