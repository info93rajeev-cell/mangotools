import { defineOperation, ok } from '@mangotools/core';
import { aggregate, volumeWarnings } from './aggregate.ts';
import { type MeasuredPackage, measurePackage } from './measure.ts';
import { shipmentInput, shipmentOutput, shipmentParams } from './schema.ts';

export const cbmShipment = defineOperation({
  id: 'logistics.cbm.shipment',
  major: 1,
  title: 'Shipment volume (CBM)',
  summary: 'Exact volume, pieces and optional known packed weight for ordered shipment packages.',
  input: shipmentInput,
  params: shipmentParams,
  output: shipmentOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
    'LOGISTICS_VALUE_TOO_LONG',
    'LOGISTICS_MEASUREMENT_TOO_LARGE',
    'LOGISTICS_WEIGHT_UNIT_REQUIRED',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured: MeasuredPackage[] = [];
    for (const [index, row] of input.packages.entries()) {
      const result = measurePackage(row, index);
      if (!result.ok) return result;
      measured.push(result.value);
    }
    const decimals = input.decimalPlaces ? Number(input.decimalPlaces) : params.decimals;
    const output = aggregate(measured, { ...params, decimals });
    return ok(output, volumeWarnings(output, decimals));
  },
});
