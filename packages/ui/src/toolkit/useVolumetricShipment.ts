import type { ResolvedPreset } from '@mangotools/schemas';
import { messageFor } from './presentation.ts';
import { useEngineRun } from './useEngineRun.ts';
import {
  isUsableItem,
  type VolumetricCalculationResult,
  type VolumetricItem,
  type VolumetricUnit,
} from './volumetricWeightModel.ts';

const OPERATION = 'logistics.weight.shipment@1';
const ENGINE_UNIT: Record<VolumetricUnit, 'cm' | 'mm' | 'in'> = { cm: 'cm', mm: 'mm', inch: 'in' };

type BilledOn = 'actual' | 'volumetric' | 'equal';

interface ShipmentRow {
  index: number;
  quantity: string;
  volumeCm3PerPiece: string;
  volumetricPerPiece: string;
  volumetricTotal: string;
  actualTotal: string;
  chargeableTotal: string;
}

interface ShipmentOutput {
  rows: ShipmentRow[];
  totalPieces: string;
  totalVolumeCm3: string;
  totalVolumeM3: string;
  volumetricTotal: string;
  actualTotal: string;
  chargeableTotal: string;
  billedOn: BilledOn;
}

const EMPTY: Omit<VolumetricCalculationResult, 'skippedRowIds'> = {
  totalPieces: 0,
  totalVolumeM3: '0.000',
  totalVolumeCm3: 0,
  totalActualWeightKg: '0.000',
  totalVolumetricWeightKg: '0.000',
  chargeableWeightKg: '0.000',
  governingFactor: 'equal',
  itemCalculations: [],
};

/** Engine input for the rows that can be counted; null when no row can. */
function shipmentInput(items: VolumetricItem[], unit: VolumetricUnit, divisor: number) {
  const usable = items.filter(isUsableItem);
  if (usable.length === 0) return null;
  return {
    unit: ENGINE_UNIT[unit],
    weightUnit: 'kg',
    divisor: String(divisor),
    packages: usable.map((i) => ({
      length: String(i.length),
      width: String(i.width),
      height: String(i.height),
      quantity: String(i.quantity),
      weightPerPiece: String(i.weightKg),
    })),
  };
}

/** Engine strings to the shape the panels show. Numbers here are for display only. */
function toResult(out: ShipmentOutput, usable: VolumetricItem[], unit: VolumetricUnit) {
  return {
    totalPieces: Number(out.totalPieces),
    totalVolumeM3: out.totalVolumeM3,
    totalVolumeCm3: Number(out.totalVolumeCm3),
    totalActualWeightKg: out.actualTotal,
    totalVolumetricWeightKg: out.volumetricTotal,
    chargeableWeightKg: out.chargeableTotal,
    governingFactor: out.billedOn,
    // A result from the previous edit can still be on screen for a moment: skip rows it no longer has.
    itemCalculations: out.rows.flatMap((row) => {
      const item = usable[row.index];
      if (!item) return [];
      const volume = Number(row.volumeCm3PerPiece);
      const quantity = Number(row.quantity);
      const calc = {
        id: item.id,
        description: item.description || 'Package',
        length: item.length,
        width: item.width,
        height: item.height,
        unit,
        quantity,
        volumeCm3PerPiece: volume,
        volumeM3PerPiece: (volume / 1_000_000).toFixed(3),
        volumetricWeightKgPerPiece: row.volumetricPerPiece,
        rowTotalVolCm3: volume * quantity,
        rowTotalVolM3: ((volume * quantity) / 1_000_000).toFixed(3),
        totalVolumetricWeightKg: row.volumetricTotal,
        totalActualWeightKg: row.actualTotal,
        chargeableWeightKg: row.chargeableTotal,
      };
      return [calc];
    }),
  };
}

/**
 * Volumetric, actual and chargeable weight for the shipment, computed by the logistics engine
 * (exact decimals). Rows that cannot be counted are listed in `skippedRowIds`.
 */
export function useVolumetricShipment(
  preset: ResolvedPreset | undefined,
  items: VolumetricItem[],
  unit: VolumetricUnit,
  divisor: number,
): VolumetricCalculationResult & { error: string | null } {
  const usable = items.filter(isUsableItem);
  const skippedRowIds = items.filter((i) => !isUsableItem(i)).map((i) => i.id);
  const run = useEngineRun<ShipmentOutput>(OPERATION, shipmentInput(items, unit, divisor), {});
  const error = run.error ? (preset ? messageFor(preset, run.error) : run.error.code) : null;
  const body = run.value && !run.error ? toResult(run.value, usable, unit) : EMPTY;
  return { ...body, skippedRowIds, error };
}
