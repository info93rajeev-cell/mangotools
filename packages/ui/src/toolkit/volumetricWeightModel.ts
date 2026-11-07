export type VolumetricUnit = 'cm' | 'mm' | 'inch';

export interface VolumetricItem {
  id: string;
  description: string;
  length: number;
  width: number;
  height: number;
  weightKg: number;
  quantity: number;
}

export interface VolumetricStandard {
  id: string;
  name: string;
  divisor: number;
  description: string;
}

export const VOLUMETRIC_STANDARDS: VolumetricStandard[] = [
  {
    id: 'iata',
    name: 'Air freight (IATA)',
    divisor: 6000,
    description: '6000 cm³/kg (Standard air cargo)',
  },
  {
    id: 'courier',
    name: 'Express Courier (DHL, FedEx, UPS)',
    divisor: 5000,
    description: '5000 cm³/kg (International express parcels)',
  },
  {
    id: 'domestic',
    name: 'Domestic Express',
    divisor: 4000,
    description: '4000 cm³/kg (Domestic road express)',
  },
  { id: 'custom', name: 'Custom Divisor', divisor: 6000, description: 'User-specified divisor' },
];

export const SAMPLE_VOLUMETRIC_ITEMS: VolumetricItem[] = [
  {
    id: 'item-1',
    description: 'Carton A',
    length: 60,
    width: 40,
    height: 40,
    weightKg: 12,
    quantity: 1,
  },
  {
    id: 'item-2',
    description: 'Carton B',
    length: 50,
    width: 30,
    height: 30,
    weightKg: 8,
    quantity: 2,
  },
  {
    id: 'item-3',
    description: 'Envelope',
    length: 35,
    width: 25,
    height: 5,
    weightKg: 0.5,
    quantity: 5,
  },
];

export interface VolumetricCalculationResult {
  /** Display values come from logistics.weight.shipment@1 as decimal strings. */
  /** Rows left out because a size, weight or quantity is missing or not valid. */
  skippedRowIds: string[];
  totalPieces: number;
  totalVolumeM3: string;
  totalVolumeCm3: number;
  totalActualWeightKg: string;
  totalVolumetricWeightKg: string;
  chargeableWeightKg: string;
  governingFactor: 'volumetric' | 'actual' | 'equal';
  itemCalculations: Array<{
    id: string;
    description: string;
    length: number;
    width: number;
    height: number;
    unit: VolumetricUnit;
    quantity: number;
    volumeCm3PerPiece: number;
    volumeM3PerPiece: string;
    volumetricWeightKgPerPiece: string;
    rowTotalVolCm3: number;
    rowTotalVolM3: string;
    totalVolumetricWeightKg: string;
    totalActualWeightKg: string;
    chargeableWeightKg: string;
  }>;
}

export function convertLengthToCm(val: number, unit: VolumetricUnit): number {
  if (unit === 'mm') return val / 10;
  if (unit === 'inch') return val * 2.54;
  return val;
}

export function convertLengthFromCm(valCm: number, unit: VolumetricUnit): number {
  if (unit === 'mm') return Math.round(valCm * 10 * 10) / 10;
  if (unit === 'inch') return Math.round((valCm / 2.54) * 10) / 10;
  return Math.round(valCm * 10) / 10;
}

const positive = (n: number) => Number.isFinite(n) && n > 0;

/** A row counts when all sizes and the weight are above zero and quantity is a whole number of at least 1. */
export function isUsableItem(item: VolumetricItem): boolean {
  return (
    positive(item.length) &&
    positive(item.width) &&
    positive(item.height) &&
    Number.isFinite(item.weightKg) &&
    item.weightKg > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  );
}
