#!/usr/bin/env node
/*
 * @plugin-sdk/cli — entry point.
 *
 * Resolves to dist/index.js at install-time. During local development
 * the npm workspace links this folder, so we run the TS source via
 * Node's strip-types loader instead.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const compiled = resolve(here, '../dist/index.js');
const source = resolve(here, '../src/index.ts');

const target = existsSync(compiled) ? compiled : source;
await import(pathToFileURL(target).href);
