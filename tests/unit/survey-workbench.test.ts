import { readFileSync } from 'node:fs';
import { createTestContext, executeOperation } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { defaultValues } from '../../packages/runtime/src/index.ts';
import {
  prepareSurveyRequest,
  surveyErrorField,
  surveySampleValues,
} from '../../packages/ui/src/toolkit/surveyWorkbench.ts';
import { checkFixture } from '../../scripts/lib/fixtures.ts';
import { loadUnpublishedEngine, unpublishedFixtures } from '../support/unpublished-fixtures.ts';

const base: ResolvedPreset = JSON.parse(
  readFileSync(new URL('../../generated/presets/estimate/gst.india.json', import.meta.url), 'utf8'),
);
const LEVELING = 'survey.leveling.reduce@1';
const TRAVERSE = 'survey.traverse.compute@1';
function preset(
  operation = LEVELING,
  input: Record<string, unknown> = {},
  params = {},
): ResolvedPreset {
  return {
    ...base,
    operation,
    params,
    userOptions: {},
    fields: {
      startRL: { kind: 'text', labelKey: 'start', order: 0 },
      showWorking: {
        kind: 'boolean',
        uiOnly: true,
        labelKey: 'working',
        default: 'false',
        order: 1,
      },
    },
    samples: { example: { titleKey: 'example', input, uiState: { showWorking: true } } },
  };
}
const leveling = preset(LEVELING, {
  startRL: '100.000000',
  observations: [
    { station: '001', bs: '1.500000', remarks: '  original  ' },
    { station: '002', fs: '1.250000' },
  ],
});
const traverse = preset(TRAVERSE, {
  start: { northingM: 0, eastingM: -200 },
  legs: [
    { from: 'A', to: 'B', distanceM: 12.3456789, azimuthDeg: 90 },
    { from: 'B', to: 'A', distanceM: 12.3456789, azimuthDeg: 270 },
  ],
});
function sample(p: ResolvedPreset) {
  const values = surveySampleValues(p, 'example');
  if (!values) throw new Error('Missing sample');
  return values;
}

describe('bounded Survey UI bindings', () => {
  it.each([leveling, traverse])(
    'round-trips real boundary types without mutating state: $operation',
    (p) => {
      const values = Object.freeze(sample(p));
      const before = JSON.stringify(values);
      expect(prepareSurveyRequest(p, values)).toMatchObject({
        ok: true,
        value: {
          input: p.samples.example?.input,
          params: {},
          missing: [],
        },
      });
      expect(values.showWorking).toBe(true);
      expect(JSON.stringify(values)).toBe(before);
      expect(defaultValues(p).showWorking).toBe('false');
      expect(surveySampleValues(p, 'missing')).toBeNull();
    },
  );
  it('preserves blank row indices and zero while omitting absent readings, not opaque text', () => {
    const values = {
      startRL: '0',
      closingRL: '',
      observations: JSON.stringify([
        { station: ' ', remarks: '', bs: '0', is: '', fs: '' },
        {},
        { fs: '2' },
      ]),
    };
    expect(prepareSurveyRequest(leveling, values)).toMatchObject({
      ok: true,
      value: {
        input: {
          startRL: '0',
          observations: [{ station: ' ', remarks: '', bs: '0' }, {}, { fs: '2' }],
        },
      },
    });
    expect(prepareSurveyRequest(leveling, { ...values, startRL: '' })).toMatchObject({
      value: { missing: ['startRL'] },
    });
  });
  it.each(['', '0x10', 'Infinity', 'NaN', '1.2bad', '1e999'])(
    'rejects invalid numeric text %j',
    (value) => {
      expect(
        prepareSurveyRequest(traverse, { ...sample(traverse), startNorthingM: value }),
      ).toMatchObject({ ok: false, error: { path: 'start.northingM' } });
    },
  );
  it('keeps malformed rows and cells as indexed errors rather than dropping/coercing them', () => {
    for (const [text, path] of [
      ['bad', 'legs'],
      ['{}', 'legs'],
      ['[null]', 'legs.0'],
      ['[{"distanceM":true}]', 'legs.0.distanceM'],
      ['[{"distanceM":"NaN"}]', 'legs.0.distanceM'],
    ]) {
      expect(
        prepareSurveyRequest(traverse, { ...sample(traverse), legs: text ?? '' }),
      ).toMatchObject({ ok: false, error: { path } });
    }
  });
  it('does not select these bindings for an unrelated operation', () => {
    expect(prepareSurveyRequest(base, {})).toMatchObject({ ok: false });
    expect(surveySampleValues(base, 'example')).toBeNull();
  });
  it('leaves row limits and unknown-key rejection to the unchanged strict engine', () => {
    const rows = Array.from({ length: 51 }, () => ({ bs: '', unexpected: '' }));
    const prepared = prepareSurveyRequest(leveling, {
      startRL: '0',
      observations: JSON.stringify(rows),
    });
    expect(prepared).toMatchObject({ ok: true });
    if (!prepared.ok) throw new Error('Expected canonical rows');
    expect(prepared.value.input.observations).toEqual(rows.map(() => ({ unexpected: '' })));
    expect(surveySampleValues(leveling, 'example')).not.toHaveProperty('start');
  });
  it('preserves special unknown JSON keys for strict engine rejection', async () => {
    const values = {
      ...sample(leveling),
      observations: '[{"bs":"1","__proto__":"unknown"},{"fs":"1"}]',
    };
    const prepared = prepareSurveyRequest(leveling, values);
    if (!prepared.ok) throw new Error('Expected request');
    expect(prepared.value.input.observations).toEqual(JSON.parse(values.observations));
    const engine = await loadUnpublishedEngine({
      packageName: '@mangotools/engine-survey',
      directory: 'engines/survey',
      operation: LEVELING,
    });
    const descriptor = engine.operations.find((op) => op.id === 'survey.leveling.reduce');
    if (!descriptor) throw new Error('Missing operation');
    expect(
      (
        await executeOperation(
          descriptor,
          prepared.value.input,
          prepared.value.params,
          createTestContext(),
        )
      ).ok,
    ).toBe(false);
  });
  it.each([
    ['start.northingM', 'startNorthingM'],
    ['start.eastingM', 'startEastingM'],
    ['observations.2.fs', 'observations'],
    ['legs.1.distanceM', 'legs'],
    ['', ''],
  ])('maps %s to its actual form field', (path, field) =>
    expect(surveyErrorField(path)).toBe(field),
  );
});

describe('immutable professional Survey fixture round-trip', () => {
  it.each([LEVELING, TRAVERSE])(
    'retains canonical requests and engine results: %s',
    async (operation) => {
      const engine = await loadUnpublishedEngine({
        packageName: '@mangotools/engine-survey',
        directory: 'engines/survey',
        operation,
      });
      const descriptor = engine.operations.find((op) => `${op.id}@${op.major}` === operation);
      if (!descriptor) throw new Error('Missing public operation');
      const fixtures = unpublishedFixtures(operation).filter(
        ({ fixture }) => !fixture.expectedError,
      );
      expect(fixtures.length).toBeGreaterThan(2);
      for (const { fixture } of fixtures) {
        const p = preset(operation, fixture.input, fixture.params);
        const prepared = prepareSurveyRequest(p, sample(p));
        if (!prepared.ok) throw new Error(`${fixture.id}: ${prepared.error.path}`);
        expect(prepared.value.input, fixture.id).toEqual(fixture.input);
        const result = await executeOperation(
          descriptor,
          prepared.value.input,
          prepared.value.params,
          createTestContext(),
        );
        expect(checkFixture(fixture, result), fixture.id).toBeNull();
      }
    },
  );
});
