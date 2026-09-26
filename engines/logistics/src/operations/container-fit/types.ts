import type { ContainerFitInput } from './schema.ts';

export interface Carton {
  length: string;
  width: string;
  height: string;
  quantity: string;
}

export interface Measured {
  carton: Carton;
  unit: ContainerFitInput['unit'];
  containerType: ContainerFitInput['containerType'];
  cartonCm: readonly [string, string, string];
  containerAxes: readonly [string, string, string];
  usablePercent: string;
  stackable: boolean;
  allowRotation: boolean;
  keepUpright: boolean;
}
