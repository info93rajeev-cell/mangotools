import type { PlasterQuantityInput } from './schema.ts';

export interface Measured {
  length: string;
  secondDimension: string;
  plasterThickness: string;
  quantity: string;
  unit: PlasterQuantityInput['unit'];
  surfaceType: PlasterQuantityInput['surfaceType'];
  openingArea: string;
  wastagePercent: string;
}

export interface Computed {
  grossAreaPerSurfaceM2: string;
  grossAreaM2: string;
  openingAreaM2: string;
  openingDeductionAreaM2: string;
  netAreaM2: string;
  netAreaFt2: string;
  plasterThicknessM: string;
  plasterVolumeM3: string;
  wastageVolumeM3: string;
  totalVolumeM3: string;
  totalVolumeFt3: string;
}
