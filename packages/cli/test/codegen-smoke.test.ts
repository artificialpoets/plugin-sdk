import { after, before, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { runCodegen } from '../src/codegen/index.ts';

/*
 * Smoke test: run codegen against the actual boilerplate manifest and
 * verify the generated TS file parses cleanly. We use `tsc --noEmit`
 * on a one-off tsconfig because that's the highest-confidence way to
 * check "this output is valid TypeScript."
 */

const BOILERPLATE = join(
  // packages/cli/test/ → ../../../boilerplates/wordpress/plugin-sdk.json
  new URL('.', import.meta.url).pathname,
  '..',
  '..',
  '..',
  'boilerplates',
  'wordpress',
  'plugin-sdk.json',
);

const TMP_PREFIX = join(tmpdir(), 'plugin-sdk-codegen-');

describe('codegen smoke — boilerplate manifest', () => {
  let outDir: string;
  let outFile: string;

  before(async () => {
    outDir = await mkdtemp(TMP_PREFIX);
    outFile = join(outDir, 'sdk.ts');
    await runCodegen({ manifestPath: BOILERPLATE, outPath: outFile });
  });

  after(async () => {
    if (outDir && existsSync(outDir)) {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('writes a non-empty file at outPath', async () => {
    assert.ok(existsSync(outFile), 'expected output file to exist');
    const contents = await readFile(outFile, 'utf8');
    assert.ok(contents.length > 200, 'expected non-trivial output');
  });

  it('contains the boilerplate REST namespace', async () => {
    const contents = await readFile(outFile, 'utf8');
    assert.ok(contents.includes('plugin-sdk-starter/v1'), contents.slice(0, 400));
  });

  it('contains the body type for POST /submissions', async () => {
    const contents = await readFile(outFile, 'utf8');
    assert.ok(contents.includes('SubmissionsCreateBody'), 'expected body type interface');
    assert.ok(contents.includes('email:'), 'expected email property');
  });

  it('the generated file parses as valid TypeScript via tsc', () => {
    // Invoke the workspace's installed tsc directly. `npx tsc` would
    // also work, but on some systems an unrelated `tsc` binary (the
    // shell wrapper) wins the PATH lookup. Absolute path is safer.
    const tscPath = join(
      new URL('.', import.meta.url).pathname,
      '..', '..', '..',
      'node_modules', '.bin', 'tsc',
    );
    const proc = spawnSync(
      tscPath,
      [
        '--noEmit',
        '--target', 'ES2022',
        '--module', 'ES2022',
        '--moduleResolution', 'node',
        '--strict',
        '--skipLibCheck',
        '--lib', 'ES2022,DOM',
        outFile,
      ],
      { encoding: 'utf8', cwd: outDir },
    );
    if (proc.status !== 0) {
      throw new Error(
        `tsc on generated file failed (exit ${proc.status}):\n` +
          `stdout: ${proc.stdout}\nstderr: ${proc.stderr}`,
      );
    }
    assert.equal(proc.status, 0);
  });
});
