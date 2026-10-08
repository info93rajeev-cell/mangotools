import { z } from 'zod';
import { kebabId, operationRef, presetId, semver } from './common.ts';

const conditions = z.record(z.string(), z.array(z.string()));
const archetype = z.enum(['A', 'B', 'C', 'D', 'E']);
const sampleUiStateValue = z.union([z.string(), z.number(), z.boolean()]);

/**
 * A one-shot, same-tab handoff of named field values to another tool, initiated by a button on this
 * tool's own result. Carried in the destination URL's hash fragment only (never sent in an HTTP
 * request, never written to any browser storage) and consumed once on the destination's first paint.
 * This is initialization only: the two tools stay fully independent afterward.
 */
const transferToSchema = z.strictObject({
  targetToolId: kebabId,
  fields: z.array(z.string()).min(1),
  buttonLabelKey: z.string(),
});

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

/**
 * Unit families a numeric field's value can be converted within when its unit selector changes
 * (the value is converted, never merely relabelled). Factors live in packages/ui/src/format/units.ts.
 */
export const unitFamilies = ['length', 'area', 'volume', 'coverage', 'liquid', 'weight'] as const;
export type UnitFamily = (typeof unitFamilies)[number];

/** Unit values understood by the shared form converter for each family. */
export const unitValuesByFamily = {
  length: ['mm', 'cm', 'm', 'in', 'ft'],
  area: ['mm', 'cm', 'm', 'in', 'ft', 'm2', 'ft2'],
  volume: ['l', 'm3', 'ft3', 'yd3'],
  coverage: ['m2-per-l', 'ft2-per-gal'],
  liquid: ['l', 'gal'],
  weight: ['kg', 'g', 'lb'],
} as const satisfies Record<UnitFamily, readonly string[]>;

export const fieldSchema = z.strictObject({
  labelKey: z.string(),
  /** 'boolean' is a genuine boolean *input* field (rendered as a switch); contrast with
   * `userOptionSchema`'s `control: 'switch'`, which is a boolean routed to operation *params*. */
  /** 'openings' is a repeatable list of width × height × quantity rows (JSON in the form value). */
  kind: z.enum([
    'text',
    'number',
    'money',
    'percent',
    'enum',
    'enum-or-number',
    'boolean',
    'openings',
  ]),
  control: z.enum(['segmented', 'select']).optional(),
  options: z
    .array(
      z.strictObject({
        value: z.union([z.string(), z.number()]),
        labelKey: z.string().optional(),
        /** Choosing this option fills these fields (an editable preset, never a locked value). */
        sets: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      }),
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
  /** Keep essential entry guidance inline; put explanatory guidance in a native disclosure. */
  helpMode: z.enum(['inline', 'disclosure']).optional(),
  placeholderKey: z.string().optional(),
  /** The enum field holding this value's unit: changing it converts this value, and its label
   * becomes this field's suffix. */
  convert: z.strictObject({ unitField: z.string(), family: z.enum(unitFamilies) }).optional(),
  /** A form-only helper (such as a preset picker) that is never sent to the engine. */
  uiOnly: z.boolean().optional(),
  /** Allows related short controls to share a row on wider calculator forms. */
  width: z.enum(['full', 'half']).optional(),
});

export const outputSchema = z.strictObject({
  labelKey: z.string(),
  format: z.enum(['text', 'money', 'percent', 'number', 'code']),
  /** Optional UI-only field whose integer value fixes this numeric output's displayed decimals. */
  decimalPlacesField: z.string().optional(),
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
        /** Form-only sample values. Generator checks restrict keys to fields marked `uiOnly`. */
        uiState: z.record(z.string(), sampleUiStateValue).optional(),
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
      /** Caps the Export Commercial Invoice Generator's item rows (TASK-009G). Not a generic
       * repeatable-field mechanism — read by exactly that one tool's own layout component. */
      maxItems: z.int().positive().optional(),
      /** Declares a "send named fields to another tool" button on this tool's own result. */
      transferTo: transferToSchema.optional(),
      /** Shown once, on this tool, when it detects it was opened via another tool's transfer. */
      transferNoticeKey: z.string().optional(),
      /** Keeps ordinary result assumptions and informational notices in one closed disclosure. */
      collapseNotices: z.boolean().optional(),
    })
    .optional(),
  strings: z.strictObject({ en: z.record(z.string(), z.string()) }).optional(),
});

export type Preset = z.infer<typeof presetSchema>;
export type PresetField = z.infer<typeof fieldSchema>;
export type PresetOutput = z.infer<typeof outputSchema>;
export type PresetUserOption = z.infer<typeof userOptionSchema>;
