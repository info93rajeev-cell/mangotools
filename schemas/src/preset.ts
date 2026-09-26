import { z } from 'zod';
import { operationRef, presetId, semver } from './common.ts';

const conditions = z.record(z.string(), z.array(z.string()));
const archetype = z.enum(['A', 'B', 'C', 'D', 'E']);

const optionValue = z.strictObject({
  labelKey: z.string(),
  order: z.int().optional(),
  visibleWhen: conditions.optional(),
});

export const userOptionSchema = z.strictObject({
  control: z.enum(['segmented', 'select', 'switch']),
  labelKey: z.string(),
  order: z.int().optional(),
  values: z.record(z.string(), optionValue).optional(),
  visibleWhen: conditions.optional(),
  visible: z.boolean().optional(),
});

export const fieldSchema = z.strictObject({
  labelKey: z.string(),
  /** 'boolean' is a genuine boolean *input* field (rendered as a switch); contrast with
   * `userOptionSchema`'s `control: 'switch'`, which is a boolean routed to operation *params*. */
  kind: z.enum(['text', 'number', 'money', 'percent', 'enum', 'enum-or-number', 'boolean']),
  control: z.enum(['segmented', 'select']).optional(),
  options: z
    .array(
      z.strictObject({ value: z.union([z.string(), z.number()]), labelKey: z.string().optional() }),
    )
    .optional(),
  allowCustom: z.boolean().optional(),
  currency: z.enum(['INR']).optional(),
  unit: z.string().optional(),
  required: z.boolean().optional(),
  /** Initial value shown before the user types (for example the most common rate). */
  default: z.union([z.string(), z.number()]).optional(),
  order: z.int(),
  visible: z.boolean().optional(),
  visibleWhen: conditions.optional(),
  helpKey: z.string().optional(),
  placeholderKey: z.string().optional(),
});

export const outputSchema = z.strictObject({
  labelKey: z.string(),
  format: z.enum(['text', 'money', 'percent', 'number', 'code']),
  order: z.int(),
  visible: z.boolean().optional(),
  visibleWhen: conditions.optional(),
  primary: z.boolean().optional(),
  primaryWhen: conditions.optional(),
});

export const presetSchema = z.strictObject({
  presetVersion: z.literal(1),
  id: presetId,
  version: semver,
  extends: presetId.optional(),
  abstract: z.boolean().optional(),
  operation: operationRef.optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  locked: z.array(z.string()).optional(),
  userOptions: z.record(z.string(), userOptionSchema).optional(),
  fields: z.record(z.string(), fieldSchema).optional(),
  outputs: z.record(z.string(), outputSchema).optional(),
  samples: z
    .record(
      z.string(),
      z.strictObject({
        titleKey: z.string(),
        input: z.record(z.string(), z.unknown()),
        params: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .optional(),
  ui: z
    .strictObject({
      archetypes: z.array(archetype).min(1),
      density: z.enum(['comfortable', 'compact']).optional(),
      compute: z.enum(['live', 'explicit']).optional(),
      outputFileName: z.string().optional(),
      outputMime: z.string().optional(),
      /** The file input's `accept` attribute, for archetype D (file-upload tools). */
      fileAccept: z.string().optional(),
      /** Archetype D: caps the file queue (1 = single-file, replacing on each new selection). */
      maxFiles: z.int().positive().optional(),
    })
    .optional(),
  strings: z.strictObject({ en: z.record(z.string(), z.string()) }).optional(),
});

export type Preset = z.infer<typeof presetSchema>;
export type PresetField = z.infer<typeof fieldSchema>;
export type PresetOutput = z.infer<typeof outputSchema>;
export type PresetUserOption = z.infer<typeof userOptionSchema>;
