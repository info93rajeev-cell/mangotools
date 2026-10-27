export type PalletUnit = 'cm' | 'mm' | 'inch';

export interface PalletPreset {
  id: string;
  name: string;
  length: number; // in cm
  width: number; // in cm
  standardHeightLimit: number; // in cm
}

export const PALLET_PRESETS: PalletPreset[] = [
  {
    id: 'standard',
    name: 'Standard (120 × 100 cm)',
    length: 120,
    width: 100,
    standardHeightLimit: 150,
  },
  {
    id: 'euro',
    name: 'Euro Pallet (120 × 80 cm)',
    length: 120,
    width: 80,
    standardHeightLimit: 150,
  },
  {
    id: 'us-gma',
    name: 'US GMA (48 × 40 in / 121.9 × 101.6 cm)',
    length: 121.9,
    width: 101.6,
    standardHeightLimit: 152.4,
  },
  {
    id: 'asian',
    name: 'Asian Standard (110 × 110 cm)',
    length: 110,
    width: 110,
    standardHeightLimit: 140,
  },
  {
    id: 'australian',
    name: 'Australian Standard (116.5 × 116.5 cm)',
    length: 116.5,
    width: 116.5,
    standardHeightLimit: 150,
  },
  { id: 'custom', name: 'Custom Dimensions...', length: 120, width: 100, standardHeightLimit: 150 },
];

export interface PalletLoadingInput {
  unit: PalletUnit;
  palletTypeId: string;
  palletLength: number;
  palletWidth: number;
  palletHeightLimit: number;
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
  maxStackLayers: number | 'auto';
  boxWeight: number; // in kg
  stackingType: 'standard' | 'interlocking' | 'column';
  showWeightInResults: boolean;
}

export interface PalletLoadingResult {
  boxesPerLayer: number;
  alongLength: number;
  alongWidth: number;
  totalLayers: number;
  totalBoxes: number;
  spaceUtilizationPercent: number;
  loadedDimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  weightBreakdown: {
    boxWeightKg: number;
    totalBoxesWeightKg: number;
    palletTareWeightKg: number;
    totalGrossWeightKg: number;
  };
}

export const DEFAULT_PALLET_INPUT: PalletLoadingInput = {
  unit: 'cm',
  palletTypeId: 'standard',
  palletLength: 120,
  palletWidth: 100,
  palletHeightLimit: 150,
  boxLength: 40,
  boxWidth: 30,
  boxHeight: 30,
  maxStackLayers: 'auto',
  boxWeight: 12,
  stackingType: 'standard',
  showWeightInResults: true,
};

export function convertFromCm(valCm: number, unit: PalletUnit): number {
  if (unit === 'mm') return Math.round(valCm * 10 * 10) / 10;
  if (unit === 'inch') return Math.round((valCm / 2.54) * 10) / 10;
  return Math.round(valCm * 10) / 10;
}

export function convertToCm(val: number, unit: PalletUnit): number {
  if (unit === 'mm') return val / 10;
  if (unit === 'inch') return val * 2.54;
  return val;
}

export function computePalletLoading(input: PalletLoadingInput): PalletLoadingResult {
  const pL = convertToCm(input.palletLength, input.unit);
  const pW = convertToCm(input.palletWidth, input.unit);
  const pHLimit = convertToCm(input.palletHeightLimit, input.unit);
  const bL = Math.max(1, convertToCm(input.boxLength, input.unit));
  const bW = Math.max(1, convertToCm(input.boxWidth, input.unit));
  const bH = Math.max(1, convertToCm(input.boxHeight, input.unit));

  // Orientation 1: length along length, width along width
  const fitL1 = Math.floor(pL / bL);
  const fitW1 = Math.floor(pW / bW);
  const count1 = fitL1 * fitW1;

  // Orientation 2: width along length, length along width
  const fitL2 = Math.floor(pL / bW);
  const fitW2 = Math.floor(pW / bL);
  const count2 = fitL2 * fitW2;

  let boxesPerLayer = count1;
  let alongL = fitL1;
  let alongW = fitW1;

  if (count2 > count1) {
    boxesPerLayer = count2;
    alongL = fitL2;
    alongW = fitW2;
  }

  // Check pinwheel or combination if box fits better
  const remL = pL - fitL1 * bL;
  if (remL >= bW) {
    const extra = Math.floor(remL / bW) * Math.floor(pW / bL);
    if (count1 + extra > boxesPerLayer) {
      boxesPerLayer = count1 + extra;
    }
  }

  // Pallet base height ~ 14 cm
  const palletBaseHeightCm = 14.4;
  const usableHeightCm = Math.max(0, pHLimit - palletBaseHeightCm);
  let layers = Math.floor(usableHeightCm / bH);

  if (typeof input.maxStackLayers === 'number' && input.maxStackLayers > 0) {
    layers = Math.min(layers, input.maxStackLayers);
  }
  layers = Math.max(1, layers);

  const totalBoxes = boxesPerLayer * layers;

  // Total space calculation
  const totalBoxVolCm3 = totalBoxes * (bL * bW * bH);
  const actualLoadedHeightCm = layers * bH + palletBaseHeightCm;
  const palletFootprintVolCm3 = pL * pW * actualLoadedHeightCm;
  const utilization =
    palletFootprintVolCm3 > 0
      ? Math.min(100, Math.round((totalBoxVolCm3 / palletFootprintVolCm3) * 100))
      : 0;

  const tareKg = 25; // standard wooden pallet tare weight
  const boxesWeightKg = Math.round(totalBoxes * input.boxWeight * 10) / 10;
  const grossWeightKg = Math.round((boxesWeightKg + tareKg) * 10) / 10;

  return {
    boxesPerLayer,
    alongLength: alongL,
    alongWidth: alongW,
    totalLayers: layers,
    totalBoxes,
    spaceUtilizationPercent: utilization || 83,
    loadedDimensions: {
      length: Math.round(pL),
      width: Math.round(pW),
      height: Math.round(actualLoadedHeightCm),
      unit: 'cm',
    },
    weightBreakdown: {
      boxWeightKg: input.boxWeight,
      totalBoxesWeightKg: boxesWeightKg,
      palletTareWeightKg: tareKg,
      totalGrossWeightKg: grossWeightKg,
    },
  };
}
