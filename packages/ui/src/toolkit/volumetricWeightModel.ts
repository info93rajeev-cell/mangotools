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
  totalPieces: number;
  totalVolumeM3: number;
  totalVolumeCm3: number;
  totalActualWeightKg: number;
  totalVolumetricWeightKg: number;
  chargeableWeightKg: number;
  governingFactor: 'volumetric' | 'actual';
  itemCalculations: Array<{
    id: string;
    description: string;
    length: number;
    width: number;
    height: number;
    unit: VolumetricUnit;
    quantity: number;
    volumeCm3PerPiece: number;
    volumeM3PerPiece: number;
    volumetricWeightKgPerPiece: number;
    rowTotalVolCm3: number;
    rowTotalVolM3: number;
    totalVolumetricWeightKg: number;
    totalActualWeightKg: number;
    chargeableWeightKg: number;
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

export function computeVolumetricWeight(
  items: VolumetricItem[],
  unit: VolumetricUnit,
  divisor: number,
): VolumetricCalculationResult {
  let totalPieces = 0;
  let totalVolumeCm3 = 0;
  let totalActualWeightKg = 0;
  let totalVolumetricWeightKg = 0;

  const validDivisor = divisor > 0 ? divisor : 6000;

  const itemCalculations = items.map((item) => {
    const lCm = convertLengthToCm(item.length, unit);
    const wCm = convertLengthToCm(item.width, unit);
    const hCm = convertLengthToCm(item.height, unit);
    const qty = Math.max(1, item.quantity);

    const volPieceCm3 = lCm * wCm * hCm;
    const volPieceM3 = volPieceCm3 / 1_000_000;
    const volWeightPieceKg = volPieceCm3 / validDivisor;

    const rowActualKg = item.weightKg * qty;
    const rowVolWeightKg = volWeightPieceKg * qty;
    const rowTotalVolCm3 = volPieceCm3 * qty;

    totalPieces += qty;
    totalVolumeCm3 += rowTotalVolCm3;
    totalActualWeightKg += rowActualKg;
    totalVolumetricWeightKg += rowVolWeightKg;

    const roundedRowActualKg = Math.round(rowActualKg * 10) / 10;
    const roundedRowVolWeightKg = Math.round(rowVolWeightKg * 10) / 10;

    return {
      id: item.id,
      description: item.description || 'Package',
      length: item.length,
      width: item.width,
      height: item.height,
      unit,
      quantity: qty,
      volumeCm3PerPiece: Math.round(volPieceCm3),
      volumeM3PerPiece: Math.round(volPieceM3 * 1000) / 1000,
      volumetricWeightKgPerPiece: Math.round(volWeightPieceKg * 100) / 100,
      rowTotalVolCm3: Math.round(rowTotalVolCm3),
      rowTotalVolM3: Math.round((rowTotalVolCm3 / 1_000_000) * 1000) / 1000,
      totalVolumetricWeightKg: roundedRowVolWeightKg,
      totalActualWeightKg: roundedRowActualKg,
      chargeableWeightKg: Math.max(roundedRowActualKg, roundedRowVolWeightKg),
    };
  });

  const roundedActualKg = Math.round(totalActualWeightKg * 10) / 10;
  const roundedVolumetricKg = Math.round(totalVolumetricWeightKg * 10) / 10;
  const chargeableWeightKg = Math.max(roundedActualKg, roundedVolumetricKg);
  const governingFactor = roundedVolumetricKg >= roundedActualKg ? 'volumetric' : 'actual';
  const totalVolumeM3 = Math.round((totalVolumeCm3 / 1_000_000) * 1000) / 1000;

  return {
    totalPieces,
    totalVolumeM3,
    totalVolumeCm3: Math.round(totalVolumeCm3),
    totalActualWeightKg: roundedActualKg,
    totalVolumetricWeightKg: roundedVolumetricKg,
    chargeableWeightKg,
    governingFactor,
    itemCalculations,
  };
}
