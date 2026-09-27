import type { PaintQuantityInput } from './schema.ts';

export interface Measured {
  length: string;
  secondDimension: string;
  unit: PaintQuantityInput['unit'];
  openingArea: string;
  coats: string;
  coveragePerLitre: string;
  wastagePercent: string;
  quantity: string;
}

/**
 * Every area/volume figure here stays in the selected input unit's own squared form (e.g. square feet
 * if unit is 'ft'), never converted to metres — coverage per litre is defined in that same unit, so
 * converting would make the coverage figure meaningless. See units.ts for why.
 */
export interface Computed {
  grossAreaPerSurface: string;
  grossArea: string;
  openingDeductionArea: string;
  netArea: string;
  coatedArea: string;
  paintLitresBeforeWastage: string;
  totalPaintLitres: string;
}
