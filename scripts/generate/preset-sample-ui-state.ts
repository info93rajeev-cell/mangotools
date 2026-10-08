import type { PresetField, ResolvedPreset } from '@mangotools/schemas';
import { type Issue, issue } from './issues.ts';

type UiStateValue = string | number | boolean;

const DECIMAL_TEXT = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
const numericKinds = new Set<PresetField['kind']>(['money', 'number', 'percent']);

const isDecimal = (value: UiStateValue) =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && DECIMAL_TEXT.test(value.trim()));

const matchesOption = (field: PresetField, value: UiStateValue) =>
  field.options?.some((option) => String(option.value) === String(value)) === true;

function enumProblem(field: PresetField, value: UiStateValue): string | null {
  if (typeof value === 'boolean') return 'must be an enum value.';
  return field.options && !matchesOption(field, value)
    ? `has unsupported option "${String(value)}".`
    : null;
}

function enumOrNumberProblem(field: PresetField, value: UiStateValue): string | null {
  if (typeof value === 'boolean') return 'must be an enum option or decimal number.';
  if (matchesOption(field, value)) return null;
  if (!field.allowCustom) return `has unsupported option "${String(value)}".`;
  return isDecimal(value) ? null : 'must be an enum option or decimal number.';
}

function valueProblem(field: PresetField, value: UiStateValue): string | null {
  if (field.kind === 'boolean') return typeof value === 'boolean' ? null : 'must be a boolean.';
  if (field.kind === 'enum') return enumProblem(field, value);
  if (field.kind === 'enum-or-number') return enumOrNumberProblem(field, value);
  if (numericKinds.has(field.kind)) return isDecimal(value) ? null : 'must be a decimal number.';
  return typeof value === 'string' ? null : 'must be text.';
}

/** Validates sample UI state against the resolved preset fields it may initialise. */
export function checkSampleUiState(file: string, preset: ResolvedPreset): Issue[] {
  const issues: Issue[] = [];
  for (const [sampleId, sample] of Object.entries(preset.samples)) {
    for (const [key, value] of Object.entries(sample.uiState ?? {})) {
      const path = `samples.${sampleId}.uiState.${key}`;
      const field = preset.fields[key];
      if (!field) {
        issues.push(issue(file, `UI state refers to unknown field "${key}".`, { path }));
        continue;
      }
      if (field.uiOnly !== true) {
        issues.push(issue(file, `UI state field "${key}" is not marked uiOnly.`, { path }));
        continue;
      }
      const problem = valueProblem(field, value);
      if (problem) issues.push(issue(file, `UI state value for "${key}" ${problem}`, { path }));
    }
  }
  return issues;
}
