import {
  type AnyOperation,
  createTestContext,
  type EngineModule,
  executeOperation,
  PLATFORM_MESSAGES,
  parseOperationRef,
} from '@mangotools/core';
import type { Conditions, Preset, ResolvedPreset } from '@mangotools/schemas';
import { type Issue, issue } from './issues.ts';

const shapeKeys = (schema: unknown): Set<string> | null => {
  const shape = (schema as { shape?: Record<string, unknown> }).shape;
  return shape ? new Set(Object.keys(shape)) : null;
};

export function toResolvedPreset(preset: Preset, engine: EngineModule): ResolvedPreset {
  const operation = preset.operation ?? '';
  return {
    id: preset.id,
    version: preset.version,
    operation,
    engineId: parseOperationRef(operation).engineId,
    params: preset.params ?? {},
    locked: preset.locked ?? [],
    userOptions: preset.userOptions ?? {},
    fields: preset.fields ?? {},
    outputs: preset.outputs ?? {},
    samples: preset.samples ?? {},
    ui: preset.ui ?? { archetypes: ['A'] },
    strings: preset.strings?.en ?? {},
    messages: { ...PLATFORM_MESSAGES, ...engine.messages },
  };
}

/** Every string key the preset references, with the data path that references it. */
export function referencedStringKeys(p: ResolvedPreset): { key: string; path: string }[] {
  const refs: { key: string; path: string }[] = [];
  const add = (key: string | undefined, path: string) => {
    if (key) refs.push({ key, path });
  };
  for (const [name, o] of Object.entries(p.userOptions)) {
    add(o.labelKey, `userOptions.${name}.labelKey`);
    for (const [value, v] of Object.entries(o.values ?? {})) {
      add(v.labelKey, `userOptions.${name}.values.${value}.labelKey`);
    }
  }
  for (const [name, f] of Object.entries(p.fields)) {
    add(f.labelKey, `fields.${name}.labelKey`);
    add(f.helpKey, `fields.${name}.helpKey`);
    add(f.placeholderKey, `fields.${name}.placeholderKey`);
    f.options?.forEach((o, i) => {
      add(o.labelKey, `fields.${name}.options.${i}.labelKey`);
    });
  }
  for (const [name, o] of Object.entries(p.outputs)) add(o.labelKey, `outputs.${name}.labelKey`);
  for (const [name, s] of Object.entries(p.samples)) add(s.titleKey, `samples.${name}.titleKey`);
  return refs;
}

/** Values a condition may test for each controllable key (null = any value). */
function conditionDomain(
  p: ResolvedPreset,
  paramKeys: Set<string>,
): Map<string, Set<string> | null> {
  const domain = new Map<string, Set<string> | null>();
  for (const key of paramKeys) domain.set(key, null);
  for (const [name, o] of Object.entries(p.userOptions)) {
    const values = o.control === 'switch' ? ['true', 'false'] : Object.keys(o.values ?? {});
    domain.set(name, new Set(values));
  }
  for (const [name, f] of Object.entries(p.fields)) {
    domain.set(
      name,
      f.options && !f.allowCustom ? new Set(f.options.map((o) => String(o.value))) : null,
    );
  }
  return domain;
}

function checkConditions(
  file: string,
  path: string,
  conditions: Conditions | undefined,
  domain: Map<string, Set<string> | null>,
): Issue[] {
  const issues: Issue[] = [];
  for (const [key, values] of Object.entries(conditions ?? {})) {
    if (!domain.has(key)) {
      issues.push(issue(file, `Condition refers to unknown field or option "${key}".`, { path }));
      continue;
    }
    const allowed = domain.get(key);
    for (const v of values) {
      if (allowed && !allowed.has(v)) {
        issues.push(issue(file, `"${v}" is not a value of "${key}".`, { path: `${path}.${key}` }));
      }
    }
  }
  return issues;
}

function checkUserOptions(
  file: string,
  p: ResolvedPreset,
  op: AnyOperation,
  paramKeys: Set<string> | null,
) {
  const issues: Issue[] = [];
  for (const [name, o] of Object.entries(p.userOptions)) {
    const path = `userOptions.${name}`;
    if (paramKeys && !paramKeys.has(name)) {
      issues.push(issue(file, `"${name}" is not a parameter of ${p.operation}.`, { path }));
      continue;
    }
    if (p.locked.includes(name)) issues.push(issue(file, `"${name}" is locked.`, { path }));
    const candidates: unknown[] =
      o.control === 'switch' ? [true, false] : Object.keys(o.values ?? {});
    for (const value of candidates) {
      if (!op.params.safeParse({ ...p.params, [name]: value }).success) {
        issues.push(
          issue(file, `Value "${String(value)}" is rejected by ${p.operation}.`, { path }),
        );
      }
    }
  }
  return issues;
}

function checkParams(file: string, p: ResolvedPreset, op: AnyOperation): Issue[] {
  const issues: Issue[] = [];
  const params = op.params.safeParse(p.params);
  if (!params.success) {
    for (const i of params.error.issues) {
      const path = ['params', ...i.path.map(String)].join('.');
      issues.push(issue(file, `Rejected by ${p.operation}: ${i.message}`, { path }));
    }
  }
  for (const key of p.locked) {
    if (!(key in p.params)) {
      issues.push(issue(file, `Locked key "${key}" has no value in params.`, { path: 'locked' }));
    }
  }
  return issues;
}

function checkKeys(
  file: string,
  group: 'fields' | 'outputs',
  names: string[],
  allowed: Set<string> | null,
  what: string,
): Issue[] {
  if (!allowed) return [];
  return names
    .filter((name) => !allowed.has(name))
    .map((name) => issue(file, `"${name}" is not ${what}.`, { path: `${group}.${name}` }));
}

function checkAllConditions(
  file: string,
  p: ResolvedPreset,
  domain: Map<string, Set<string> | null>,
): Issue[] {
  const issues: Issue[] = [];
  const entries = [
    ...Object.entries(p.userOptions).map(
      ([n, e]) => [`userOptions.${n}`, e.visibleWhen, undefined] as const,
    ),
    ...Object.entries(p.fields).map(([n, e]) => [`fields.${n}`, e.visibleWhen, undefined] as const),
    ...Object.entries(p.outputs).map(
      ([n, e]) => [`outputs.${n}`, e.visibleWhen, e.primaryWhen] as const,
    ),
  ];
  for (const [base, visibleWhen, primaryWhen] of entries) {
    issues.push(...checkConditions(file, `${base}.visibleWhen`, visibleWhen, domain));
    issues.push(...checkConditions(file, `${base}.primaryWhen`, primaryWhen, domain));
  }
  return issues;
}

function checkStrings(file: string, p: ResolvedPreset): Issue[] {
  return referencedStringKeys(p)
    .filter((ref) => !(ref.key in p.strings))
    .map((ref) =>
      issue(file, `Missing string "${ref.key}".`, {
        path: ref.path,
        hint: `Add strings.en.${ref.key}`,
      }),
    );
}

/** Static checks of a resolved preset against its operation. */
export function checkPresetAgainstOperation(
  file: string,
  p: ResolvedPreset,
  op: AnyOperation,
): Issue[] {
  const paramKeys = shapeKeys(op.params);
  return [
    ...checkParams(file, p, op),
    ...checkUserOptions(file, p, op, paramKeys),
    ...checkKeys(
      file,
      'fields',
      Object.keys(p.fields),
      shapeKeys(op.input),
      `an input of ${p.operation}`,
    ),
    ...checkKeys(
      file,
      'outputs',
      Object.keys(p.outputs),
      shapeKeys(op.output),
      `an output of ${p.operation}`,
    ),
    ...checkAllConditions(file, p, conditionDomain(p, paramKeys ?? new Set())),
    ...checkStrings(file, p),
  ];
}

/** Collects formula keys from an operation result's `working` steps, if it has any. */
export function formulaKeysOf(value: unknown): string[] {
  const working = (value as { working?: { formulaKey?: unknown }[] } | null)?.working;
  if (!Array.isArray(working)) return [];
  return working.map((w) => w.formulaKey).filter((k): k is string => typeof k === 'string');
}

/** Runs every sample through the real operation. */
export async function runSamples(file: string, p: ResolvedPreset, op: AnyOperation) {
  const issues: Issue[] = [];
  const formulaKeys = new Set<string>();
  for (const [name, sample] of Object.entries(p.samples)) {
    const params = { ...p.params, ...(sample.params ?? {}) };
    const result = await executeOperation(op, sample.input, params, createTestContext());
    if (!result.ok) {
      issues.push(
        issue(
          file,
          `Sample "${name}" fails with ${result.error.code}${result.error.path ? ` at ${result.error.path}` : ''}.`,
          {
            path: `samples.${name}`,
          },
        ),
      );
      continue;
    }
    for (const key of formulaKeysOf(result.value)) formulaKeys.add(key);
  }
  return { issues, formulaKeys };
}
