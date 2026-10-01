import type { ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { applyFieldEdit } from './fieldEffects.ts';
import {
  convertOpeningsText,
  openingRowError,
  readOpeningRows,
  writeOpeningRows,
} from './openingRows.ts';

const unitOptions = [{ value: 'mm' }, { value: 'm' }, { value: 'ft' }, { value: 'in' }];
const preset = {
  fields: {
    unit: { labelKey: 'u', kind: 'enum', order: 1, options: unitOptions },
    length: {
      labelKey: 'l',
      kind: 'number',
      order: 2,
      convert: { unitField: 'unit', family: 'length' },
    },
    openings: {
      labelKey: 'o',
      kind: 'openings',
      order: 3,
      convert: { unitField: 'unit', family: 'length' },
    },
    brickUnit: { labelKey: 'b', kind: 'enum', order: 4, options: unitOptions },
    joint: {
      labelKey: 'j',
      kind: 'number',
      order: 5,
      convert: { unitField: 'brickUnit', family: 'length' },
    },
    brickPreset: {
      labelKey: 'p',
      kind: 'enum',
      order: 0,
      uiOnly: true,
      options: [{ value: 'custom' }, { value: 'us', sets: { brickUnit: 'in', joint: '0.375' } }],
    },
  },
} as unknown as ResolvedPreset;

const base = {
  unit: 'm',
  length: '5',
  openings: '',
  brickUnit: 'mm',
  joint: '10',
  brickPreset: 'custom',
};

describe('applyFieldEdit', () => {
  it('converts dependent values when a unit changes', () => {
    const next = applyFieldEdit(preset, base, 'unit', 'ft');
    expect(next.length).toBe('16.404199');
    expect(next.joint).toBe('10');
  });

  it('converts opening rows with the length unit', () => {
    const values = { ...base, openings: '[{"width":"1","height":"2","quantity":"3"}]' };
    const next = applyFieldEdit(preset, values, 'unit', 'mm');
    expect(JSON.parse(String(next.openings))).toEqual([
      { width: '1000', height: '2000', quantity: '3' },
    ]);
  });

  it('fills fields from a preset choice without converting them', () => {
    const next = applyFieldEdit(preset, base, 'brickPreset', 'us');
    expect(next.brickUnit).toBe('in');
    expect(next.joint).toBe('0.375');
  });

  it('switches a preset picker back to custom once a preset value is edited', () => {
    const chosen = applyFieldEdit(preset, base, 'brickPreset', 'us');
    const edited = applyFieldEdit(preset, chosen, 'joint', '0.5');
    expect(edited.brickPreset).toBe('custom');
    const same = applyFieldEdit(preset, chosen, 'length', '6');
    expect(same.brickPreset).toBe('us');
  });
});

describe('opening rows', () => {
  it('treats an empty value as no rows and writes no rows as empty', () => {
    expect(readOpeningRows('')).toEqual([]);
    expect(writeOpeningRows([])).toBe('');
  });

  it('sends a row that has no size yet as blank', () => {
    expect(writeOpeningRows([{ width: '', height: '', quantity: '1' }])).toBe('[{}]');
  });

  it('keeps blank text blank when converting', () => {
    expect(convertOpeningsText('[{}]', 'm', 'ft')).toBe('[{}]');
  });

  it('maps an engine path to its row and field', () => {
    expect(openingRowError('openings[2].height')).toEqual({ index: 2, field: 'height' });
    expect(openingRowError('openings')).toBeNull();
    expect(openingRowError('items[0].width')).toBeNull();
  });
});
