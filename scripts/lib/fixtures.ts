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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** Recursive subset comparison: every key in `expected` must equal the same key in `actual`. */
export function subsetMismatch(actual: unknown, expected: unknown, path = ''): string | null {
  const where = path || '(root)';
  if (!isRecord(expected)) {
    const same = JSON.stringify(actual) === JSON.stringify(expected);
    return same
      ? null
      : `${where}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
  }
  if (!isRecord(actual)) return `${where}: expected an object`;
  for (const [key, value] of Object.entries(expected)) {
    const mismatch = subsetMismatch(actual[key], value, path ? `${path}.${key}` : key);
    if (mismatch) return mismatch;
  }
  return null;
}

function checkExpectedError(
  expected: NonNullable<Fixture['expectedError']>,
  result: Result<unknown>,
): string | null {
  if (result.ok) return `expected error ${expected.code}, got success`;
  if (result.error.code !== expected.code)
    return `expected error ${expected.code}, got ${result.error.code}`;
  if (expected.path !== undefined && result.error.path !== expected.path) {
    return `expected error path ${expected.path}, got ${String(result.error.path)}`;
  }
  return expected.details
    ? subsetMismatch(result.error.details ?? {}, expected.details, 'details')
    : null;
}

function checkWarnings(fixture: Fixture, codes: string[]): string | null {
  const actual = JSON.stringify([...codes].sort());
  const expected = JSON.stringify([...(fixture.expectedWarnings ?? [])].sort());
  return actual === expected ? null : `expected warnings ${expected}, got ${actual}`;
}

/** Compares a result with a fixture's expectations. Returns null when the fixture passes. */
export function checkFixture(fixture: Fixture, result: Result<unknown>): string | null {
  if (fixture.expectedError) return checkExpectedError(fixture.expectedError, result);
  if (!result.ok) {
    return `expected success, got error ${result.error.code} ${JSON.stringify(result.error.details ?? {})}`;
  }
  const exact = JSON.stringify(result.value) === JSON.stringify(fixture.expected);
  const mismatch =
    fixture.match === 'exact'
      ? exact
        ? null
        : 'exact match failed'
      : subsetMismatch(result.value, fixture.expected);
  return (
    mismatch ??
    checkWarnings(
      fixture,
      result.warnings.map((w) => w.code),
    )
  );
}

export type FixtureContextFactory = () => OperationContext;
