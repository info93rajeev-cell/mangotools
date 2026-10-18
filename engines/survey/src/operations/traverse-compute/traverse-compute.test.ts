import { readdirSync, readFileSync } from 'node:fs';
import { canonicalJson, createTestContext, executeOperation } from '@mangotools/core';
import type { Fixture } from '@mangotools/schemas';
import { expect, it } from 'vitest';
import { parse } from 'yaml';
import { traverseCompute } from './operation.ts';
import { traverseOutput } from './schema.ts';

const directory = new URL('./fixtures/', import.meta.url);
const fixtures = readdirSync(directory).map(
  (file) => parse(readFileSync(new URL(file, directory), 'utf8')) as Fixture,
);
const rectangle = fixtures.find((f) => f.id === '004-cardinal-rectangle') as Fixture;
const run = (input: unknown, params = {}) =>
  executeOperation(traverseCompute, input, params, createTestContext());
const references = JSON.parse(
  readFileSync(new URL('../../../reference/cases.json', import.meta.url), 'utf8'),
) as { id: string; frozen: { input: unknown; binary64Reference: unknown } }[];

it.each(references)('$id matches the merged professional binary64 reference', async (reference) => {
  const result = await run(reference.frozen.input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const output = traverseOutput.parse(result.value);
  expect({
    type: output.type,
    legs: output.legs,
    coordinates: output.coordinates,
    closure: output.closure,
  }).toEqual(reference.frozen.binary64Reference);
});

it.each(fixtures)(
  '$id: exact references/errors, immutable inputs and repeat determinism',
  async (f) => {
    const snapshot = JSON.stringify(f.input);
    const result = await run(f.input, f.params);
    if (f.expectedError) {
      expect(result).toEqual({
        ok: false,
        error: { ...f.expectedError, messageKey: `errors.${f.expectedError.code}` },
      });
    } else {
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const output = traverseOutput.parse(result.value);
      expect(output).toMatchObject(f.expected ?? {});
      expect(output.coordinates).toHaveLength(output.legs.length + 1);
      expect(output.working.length).toBeLessThanOrEqual(4 * output.legs.length + 6);
      expect(
        output.working.every((s) =>
          Object.values(s.variables).every((v) => Number.isFinite(Number(v))),
        ),
      ).toBe(true);
    }
    expect(JSON.stringify(f.input)).toBe(snapshot);
    expect(canonicalJson(await run(f.input, f.params))).toBe(canonicalJson(result));
  },
);

it.each(['northingM', 'eastingM', 'distanceM', 'azimuthDeg'])(
  'rejects nonfinite %s structurally',
  async (key) => {
    for (const value of [NaN, Infinity, -Infinity]) {
      const input = structuredClone(rectangle.input);
      const target =
        key.endsWith('M') && !key.startsWith('distance')
          ? input.start
          : (input.legs as object[])[0];
      Object.assign(target as object, { [key]: value });
      const result = await run(input);
      const path = key === 'northingM' || key === 'eastingM' ? `start.${key}` : `legs.0.${key}`;
      expect(result).toEqual({
        ok: false,
        error: { code: 'INVALID_INPUT', path, messageKey: 'errors.INVALID_INPUT' },
      });
    }
  },
);

it('retains the raw endpoint and independent component sums at a large origin', async () => {
  const input = structuredClone(rectangle.input);
  input.start = { northingM: 1e9, eastingM: -1e9 };
  (input.legs as { distanceM: number }[])[0].distanceM = 1e-8;
  const result = await run(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.closure.northingMisclosureM).toBe(1e-8 - 10);
  expect(result.value.coordinates.at(-1)?.northingM).toBe(1e9 - 10);
  expect(result.value.coordinates.at(-1)).not.toEqual(input.start);
  expect(result.value.closure.northingMisclosureM).not.toBe(
    (result.value.coordinates.at(-1)?.northingM ?? 0) - 1e9,
  );
});

it('accepts exact domain bounds/verbatim labels and normalizes only output negative zero', async () => {
  const input = structuredClone(rectangle.input);
  input.start = { northingM: -0, eastingM: -1e9 };
  const legs = input.legs as { from: string; to: string; distanceM: number; azimuthDeg: number }[];
  const labels = [' A ', 'a', 'A'.repeat(60), 'D'];
  for (const [i, leg] of legs.entries()) {
    leg.from = labels[i];
    leg.to = labels[(i + 1) % labels.length];
    leg.distanceM = 1e6;
  }
  legs[0].azimuthDeg = -0;
  const result = await run(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.legs.map((l) => l.from)).toEqual(labels);
  expect(Object.is(result.value.coordinates[0].northingM, -0)).toBe(false);
  expect(Object.is(result.value.legs[0].azimuthDeg, -0)).toBe(false);
  expect(Object.is((input.start as { northingM: number }).northingM, -0)).toBe(true);
  expect(result.value.working[0]).toEqual({
    ref: 'legs.0.latitudeM',
    formulaKey: 'traverse.working.latitude',
    variables: { distanceM: '1000000', azimuthDeg: '0' },
    result: '1000000',
  });
});
