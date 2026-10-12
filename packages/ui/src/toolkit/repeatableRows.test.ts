import type { PresetField, ResolvedPreset, RowsSpec } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import { FieldControl } from '../archetypes/CalculatorFields.tsx';
import { OpeningRows } from './OpeningRows.tsx';
import { RepeatableRows } from './RepeatableRows.tsx';
import {
  focusAfterAdd,
  focusAfterRemove,
  isRowsFieldPath,
  rowCellError,
  rowsState,
  valueAfterAdd,
  valueAfterCellEdit,
  valueAfterRemove,
} from './repeatableRows.ts';

/** Generic slab-shaped columns, used only as an example of a `rows` field. */
const spec: RowsSpec = {
  columns: {
    min: { labelKey: 'min', kind: 'money' },
    max: { labelKey: 'max', kind: 'money' },
    chargeMode: {
      labelKey: 'mode',
      kind: 'enum',
      options: [{ value: 'fixed' }, { value: 'percent' }],
    },
    value: { labelKey: 'value', kind: 'percent' },
    note: { labelKey: 'note', kind: 'text' },
    weight: { labelKey: 'weight', kind: 'number' },
  },
  minRows: 1,
  maxRows: 3,
};

const EMPTY = { min: '', max: '', chargeMode: 'fixed', value: '', note: '', weight: '' };
const parse = (value: string) => JSON.parse(value) as Record<string, string>[];

describe('repeatable rows logic', () => {
  it('starts from minRows or defaultRows', () => {
    expect(rowsState(spec, '').rows).toEqual([EMPTY]);
    const withDefaults = { ...spec, defaultRows: [{ max: '500' }, { min: '500' }] };
    expect(rowsState(withDefaults, '').rows.map((r) => [r.min, r.max])).toEqual([
      ['', '500'],
      ['500', ''],
    ]);
  });

  it('adds rows up to maxRows and reports canAdd', () => {
    let value = '';
    expect(rowsState(spec, value).canAdd).toBe(true);
    value = valueAfterAdd(spec, value);
    value = valueAfterAdd(spec, value);
    expect(parse(value)).toHaveLength(3);
    expect(rowsState(spec, value).canAdd).toBe(false);
    expect(valueAfterAdd(spec, value)).toBe(value);
  });

  it('removes rows down to minRows, preserving order', () => {
    let value = valueAfterAdd(spec, valueAfterAdd(spec, ''));
    value = valueAfterCellEdit(spec, value, 0, 'note', 'a');
    value = valueAfterCellEdit(spec, value, 1, 'note', 'b');
    value = valueAfterCellEdit(spec, value, 2, 'note', 'c');
    value = valueAfterRemove(spec, value, 1);
    expect(parse(value).map((r) => r.note)).toEqual(['a', 'c']);
    value = valueAfterRemove(spec, value, 0);
    expect(parse(value).map((r) => r.note)).toEqual(['c']);
    expect(rowsState(spec, value).canRemove).toBe(false);
    expect(valueAfterRemove(spec, value, 0)).toBe(value);
    expect(valueAfterRemove(spec, value, 9)).toBe(value);
  });

  it('keeps every column kind as typed text and optional cells blank', () => {
    let value = '';
    value = valueAfterCellEdit(spec, value, 0, 'max', '1,000.50');
    value = valueAfterCellEdit(spec, value, 0, 'value', '7.00');
    value = valueAfterCellEdit(spec, value, 0, 'chargeMode', 'percent');
    value = valueAfterCellEdit(spec, value, 0, 'weight', '0.500');
    value = valueAfterCellEdit(spec, value, 0, 'note', 'Open lower bound');
    expect(parse(value)[0]).toEqual({
      min: '',
      max: '1,000.50',
      chargeMode: 'percent',
      value: '7.00',
      note: 'Open lower bound',
      weight: '0.500',
    });
    expect(Object.values(parse(value)[0] ?? {}).every((v) => typeof v === 'string')).toBe(true);
  });

  it('ignores edits to unknown columns or rows and never serializes row ids', () => {
    const value = valueAfterAdd(spec, '');
    expect(valueAfterCellEdit(spec, value, 0, 'id', 'x')).toBe(value);
    expect(valueAfterCellEdit(spec, value, 5, 'note', 'x')).toBe(value);
    expect(value).not.toContain('"id"');
    expect(Object.keys(parse(value)[0] ?? {})).toEqual(Object.keys(spec.columns));
  });

  it('serializes deterministically', () => {
    const a = valueAfterCellEdit(spec, '', 0, 'note', 'x');
    const b = valueAfterCellEdit(spec, '', 0, 'note', 'x');
    expect(a).toBe(b);
  });

  it('maps simple row error paths to a cell and leaves nested paths whole-field', () => {
    expect(rowCellError('slabs', spec, 'slabs.2.max')).toEqual({ index: 2, column: 'max' });
    expect(rowCellError('slabs', spec, 'slabs[1].value')).toEqual({ index: 1, column: 'value' });
    expect(rowCellError('slabs', spec, 'slabs.2.unknown')).toBeNull();
    expect(rowCellError('slabs', spec, 'slabs')).toBeNull();
    expect(rowCellError('slabs', spec, 'feeLines.2.priceSlabs.1.max')).toBeNull();
    expect(rowCellError('slabs', spec, 'slabsExtra.0.max')).toBeNull();
    expect(isRowsFieldPath('slabs', 'slabs.0.max')).toBe(true);
    expect(isRowsFieldPath('slabs', 'slabs')).toBe(true);
    expect(isRowsFieldPath('slabs', 'slabsExtra.0')).toBe(false);
  });

  it('focuses the nearest remaining Remove button when removing above minRows', () => {
    expect(focusAfterRemove(1, 4, 1)).toEqual({ kind: 'remove', index: 1 });
    expect(focusAfterRemove(3, 4, 1)).toEqual({ kind: 'remove', index: 2 });
    expect(focusAfterRemove(0, 3, 1)).toEqual({ kind: 'remove', index: 0 });
  });

  it('focuses Add row when a removal reaches minRows (Remove buttons are disabled there)', () => {
    expect(focusAfterRemove(1, 2, 1)).toEqual({ kind: 'add' });
    expect(focusAfterRemove(0, 2, 1)).toEqual({ kind: 'add' });
    expect(focusAfterRemove(2, 3, 2)).toEqual({ kind: 'add' });
  });

  it('keeps minRows 0 behaviour: nearest Remove, then Add once no rows remain', () => {
    expect(focusAfterRemove(0, 2, 0)).toEqual({ kind: 'remove', index: 0 });
    expect(focusAfterRemove(1, 2)).toEqual({ kind: 'remove', index: 0 });
    expect(focusAfterRemove(0, 1, 0)).toEqual({ kind: 'add' });
  });

  it('focuses the first editable cell of a newly added row', () => {
    expect(focusAfterAdd(2)).toEqual({ kind: 'cell', index: 2 });
    expect(focusAfterAdd(0)).toEqual({ kind: 'cell', index: 0 });
  });
});

describe('field routing', () => {
  const preset = { strings: {}, fields: {} } as unknown as ResolvedPreset;
  const control = (field: PresetField) =>
    FieldControl({
      id: 'f',
      name: 'slabs',
      field,
      preset,
      value: '',
      error: null,
      onValue: () => {},
    }) as VNode;

  it("routes only kind 'rows' to the repeatable rows editor", () => {
    const rows = control({ labelKey: 'slabs', kind: 'rows', order: 1, rows: spec });
    expect(rows.type).toBe(RepeatableRows);
    const openings = control({ labelKey: 'openings', kind: 'openings', order: 1 });
    expect(openings.type).toBe(OpeningRows);
    const money = control({ labelKey: 'price', kind: 'money', order: 1 });
    expect(money.type).not.toBe(RepeatableRows);
  });
});
