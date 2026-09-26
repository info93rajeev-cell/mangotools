import type { PalletFitInput } from './schema.ts';

export interface Carton {
  length: string;
  width: string;
  height: string;
  quantity: string;
}

export interface Measured {
  carton: Carton;
  unit: PalletFitInput['unit'];
  cartonCm: readonly [string, string, string];
  palletAxes: readonly [string, string, string];
}
