import type { PresetField, ResolvedPreset } from '@mangotools/schemas';
import { isShown } from '@mangotools/schemas/conditions';

/** A value as held by a tool form: text as typed, option values as strings, switches as booleans. */
export type FieldValue = string | boolean;
export type FieldValues = Record<string, FieldValue>;

const NUMERIC_KINDS = new Set<PresetField['kind']>([
  'money',
  'number',
  'percent',
  'enum-or-number',
]);

/** Removes grouping and symbols people type ("₹1,00,000", "18 %") before the engine parses it. */
export function normalizeNumberText(raw: string): string {
  return raw.replace(/[\s,_₹%]/g, '');
}

function fieldDefault(field: PresetField): string {
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
  for (const [key, v] of Object.entries({ ...(sample.params ?? {}), ...sample.input })) {
    values[key] = typeof v === 'boolean' ? v : String(v);
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

/** Turns form values into the operation's input and params. Hidden fields are left out. */
export function buildRequest(preset: ResolvedPreset, values: FieldValues): ToolRequest {
  const params = optionParams(preset, values);
  const state = { ...params, ...values };
  const input: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const [key, field] of Object.entries(preset.fields)) {
    if (!isShown(field, state)) continue;
    const value = fieldText(field, values[key]);
    if (value.trim() !== '') input[key] = value;
    else if (mustChoose(field)) missing.push(key);
  }
  return { input, params, missing };
}
