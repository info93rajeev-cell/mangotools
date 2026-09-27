import type { BrickworkQuantityInput } from './schema.ts';

export interface Measured {
  wallLength: string;
  wallHeight: string;
  wallThickness: string;
  quantity: string;
  unit: BrickworkQuantityInput['unit'];
  brickLength: string;
  brickWidth: string;
  brickHeight: string;
  brickUnit: BrickworkQuantityInput['brickUnit'];
  mortarJointMm: string;
  openingArea: string;
  wastagePercent: string;
}

export interface Computed {
  grossAreaPerWallM2: string;
  grossWallAreaM2: string;
  openingAreaM2: string;
  openingDeductionAreaM2: string;
  netWallAreaM2: string;
  netWallAreaFt2: string;
  wallThicknessM: string;
  brickworkVolumeM3: string;
  brickworkVolumeFt3: string;
  effectiveBrickVolumeM3: string;
  estimatedBrickCount: string;
  wastageBricks: string;
  totalBricks: string;
}
