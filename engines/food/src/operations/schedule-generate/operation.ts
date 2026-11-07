import { defineOperation, err, ok } from '@mangotools/core';
import { buildSchedule } from './schedule.ts';
import { scheduleGenerateInput, scheduleGenerateOutput, scheduleGenerateParams } from './schema.ts';
import { validateScheduleInput } from './validate.ts';

export const scheduleGenerate = defineOperation({
  id: 'food.schedule.generate',
  major: 1,
  title: 'Generate deterministic cooking schedule',
  summary:
    'Builds an end-to-end cooking schedule from selected recipes, target meal time, and kitchen capacity using backward topological scheduling.',
  input: scheduleGenerateInput,
  params: scheduleGenerateParams,
  output: scheduleGenerateOutput,
  errors: [
    'FOOD_UNKNOWN_RECIPE',
    'FOOD_DUPLICATE_RECIPE',
    'FOOD_DUPLICATE_SELECTION',
    'FOOD_INVALID_MEAL_TIME',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const validated = validateScheduleInput(input);
    if (!validated.ok) {
      return err(validated.error.code, {
        path: validated.error.path,
        details: validated.error.details,
      });
    }

    const { output, warnings } = buildSchedule(validated.value, input, params);
    return ok(output, warnings);
  },
});
