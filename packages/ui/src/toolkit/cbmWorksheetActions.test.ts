import type { RunFn } from '@mangotools/runtime';
import { describe, expect, it } from 'vitest';
import { createCbmController } from './cbmShipmentController.ts';
import {
  addPackage,
  duplicatePackages,
  movePackage,
  pasteBlock,
  setDimensionUnit,
  setWeightUnit,
} from './cbmWorksheetActions.ts';

function harness() {
  const inputs: unknown[] = [];
  const run: RunFn = (_operation, input) => {
    inputs.push(input);
    return new Promise(() => {});
  };
  const controller = createCbmController(run);
  const rows = () => controller.get().packages;
  const fill = (index: number, values: Record<string, string>) => {
    const row = rows()[index];
    if (!row) throw new Error(`no row ${index}`);
    for (const [field, value] of Object.entries(values))
      controller.edit(row.id, field as 'length', value);
  };
  return { controller, rows, fill, inputs };
}

describe('CBM worksheet actions (public controller API only)', () => {
  it('converts every package to one dimension unit without changing its size', () => {
    const h = harness();
    addPackage(h.controller, 'kg');
    h.fill(1, { length: '100', width: '50', height: '20' });
    setDimensionUnit(h.controller, 'm');
    expect(h.controller.get().unit).toBe('m');
    expect(h.rows().map((row) => [row.unit, row.length, row.width, row.height])).toEqual([
      ['m', '0.5', '0.4', '0.3'],
      ['m', '1', '0.5', '0.2'],
    ]);
  });

  it('converts every weight to one weight unit and adds new rows in it', () => {
    const h = harness();
    h.fill(0, { weightPerItem: '2' });
    setWeightUnit(h.controller, 'g');
    expect(h.rows()[0]).toMatchObject({ weightPerItem: '2000', weightUnit: 'g' });
    const id = addPackage(h.controller, 'g');
    expect(h.rows().find((row) => row.id === id)?.weightUnit).toBe('g');
  });

  it('duplicates the selected packages in worksheet order', () => {
    const h = harness();
    addPackage(h.controller, 'kg');
    h.fill(1, { description: 'B', length: '1', width: '1', height: '1' });
    const [first, second] = h.rows();
    duplicatePackages(h.controller, new Set([second?.id ?? -1, first?.id ?? -1]));
    expect(h.rows().map((row) => row.description || '·')).toEqual(['·', '·', 'B', 'B']);
  });

  it('moves package contents while row ids stay in place', () => {
    const h = harness();
    addPackage(h.controller, 'kg');
    addPackage(h.controller, 'kg');
    h.fill(1, { description: 'B', length: '2' });
    h.fill(2, { description: 'C', length: '3' });
    const ids = h.rows().map((row) => row.id);
    movePackage(h.controller, 2, 0);
    expect(h.rows().map((row) => row.id)).toEqual(ids);
    expect(h.rows().map((row) => [row.description, row.length])).toEqual([
      ['C', '3'],
      ['', '50'],
      ['B', '2'],
    ]);
  });

  it('pastes a block from the focused cell, adding rows, never past 50', () => {
    const h = harness();
    const count = pasteBlock(
      h.controller,
      { index: 0, field: 'description' },
      [
        ['Carton A', '60', '40', '40', '100', '12'],
        ['Carton B', '1,250', '30', '30', '80', '8'],
      ],
      'kg',
    );
    expect(count).toBe(2);
    expect(
      h.rows().map((row) => [row.description, row.length, row.quantity, row.weightPerItem]),
    ).toEqual([
      ['Carton A', '60', '100', '12'],
      ['Carton B', '1250', '80', '8'],
    ]);
    const many = Array.from({ length: 60 }, () => ['1', '1', '1']);
    expect(pasteBlock(h.controller, { index: 1, field: 'length' }, many, 'kg')).toBe(49);
    expect(h.rows()).toHaveLength(50);
    expect(h.rows()[1]?.description).toBe('Carton B');
  });

  it('never sends descriptions to the engine', () => {
    const h = harness();
    pasteBlock(
      h.controller,
      { index: 0, field: 'description' },
      [['Secret SKU', '1', '1', '1']],
      'kg',
    );
    expect(JSON.stringify(h.inputs.at(-1))).not.toContain('Secret SKU');
  });
});
