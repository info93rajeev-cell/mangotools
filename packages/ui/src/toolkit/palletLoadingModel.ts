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
  showWeightInResults: boolean;
}

export interface PalletLoadingResult {
  boxesPerLayer: number;
  alongLength: number;
  alongWidth: number;
  /** Boxes turned 90° in the strip left over along the pallet length (mixed pattern). */
  rotatedExtra: number;
  /** Why nothing fits, when that is the case. */
  issue: string | null;
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

/** Assumed height of the empty pallet and its tare weight, stated in the results. */
export const PALLET_BASE_HEIGHT_CM = 14.4;
export const PALLET_TARE_KG = 25;

interface Layer {
  count: number;
  alongL: number;
  alongW: number;
  rotatedExtra: number;
}

/** Best single-layer pattern: either grid orientation, or the first one plus a rotated strip. */
export function bestLayer(pL: number, pW: number, bL: number, bW: number): Layer {
  const fitL1 = Math.floor(pL / bL);
  const fitW1 = Math.floor(pW / bW);
  const fitL2 = Math.floor(pL / bW);
  const fitW2 = Math.floor(pW / bL);
  let best: Layer = { count: fitL1 * fitW1, alongL: fitL1, alongW: fitW1, rotatedExtra: 0 };
  if (fitL2 * fitW2 > best.count)
    best = { count: fitL2 * fitW2, alongL: fitL2, alongW: fitW2, rotatedExtra: 0 };
  const remL = pL - fitL1 * bL;
  const extra = remL >= bW ? Math.floor(remL / bW) * Math.floor(pW / bL) : 0;
  if (fitL1 * fitW1 + extra > best.count) {
    best = { count: fitL1 * fitW1 + extra, alongL: fitL1, alongW: fitW1, rotatedExtra: extra };
  }
  return best;
}

const positive = (n: number) => Number.isFinite(n) && n > 0;

function inputIssue(
  dims: number[],
  usableHeightCm: number,
  boxHeightCm: number,
  layer: Layer,
): string | null {
  if (!dims.every(positive)) return 'Enter pallet and box sizes greater than zero.';
  if (layer.count === 0) return 'The box is larger than the pallet surface, so no box fits.';
  if (boxHeightCm > usableHeightCm) {
    return `The box is taller than the usable height (${Math.round(usableHeightCm * 10) / 10} cm above the pallet).`;
  }
  return null;
}

export function computePalletLoading(input: PalletLoadingInput): PalletLoadingResult {
  const pL = convertToCm(input.palletLength, input.unit);
  const pW = convertToCm(input.palletWidth, input.unit);
  const pHLimit = convertToCm(input.palletHeightLimit, input.unit);
  const bL = convertToCm(input.boxLength, input.unit);
  const bW = convertToCm(input.boxWidth, input.unit);
  const bH = convertToCm(input.boxHeight, input.unit);
  const dims = [pL, pW, pHLimit, bL, bW, bH];
  const layer = dims.every(positive)
    ? bestLayer(pL, pW, bL, bW)
    : { count: 0, alongL: 0, alongW: 0, rotatedExtra: 0 };
  const usableHeightCm = Math.max(0, pHLimit - PALLET_BASE_HEIGHT_CM);
  const issue = inputIssue(dims, usableHeightCm, bH, layer);

  let layers = issue ? 0 : Math.floor(usableHeightCm / bH);
  if (typeof input.maxStackLayers === 'number' && input.maxStackLayers > 0) {
    layers = Math.min(layers, input.maxStackLayers);
  }
  const totalBoxes = layer.count * layers;
  const loadedHeightCm = layers * bH + PALLET_BASE_HEIGHT_CM;
  const footprintVolCm3 = pL * pW * loadedHeightCm;
  const utilization =
    totalBoxes > 0 && footprintVolCm3 > 0
      ? Math.min(100, Math.round(((totalBoxes * bL * bW * bH) / footprintVolCm3) * 100))
      : 0;
  const boxWeight = Number.isFinite(input.boxWeight) && input.boxWeight > 0 ? input.boxWeight : 0;
  const boxesWeightKg = Math.round(totalBoxes * boxWeight * 10) / 10;

  return {
    boxesPerLayer: issue ? 0 : layer.count,
    alongLength: layer.alongL,
    alongWidth: layer.alongW,
    rotatedExtra: layer.rotatedExtra,
    issue,
    totalLayers: layers,
    totalBoxes,
    spaceUtilizationPercent: utilization,
    loadedDimensions: {
      length: Math.round(pL),
      width: Math.round(pW),
      height: Math.round(loadedHeightCm),
      unit: 'cm',
    },
    weightBreakdown: {
      boxWeightKg: boxWeight,
      totalBoxesWeightKg: boxesWeightKg,
      palletTareWeightKg: PALLET_TARE_KG,
      totalGrossWeightKg: Math.round((boxesWeightKg + PALLET_TARE_KG) * 10) / 10,
    },
  };
}

/** "(3 × 3)" or "(3 × 3 + 2 rotated)" for the layer pattern. */
export function layerPattern(
  r: Pick<PalletLoadingResult, 'alongLength' | 'alongWidth' | 'rotatedExtra'>,
): string {
  const extra = r.rotatedExtra > 0 ? ` + ${r.rotatedExtra} rotated` : '';
  return `(${r.alongLength} × ${r.alongWidth}${extra})`;
}
