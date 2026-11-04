import { defineOperation, ok } from '@mangotools/core';
import { messages } from '../../errors.ts';
import { reduceV2 } from './reduce.ts';
import { levelingInputV2, levelingOutputV2, levelingParamsV2 } from './schema.ts';
import { validateV2 } from './validate.ts';

export const levelingReduceV2 = defineOperation({
  id: 'survey.leveling.reduce',
  major: 2,
  title: 'Rise & Fall leveling with adjustments',
  summary:
    'Reduce level book with arithmetic checks, line distance, closing misclosure, allowable error, and distance or setup adjustments.',
  input: levelingInputV2,
  params: levelingParamsV2,
  output: levelingOutputV2,
  errors: Object.keys(messages),
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'personal',
  run(input, params) {
    const checked = validateV2(input, params);
    return checked.ok ? ok(reduceV2(checked.value)) : checked;
  },
});
