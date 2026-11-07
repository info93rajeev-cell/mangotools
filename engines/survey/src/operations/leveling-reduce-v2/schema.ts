import { z } from 'zod';

const metres = z.string().describe('Exact decimal metres; at most six fractional digits.');
const labels = {
  station: z.string().describe('Opaque station label, echoed unchanged.').optional(),
  remarks: z.string().describe('Opaque remarks, echoed unchanged.').optional(),
};
const readingsV2 = {
  bs: metres.optional(),
  is: metres.optional(),
  fs: metres.optional(),
  dist: metres
    .optional()
    .describe('Incremental distance in metres from previous station; 0 for start benchmark.'),
};

export const levelingInputV2 = z.strictObject({
  startRL: metres.describe('Signed starting RL in metres; required for calculation.').optional(),
  closingRL: metres.describe('Signed known closing RL in metres, if known.').optional(),
  observations: z
    .array(z.strictObject({ ...labels, ...readingsV2 }))
    .describe('Ordered field book.'),
});

export const levelingParamsV2 = z.strictObject({
  method: z
    .enum(['rise-fall', 'height-of-instrument'])
    .default('rise-fall')
    .describe('Reduction method (rise-fall or height-of-instrument).'),
  adjBy: z
    .enum(['none', 'distance', 'setup'])
    .default('none')
    .describe('Adjustment method for closing misclosure.'),
  kConstant: z
    .string()
    .optional()
    .describe('Project-specified allowable error constant C in mm/sqrt(km); no default.'),
});

const resultRowV2 = z.strictObject({
  ...labels,
  bs: metres.nullable(),
  is: metres.nullable(),
  fs: metres.nullable(),
  hi: metres
    .nullable()
    .optional()
    .describe('Height of instrument (collimation) in metres for this setup, or null.'),
  rise: metres.nullable(),
  fall: metres.nullable(),
  rl: metres,
  isChangePoint: z
    .boolean()
    .describe('Interior incoming FS and outgoing BS on one physical point.'),
  dist: metres.nullable().describe('Incremental distance from previous station in metres.'),
  corr: z
    .string()
    .nullable()
    .describe(
      'Correction in millimetres to 1 decimal place (e.g. "+0.9", "0.0"). Null when unadjusted or open line.',
    ),
  adjustedRL: metres
    .nullable()
    .describe(
      'Adjusted Reduced Level in metres to 3 decimal places. Null when unadjusted or open line.',
    ),
});

const check = z.strictObject({
  id: z.string(),
  labelKey: z.string(),
  status: z.enum(['pass', 'fail']),
  expected: metres,
  actual: metres,
});

const working = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), metres),
  result: metres,
});

export const levelingOutputV2 = z.strictObject({
  rows: z.array(resultRowV2),
  startingRL: metres,
  endingRL: metres,
  sumBS: metres,
  sumFS: metres,
  sumRise: metres
    .nullable()
    .describe('Sum of rises in metres, or null for height-of-instrument method.'),
  sumFall: metres
    .nullable()
    .describe('Sum of falls in metres, or null for height-of-instrument method.'),
  bsFsDelta: metres,
  riseFallDelta: metres
    .nullable()
    .describe('Difference sumRise - sumFall in metres, or null for height-of-instrument method.'),
  rlDelta: metres,
  closingRL: metres.nullable(),
  misclosure: metres.nullable(),
  checks: z.array(check),
  working: z.array(working),
  totalDistanceKm: metres
    .nullable()
    .describe(
      'Total line distance K in kilometres (to 3 decimal places), or null if distances absent.',
    ),
  allowableError: z
    .string()
    .nullable()
    .describe(
      'Allowable error in millimetres to 1 decimal place, or null if C or distance absent.',
    ),
  closureStatus: z
    .enum(['pass', 'fail', 'criterion-not-provided', 'distance-not-provided'])
    .nullable()
    .describe('Closure tolerance status; null if open line.'),
  setupsCount: z.number().describe('Total number of instrument setups.'),
});

export type LevelingInputV2 = z.infer<typeof levelingInputV2>;
export type LevelingParamsV2 = z.infer<typeof levelingParamsV2>;
export type LevelingOutputV2 = z.infer<typeof levelingOutputV2>;
