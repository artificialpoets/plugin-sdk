import type { Platform } from './types.ts';
import { wordpress } from './wordpress.ts';

/*
 * Platform registry. Each entry knows:
 *   - id           the --platform flag value
 *   - displayName  shown in prompts
 *   - templateDir  where to copy the scaffold from (relative to repo root
 *                  for monorepo, absolute for installed @plugin-sdk/cli)
 *   - prompts      ordered list of prompts to gather context
 *   - postCreate   optional hook (e.g. composer install) to run after scaffold
 *
 * Adding a new platform is one entry — keep the cognitive surface tight.
 */
const platforms: Record<string, Platform> = {
  wordpress,
};

export function listPlatforms(): string[] {
  return Object.keys(platforms);
}

export function getPlatform(id: string): Platform | null {
  return platforms[id] ?? null;
}

export type { Platform } from './types.ts';
