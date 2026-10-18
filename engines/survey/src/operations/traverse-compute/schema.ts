import { z } from 'zod';

const point = z.strictObject({ northingM: z.number(), eastingM: z.number() });
const leg = z.strictObject({
  from: z.string(),
  to: z.string(),
  distanceM: z.number(),
  azimuthDeg: z.number(),
});
export const traverseInput = z.strictObject({ start: point, legs: z.array(leg) });
export const traverseParams = z.strictObject({});
export const traverseOutput = z.strictObject({
  type: z.literal('closed-loop'),
  legs: z.array(leg.extend({ latitudeM: z.number(), departureM: z.number() })),
  coordinates: z.array(point),
  closure: z.strictObject({
    northingMisclosureM: z.number(),
    eastingMisclosureM: z.number(),
    linearMisclosureM: z.number(),
    perimeterM: z.number(),
    relativePrecision: z.number(),
    closureRatioDenominator: z.number().nullable(),
    closureStatus: z.enum(['finite', 'zero-misclosure']),
  }),
  working: z.array(
    z.strictObject({
      ref: z.string(),
      formulaKey: z.string(),
      variables: z.record(z.string(), z.string()),
      result: z.string(),
    }),
  ),
});
export type TraverseInput = z.infer<typeof traverseInput>;
export type TraverseOutput = z.infer<typeof traverseOutput>;
