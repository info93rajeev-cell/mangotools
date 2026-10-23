import type { OpError } from '@mangotools/core';
import type { CbmCostInput, CbmCostResult } from './cbmShipmentModel.ts';
/** UI projections of the unchanged logistics.container.load@1 schema. */
export interface LoadPackage {
  id: number;
  description: string;
  length: string;
  width: string;
  height: string;
  unit: string;
  quantity: string;
  weight: string;
  weightUnit: string;
}
export interface LoadSettings {
  containerType: string;
  containerLength: string;
  containerWidth: string;
  containerHeight: string;
  maxPayload: string;
  maxStackHeight: string;
  allowRotation: boolean;
  keepUpright: boolean;
  stackable: boolean;
}
export interface PlacementBlock {
  container: number;
  package: number;
  x: string;
  y: string;
  z: string;
  pieceLength: string;
  pieceWidth: string;
  pieceHeight: string;
  countX: number;
  countY: number;
  countZ: number;
  count: number;
}
export interface PlacedPackage {
  index: number;
  requested: string;
  loaded: string;
  unloaded: string;
  loadedVolume: string;
  requestedVolume: string;
  loadedWeight: string | null;
  unloadedReason: string | null;
  byContainer: string[];
}
export interface LoadResult {
  status: 'complete' | 'partial' | 'none';
  containerLength: string;
  containerWidth: string;
  containerHeight: string;
  containersRequired: string;
  totalPieces: string;
  loadedPieces: string;
  unloadedPieces: string;
  containerVolume: string;
  loadedVolume: string;
  availableVolume: string;
  volumeUtilizationPercent: string;
  weightStatus: 'complete' | 'partial' | 'none';
  loadedWeight: string | null;
  maxPayload: string | null;
  weightUtilizationPercent: string | null;
  packages: PlacedPackage[];
  blocks: PlacementBlock[];
  containers: {
    index: number;
    pieces: string;
    loadedVolume: string;
    volumeUtilizationPercent: string;
    loadedWeight: string | null;
    weightUtilizationPercent: string | null;
  }[];
}
export interface LoadSnapshot {
  packages: LoadPackage[];
  settings: LoadSettings;
  costInput: CbmCostInput;
  result: LoadResult | null;
  cost: CbmCostResult | null;
  pending: boolean;
  error: OpError | null;
  costError: OpError | null;
  warnings: string[];
}
export const emptyLoadPackage = (id: number): LoadPackage => ({
  id,
  description: '',
  length: '',
  width: '',
  height: '',
  unit: 'cm',
  quantity: '1',
  weight: '',
  weightUnit: 'kg',
});
export function initialLoadState(): LoadSnapshot {
  const data = [
    ['Carton A', '60', '40', '40', '100', '12'],
    ['Carton B', '50', '30', '30', '80', '8'],
    ['Wooden Crate', '120', '100', '180', '10', '250'],
    ['Pallet (Boxed)', '100', '100', '120', '10', '400'],
  ];
  return {
    packages: data.map((r, id) => ({
      ...emptyLoadPackage(id),
      description: r[0] ?? '',
      length: r[1] ?? '',
      width: r[2] ?? '',
      height: r[3] ?? '',
      quantity: r[4] ?? '',
      weight: r[5] ?? '',
    })),
    settings: {
      containerType: '20gp',
      containerLength: '600',
      containerWidth: '240',
      containerHeight: '240',
      maxPayload: '28000',
      maxStackHeight: '',
      allowRotation: true,
      keepUpright: false,
      stackable: true,
    },
    costInput: { enabled: false, currency: 'INR', rate: '', minimumCharge: '', otherCharges: '' },
    result: null,
    cost: null,
    pending: false,
    error: null,
    costError: null,
    warnings: [],
  };
}
export function loadPayload(state: LoadSnapshot) {
  const {
    containerType,
    containerLength,
    containerWidth,
    containerHeight,
    maxPayload,
    maxStackHeight,
  } = state.settings;
  return {
    packages: state.packages.map(
      ({ id: _id, description: _description, weight, weightUnit, ...row }) => ({
        ...row,
        ...(weight.trim() ? { weight, weightUnit } : {}),
      }),
    ),
    containerType,
    ...(containerType === 'custom'
      ? { containerLength, containerWidth, containerHeight, containerUnit: 'cm' }
      : {}),
    ...(maxPayload.trim() ? { maxPayload, payloadUnit: 'kg' } : {}),
    ...(maxStackHeight.trim() ? { maxStackHeight, stackHeightUnit: 'cm' } : {}),
  };
}
