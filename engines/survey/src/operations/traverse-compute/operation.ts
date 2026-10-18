import { defineOperation } from '@mangotools/core';
import { traverseMessages } from '../../errors.ts';
import { compute } from './compute.ts';
import { traverseInput, traverseOutput, traverseParams } from './schema.ts';
import { validate } from './validate.ts';

export const traverseCompute = defineOperation({
  id: 'survey.traverse.compute',
  major: 1,
  title: 'Unadjusted closed traverse',
  summary: 'Compute ordered raw components, coordinates and closure without adjustment.',
  input: traverseInput,
  params: traverseParams,
  output: traverseOutput,
  errors: Object.keys(traverseMessages),
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'personal',
  run(input) {
    const checked = validate(input);
    return checked.ok ? compute(checked.value) : checked;
  },
});
