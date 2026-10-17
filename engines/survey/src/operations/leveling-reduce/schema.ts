import { z } from 'zod';

const metres = z.string().describe('Exact decimal metres; at most six fractional digits.');
const labels = {
  station: z.string().describe('Opaque station label, echoed unchanged.').optional(),
  remarks: z.string().describe('Opaque remarks, echoed unchanged.').optional(),
};
const readings = { bs: metres.optional(), is: metres.optional(), fs: metres.optional() };
export const levelingInput = z.strictObject({
  startRL: metres.describe('Signed starting RL in metres; required for calculation.').optional(),
  closingRL: metres.describe('Signed known closing RL in metres, if known.').optional(),
  observations: z.array(z.strictObject({ ...labels, ...readings })).describe('Ordered field book.'),
});
export const levelingParams = z.strictObject({
  method: z.literal('rise-fall').default('rise-fall').describe('Rise & Fall reduction only.'),
});
const resultRow = z.strictObject({
  ...labels,
  bs: metres.nullable(),
  is: metres.nullable(),
  fs: metres.nullable(),
  rise: metres.nullable(),
  fall: metres.nullable(),
  rl: metres,
  isChangePoint: z
    .boolean()
    .describe('Interior incoming FS and outgoing BS on one physical point.'),
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
  variables: z.strictObject({
    previousRL: metres,
    previousReading: metres,
    incomingReading: metres,
    rise: metres,
    fall: metres,
  }),
  result: metres,
});
export const levelingOutput = z.strictObject({
  rows: z.array(resultRow),
  startingRL: metres,
  endingRL: metres,
  sumBS: metres,
  sumFS: metres,
  sumRise: metres,
  sumFall: metres,
  bsFsDelta: metres,
  riseFallDelta: metres,
  rlDelta: metres,
  closingRL: metres.nullable(),
  misclosure: metres.nullable(),
  checks: z.array(check),
  working: z.array(working),
});
export type LevelingInput = z.infer<typeof levelingInput>;
export type LevelingOutput = z.infer<typeof levelingOutput>;
