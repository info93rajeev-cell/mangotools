import { z } from 'zod';

/** Map keys are lower-camel-case identifiers, at most 40 characters. */
const mapKey = z
  .string()
  .max(40)
  .regex(/^[a-z][a-zA-Z0-9]*$/);

const MAX_KEYS = 16;

function keyMap<T extends z.ZodType>(value: T) {
  return z
    .record(mapKey, value)
    .refine((map) => Object.keys(map).length <= MAX_KEYS, { message: 'At most 16 keys.' });
}

const rangeSchema = z.strictObject({
  min: z.string().optional(),
  max: z.string().optional(),
  unit: z.string().optional(),
});

const recordSchema = z.strictObject({
  id: z.string().optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  status: z.string().optional(),
  match: keyMap(z.string()).optional(),
  ranges: keyMap(rangeSchema).optional(),
  value: keyMap(z.string().nullable()).optional(),
  meta: keyMap(z.string()).optional(),
});

const conditionValueSchema = z.strictObject({
  value: z.string().optional(),
  unit: z.string().optional(),
});

const conditionsSchema = z.strictObject({
  selectors: keyMap(z.string()).optional(),
  values: keyMap(conditionValueSchema).optional(),
});

/** Required fields are optional here so the engine can report typed REFERENCE_ errors. */
export const recordResolveInput = z.strictObject({
  datasetVersion: z.string().optional(),
  effectiveDate: z.string().optional(),
  records: z.array(recordSchema).optional(),
  conditions: conditionsSchema.optional(),
});

export const recordResolveParams = z.strictObject({});

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

const resolvedRecord = z.strictObject({
  id: z.string(),
  status: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  value: z.record(z.string(), z.string().nullable()).optional(),
  meta: z.record(z.string(), z.string()).optional(),
});

export const recordResolveOutput = z.strictObject({
  datasetVersion: z.string(),
  effectiveDate: z.string(),
  resolution: z.enum(['matched', 'no-match', 'ambiguous']),
  record: resolvedRecord.optional(),
  candidateIds: z.array(z.string()),
  matchedOn: z.strictObject({
    selectors: z.array(z.string()),
    ranges: z.array(z.string()),
  }),
  counts: z.strictObject({
    records: z.number().int(),
    dateEligible: z.number().int(),
    conditionEligible: z.number().int(),
  }),
  working: z.array(workingStep),
});

export type RecordResolveInput = z.infer<typeof recordResolveInput>;
export type ReferenceRecord = NonNullable<RecordResolveInput['records']>[number];
export type ReferenceConditions = NonNullable<RecordResolveInput['conditions']>;
export type RecordResolveOutput = z.infer<typeof recordResolveOutput>;
export type ResolvedRecord = z.infer<typeof resolvedRecord>;
