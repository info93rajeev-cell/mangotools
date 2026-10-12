import { describe, expect, it } from 'vitest';
import { fieldSchema } from './preset.ts';

/** Generic slab shapes used only as examples of what a `rows` field can describe. */
const priceSlabRows = {
  columns: {
    min: { labelKey: 'slab.min', kind: 'money' },
    max: { labelKey: 'slab.max', kind: 'money' },
    chargeMode: {
      labelKey: 'slab.chargeMode',
      kind: 'enum',
      options: [{ value: 'fixed' }, { value: 'percent' }],
      default: 'fixed',
    },
    value: { labelKey: 'slab.value', kind: 'number', required: true },
  },
  minRows: 1,
  maxRows: 20,
};

const weightSlabRows = {
  columns: {
    min: { labelKey: 'slab.min', kind: 'number' },
    max: { labelKey: 'slab.max', kind: 'number' },
    unit: { labelKey: 'slab.unit', kind: 'enum', options: [{ value: 'g' }, { value: 'kg' }] },
    amount: { labelKey: 'slab.amount', kind: 'money' },
  },
  maxRows: 10,
  defaultRows: [
    { max: '0.5', unit: 'kg', amount: '' },
    { min: '0.5', unit: 'kg', amount: '' },
  ],
};

const rowsField = (rows: unknown, extra: Record<string, unknown> = {}) => ({
  labelKey: 'fee.slabs',
  kind: 'rows',
  order: 10,
  rows,
  ...extra,
});

const issues = (value: unknown) => {
  const parsed = fieldSchema.safeParse(value);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
};

describe("preset field kind 'rows'", () => {
  it('keeps existing primitive fields valid', () => {
    for (const kind of ['text', 'number', 'money', 'percent', 'boolean', 'openings']) {
      expect(issues({ labelKey: 'x', kind, order: 1 })).toEqual([]);
    }
    expect(
      issues({ labelKey: 'x', kind: 'enum', order: 1, options: [{ value: 'a' }], default: 'a' }),
    ).toEqual([]);
  });

  it('accepts price-slab and weight-slab shaped rows', () => {
    expect(issues(rowsField(priceSlabRows))).toEqual([]);
    expect(issues(rowsField(weightSlabRows))).toEqual([]);
  });

  it('allows zero minimum rows and enforces min ≤ max within the platform limit', () => {
    expect(issues(rowsField({ ...priceSlabRows, minRows: 0 }))).toEqual([]);
    expect(issues(rowsField({ ...priceSlabRows, minRows: 5, maxRows: 2 }))).toContain(
      'minRows must not exceed maxRows.',
    );
    expect(issues(rowsField({ ...priceSlabRows, maxRows: 51 })).length).toBeGreaterThan(0);
    expect(issues(rowsField({ ...priceSlabRows, maxRows: 0 })).length).toBeGreaterThan(0);
  });

  it('requires rows exactly for kind rows and rejects default/options on it', () => {
    expect(issues({ labelKey: 'x', kind: 'rows', order: 1 })).toContain(
      "Set 'rows' exactly when kind is 'rows'.",
    );
    expect(issues({ labelKey: 'x', kind: 'text', order: 1, rows: priceSlabRows })).toContain(
      "Set 'rows' exactly when kind is 'rows'.",
    );
    expect(issues(rowsField(priceSlabRows, { default: '[]' }))).toContain(
      "A 'rows' field uses rows.defaultRows, not default or options.",
    );
  });

  it('validates default rows against columns and limits', () => {
    expect(
      issues(rowsField({ ...weightSlabRows, defaultRows: [{ unit: 'lb', amount: '1' }] })),
    ).toContain('Default row 0 column "unit" is not one of its options.');
    expect(issues(rowsField({ ...weightSlabRows, defaultRows: [{ other: '1' }] }))).toContain(
      'Default row 0 has unknown column "other".',
    );
    expect(issues(rowsField({ ...priceSlabRows, defaultRows: [] }))).toContain(
      'defaultRows must contain between minRows and maxRows rows.',
    );
  });

  it('rejects invalid columns, unknown keys and nested rows', () => {
    const bad = (column: unknown) =>
      issues(rowsField({ ...priceSlabRows, columns: { ...priceSlabRows.columns, extra: column } }));
    expect(bad({ labelKey: 'x', kind: 'rows' }).length).toBeGreaterThan(0);
    expect(bad({ labelKey: 'x', kind: 'boolean' }).length).toBeGreaterThan(0);
    expect(bad({ labelKey: 'x', kind: 'text', surprise: true }).length).toBeGreaterThan(0);
    expect(bad({ labelKey: 'x', kind: 'enum' })).toContain('Enum column "extra" needs options.');
    expect(bad({ labelKey: 'x', kind: 'text', options: [{ value: 'a' }] })).toContain(
      'Column "extra" has options but is not an enum.',
    );
    expect(issues(rowsField({ ...priceSlabRows, columns: {} }))).toContain(
      'Rows need 1–12 columns.',
    );
    expect(issues(rowsField({ ...priceSlabRows, surprise: 1 })).length).toBeGreaterThan(0);
    expect(
      issues(
        rowsField({ ...priceSlabRows, columns: { 'Bad-Key': { labelKey: 'x', kind: 'text' } } }),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('parses deterministically, preserving column and default-row order', () => {
    const parsed = fieldSchema.parse(rowsField(weightSlabRows));
    expect(Object.keys(parsed.rows?.columns ?? {})).toEqual(['min', 'max', 'unit', 'amount']);
    expect(parsed.rows?.defaultRows?.map((r) => r.max ?? r.min)).toEqual(['0.5', '0.5']);
    expect(JSON.stringify(fieldSchema.parse(rowsField(weightSlabRows)))).toBe(
      JSON.stringify(parsed),
    );
  });
});
