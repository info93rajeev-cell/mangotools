import { defineOperation, ok } from '@mangotools/core';
import { messages } from '../../errors.ts';
import { reduce } from './reduce.ts';
import { levelingInput, levelingOutput, levelingParams } from './schema.ts';
import { validate } from './validate.ts';

export const levelingReduce = defineOperation({
  id: 'survey.leveling.reduce',
  major: 1,
  title: 'Rise & Fall leveling',
  summary:
    'Reduce a bounded level book with exact decimal arithmetic checks and optional signed misclosure.',
  input: levelingInput,
  params: levelingParams,
  output: levelingOutput,
  errors: Object.keys(messages),
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'personal',
  run(input) {
    const checked = validate(input);
    return checked.ok ? ok(reduce(checked.value)) : checked;
  },
});
