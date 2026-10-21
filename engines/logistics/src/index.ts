import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { cbmCompute } from './operations/cbm-compute/operation.ts';
import { cbmShipment } from './operations/cbm-shipment/operation.ts';
import { containerFit } from './operations/container-fit/operation.ts';
import { palletFit } from './operations/pallet-fit/operation.ts';
import { weightChargeable } from './operations/weight-chargeable/operation.ts';

export const engine: EngineModule = {
  engineId: 'logistics',
  operations: [cbmShipment, cbmCompute, weightChargeable, containerFit, palletFit],
  messages,
};

export { cbmCompute, cbmShipment, containerFit, palletFit, weightChargeable };
