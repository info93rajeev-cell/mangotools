import type { WorkingStep } from '@mangotools/core';
import { z } from 'zod';

/** Schema of one working step, shared by the civil `@2` operation outputs. */
export const workingStepSchema = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

/** One working step; values stay at full precision (templates in the preset format them). */
export const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });
