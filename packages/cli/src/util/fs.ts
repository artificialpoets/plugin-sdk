import { promises as fs } from 'node:fs';
import { dirname, join, relative } from 'node:path';

/**
 * Recursive copy with per-file transform hook. The hook receives the
 * file's relative path (from `from`) plus its UTF-8 contents and
 * returns:
 *   - { kind: 'skip' }                 — don't write
 *   - { kind: 'write', path, content } — write to a (possibly renamed) path
 *
 * Binary files (those whose contents can't decode as UTF-8) are copied
 * byte-for-byte without invoking the transform.
 */
export type FileXform = (
  relPath: string,
  text: string,
) => { kind: 'skip' } | { kind: 'write'; path: string; content: string };

export async function copyTree(
  from: string,
  to: string,
  transform?: FileXform,
): Promise<{ written: string[]; skipped: string[] }> {
  const written: string[] = [];
  const skipped: string[] = [];

  async function walk(absSrc: string): Promise<void> {
    const entries = await fs.readdir(absSrc, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(absSrc, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'vendor' || entry.name === '.git') {
          continue; // never copy build artifacts or VCS
        }
        await walk(srcPath);
        continue;
      }

      const rel = relative(from, srcPath);
      const buf = await fs.readFile(srcPath);

      // Heuristic: if the buffer round-trips through UTF-8 without
      // losing data, treat as text. Otherwise binary (image, etc.).
      const decoded = buf.toString('utf8');
      const isText = Buffer.from(decoded, 'utf8').equals(buf);

      if (isText && transform) {
        const result = transform(rel, decoded);
        if (result.kind === 'skip') {
          skipped.push(rel);
          continue;
        }
        const dest = join(to, result.path);
        await fs.mkdir(dirname(dest), { recursive: true });
        await fs.writeFile(dest, result.content, 'utf8');
        written.push(result.path);
      } else {
        const dest = join(to, rel);
        await fs.mkdir(dirname(dest), { recursive: true });
        await fs.writeFile(dest, buf);
        written.push(rel);
      }
    }
  }

  await fs.mkdir(to, { recursive: true });
  await walk(from);
  return { written, skipped };
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
