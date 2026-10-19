import { err, ok, type Result } from '@mangotools/core';
import { type FieldValues, sampleValues, type ToolRequest } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';

const TRAVERSE = 'survey.traverse.compute@1';
const LEVELING = 'survey.leveling.reduce@1';
const numeric = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i;
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function geometryNumber(raw: unknown, path: string): number {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text || numeric.exec(text)?.[0] !== text || !Number.isFinite(Number(text))) throw path;
  return Number(text);
}

function requestRows(rows: unknown[], field: string, traverse: boolean) {
  const measurements = traverse ? ['distanceM', 'azimuthDeg'] : ['bs', 'is', 'fs'];
  return rows.map((row, index) => {
    if (!object(row)) throw `${field}.${index}`;
    const entry: [string, unknown][] = [];
    for (const [key, value] of Object.entries(row)) {
      if (typeof value !== 'string') throw `${field}.${index}.${key}`;
      if (!value.trim() && measurements.includes(key)) continue;
      entry.push([
        key,
        traverse && measurements.includes(key)
          ? geometryNumber(value, `${field}.${index}.${key}`)
          : value,
      ]);
    }
    return Object.fromEntries(entry);
  });
}

function levelingScalars(values: Readonly<FieldValues>) {
  const input: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const key of ['startRL', 'closingRL']) {
    const text = String(values[key] ?? '');
    if (text.trim()) input[key] = text;
    else if (key === 'startRL') missing.push(key);
  }
  return { input, missing };
}

/** UI text only: preserve every row/index and leave domain validation to Survey. */
export function prepareSurveyRequest(
  preset: ResolvedPreset,
  values: Readonly<FieldValues>,
): Result<ToolRequest> {
  if (![TRAVERSE, LEVELING].includes(preset.operation)) return err('INVALID_INPUT');
  const traverse = preset.operation === TRAVERSE;
  const field = traverse ? 'legs' : 'observations';
  let rows: unknown;
  try {
    rows = JSON.parse(String(values[field] ?? '[]'));
  } catch {
    return err('INVALID_INPUT', { path: field });
  }
  if (!Array.isArray(rows)) return err('INVALID_INPUT', { path: field });
  const { input, missing }: Pick<ToolRequest, 'input' | 'missing'> = traverse
    ? { input: {}, missing: [] }
    : levelingScalars(values);
  try {
    if (traverse)
      input.start = {
        northingM: geometryNumber(values.startNorthingM, 'start.northingM'),
        eastingM: geometryNumber(values.startEastingM, 'start.eastingM'),
      };
    input[field] = requestRows(rows, field, traverse);
  } catch (path) {
    return err('INVALID_INPUT', { path: String(path) });
  }
  return ok({ input, params: { ...preset.params }, missing });
}

/** Canonical engine samples become editable primitive row strings, never UI metadata in input. */
export function surveySampleValues(preset: ResolvedPreset, id: string): FieldValues | null {
  if (![TRAVERSE, LEVELING].includes(preset.operation)) return null;
  const values = sampleValues(preset, id);
  if (!values) return null;
  const input = preset.samples[id]?.input ?? {};
  delete values.start;
  for (const [key, value] of Object.entries(input)) {
    if (key === 'start' && object(value)) {
      values.startNorthingM = String(value.northingM);
      values.startEastingM = String(value.eastingM);
    } else if (Array.isArray(value)) {
      values[key] = JSON.stringify(
        value.map((row) =>
          Object.fromEntries(Object.entries(row).map(([column, cell]) => [column, String(cell)])),
        ),
      );
    } else values[key] = String(value);
  }
  return values;
}

export function surveyErrorField(path = ''): string {
  return path === 'start.northingM'
    ? 'startNorthingM'
    : path === 'start.eastingM'
      ? 'startEastingM'
      : (path.split('.')[0] ?? '');
}
