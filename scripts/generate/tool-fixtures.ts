import { basename } from 'node:path';
import { type AnyOperation, createTestContext, executeOperation } from '@mangotools/core';
import { type Fixture, fixtureSchema, type ResolvedPreset } from '@mangotools/schemas';
import { checkFixture } from '../lib/fixtures.ts';
import { type Issue, issue, zodIssues } from './issues.ts';
import { findTodos, type LoadedTool } from './manifests.ts';
import { collectWorkingSteps, type FormulaUse } from './preset-checks.ts';
import type { SourceFile } from './sources.ts';

export interface FixtureRun {
  fixture: Fixture;
  params: Record<string, unknown>;
  value: unknown;
}

/** Minimum tool fixtures per tier (playbook: T1 ≥ 3, T2 ≥ 2, T3/T4 ≥ 1). */
export const MIN_FIXTURES = { T1: 3, T2: 2, T3: 1, T4: 1 } as const;

type OneRun = { issues: Issue[]; run?: FixtureRun };
export type FixtureBinding = { preset: ResolvedPreset; op: AnyOperation };
export type ResolveFixtureBinding = (presetId: string) => FixtureBinding | undefined;

async function runOne(
  source: SourceFile,
  tool: LoadedTool,
  preset: ResolvedPreset,
  op: AnyOperation,
  resolveBinding: ResolveFixtureBinding,
): Promise<OneRun> {
  const parsed = fixtureSchema.safeParse(source.data);
  if (!parsed.success) return { issues: zodIssues(source.file, parsed.error) };
  const fixture = parsed.data;
  const issues: Issue[] = findTodos(source.data).map((path) =>
    issue(source.file, 'Placeholder text left by the scaffolder.', {
      path,
      hint: 'Verify the values by hand and cite the source.',
    }),
  );
  if (`${fixture.id}.yaml` !== basename(source.file)) {
    issues.push(
      issue(source.file, `Fixture id "${fixture.id}" must match the file name.`, { path: 'id' }),
    );
  }
  if (!fixture.preset) {
    issues.push(issue(source.file, 'Tool fixtures must declare a preset.', { path: 'preset' }));
    return { issues };
  }
  const active = fixture.preset === tool.manifest.preset;
  const binding = active ? { preset, op } : resolveBinding(fixture.preset);
  if (!binding) {
    issues.push(
      issue(source.file, `Fixture refers to unknown or unavailable preset "${fixture.preset}".`, {
        path: 'preset',
      }),
    );
    return { issues };
  }
  const params = { ...binding.preset.params, ...(fixture.params ?? {}) };
  const result = await executeOperation(binding.op, fixture.input, params, createTestContext());
  const mismatch = checkFixture(fixture, result);
  if (mismatch) {
    const hint =
      'Fixtures are truth — fix the engine or report the fixture, never edit expected values to pass.';
    issues.push(issue(source.file, `Fixture fails: ${mismatch}`, { hint }));
    return { issues };
  }
  return {
    issues,
    ...(active && result.ok ? { run: { fixture, params, value: result.value } } : {}),
  };
}

/** Validates a tool's fixtures and runs each one through its preset and operation. */
export async function runToolFixtures(
  tool: LoadedTool,
  preset: ResolvedPreset,
  op: AnyOperation,
  resolveBinding: ResolveFixtureBinding,
) {
  const issues: Issue[] = [];
  const runs = new Map<string, FixtureRun>();
  const formulaKeys: FormulaUse = new Map();
  if (tool.source.fixtures.length === 0) {
    issues.push(
      issue(`tools/${tool.source.folder}/fixtures`, 'Every tool needs at least one fixture.'),
    );
  }
  for (const source of tool.source.fixtures.filter((f) => f.data !== undefined)) {
    const one = await runOne(source, tool, preset, op, resolveBinding);
    issues.push(...one.issues);
    if (!one.run) continue;
    runs.set(one.run.fixture.id, one.run);
    collectWorkingSteps(one.run.value, formulaKeys);
  }
  return { runs, issues, formulaKeys };
}
