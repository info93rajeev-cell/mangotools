import type { PresetField, ResolvedPreset } from '@mangotools/schemas';
import { isShown } from '@mangotools/schemas/conditions';
import { normalizeNumberText } from './number-text.ts';
import { initialRows, parseRows, rowsRequest, serializeRows } from './rows.ts';

/** A value as held by a tool form: text as typed, option values as strings, switches as booleans. */
export type FieldValue = string | boolean;
export type FieldValues = Record<string, FieldValue>;

const NUMERIC_KINDS = new Set<PresetField['kind']>([
  'money',
  'number',
  'percent',
  'enum-or-number',
]);

export { normalizeNumberText };

function fieldDefault(field: PresetField): string {
  if (field.rows) return serializeRows(field.rows, initialRows(field.rows));
  if (field.default !== undefined) return String(field.default);
  if (field.kind === 'enum' && field.options?.[0]) return String(field.options[0].value);
  return '';
}

/** Initial form values: option values from preset params, field defaults, empty text. */
export function defaultValues(preset: ResolvedPreset): FieldValues {
  const values: FieldValues = {};
  for (const [key, option] of Object.entries(preset.userOptions)) {
    const v = preset.params[key];
    values[key] = option.control === 'switch' ? v === true : String(v ?? '');
  }
  for (const [key, field] of Object.entries(preset.fields)) values[key] = fieldDefault(field);
  return values;
}

/** Form values for a sample: defaults overlaid with the sample's input and params. */
export function sampleValues(preset: ResolvedPreset, sampleId: string): FieldValues | null {
  const sample = preset.samples[sampleId];
  if (!sample) return null;
  const values = defaultValues(preset);
  const sampleState = { ...(sample.params ?? {}), ...sample.input, ...(sample.uiState ?? {}) };
  for (const [key, v] of Object.entries(sampleState)) {
    // A sample field is almost always a scalar written as-is in YAML; the one exception is a
    // structured field authored as a native array/object (e.g. the invoice's item rows), which a
    // form field can only hold as a string, so it is JSON-encoded exactly like the browser would.
    values[key] =
      typeof v === 'boolean'
        ? v
        : typeof v === 'object' && v !== null
          ? JSON.stringify(v)
          : String(v);
  }
  return values;
}

export interface ToolRequest {
  input: Record<string, unknown>;
  params: Record<string, unknown>;
  /** Required, visible fields that are still empty; nothing runs until this is empty. */
  missing: string[];
}

function optionParams(preset: ResolvedPreset, values: FieldValues): Record<string, unknown> {
  const params: Record<string, unknown> = { ...preset.params };
  for (const key of Object.keys(preset.userOptions)) {
    if (!preset.locked.includes(key) && key in values) params[key] = values[key];
  }
  return params;
}

/** The text sent to the engine for one field ('' when empty). */
function fieldText(field: PresetField, raw: FieldValue | undefined): string {
  const text = typeof raw === 'string' ? raw : '';
  return NUMERIC_KINDS.has(field.kind) ? normalizeNumberText(text) : text;
}

const mustChoose = (field: PresetField) =>
  field.required === true || field.kind === 'enum' || field.kind === 'enum-or-number';

/** The value sent to the engine for one field, or null when it is empty. */
function fieldInput(field: PresetField, raw: FieldValue | undefined): unknown {
  const text = fieldText(field, raw);
  if (field.rows) {
    const rows = rowsRequest(field.rows, parseRows(field.rows, text));
    return rows.length > 0 ? rows : null;
  }
  return text.trim() !== '' ? text : null;
}

const mustFill = (field: PresetField) => (field.rows ? field.required === true : mustChoose(field));

/** Turns form values into the operation's input and params. Hidden fields are left out. */
export function buildRequest(preset: ResolvedPreset, values: FieldValues): ToolRequest {
  const params = optionParams(preset, values);
  const state = { ...params, ...values };
  const input: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const [key, field] of Object.entries(preset.fields)) {
    if (field.uiOnly === true || !isShown(field, state)) continue;
    const value = fieldInput(field, values[key]);
    if (value !== null) input[key] = value;
    else if (mustFill(field)) missing.push(key);
  }
  return { input, params, missing };
}

/**
 * Form values for previously saved values (for example a user preset): defaults overlaid with each
 * saved value whose key is a field or option of this preset and whose type fits it. Unknown keys and
 * wrongly typed values are ignored, so stale or tampered data can never reach the engine unchecked.
 */
export function restoreValues(
  preset: ResolvedPreset,
  saved: Readonly<Record<string, unknown>>,
): FieldValues {
  const values = defaultValues(preset);
  for (const [key, current] of Object.entries(values)) {
    const v = saved[key];
    if (typeof v === typeof current) values[key] = v as FieldValue;
  }
  return values;
}
