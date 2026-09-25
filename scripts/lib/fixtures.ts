import { basename, join } from 'node:path';
import type { OperationContext, Result } from '@mangotools/core';
import { type Fixture, fixtureSchema } from '@mangotools/schemas';
import { listDirs, listFiles, readYaml } from './files.ts';
import { paths, rel } from './paths.ts';

export interface LoadedFixture {
  file: string;
  fixture: Fixture;
}

export function loadFixture(file: string): LoadedFixture {
  const parsed = fixtureSchema.safeParse(readYaml(file));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `${rel(file)}: ${issue?.path.join('.') ?? ''} ${issue?.message ?? 'invalid fixture'}`,
    );
  }
  if (`${parsed.data.id}.yaml` !== basename(file)) {
    throw new Error(`${rel(file)}: fixture id "${parsed.data.id}" must match the file name.`);
  }
  return { file, fixture: parsed.data };
}

export function engineFixtureFiles(): string[] {
  const files: string[] = [];
  for (const engineId of listDirs(paths.engines)) {
    const opsDir = join(paths.engines, engineId, 'src', 'operations');
    for (const op of listDirs(opsDir))
      files.push(...listFiles(join(opsDir, op, 'fixtures'), '.yaml'));
  }
  return files;
}

/** Recursive subset comparison: every key in `expected` must equal the same key in `actual`. */
export function subsetMismatch(actual: unknown, expected: unknown, path = ''): string | null {
  if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      return `${path || '(root)'}: expected an object`;
    }
    for (const [key, value] of Object.entries(expected)) {
      const m = subsetMismatch(
        (actual as Record<string, unknown>)[key],
        value,
        path ? `${path}.${key}` : key,
      );
      if (m) return m;
    }
    return null;
  }
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  return same
    ? null
    : `${path || '(root)'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
}

/** Compares a result with a fixture's expectations. Returns null when the fixture passes. */
export function checkFixture(fixture: Fixture, result: Result<unknown>): string | null {
  if (fixture.expectedError) {
    if (result.ok) return `expected error ${fixture.expectedError.code}, got success`;
    if (result.error.code !== fixture.expectedError.code) {
      return `expected error ${fixture.expectedError.code}, got ${result.error.code}`;
    }
    if (
      fixture.expectedError.path !== undefined &&
      result.error.path !== fixture.expectedError.path
    ) {
      return `expected error path ${fixture.expectedError.path}, got ${String(result.error.path)}`;
    }
    return fixture.expectedError.details
      ? subsetMismatch(result.error.details ?? {}, fixture.expectedError.details, 'details')
      : null;
  }
  if (!result.ok)
    return `expected success, got error ${result.error.code} ${JSON.stringify(result.error.details ?? {})}`;
  const mismatch =
    fixture.match === 'exact'
      ? JSON.stringify(result.value) === JSON.stringify(fixture.expected)
        ? null
        : 'exact match failed'
      : subsetMismatch(result.value, fixture.expected);
  if (mismatch) return mismatch;
  const warnings = result.warnings.map((w) => w.code).sort();
  const expectedWarnings = [...(fixture.expectedWarnings ?? [])].sort();
  return JSON.stringify(warnings) === JSON.stringify(expectedWarnings)
    ? null
    : `expected warnings ${JSON.stringify(expectedWarnings)}, got ${JSON.stringify(warnings)}`;
}

export type FixtureContextFactory = () => OperationContext;
