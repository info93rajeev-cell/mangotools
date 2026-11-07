import { defineOperation, ok } from '@mangotools/core';
import { readWholeInRange } from '../../lib/read-input.ts';
import { DIVISOR_MAX, DIVISOR_MIN } from '../weight-chargeable/units.ts';
import { aggregate } from './aggregate.ts';
import { type MeasuredRow, measureRow } from './measure.ts';
import { weightShipmentInput, weightShipmentOutput, weightShipmentParams } from './schema.ts';

export const weightShipment = defineOperation({
  id: 'logistics.weight.shipment',
  major: 1,
  title: 'Shipment volumetric and chargeable weight',
  summary:
    'Volumetric and actual weight for up to 50 package rows, and the chargeable weight of the whole shipment.',
  input: weightShipmentInput,
  params: weightShipmentParams,
  output: weightShipmentOutput,
  errors: [
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_POSITIVE',
    'LOGISTICS_QUANTITY_NOT_WHOLE',
    'LOGISTICS_QUANTITY_TOO_LARGE',
    'LOGISTICS_WEIGHT_TOO_LARGE',
    'LOGISTICS_DIVISOR_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const divisor = readWholeInRange(input.divisor, 'divisor', {
      min: DIVISOR_MIN,
      max: DIVISOR_MAX,
      rangeCode: 'LOGISTICS_DIVISOR_OUT_OF_RANGE',
    });
    if (!divisor.ok) return divisor;
    const rows: MeasuredRow[] = [];
    for (const [index, row] of input.packages.entries()) {
      const measured = measureRow(row, index, input, divisor.value);
      if (!measured.ok) return measured;
      rows.push(measured.value);
    }
    const decimals = input.decimalPlaces ? Number(input.decimalPlaces) : params.decimals;
    return ok(
      aggregate(rows, {
        unit: input.unit,
        divisor: divisor.value,
        decimals,
        rounding: params.rounding,
      }),
    );
  },
});
