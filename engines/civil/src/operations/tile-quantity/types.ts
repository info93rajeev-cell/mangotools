import type { TileQuantityInput } from './schema.ts';

export interface Measured {
  surfaceLength: string;
  surfaceWidth: string;
  tileLength: string;
  tileWidth: string;
  unit: TileQuantityInput['unit'];
  quantity: string;
  wastagePercent: string;
  tilesPerBox: string | null;
}

export interface Computed {
  surfaceAreaPerRoomM2: string;
  surfaceAreaM2: string;
  surfaceAreaFt2: string;
  tileAreaM2: string;
  baseTileCount: string;
  wastageTileCount: string;
  totalTiles: string;
  boxesRequired: string | null;
}
