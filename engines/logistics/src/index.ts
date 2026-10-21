import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { cbmCompute } from './operations/cbm-compute/operation.ts';
import { cbmShipment } from './operations/cbm-shipment/operation.ts';
import { containerFit } from './operations/container-fit/operation.ts';
import { containerLoad } from './operations/container-load/operation.ts';
import { costEstimate } from './operations/cost-estimate/operation.ts';
import { palletFit } from './operations/pallet-fit/operation.ts';
import { weightChargeable } from './operations/weight-chargeable/operation.ts';

export const engine: EngineModule = {
  engineId: 'logistics',
  operations: [
    cbmShipment,
    cbmCompute,
    weightChargeable,
    containerFit,
    palletFit,
    costEstimate,
    containerLoad,
  ],
  messages,
};

export {
  cbmCompute,
  cbmShipment,
  containerFit,
  containerLoad,
  costEstimate,
  palletFit,
  weightChargeable,
};
