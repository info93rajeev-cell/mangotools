import type { FieldValues } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { convertUnitText } from '../format/units.ts';
import { convertOpeningsText } from './openingRows.ts';

/**
 * Form-level effects of one field edit, applied before the store sees the new values:
 * 1. a unit selector converts every value measured in that unit (never just relabels it);
 * 2. a preset picker (an option with `sets`) fills its fields as an editable starting point;
 * 3. editing a field a preset filled switches that picker back to its "custom" option.
 */
export function applyFieldEdit(
  preset: ResolvedPreset,
  values: FieldValues,
  key: string,
  next: string,
): FieldValues {
  const out: FieldValues = { ...values, [key]: next };
  const previous = String(values[key] ?? '');
  convertDependents(preset, out, key, previous, next);
  applyPresetChoice(preset, out, key, next);
  releasePresetPickers(preset, out, key);
  return out;
}

function convertDependents(
  preset: ResolvedPreset,
  out: FieldValues,
  unitKey: string,
  from: string,
  to: string,
) {
  if (from === to) return;
  for (const [key, field] of Object.entries(preset.fields)) {
    if (field.convert?.unitField !== unitKey) continue;
    const text = String(out[key] ?? '');
    out[key] =
      field.kind === 'openings'
        ? convertOpeningsText(text, from, to)
        : convertUnitText(text, field.convert.family, from, to);
  }
}

function applyPresetChoice(preset: ResolvedPreset, out: FieldValues, key: string, next: string) {
  const option = preset.fields[key]?.options?.find((o) => String(o.value) === next);
  for (const [target, value] of Object.entries(option?.sets ?? {})) out[target] = String(value);
}

function releasePresetPickers(preset: ResolvedPreset, out: FieldValues, key: string) {
  for (const [pickerKey, picker] of Object.entries(preset.fields)) {
    if (pickerKey === key || !picker.options?.some((o) => o.sets)) continue;
    const chosen = picker.options.find((o) => String(o.value) === String(out[pickerKey]));
    if (!chosen?.sets || !(key in chosen.sets)) continue;
    if (String(chosen.sets[key]) === String(out[key])) continue;
    const custom = picker.options.find((o) => !o.sets);
    if (custom) out[pickerKey] = String(custom.value);
  }
}
