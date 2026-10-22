/**
 * Worksheet-wide edits for the CBM workbench, built only on the controller's public, stale-safe
 * methods (edit, add, duplicate, setDefaultUnit). Every call recalculates through the controller,
 * so a superseded result is never shown.
 */
import { PASTE_COLUMNS, type PasteField, pastedValue } from './cbmPaste.ts';
import { moveItem, withWeightUnit } from './cbmRowUnits.ts';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmPackage } from './cbmShipmentModel.ts';

const MAX_ROWS = 50;
const CONTENT = [
  'weightUnit',
  'description',
  'length',
  'width',
  'height',
  'quantity',
  'weightPerItem',
] as const;

const rowById = (controller: CbmController, id: number) =>
  controller.get().packages.find((row) => row.id === id);

/** Converts every package to one dimension unit; physical sizes and volume are unchanged. */
export function setDimensionUnit(controller: CbmController, unit: string) {
  controller.setDefaultUnit(unit);
  for (const row of controller.get().packages)
    if (row.unit !== unit) controller.edit(row.id, 'unit', unit);
}

/** Converts every package's weight to one weight unit. */
export function setWeightUnit(controller: CbmController, weightUnit: string) {
  for (const row of controller.get().packages) {
    const converted = withWeightUnit(row, weightUnit);
    if (converted === row) continue;
    if (converted.weightPerItem !== row.weightPerItem)
      controller.edit(row.id, 'weightPerItem', converted.weightPerItem);
    controller.edit(row.id, 'weightUnit', weightUnit);
  }
}

/** Adds a package in the worksheet's current units; returns its id. */
export function addPackage(controller: CbmController, weightUnit: string): number | undefined {
  controller.add();
  const added = controller.get().packages.at(-1);
  if (added && added.weightUnit !== weightUnit) controller.edit(added.id, 'weightUnit', weightUnit);
  return added?.id;
}

/** Duplicates the selected packages, in worksheet order, up to the 50-package limit. */
export function duplicatePackages(controller: CbmController, ids: ReadonlySet<number>) {
  const order = controller.get().packages.filter((row) => ids.has(row.id));
  for (const row of order) controller.duplicate(row.id);
}

/** Copies one row's content into another row, unit first so its conversion is overwritten. */
function writeRow(controller: CbmController, target: CbmPackage, source: CbmPackage) {
  if (target.unit !== source.unit) controller.edit(target.id, 'unit', source.unit);
  const current = rowById(controller, target.id) ?? target;
  for (const field of CONTENT)
    if (current[field] !== source[field]) controller.edit(target.id, field, source[field]);
}

/**
 * Moves a package from one position to another. Row ids stay in place and their contents shift,
 * so the result is identical to reordering the rows.
 */
export function movePackage(controller: CbmController, from: number, to: number) {
  const rows = controller.get().packages;
  const order = moveItem(rows, from, to);
  rows.forEach((row, index) => {
    const source = order[index];
    if (source && source !== row) writeRow(controller, row, source);
  });
}

/** Pastes a block of cells starting at one row and column, adding rows up to the limit. */
export function pasteBlock(
  controller: CbmController,
  start: { index: number; field: PasteField },
  grid: string[][],
  weightUnit: string,
): number {
  const column = PASTE_COLUMNS.indexOf(start.field);
  const wanted = Math.min(MAX_ROWS, start.index + grid.length);
  while (controller.get().packages.length < wanted) addPackage(controller, weightUnit);
  const rows = controller.get().packages;
  let pasted = 0;
  grid.forEach((cells, offset) => {
    const row = rows[start.index + offset];
    if (!row) return;
    pasted++;
    cells.forEach((value, step) => {
      const field = PASTE_COLUMNS[column + step];
      if (field) controller.edit(row.id, field, pastedValue(field, value));
    });
  });
  return pasted;
}
