import type { OpError } from '@mangotools/core';
import type { FieldValues } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { isShown, matchesConditions } from '@mangotools/schemas/conditions';
import { type Currency, formatValue, type ValueFormat } from '../format/numbers.ts';

/** Preset text by key, falling back to the key itself so gaps are visible, never blank. */
export const label = (preset: ResolvedPreset, key: string | undefined): string =>
  key ? (preset.strings[key] ?? key) : '';

/** Fills {placeholders} in an engine message with the error's details. */
export function messageFor(
  preset: ResolvedPreset,
  error: Pick<OpError, 'code' | 'details'>,
): string {
  const template = preset.messages[error.code] ?? preset.messages.INTERNAL_ERROR ?? error.code;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = error.details?.[name];
    return value === undefined ? match : String(value);
  });
}

/** The currency of the preset's money fields (only INR in Phase 1). */
export function presetCurrency(preset: ResolvedPreset): Currency | undefined {
  return Object.values(preset.fields).some((f) => f.currency === 'INR') ? 'INR' : undefined;
}

/** Visible, ordered entries of a preset map for the current state. */
export function visibleEntries<
  T extends { order?: number; visible?: boolean; visibleWhen?: Record<string, string[]> },
>(entries: Record<string, T>, state: FieldValues): [string, T][] {
  return Object.entries(entries)
    .filter(([, entry]) => isShown(entry, state))
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
}

export interface OutputRow {
  key: string;
  label: string;
  value: string;
  format: ValueFormat;
  primary: boolean;
}

/** Outputs to show for a result: visible, non-empty, formatted, with the primary one first. */
export function outputRows(
  preset: ResolvedPreset,
  value: Record<string, unknown>,
  state: FieldValues,
): OutputRow[] {
  const currency = presetCurrency(preset);
  const rows = visibleEntries(preset.outputs, state)
    .filter(([key]) => value[key] !== null && value[key] !== undefined && value[key] !== '')
    .map(([key, out]) => ({
      key,
      label: label(preset, out.labelKey),
      value: formatValue(out.format, String(value[key]), { currency }),
      format: out.format,
      primary:
        out.primary === true ||
        (out.primaryWhen ? matchesConditions(out.primaryWhen, state) : false),
    }));
  const primary = rows.findIndex((r) => r.primary);
  if (primary > 0) rows.unshift(...rows.splice(primary, 1));
  return rows;
}

/** Option values shown for a user option in the current state. */
export function visibleOptionValues(
  preset: ResolvedPreset,
  key: string,
  state: FieldValues,
): [string, string][] {
  const option = preset.userOptions[key];
  return Object.entries(option?.values ?? {})
    .filter(([, v]) => matchesConditions(v.visibleWhen, state))
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    .map(([value, v]) => [value, label(preset, v.labelKey)]);
}

/** After an option changes, moves any option whose value became hidden to its first visible value. */
export function reconcileOptions(preset: ResolvedPreset, values: FieldValues): FieldValues {
  const next = { ...values };
  for (const [key, option] of Object.entries(preset.userOptions)) {
    if (option.control === 'switch' || !option.values) continue;
    const visible = visibleOptionValues(preset, key, next).map(([v]) => v);
    if (visible.length > 0 && !visible.includes(String(next[key]))) next[key] = visible[0] ?? '';
  }
  return next;
}

/** Line and column (1-based) of a string offset. */
export function lineColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, offset));
  const lines = before.split('\n');
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}
