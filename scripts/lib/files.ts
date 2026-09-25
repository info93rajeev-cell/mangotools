import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export function readYaml(path: string): unknown {
  return parse(readFileSync(path, 'utf8'), { version: '1.2' });
}

export function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort();
}

export function listFiles(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(extension) && statSync(join(dir, name)).isFile())
    .sort()
    .map((name) => join(dir, name));
}

/** Recursively lists files under `dir` whose names end with `extension`. */
export function walkFiles(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full, extension));
    else if (name.endsWith(extension)) out.push(full);
  }
  return out;
}
