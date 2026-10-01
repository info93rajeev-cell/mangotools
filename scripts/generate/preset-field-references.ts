import { type PresetField, type ResolvedPreset, unitValuesByFamily } from '@mangotools/schemas';
import { type Issue, issue } from './issues.ts';

function checkConversion(
  file: string,
  name: string,
  field: PresetField,
  preset: ResolvedPreset,
): Issue[] {
  if (!field.convert) return [];
  const { family, unitField: unitFieldName } = field.convert;
  const path = `fields.${name}.convert.unitField`;
  const unitField = preset.fields[unitFieldName];
  if (!unitField) {
    return [issue(file, `Conversion refers to unknown field "${unitFieldName}".`, { path })];
  }
  if (unitField.kind !== 'enum' || !unitField.options) {
    return [
      issue(file, `Conversion unit field "${unitFieldName}" must be an enum with options.`, {
        path,
      }),
    ];
  }
  const supported = new Set<string>(unitValuesByFamily[family]);
  return unitField.options
    .filter((option) => !supported.has(String(option.value)))
    .map((option) =>
      issue(file, `Unit "${String(option.value)}" is not supported by the ${family} converter.`, {
        path,
      }),
    );
}

function checkPresetFills(file: string, name: string, field: PresetField, preset: ResolvedPreset) {
  return (field.options ?? []).flatMap((option, optionIndex) =>
    Object.keys(option.sets ?? {})
      .filter((target) => !(target in preset.fields))
      .map((target) =>
        issue(file, `Preset fill refers to unknown field "${target}".`, {
          path: `fields.${name}.options.${optionIndex}.sets.${target}`,
        }),
      ),
  );
}

export function checkFieldReferences(file: string, preset: ResolvedPreset): Issue[] {
  return Object.entries(preset.fields).flatMap(([name, field]) => [
    ...checkConversion(file, name, field, preset),
    ...checkPresetFills(file, name, field, preset),
  ]);
}
