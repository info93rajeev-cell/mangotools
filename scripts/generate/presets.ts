import { type Preset, presetSchema } from '@mangotools/schemas';
import { type Issue, issue, zodIssues } from './issues.ts';
import type { SourceFile } from './sources.ts';

export interface RawPreset {
  file: string;
  preset: Preset;
}

/** Longest allowed `extends` chain (a preset plus three ancestors). */
export const MAX_EXTENDS_DEPTH = 3;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** Keyed maps merge recursively; arrays and scalars from `over` replace those in `base`. */
export function deepMerge(base: unknown, over: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) out[key] = deepMerge(base[key], value);
  return out;
}

function expectedId(file: string): string {
  return file.replace(/^presets\//, '').replace(/\.yaml$/, '');
}

export function parsePresets(files: SourceFile[]): {
  raw: Map<string, RawPreset>;
  issues: Issue[];
} {
  const raw = new Map<string, RawPreset>();
  const issues: Issue[] = [];
  for (const source of files) {
    if (source.data === undefined) continue;
    const parsed = presetSchema.safeParse(source.data);
    if (!parsed.success) {
      issues.push(...zodIssues(source.file, parsed.error));
      continue;
    }
    const preset = parsed.data;
    if (preset.id !== expectedId(source.file)) {
      issues.push(
        issue(source.file, `Preset id "${preset.id}" does not match its path.`, {
          path: 'id',
          hint: `Use id: ${expectedId(source.file)}`,
        }),
      );
      continue;
    }
    raw.set(preset.id, { file: source.file, preset });
  }
  return { raw, issues };
}

/** Applies the `extends` chain. Returns the merged preset, or an issue explaining why it can't. */
export function resolveExtends(
  id: string,
  raw: Map<string, RawPreset>,
): { preset: Preset } | { problem: Issue } {
  const entry = raw.get(id);
  if (!entry) return { problem: issue('presets', `Preset "${id}" does not exist.`) };
  const chain: RawPreset[] = [entry];
  let current = entry.preset;
  while (current.extends) {
    const parent = raw.get(current.extends);
    const file = chain[chain.length - 1]?.file ?? entry.file;
    if (!parent) {
      return {
        problem: issue(file, `Extends unknown preset "${current.extends}".`, { path: 'extends' }),
      };
    }
    if (chain.includes(parent)) {
      const cycle = [...chain.map((c) => c.preset.id), parent.preset.id].join(' → ');
      return { problem: issue(file, `Circular extends: ${cycle}.`, { path: 'extends' }) };
    }
    chain.push(parent);
    if (chain.length - 1 > MAX_EXTENDS_DEPTH) {
      return {
        problem: issue(entry.file, `Extends chain is deeper than ${MAX_EXTENDS_DEPTH}.`, {
          path: 'extends',
          hint: 'Flatten the chain; deep inheritance makes presets hard to review.',
        }),
      };
    }
    current = parent.preset;
  }
  let merged: unknown = {};
  for (const link of [...chain].reverse()) merged = deepMerge(merged, link.preset);
  const result = { ...(merged as Preset), id: entry.preset.id, version: entry.preset.version };
  delete result.extends;
  if (entry.preset.abstract) result.abstract = true;
  else delete result.abstract;
  return { preset: result };
}
