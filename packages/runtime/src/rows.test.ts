import type { ResolvedPreset, RowsSpec } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import {
  addRow,
  emptyRow,
  initialRows,
  parseRows,
  removeRow,
  rowsRequest,
  serializeRows,
} from './rows.ts';
import { buildRequest, defaultValues, restoreValues } from './tool-input.ts';

const spec: RowsSpec = {
  columns: {
    min: { labelKey: 'min', kind: 'money' },
    max: { labelKey: 'max', kind: 'money' },
    chargeMode: {
      labelKey: 'mode',
      kind: 'enum',
      options: [{ value: 'fixed' }, { value: 'percent' }],
    },
    value: { labelKey: 'value', kind: 'number' },
  },
  minRows: 1,
  maxRows: 3,
};

const preset = (rows: RowsSpec, required = false) =>
  ({
    operation: 'test.rows.run@1',
    params: {},
    userOptions: {},
    locked: [],
    samples: {},
    fields: {
      slabs: { labelKey: 'slabs', kind: 'rows', order: 1, rows, required },
      note: { labelKey: 'note', kind: 'text', order: 2 },
      enabled: { labelKey: 'enabled', kind: 'boolean', order: 3, default: 'false' },
    },
  }) as unknown as ResolvedPreset;

describe('rows runtime', () => {
  it('starts with minRows empty rows, enums at their first option', () => {
    expect(initialRows(spec)).toEqual([{ min: '', max: '', chargeMode: 'fixed', value: '' }]);
    expect(initialRows({ ...spec, minRows: 0 })).toEqual([]);
  });

  it('uses defaultRows when given, filling absent cells', () => {
    const rows = initialRows({ ...spec, defaultRows: [{ max: '500' }, { min: '500' }] });
    expect(rows.map((r) => [r.min, r.max, r.chargeMode])).toEqual([
      ['', '500', 'fixed'],
      ['500', '', 'fixed'],
    ]);
  });

  it('adds and removes within min/max and preserves order', () => {
    let rows = initialRows(spec);
    rows = [...addRow(spec, rows)];
    rows = [...addRow(spec, rows)];
    expect(rows).toHaveLength(3);
    expect(addRow(spec, rows)).toBe(rows);
    const labelled = rows.map((r, i) => ({ ...r, value: String(i) }));
    expect(removeRow(spec, labelled, 1).map((r) => r.value)).toEqual(['0', '2']);
    const one = [emptyRow(spec)];
    expect(removeRow(spec, one, 0)).toBe(one);
    expect(removeRow(spec, labelled, 7)).toBe(labelled);
  });

  it('serializes deterministically and round-trips', () => {
    const rows = [{ value: '5', chargeMode: 'percent', max: '1000', min: '' }];
    const text = serializeRows(spec, rows);
    expect(text).toBe('[{"min":"","max":"1000","chargeMode":"percent","value":"5"}]');
    expect(serializeRows(spec, parseRows(spec, text))).toBe(text);
  });

  it('falls back safely on malformed values and caps at maxRows', () => {
    expect(parseRows(spec, 'not json')).toEqual(initialRows(spec));
    expect(parseRows(spec, '{"a":1}')).toEqual(initialRows(spec));
    const many = JSON.stringify(Array.from({ length: 9 }, () => ({ value: '1', extra: 'x' })));
    const parsed = parseRows(spec, many);
    expect(parsed).toHaveLength(3);
    expect(Object.keys(parsed[0] ?? {})).toEqual(['min', 'max', 'chargeMode', 'value']);
    expect(parseRows(spec, '[{"value":7}]')[0]?.value).toBe('');
  });

  it('builds engine rows: skips blank rows, drops empty cells, keeps decimal strings', () => {
    const rows = [
      { min: '', max: '1,000', chargeMode: 'fixed', value: '₹12.50' },
      { min: '', max: '', chargeMode: 'percent', value: '' },
      { min: '1000', max: '', chargeMode: 'percent', value: '5.0000' },
    ];
    expect(rowsRequest(spec, rows)).toEqual([
      { max: '1000', chargeMode: 'fixed', value: '12.50' },
      { min: '1000', chargeMode: 'percent', value: '5.0000' },
    ]);
  });

  it('integrates with form defaults, requests and required checks', () => {
    const p = preset(spec, true);
    const values = defaultValues(p);
    expect(values.slabs).toBe('[{"min":"","max":"","chargeMode":"fixed","value":""}]');
    expect(buildRequest(p, values).missing).toEqual(['slabs']);
    const filled = { ...values, slabs: serializeRows(spec, [{ max: '500', value: '10' }]) };
    expect(buildRequest(p, filled).input.slabs).toEqual([
      { max: '500', chargeMode: 'fixed', value: '10' },
    ]);
    expect(buildRequest(preset(spec), values).input).not.toHaveProperty('slabs');
  });

  it('restores saved values by key and type only', () => {
    const p = preset(spec);
    const restored = restoreValues(p, {
      slabs: '[{"max":"9"}]',
      note: 42,
      enabled: true,
      unknown: 'x',
    });
    expect(restored.slabs).toBe('[{"max":"9"}]');
    expect(restored.note).toBe('');
    expect(restored.enabled).toBe('false');
    expect(restored).not.toHaveProperty('unknown');
  });
});
